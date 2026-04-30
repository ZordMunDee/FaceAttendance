# backend/models.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from database import Base

# ตารางที่ 1: เก็บข้อมูลพนักงาน
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    fullname = Column(String, nullable=False) # ชื่อ-นามสกุล (ห้ามว่าง)
    employee_id = Column(String, unique=True, index=True) # รหัสพนักงาน (ห้ามซ้ำ)
    
    # เราเก็บข้อมูลใบหน้า (Face Encoding) เป็น Text 
    # (เพราะ AI จะแปลงหน้าคนเป็นชุดตัวเลขยาวๆ เราจึงเก็บตัวเลขนั้นไว้ ไม่เก็บเป็นไฟล์รูปภาพเพื่อความปลอดภัย)
    face_encoding = Column(Text, nullable=True) 
    
    # เวลาที่ลงทะเบียน
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# ตารางที่ 2: เก็บประวัติการสแกนเข้า-ออกงาน
class AttendanceLog(Base):
    __tablename__ = "attendance_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id")) # เชื่อมโยงไปที่ตาราง users เพื่อให้รู้ว่าใครสแกน
    
    status = Column(String) # สถานะ เช่น 'IN' (เข้างาน) หรือ 'OUT' (ออกงาน)
    
    # เวลาที่สแกนหน้าสำเร็จ
    timestamp = Column(DateTime(timezone=True), server_default=func.now())