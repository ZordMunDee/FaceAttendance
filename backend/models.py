# backend/models.py
from sqlalchemy import Column, String, DateTime, Boolean, Integer, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

# ตารางพนักงาน (เหมือนเดิม)
class User(Base):
    __tablename__ = "users"

    employee_id = Column(String, primary_key=True, index=True)
    fullname = Column(String)
    is_admin = Column(Boolean, default=False)
    face_encoding = Column(String)
    status = Column(String, default="In") 
    timestamp = Column(DateTime, default=datetime.now)

# 🚀 สร้างตารางใหม่: เอาไว้จดประวัติทุกครั้งที่สแกน
class ScanLog(Base):
    __tablename__ = "scan_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id = Column(String, ForeignKey("users.employee_id"))
    fullname = Column(String)
    status = Column(String) # จดว่าตอนนั้นเข้า หรือ ออก
    timestamp = Column(DateTime, default=datetime.now)