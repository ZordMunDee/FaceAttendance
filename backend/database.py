# backend/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. กำหนดชื่อและที่อยู่ของไฟล์ Database
# "sqlite:///./attendance.db" หมายถึงให้สร้างไฟล์ชื่อ attendance.db ไว้ในโฟลเดอร์เดียวกัน
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:123456@db:3306/face_attendance"

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