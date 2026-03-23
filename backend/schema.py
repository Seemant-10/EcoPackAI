from pydantic import BaseModel # type: ignore

class ProductRequest(BaseModel):
    product_type: str
    strength: int
    weight_capacity: float