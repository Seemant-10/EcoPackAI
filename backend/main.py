from fastapi import FastAPI, Depends, Header, HTTPException # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore
from sqlalchemy.orm import Session # type: ignore
from sqlalchemy import func # type: ignore
import pandas as pd
import joblib
from rapidfuzz import process, fuzz # type: ignore

from database import SessionLocal
from models import Material, Prediction
from schema import ProductRequest
from ranking import rank_materials
from database import engine, Base
import models
from datetime import datetime, timedelta
from jose import jwt, JWTError # type: ignore
from passlib.context import CryptContext # type: ignore

from models import User
from schema import RegisterRequest, LoginRequest

Base.metadata.create_all(bind=engine)


app = FastAPI()

SECRET_KEY = "EcoPackAI_SECRET_2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "EcoPackAI backend running"}

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def hash_password(password):
    return pwd_context.hash(password)

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )
def get_current_user_email(authorization: str = Header(None)):
    if not authorization:
        return None

    try:
        token = authorization.split(" ")[1]

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        return payload.get("sub")

    except:
        return None
    
def get_email_from_token(authorization: str):
    try:
        if not authorization:
            return None

        parts = authorization.split(" ")

        if len(parts) != 2:
            return None

        token = parts[1]

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        return payload.get("sub")

    except JWTError:
        return None

# Load trained models
cost_model = joblib.load("../trained_models/cost_model.pkl")
co2_model = joblib.load("../trained_models/co2_model.pkl")

cost_features = joblib.load("../trained_models/cost_feature_columns.pkl")
co2_features = joblib.load("../trained_models/co2_feature_columns.pkl")

@app.post("/register")
def register_user(request: RegisterRequest, db: Session = Depends(get_db)):

    allowed_domains = [
        "gmail.com",
        "outlook.com",
        "hotmail.com",
        "yahoo.com",
        "icloud.com",
        "live.com",
        "proton.me",
        "protonmail.com"
    ]

    email_domain = request.email.split("@")[-1].lower()

    if (
        email_domain not in allowed_domains
        and not email_domain.endswith(".edu")
        and not email_domain.endswith(".ac.in")
    ):
        return {
            "message": "Use a valid email provider"
        }
    existing_email = db.query(User).filter(
        User.email == request.email
    ).first()

    if existing_email:
        return {"message": "Email already registered"}

    existing_username = db.query(User).filter(
        User.username == request.username
    ).first()

    if existing_username:
        return {"message": "Username already taken"}

    new_user = User(
        username=request.username,
        email=request.email,
        password_hash=hash_password(request.password)
    )

    db.add(new_user)
    db.commit()

    return {"message": "Registration successful"}

@app.post("/login")
def login_user(request: LoginRequest, db: Session = Depends(get_db)):

    user = db.query(User).filter(
        User.email == request.email
    ).first()

    if not user:
        return {"message": "Invalid credentials"}

    if not verify_password(
        request.password,
        user.password_hash
    ):
        return {"message": "Invalid credentials"}

    token = create_access_token(
        {
            "sub": user.email,
            "username": user.username
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user.username
    }


@app.get("/analytics")
def get_analytics(
    db: Session = Depends(get_db),
    authorization: str = Header(None)
):
    email = get_email_from_token(authorization)

    if not email:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized"
        )

    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    base_query = db.query(Prediction).filter(
        Prediction.user_id == user.user_id
    )

    total_predictions = base_query.count()

    top_materials = db.query(
        Prediction.recommended_material,
        func.count(Prediction.recommended_material).label("count")
    ).filter(
        Prediction.user_id == user.user_id
    ).group_by(
        Prediction.recommended_material
    ).order_by(
        func.count(Prediction.recommended_material).desc()
    ).limit(5).all()

    top_products = db.query(
        Prediction.product_type,
        func.count(Prediction.product_type).label("count")
    ).filter(
        Prediction.user_id == user.user_id
    ).group_by(
        Prediction.product_type
    ).order_by(
        func.count(Prediction.product_type).desc()
    ).limit(5).all()

    avg_cost = base_query.with_entities(
        func.avg(Prediction.predicted_cost)
    ).scalar() or 0

    avg_co2 = base_query.with_entities(
        func.avg(Prediction.predicted_co2)
    ).scalar() or 0

    avg_score = base_query.with_entities(
        func.avg(Prediction.sustainability_score)
    ).scalar() or 0

    return {
        "total_predictions": total_predictions,

        "top_materials": [
            {"name": row[0], "count": row[1]}
            for row in top_materials
        ],

        "top_products": [
            {"name": row[0], "count": row[1]}
            for row in top_products
        ],

        "avg_cost": round(avg_cost, 2),
        "avg_co2": round(avg_co2, 2),
        "avg_score": round(avg_score * 100, 1)
    }

