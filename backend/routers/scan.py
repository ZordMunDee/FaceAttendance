from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import models, schemas, database, face_engine
import hardware 

router = APIRouter(
    prefix="/scan",
    tags=["Scan Attendance"]
)

@router.post("/")
async def scan_face(db: Session = Depends(database.get_db)):
    users = db.query(models.User).all()
    if not users:
        raise HTTPException(status_code=400, detail="ยังไม่มีข้อมูลพนักงานในระบบ")

    known_encodings = []
    known_ids = []

    for u in users:
        if u.face_encoding:
            encoding_array = face_engine.string_to_encode(u.face_encoding)
            known_encodings.append(encoding_array)
            known_ids.append(u.employee_id)

    matched_employee_id = face_engine.recognize_face(known_encodings, known_ids)

    if not matched_employee_id:
        raise HTTPException(status_code=400, detail="สแกนไม่ผ่าน หรือยกเลิกการสแกน")

    user = db.query(models.User).filter(models.User.employee_id == matched_employee_id).first()
    
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    log = db.query(models.AttendanceLog).filter(
        models.AttendanceLog.user_id == user.id,
        models.AttendanceLog.timestamp >= today_start
    ).first()

    status = "Clock In"
    if log:
        status = "Clock Out" 
    
    new_log = models.AttendanceLog(user_id=user.id, status=status)
    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    # 🚀 สั่งเปิดประตู/ไฟเขียว ทันทีที่บันทึกข้อมูลเสร็จ!
    hardware.trigger_door_unlock()

    return {
        "message": f"สแกนสำเร็จ! ยินดีต้อนรับคุณ {user.fullname}",
        "status": status,
        "timestamp": new_log.timestamp
    }