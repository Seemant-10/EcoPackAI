from sqlalchemy import Column, Integer, Float, String
from database import Base

class Material(Base):
    __tablename__ = "materials"

    material_id = Column(Integer, primary_key=True, index=True)
    material_type = Column(String)
    product_type = Column(String)
    industry = Column(String)
    strength = Column(Integer)
    weight_capacity = Column(Float)
    biodegradability_score = Column(Integer)
    recyclability = Column(Float)
    cost = Column(Float)
    co2_emission = Column(Float)


class Prediction(Base):
    __tablename__ = "predictions"

    prediction_id = Column(Integer, primary_key=True, index=True)
    product_type = Column(String)
    recommended_material = Column(String)
    predicted_cost = Column(Float)
    predicted_co2 = Column(Float)
    sustainability_score = Column(Float)