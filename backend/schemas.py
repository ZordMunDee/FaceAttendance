# backend/schemas.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# 1. โครงสร้างข้อมูลเวลาหน้าเว็บส่งมา "สร้างพนักงานใหม่" (รับข้อมูลเข้ามา)
class UserCreate(BaseModel):
    fullname: str
    employee_id: str
    # face_encoding ตอนแรกอาจจะยังไม่มี (รอกดสแกนทีหลัง) เลยให้เว้นว่างได้
    face_encoding: Optional[str] = None 

# 2. โครงสร้างข้อมูลเวลา Backend ส่ง "ข้อมูลพนักงาน" กลับไปให้หน้าเว็บ (ส่งข้อมูลออกไป)
class UserResponse(BaseModel):
    id: int
    fullname: str
    employee_id: str
    created_at: datetime

    class Config:
        from_attributes = True # ตั้งค่าให้อ่านข้อมูลจาก Database (SQLAlchemy) ได้


# backend/schemas.py (เพิ่มโค้ดนี้ต่อท้าย)

class UserUpdate(BaseModel):
    fullname: Optional[str] = None
    employee_id: Optional[str] = None
    face_encoding: Optional[str] = None