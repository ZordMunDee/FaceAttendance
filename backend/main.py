from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, extract

import os
import json
import time
import base64
import threading
from datetime import datetime, time as dt_time, timedelta
from dotenv import load_dotenv

import numpy as np
import cv2
import face_recognition
import serial

import models
import schemas
from database import engine, get_db
from auth import create_access_token
from auth import verify_token

from fastapi import Header

# =========================
# STATIC FILES (อัปโหลดรูปภาพ)
# =========================
# 🚀 สั่งให้สร้างโฟลเดอร์ก่อน แล้วค่อย mount

app = FastAPI()


os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# =========================
# APP INIT
# =========================


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://faceattendance-production-9905.up.railway.app" # 👈 เพิ่มบรรทัดนี้! (ระวัง: ห้ามมี / ปิดท้ายลิงก์เด็ดขาด)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


load_dotenv()
models.Base.metadata.create_all(bind=engine)


def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(401, "No token")

    token = authorization.replace("Bearer ", "")

    payload = verify_token(token)

    if not payload:
        raise HTTPException(401, "Invalid token")

    return payload


# =========================
# SERIAL
# =========================
try:
    ser = serial.Serial(os.getenv("SERIAL_PORT", "COM3"), 9600, timeout=1)
    print("✅ SC-840 connected")
except:
    ser = None
    print("❌ SC-840 not found")


# =========================
# RELAY
# =========================
def trigger_sc840_relay(channel: int):
    if not ser:
        return print(f"[SIM] Relay {channel}")

    try:
        ser.write(f"@1 N{channel}\r".encode())
        time.sleep(3)
        ser.write(f"@1 F{channel}\r".encode())
    except Exception as e:
        print("Relay error:", e)


# =========================
# FACE ENCODING
# =========================
def decode_face(base64_string: str):
    try:
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]

        img = base64.b64decode(base64_string)
        arr = np.frombuffer(img, np.uint8)
        frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        enc = face_recognition.face_encodings(rgb)

        return enc[0] if enc else None

    except:
        return None


# =========================
# ROOT
# =========================
@app.get("/")
def root():
    return {"message": "Backend running"}


# =========================
# USERS
# =========================
# 📂 main.py (แก้ตรงส่วน @app.post("/users/"))

import base64 # อย่าลืมเช็คว่ามี import base64 ด้านบนสุดหรือยัง

@app.post("/users/")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):

    # 1. แปลงรูปใบหน้า
    enc = decode_face(user.image_base64)
    if enc is None:
        raise HTTPException(400, "no face")

    # 🚀 2. โค้ดสำหรับเซฟไฟล์รูปภาพจริงๆ ลงโฟลเดอร์ uploads
    try:
        # ตัดส่วนหัว data:image/jpeg;base64, ออกให้เหลือแต่ข้อมูลเพียวๆ
        image_data = user.image_base64.split(",")[1] if "," in user.image_base64 else user.image_base64
        # ตั้งชื่อไฟล์ตามรหัสพนักงานเลย เช่น 66200105.jpg
        file_path = f"uploads/{user.employee_id}.jpg"
        with open(file_path, "wb") as f:
            f.write(base64.b64decode(image_data))
    except Exception as e:
        print("Save image error:", e)

    # 3. ลองค้นหาดูว่ามีรหัสพนักงานนี้ในระบบหรือยัง (โค้ดดึงข้อมูลกลับมาที่ทำไว้เมื่อกี้)
    existing_user = db.query(models.User).filter_by(employee_id=user.employee_id).first()

    if existing_user:
        if existing_user.is_deleted:
            existing_user.fullname = user.fullname
            existing_user.position = user.position
            existing_user.is_admin = user.is_admin
            existing_user.face_encoding = json.dumps(enc.tolist())
            existing_user.is_deleted = False
            existing_user.status = "In"
            existing_user.timestamp = datetime.now()
            db.commit()
            return {"message": "reactivated"}
        else:
            raise HTTPException(400, "exists")

    db.add(models.User(
        employee_id=user.employee_id,
        fullname=user.fullname,
        position=user.position,
        is_admin=user.is_admin,
        face_encoding=json.dumps(enc.tolist()),
        status="In",
        timestamp=datetime.now(),
        is_deleted=False
    ))

    db.commit()
    return {"message": "ok"}


