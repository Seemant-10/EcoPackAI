from pydantic import BaseModel # type: ignore

class ProductRequest(BaseModel):
    product_type: str