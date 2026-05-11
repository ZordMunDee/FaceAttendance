# backend/models.py

from sqlalchemy import Column, String, DateTime, Boolean, Integer, ForeignKey
from datetime import datetime
from database import Base


# ตารางพนักงาน
class User(Base):
    __tablename__ = "users"

    employee_id = Column(String(50), primary_key=True, index=True)
    fullname = Column(String(255))
    position = Column(String(100), nullable=True)

    is_admin = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)

    # face encoding JSON ยาวมาก
    face_encoding = Column(String(12000))

    status = Column(String(50), default="In")

    timestamp = Column(DateTime, default=datetime.now)


# ตารางประวัติการสแกน
class ScanLog(Base):
    __tablename__ = "scan_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    employee_id = Column(
        String(50),
        ForeignKey("users.employee_id")
    )

    fullname = Column(String(255))

    status = Column(String(50))

    timestamp = Column(DateTime, default=datetime.now)