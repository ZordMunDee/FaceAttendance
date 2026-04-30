# backend/init_db.py
from database import engine, Base
import models

# คำสั่งนี้จะทำการตรวจสอบไฟล์ models.py และสร้างตารางทั้งหมดลงในไฟล์ attendance.db
print("กำลังสร้างฐานข้อมูล...")
Base.metadata.create_all(bind=engine)
print("สร้างฐานข้อมูล attendance.db และตารางเสร็จสมบูรณ์! 🎉")