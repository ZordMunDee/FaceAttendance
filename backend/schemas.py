from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    employee_id: str
    fullname: str
    position: Optional[str] = None
    image_base64: str
    is_admin: bool = False

# backend/schemas.py
class ScanRequest(BaseModel):
    image_base64: str
    scan_type: str  # เพิ่มฟิลด์นี้: "In" หรือ "Out"
    lat: Optional[float] = None
    lng: Optional[float] = None

# backend/schemas.py

class UserResponse(BaseModel):
    employee_id: str
    fullname: str
    position: Optional[str] = None
    is_admin: bool
    status: str      
    timestamp: datetime 

class LogResponse(BaseModel):
    id: int
    employee_id: str
    fullname: str
    status: str
    timestamp: datetime

# 🚀 สำหรับอัปเดตข้อมูลพนักงาน
class UserUpdate(BaseModel):
    fullname: Optional[str] = None
    position: Optional[str] = None
    is_admin: Optional[bool] = None
    image_base64: Optional[str] = None

# 🚀 สำหรับรับข้อมูลตอน Login ของ Admin
class LoginRequest(BaseModel):
    username: str
    password: str

    class Config:
        from_attributes = True