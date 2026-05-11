# backend/database.py
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. กำหนดชื่อและที่อยู่ของไฟล์ Database
# "sqlite:///./attendance.db" หมายถึงให้สร้างไฟล์ชื่อ attendance.db ไว้ในโฟลเดอร์เดียวกัน

DATABASE_URL = os.getenv("MYSQL_URL", "mysql+pymysql://root:123456@db:3306/face_attendance")

if DATABASE_URL.startswith("mysql://"):
    DATABASE_URL = DATABASE_URL.replace("mysql://", "mysql+pymysql://", 1)

SQLALCHEMY_DATABASE_URL = DATABASE_URL


engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()