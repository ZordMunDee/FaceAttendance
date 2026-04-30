# ============================================================
# ไฟล์: backend/routers/users.py (โค้ดฉบับแก้ไข - แยกสมองออกไปแล้ว)
# ============================================================
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas, database, face_engine # import สมอง AI มาใช้งาน

# สร้าง Router สำหรับจัดกลุ่ม API หมวด User
router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

# ==========================================
# API 1: ดึงข้อมูลพนักงานทั้งหมด (GET /users)
# ==========================================
@router.get("/", response_model=list[schemas.UserResponse])
def get_users(db: Session = Depends(database.get_db)):
    users = db.query(models.User).all()
    return users

# ==========================================
# API 2: เพิ่มพนักงานใหม่ พร้อมเปิดกล้องสแกนหน้า (POST /users)
# ==========================================
@router.post("/", response_model=schemas.UserResponse)
async def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    # 1. เช็คก่อนว่ารหัสพนักงานซ้ำไหม?
    db_user = db.query(models.User).filter(models.User.employee_id == user.employee_id).first()
    if db_user:
        raise HTTPException(status_code=400, detail="รหัสพนักงานนี้ถูกใช้งานแล้ว!")
    
    # 2. เรียกใช้ "สมอง AI" ที่อยู่ในไฟล์ face_engine.py
    # (เราไม่ได้เขียนฟังก์ชันสแกนหน้าในไฟล์นี้แล้วนะ!)
    print(f"📸 กำลังเปิดกล้องลงทะเบียนให้กับ: {user.fullname}...")
    face_encoding_result, message = face_engine.register_face_liveness()

    # 3. เช็คผลลัพธ์จากกล้อง
    if face_encoding_result is None:
        raise HTTPException(status_code=400, detail=f"ลงทะเบียนใบหน้าไม่สำเร็จ: {message}")

    # 4. แปลงข้อมูลใบหน้าให้เป็น String ผ่าน face_engine
    encoding_str = face_engine.encode_to_string(face_encoding_result)
    
    # 5. สร้างข้อมูลใหม่ลง Database
    new_user = models.User(
        fullname=user.fullname, 
        employee_id=user.employee_id,
        face_encoding=encoding_str
    )
    db.add(new_user)
    db.commit()          # ยืนยันการบันทึก
    db.refresh(new_user) # ดึงข้อมูลกลับมา
    print(f"✅ ลงทะเบียน {user.fullname} สำเร็จ!")
    return new_user