# ============================================================
# ไฟล์: backend/main.py (โค้ดศูนย์กลางของระบบ)
# ============================================================
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# นำเข้าส่วนประกอบของ Database และ API Routers
import models
from database import engine
from routers import users, scan

# สร้างตารางในฐานข้อมูล SQLite อัตโนมัติ (ถ้ายังไม่มี)
models.Base.metadata.create_all(bind=engine)

# สร้างแอปพลิเคชัน FastAPI
app = FastAPI(
    title="Face Scan Attendance API",
    description="ระบบสแกนใบหน้าเพื่อบันทึกเวลาเข้า-ออกงาน",
    version="1.0.0"
)

# ตั้งค่า CORS (สำคัญมากสำหรับตอนต่อกับหน้าเว็บ Next.js)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # อนุญาตให้ทุกโดเมนเรียกใช้ API ได้ (สำหรับตอนพัฒนา)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# เสียบปลั๊ก Routers (API เส้นทางต่างๆ) เข้ากับระบบหลัก
app.include_router(users.router) # API จัดการข้อมูลพนักงานและลงทะเบียนหน้า
app.include_router(scan.router)  # API สแกนเวลาเข้า-ออกงานแบบด่วน (Fast Scan)

# API หน้าแรกสำหรับเช็คสถานะเซิร์ฟเวอร์
@app.get("/")
def read_root():
    return {"message": "Hello, Backend is running! 🚀 API พร้อมทำงานแล้ว!"}