@app.post("/recommend-material")
def predict(
    request: ProductRequest,
    db: Session = Depends(get_db),
    authorization: str = Header(None)
):
    email = get_email_from_token(authorization)

    if not email:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized"
        )

    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )
    user_product = request.product_type.lower().strip()
    user_strength = request.strength or 5
    user_weight = request.weight_capacity or 10

    products = db.query(Material.product_type).distinct().all()
    product_list = [p[0] for p in products]

    product_map = {p.lower().strip(): p for p in product_list}
    product_list_lower = list(product_map.keys())

    closest_match = process.extractOne(
        user_product,
        product_list_lower,
        scorer=fuzz.token_sort_ratio
    )

    if not closest_match:
        return {"results": [], "message": "No products available"}

    matched_product_lower = closest_match[0]
    score = closest_match[1]

    if score < 60:
        return {
            "results": [],
            "message": "Product not recognized"
        }

    materials = db.query(Material).filter(
        func.lower(Material.product_type) == matched_product_lower
    ).all()

    if not materials:
        return {"results": [], "message": "No materials found"}

    df = pd.DataFrame([m.__dict__ for m in materials])

    df = df.drop(columns=["_sa_instance_state", "material_id"])
    df = df.rename(columns={
        "strength": "Strength (1-10)",
        "weight_capacity": "Weight Capacity (kg)",
        "biodegradability_score": "Biodegradability Score (1-10)",
        "recyclability": "Recyclability (%)",
        "cost": "Cost (USD)",
        "co2_emission": "CO2 Emission (kg CO2/kg)",
        "material_type": "Material_Type",
        "product_type": "Product_Type",
        "industry": "Industry"
    })

    if "laptop" in user_product:
        df = df[df["Material_Type"].isin([
            "Corrugated Cardboard", "Cardboard", "Foam", 
            "Molded Pulp", "Mushroom Packaging"
        ])]

    elif "bottle" in user_product:
        df = df[df["Material_Type"].isin([
            "PET Plastic", "Glass", "Aluminum",
            "Bioplastic (PLA)", "Recycled Plastic", 
            "HDPE Plastic",                           
            "HDPE Plastic", "Steel", "PP Plastic"     
        ])]

    elif "pizza" in user_product or "food" in user_product:
        df = df[df["Material_Type"].isin([
            "Corrugated Cardboard", "Kraft Paper", "Cardboard",
            "Bagasse Fiber", "Mushroom Packaging",    
            "Bioplastic (PLA)", "PP Plastic"          
        ])]

    if df.empty:
        return {"results": [], "message": "No suitable materials found"}

    df_encoded = pd.get_dummies(df)
    X_cost = df_encoded.reindex(columns=cost_features, fill_value=0)
    X_co2 = df_encoded.reindex(columns=co2_features, fill_value=0)

    df["predicted_cost"] = cost_model.predict(X_cost)
    df["predicted_co2"] = co2_model.predict(X_co2)


    df["strength_match"] = 1 - abs(df["Strength (1-10)"] - user_strength) / 10
    df["strength_match"] = df["strength_match"].clip(lower=0, upper=1)

    max_weight = df["Weight Capacity (kg)"].max()
    df["weight_match"] = 1 - abs(df["Weight Capacity (kg)"] - user_weight) / max_weight
    df["weight_match"] = df["weight_match"].clip(lower=0, upper=1)

    df["compatibility"] = (
        0.6 * df["strength_match"] +
        0.4 * df["weight_match"]
    )

    ranked = rank_materials(df)

    ranked = ranked.sort_values(by="final_score", ascending=False)

    for _, row in ranked.iterrows():
        prediction = Prediction(
            product_type=request.product_type,
            recommended_material=row["Material_Type"],
            predicted_cost=float(row["predicted_cost"]),
            predicted_co2=float(row["predicted_co2"]),
            sustainability_score=float(row["final_score"]),
            user_id=user.user_id
        )
        db.add(prediction)

    db.commit()

    return {
        "results": ranked[
            [
                "Material_Type",
                "predicted_cost",
                "predicted_co2",
                "final_score",
                "co2_score",
                "bio_score",
                "rec_score",
                "compatibility"
            ]
        ].head(3).to_dict(orient="records"),

        "message": "Recommendations generated successfully"
    }