# backend/routers/users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas, database, face_engine

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.get("/", response_model=list[schemas.UserResponse])
def get_users(db: Session = Depends(database.get_db)):
    users = db.query(models.User).all()
    return users

@router.post("/", response_model=schemas.UserResponse)
async def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    # 1. เช็ครหัสพนักงานซ้ำ
    db_user = db.query(models.User).filter(models.User.employee_id == user.employee_id).first()
    if db_user:
        raise HTTPException(status_code=400, detail="รหัสพนักงานนี้ถูกใช้งานแล้ว!")
    
    # 2. แปลงรูป Base64 และดึง Face Encoding
    face_encoding_result, message = face_engine.get_encoding_from_image(user.image_base64)

    if face_encoding_result is None:
        raise HTTPException(status_code=400, detail=message)

    # 3. แปลงข้อมูลใบหน้าให้เป็น String
    encoding_str = face_engine.encode_to_string(face_encoding_result)
    
    # 4. บันทึกลง Database
    new_user = models.User(
        fullname=user.fullname, 
        employee_id=user.employee_id,
        face_encoding=encoding_str
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    print(f"✅ ลงทะเบียน {user.fullname} สำเร็จ ผ่านหน้าเว็บ!")
    return new_user