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
    materials_check = db.query(Material.material_type).distinct().all()

    material_list = [m[0] for m in materials_check]

    material_map = {m.lower().strip(): m for m in material_list}

    material_list_lower = list(material_map.keys())

    # Fuzzy match materials
    material_match = process.extractOne(
        user_product,
        material_list_lower,
        scorer=fuzz.token_sort_ratio
    )

    if material_match and material_match[1] > 60:

        matched_material = material_map[material_match[0]]

        materials = db.query(Material).filter(
            func.lower(Material.material_type).like(f"%{user_product}%")
        ).all()

        if not materials:
            return {
                "results": [],
                "message": f"No data available for material '{matched_material}'"
            }

        df = pd.DataFrame([m.__dict__ for m in materials])

    else:
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
            return {
                "results": [],
                "message": "No products available in database"
            }

        matched_product_lower = closest_match[0]
        score = closest_match[1]

        matched_product = product_map[matched_product_lower]
        if score < 60:
            suggestions = process.extract(
                user_product,
                product_list_lower,
                scorer=fuzz.token_sort_ratio,
                limit=3
            )
            return {
                "results": [],
                "message": "Product not recognized",
                "did_you_mean": [s[0] for s in suggestions]
            }
        materials = db.query(Material).filter(
            func.lower(Material.product_type) == matched_product_lower
        ).all()
        if not materials:
            fallback = db.query(Material).limit(5).all()
            return {
                "results": [],
                "message": f"No materials found for '{matched_product}'",
                "suggested_materials": [m.material_type for m in fallback]
            }
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

    df_encoded = pd.get_dummies(df)
    X_cost = df_encoded.reindex(columns=cost_features, fill_value=0)
    X_co2 = df_encoded.reindex(columns=co2_features, fill_value=0)
     
    df["predicted_cost"] = cost_model.predict(X_cost)
    df["predicted_co2"] = co2_model.predict(X_co2)

    ranked = rank_materials(df)
     
    for _, row in ranked.iterrows():

        prediction = Prediction(
            product_type=request.product_type,
            recommended_material=row["Material_Type"],
            predicted_cost=float(row["predicted_cost"]),
            predicted_co2=float(row["predicted_co2"]),
            sustainability_score=float(row["score"])
        )

        db.add(prediction)

    db.commit()

    return {
        "results": ranked[
            ["Material_Type", "predicted_cost", "predicted_co2", "score"]
        ].to_dict(orient="records"),
        "message": "Recommendations generated successfully"
    }