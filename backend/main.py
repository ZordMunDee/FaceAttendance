from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

import os
import json
import time
import base64
import threading
from datetime import datetime, time as dt_time
from dotenv import load_dotenv

import numpy as np
import cv2
import face_recognition
import serial

import models
import schemas
from database import engine, get_db
from auth import create_access_token


# =========================
# APP INIT
# =========================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()
models.Base.metadata.create_all(bind=engine)


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
@app.post("/users/")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):

    if db.query(models.User).filter_by(employee_id=user.employee_id).first():
        raise HTTPException(400, "exists")

    enc = decode_face(user.image_base64)
    if not enc:
        raise HTTPException(400, "no face")

    db.add(models.User(
        employee_id=user.employee_id,
        fullname=user.fullname,
        is_admin=user.is_admin,
        face_encoding=json.dumps(enc.tolist()),
        status="In",
        timestamp=datetime.now()
    ))

    db.commit()
    return {"message": "ok"}


@app.get("/users/")
def users(db: Session = Depends(get_db)):
    return db.query(models.User).all()


# =========================
# LOGIN
# =========================
@app.post("/login/")
def login(data: schemas.LoginRequest):

    if data.username == os.getenv("ADMIN_USER") and data.password == os.getenv("ADMIN_PASS"):
        return {"message": "ok"}

    raise HTTPException(401, "invalid")


# =========================
# SCAN (เวอร์ชันแก้บัคชื่อตัวแปร)
# =========================
@app.post("/scan/")
def scan(data: schemas.ScanRequest, db: Session = Depends(get_db)):

    
    incoming_encoding = decode_face(data.image_base64)

    if incoming_encoding is None:  
        raise HTTPException(status_code=400, detail="กล้องจับใบหน้าไม่ชัด")

    all_users = db.query(models.User).all()
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

    # กำหนดสถานะ
    status = data.scan_type
    if status == "In" and datetime.now().time() > dt_time(8, 30):
        status = "Late"

    # อัปเดตข้อมูลพนักงาน
    user.status = status
    user.timestamp = datetime.now()

    # บันทึก Log
    db.add(models.ScanLog(
        employee_id=user.employee_id,
        fullname=user.fullname,
        status=status,
        timestamp=datetime.now()
    ))

    db.commit()

    # สั่งเปิด Relay (ไนซ์อย่าลืมเช็ค Port COM3 นะครับ)
    threading.Thread(target=trigger_sc840_relay, args=(1,)).start()

    return {
        "employee_id": user.employee_id,
        "fullname": user.fullname,
        "status": status
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
@app.delete("/users/{emp_id}")
async def delete_user(emp_id: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.employee_id == emp_id).first()
    if not user: raise HTTPException(status_code=404, detail="ไม่พบพนักงาน")
    db.delete(user)
    db.commit()
    return {"message": "ลบสำเร็จ"}

@app.put("/users/{emp_id}")
async def update_user(emp_id: str, data: schemas.UserUpdate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.employee_id == emp_id).first()
    if not user: raise HTTPException(status_code=404, detail="ไม่พบพนักงาน")
    user.fullname = data.fullname
    user.is_admin = data.is_admin
    db.commit()
    return {"message": "แก้ไขสำเร็จ"}


# =========================
# STATS
# =========================
@app.get("/stats/latecomers/")
def stats(db: Session = Depends(get_db)):

    result = db.query(
        models.ScanLog.fullname,
        func.count(models.ScanLog.id)
    ).filter(
        models.ScanLog.status == "In"
    ).group_by(
        models.ScanLog.fullname
    ).all()

    return [{"name": r[0], "count": r[1]} for r in result]