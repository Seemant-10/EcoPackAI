from fastapi import FastAPI, Depends # type: ignore
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

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load trained models
cost_model = joblib.load("../trained_models/cost_model.pkl")
co2_model = joblib.load("../trained_models/co2_model.pkl")

cost_features = joblib.load("../trained_models/cost_feature_columns.pkl")
co2_features = joblib.load("../trained_models/co2_feature_columns.pkl")

@app.get("/")
def home():
    return {"message": "EcoPackAI backend running"}

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/recommend-material")
def recommend_material(request: ProductRequest, db: Session = Depends(get_db)):

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

    # if "laptop" in user_product:
    #     df = df[df["Material_Type"].isin([
    #         "Corrugated Cardboard", "Cardboard", "Foam", 
    #         "Molded Pulp", "Mushroom Packaging"
    #     ])]

    # elif "bottle" in user_product:
    #     df = df[df["Material_Type"].isin([
    #         "PET Plastic", "Glass", "Aluminum",
    #         "Bioplastic (PLA)", "Recycled Plastic",  
    #         "HDPE Plastic",                           
    #         "HDPE Plastic", "Steel", "PP Plastic"     
    #     ])]

    # elif "pizza" in user_product or "food" in user_product:
    #     df = df[df["Material_Type"].isin([
    #         "Corrugated Cardboard", "Kraft Paper", "Cardboard",
    #         "Bagasse Fiber", "Mushroom Packaging",    
    #         "Bioplastic (PLA)", "PP Plastic"          
    #     ])]

    if df.empty:
        return {"results": [], "message": "No suitable materials found"}

    df_encoded = pd.get_dummies(df)
    X_cost = df_encoded.reindex(columns=cost_features, fill_value=0)
    X_co2 = df_encoded.reindex(columns=co2_features, fill_value=0)

    df["predicted_cost"] = cost_model.predict(X_cost)
    df["predicted_co2"] = co2_model.predict(X_co2)


    df["strength_match"] = 1 - abs(df["Strength (1-10)"] - user_strength) / 10

    max_weight = df["Weight Capacity (kg)"].max()
    df["weight_match"] = 1 - abs(df["Weight Capacity (kg)"] - user_weight) / max_weight

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
            sustainability_score=float(row["final_score"])
        )
        db.add(prediction)

    db.commit()

    return {
        "results": ranked[
            ["Material_Type", "predicted_cost", "predicted_co2", "final_score"]
        ].head(3).to_dict(orient="records"),
        "message": "Recommendations generated successfully"
    }