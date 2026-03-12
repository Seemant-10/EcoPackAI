from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
import pandas as pd
import joblib

from database import SessionLocal
from models import Material
from schema import ProductRequest
from ranking import rank_materials

app = FastAPI()

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

    # Get materials from database
    materials = db.query(Material).filter(
        Material.product_type == request.product_type
    ).all()

    # Convert to DataFrame
    df = pd.DataFrame([m.__dict__ for m in materials])

    df = df.drop(columns=["_sa_instance_state", "material_id"])

    # Rename columns to match training dataset
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

    # Apply same encoding as training
    df_encoded = pd.get_dummies(df)

    #  Align columns with training features
    X_cost = df_encoded.reindex(columns=cost_features, fill_value=0)
    X_co2 = df_encoded.reindex(columns=co2_features, fill_value=0)

    # Run predictions
    df["predicted_cost"] = cost_model.predict(X_cost)
    df["predicted_co2"] = co2_model.predict(X_co2)

    # Rank materials
    ranked = rank_materials(df)

    return ranked[
        ["Material_Type", "predicted_cost", "predicted_co2", "score"]
    ].to_dict(orient="records")
