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
    scan_type: str  # เพิ่มฟิลด์นี้: "In" หรือ "Out"

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

# 🚀 สำหรับอัปเดตข้อมูลพนักงาน
class UserUpdate(BaseModel):
    fullname: str
    is_admin: bool

# 🚀 สำหรับรับข้อมูลตอน Login ของ Admin
class LoginRequest(BaseModel):
    username: str
    password: str

    class Config:
        from_attributes = True