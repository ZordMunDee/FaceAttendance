from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    employee_id: str
    fullname: str
    image_base64: str
    is_admin: bool = False

# backend/schemas.py
class ScanRequest(BaseModel):
    image_base64: str
    employee_id: Optional[str] = None # 🚀 ใส่ Optional ไว้เผื่อไม่ได้ส่งมา

# backend/schemas.py

class UserResponse(BaseModel):
    employee_id: str
    fullname: str
    is_admin: bool
    status: str      
    timestamp: datetime 

class LogResponse(BaseModel):
    id: int
    employee_id: str
    fullname: str
    status: str
    timestamp: datetime

    class Config:
        from_attributes = True