@app.get("/users/")
def users(db: Session = Depends(get_db)):
    # 🚀 ดึงเฉพาะคนที่มี is_deleted เป็น False เท่านั้น
    return db.query(models.User).filter(models.User.is_deleted == False).all()

@app.get("/employees/count")
def get_employee_count(db: Session = Depends(get_db), user=Depends(get_current_user)):
    count = db.query(models.User).count()
    return {"total": count}


# =========================
# LOGIN
# =========================
@app.post("/login/")
def login(data: schemas.LoginRequest):

    if data.username == os.getenv("ADMIN_USER") and data.password == os.getenv("ADMIN_PASS"):

        token = create_access_token({
            "sub": data.username,
            "role": "admin"
        })

        return {
            "access_token": token,
            "token_type": "bearer"
        }

    raise HTTPException(401, "invalid")


@app.post("/scan/")
def scan(data: schemas.ScanRequest, db: Session = Depends(get_db)):

    incoming_encoding = decode_face(data.image_base64)

    if incoming_encoding is None:  
        raise HTTPException(status_code=400, detail="กล้องจับใบหน้าไม่ชัด")

    # 🚀 ดึงเฉพาะพนักงานที่ยังไม่ถูกลบ
    all_users = db.query(models.User).filter(models.User.is_deleted == False).all()
    if not all_users:
        raise HTTPException(404, "ระบบยังไม่มีข้อมูลพนักงาน")

    encs, refs = [], []
    for u in all_users:
        if u.face_encoding:
            try:
                encs.append(np.array(json.loads(u.face_encoding)))
                refs.append(u)
            except: continue

    if not encs:
        raise HTTPException(404, "ไม่พบข้อมูลใบหน้าในฐานข้อมูล")

    dist = face_recognition.face_distance(encs, incoming_encoding)
    best = np.argmin(dist)

    if dist[best] > 0.5:
        raise HTTPException(404, "ใบหน้าไม่ตรงกับพนักงานคนใด")

    user = refs[best]
    
    # วันที่และเวลาปัจจุบัน
    now = datetime.now()
    today = now.date()
    status = data.scan_type

    # ==========================================
    # 🎯 เงื่อนไข 1: สแกนเข้างาน (In)
    # ==========================================
    if status == "In":
        # เช็คว่าวันนี้สแกน In หรือ Late ไปแล้วหรือยัง
        existing_in = db.query(models.ScanLog).filter(
            models.ScanLog.employee_id == user.employee_id,
            func.date(models.ScanLog.timestamp) == today,
            models.ScanLog.status.in_(["In", "Late"])
        ).first()

        if existing_in:
            # ถ้ามีแล้ว ให้ดึงเวลาที่สแกนมาแจ้งเตือน และหยุดทำงาน (Error 400)
            time_str = existing_in.timestamp.strftime("%H:%M น.")
            raise HTTPException(status_code=400, detail=f"คุณได้สแกนเข้างานไปแล้ววันนี้ เมื่อเวลา {time_str}")

        # ถ้ายังไม่เคยสแกน ให้เช็คสาย
        if now.time() > dt_time(8, 30):
            status = "Late"

        # บันทึกเป็น Post (สร้างใหม่)
        db.add(models.ScanLog(
            employee_id=user.employee_id,
            fullname=user.fullname,
            status=status,
            timestamp=now
        ))

    # ==========================================
    # 🎯 เงื่อนไข 2: สแกนออกงาน (Out)
    # ==========================================
    elif status == "Out":
        # เช็คว่าวันนี้เคยสแกน Out ไปแล้วหรือยัง
        existing_out = db.query(models.ScanLog).filter(
            models.ScanLog.employee_id == user.employee_id,
            func.date(models.ScanLog.timestamp) == today,
            models.ScanLog.status == "Out"
        ).first()

        if existing_out:
            # ถ้ามีแล้ว ให้เป็น Put (อัปเดตเวลาล่าสุด)
            existing_out.timestamp = now
        else:
            # ถ้าเพิ่งออกครั้งแรก ให้เป็น Post (สร้างใหม่)
            db.add(models.ScanLog(
                employee_id=user.employee_id,
                fullname=user.fullname,
                status=status,
                timestamp=now
            ))

    # อัปเดตข้อมูลสถานะพนักงานล่าสุด
    user.status = status
    user.timestamp = now

    db.commit()

    # สั่งเปิด Relay กั้นประตู
    threading.Thread(target=trigger_sc840_relay, args=(1,)).start()

    return {
        "employee_id": user.employee_id,
        "fullname": user.fullname,
        "status": status,
        "message": "สแกนสำเร็จ"
    }


