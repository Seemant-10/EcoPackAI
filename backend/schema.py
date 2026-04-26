from pydantic import BaseModel, EmailStr # type: ignore

class ProductRequest(BaseModel):
    product_type: str
    strength: int
    weight_capacity: float

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str