# backend/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. กำหนดชื่อและที่อยู่ของไฟล์ Database
# "sqlite:///./attendance.db" หมายถึงให้สร้างไฟล์ชื่อ attendance.db ไว้ในโฟลเดอร์เดียวกัน
SQLALCHEMY_DATABASE_URL = "sqlite:///./attendance.db"

# 2. สร้าง Engine (เครื่องยนต์) เพื่อใช้คุยกับ Database
# check_same_thread=False เป็นการตั้งค่าเฉพาะของ SQLite เพื่อให้ทำงานกับ FastAPI (ที่เป็นระบบ Asynchronous) ได้อย่างไม่มีปัญหา
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# 3. สร้าง Session (เซสชัน) เอาไว้สำหรับเปิด-ปิดการคุยกับ Database เวลาเราจะ บันทึก/ดึง ข้อมูล
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. สร้าง Base Class เพื่อให้ไฟล์ models.py นำไปใช้ต่อ
Base = declarative_base()

# 5. ฟังก์ชันสำหรับเรียกใช้ Database ในแต่ละ API (Best Practice สำหรับ FastAPI)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() # ดึงข้อมูลเสร็จ ต้องปิดการเชื่อมต่อเสมอ ป้องกันเมมโมรี่เต็ม