# =========================
# LOGS
# =========================
@app.get("/scan/logs")
def logs(db: Session = Depends(get_db)):
    return db.query(models.ScanLog).order_by(models.ScanLog.timestamp.desc()).all()


# =========================
# UPDATE / DELETE
# =========================
# 🚀 ตรวจสอบว่าใน main.py มี Route เหล่านี้ไหม
# @app.delete("/users/{emp_id}")
# async def delete_user(emp_id: str, db: Session = Depends(get_db)):
#     user = db.query(models.User).filter(models.User.employee_id == emp_id).first()
#     if not user: raise HTTPException(status_code=404, detail="ไม่พบพนักงาน")
#     db.delete(user)
#     db.commit()
#     return {"message": "ลบสำเร็จ"}
# 📂 main.py
@app.delete("/users/{emp_id}")
async def delete_user(emp_id: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.employee_id == emp_id).first()
    if not user: 
        raise HTTPException(status_code=404, detail="ไม่พบพนักงาน")
    
    # 🚀 แทนที่จะ db.delete(user) ให้ทำแบบนี้แทน:
    user.is_deleted = True 
    db.commit()
    return {"message": "ลบพนักงานเรียบร้อย (Soft Delete)"}

@app.put("/users/{emp_id}")
async def update_user(emp_id: str, data: schemas.UserUpdate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.employee_id == emp_id).first()
    if not user: raise HTTPException(status_code=404, detail="ไม่พบพนักงาน")
    user.fullname = data.fullname
    user.position = data.position
    user.is_admin = data.is_admin
    db.commit()
    return {"message": "แก้ไขสำเร็จ"}


# =========================
# STATS
# =========================
@app.get("/stats/latecomers/")
def get_latecomers(db: Session = Depends(get_db)):
    # 🚀 สมมติว่าโค้ดเดิมเป็นการ query ScanLog
    # ให้เพิ่มเงื่อนไข Join กับตาราง User และเช็คว่า is_deleted == False
    
    results = db.query(
        models.User.fullname,
        models.User.employee_id,
        func.count(models.ScanLog.id).label('count')
    ).join(
        models.ScanLog, models.User.employee_id == models.ScanLog.employee_id
    ).filter(
        models.ScanLog.status == "Late",
        models.User.is_deleted == False # 🚀 หัวใจสำคัญอยู่บรรทัดนี้!
    ).group_by(
        models.User.fullname,
        models.User.employee_id
    ).order_by(
        desc('count')
    ).all()

    # แปลงข้อมูลส่งกลับ
    return [{"fullname": r.fullname, "employee_id": r.employee_id, "count": r.count} for r in results]


@app.get("/stats/latecomers/monthly")
def late_monthly(db: Session = Depends(get_db)):

    four_months_ago = datetime.now() - timedelta(days=120)

    year_col = extract('year', models.ScanLog.timestamp).label("year")
    month_col = extract('month', models.ScanLog.timestamp).label("month")

    result = (
        db.query(
            models.ScanLog.fullname,
            year_col,
            month_col,
            func.count(models.ScanLog.id).label("count")
        )
        .filter(
            models.ScanLog.status == "Late",
            models.ScanLog.timestamp >= four_months_ago
        )
        .group_by(
            models.ScanLog.fullname,
            year_col,
            month_col
        )
        .order_by(
            year_col.desc(),
            month_col.desc(),
            func.count(models.ScanLog.id).desc()
        )
        .all()
    )

    return [
        {
            "name": r[0],
            "year": int(r[1]),
            "month": int(r[2]),
            "count": r[3]
        }
        for r in result
    ]


@app.get("/users/{employee_id}")
def get_user(employee_id: str, db: Session = Depends(get_db)):
    # ค้นหาพนักงานจาก employee_id
    user = db.query(models.User).filter(models.User.employee_id == employee_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="ไม่พบข้อมูลพนักงาน")
        
    return user