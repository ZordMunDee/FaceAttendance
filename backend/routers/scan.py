# backend/routers/scan.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import models, schemas, database, face_engine
# import hardware # ปิดส่วนนี้ไว้ก่อนตามที่ตกลงกัน

router = APIRouter(
    prefix="/scan",
    tags=["Scan Attendance"]
)

@router.post("/")
async def scan_face(request: schemas.ScanRequest, db: Session = Depends(database.get_db)):
    # 1. โหลดข้อมูลใบหน้าพนักงานทุกคน
    users = db.query(models.User).all()
    if not users:
        raise HTTPException(status_code=400, detail="ยังไม่มีข้อมูลพนักงานในระบบ")

    known_encodings = []
    known_ids = []
    for u in users:
        if u.face_encoding:
            known_encodings.append(face_engine.string_to_encode(u.face_encoding))
            known_ids.append(u.employee_id)

    # 2. ส่งรูป Base64 ไปให้ AI เทียบหน้า
    matched_employee_id = face_engine.recognize_from_image(request.image_base64, known_encodings, known_ids)

    if not matched_employee_id:
        raise HTTPException(status_code=400, detail="สแกนไม่ผ่าน: ไม่พบใบหน้านี้ในระบบ")

    # 3. หาข้อมูลพนักงานที่สแกนผ่าน
    user = db.query(models.User).filter(models.User.employee_id == matched_employee_id).first()
    
    # 4. เช็คสถานะ Clock In / Clock Out ของวันนี้
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    log = db.query(models.AttendanceLog).filter(
        models.AttendanceLog.user_id == user.id,
        models.AttendanceLog.timestamp >= today_start
    ).first()

    status = "Clock In" if not log else "Clock Out" 
    
    # 5. บันทึกเวลา
    new_log = models.AttendanceLog(user_id=user.id, status=status)
    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    # hardware.trigger_door_unlock() # ปิดไว้ก่อน

    return {
        "message": f"สแกนสำเร็จ! ยินดีต้อนรับคุณ {user.fullname}",
        "status": status,
        "timestamp": new_log.timestamp
    }

# ==========================================
# API สำหรับดึงข้อมูลประวัติการสแกนเข้า-ออกงาน
# ==========================================
@router.get("/logs")
def get_attendance_logs(db: Session = Depends(database.get_db)):
    # ดึงประวัติล่าสุด 50 รายการ เรียงจากใหม่ไปเก่า
    logs = db.query(models.AttendanceLog).order_by(models.AttendanceLog.timestamp.desc()).limit(50).all()
    
    result = []
    for log in logs:
        # หาข้อมูลพนักงานที่สแกน
        user = db.query(models.User).filter(models.User.id == log.user_id).first()
        result.append({
            "id": log.id,
            "employee_id": user.employee_id if user else "ไม่ทราบ",
            "fullname": user.fullname if user else "ไม่ทราบ",
            "status": log.status,
            "timestamp": log.timestamp
        })
    
    return result