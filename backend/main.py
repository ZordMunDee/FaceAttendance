from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
import models
import schemas
from database import engine, get_db
import face_recognition
import numpy as np
import cv2
import base64
import json
import serial
import time
import threading
import os
from dotenv import load_dotenv

load_dotenv()
models.Base.metadata.create_all(bind=engine)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🚀 ตั้งค่า Serial ตามสเปกของ SC-840 (9600, N, 8, 1)
try:
    ser = serial.Serial(os.getenv("SERIAL_PORT", 'COM3'), 9600, timeout=1)
    print("✅ เชื่อมต่อ SC-840 สำเร็จ")
except Exception as e:
    ser = None
    print(f"❌ ไม่พบพอร์ต SC-840: {e}")

# 🚀 ฟังก์ชันควบคุม SC-840 ตามคู่มือ (ใช้ String @1 Nx)
def trigger_sc840_relay(channel: int):
    # รูปแบบคำสั่ง: @1 (Address 1) N(ช่อง) สำหรับเปิด หรือ F(ช่อง) สำหรับปิด ตามคู่มือ
    cmd_on = f"@1 N{channel}\r"  
    cmd_off = f"@1 F{channel}\r"
    
    if ser and ser.is_open:
        try:
            # 1. ส่งคำสั่งเปิด
            ser.write(cmd_on.encode()) 
            print(f"💡 SC-840: ส่งคำสั่ง {cmd_on.strip()} (เปิดช่อง {channel})")
            
            time.sleep(3) # รอ 3 วินาที
            
            # 2. ส่งคำสั่งปิด
            ser.write(cmd_off.encode())
            print(f"💡 SC-840: ส่งคำสั่ง {cmd_off.strip()} (ปิดช่อง {channel})")
        except Exception as e:
            print(f"Error writing to SC-840: {e}")
    else:
        print(f"💡 [Simulation] SC-840 เปิด Relay ช่องที่ {channel}")

@app.post("/trigger-light/")
async def trigger_light_endpoint():
    # สั่งเปิด Relay ช่องที่ 1 (ไนซ์เปลี่ยนเลขช่องตรงนี้ได้เลย)
    threading.Thread(target=trigger_sc840_relay, args=(1,)).start()
    return {"message": "Light triggered"}

# 💡 ฟังก์ชันแปลงรูปภาพ
def get_face_encoding_from_base64(base64_string: str):
    try:
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]
        img_data = base64.b64decode(base64_string)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        encodings = face_recognition.face_encodings(rgb_img)
        return encodings[0] if len(encodings) > 0 else None
    except Exception as e:
        print(f"Error decoding image: {e}")
        return None

# 🚀 1. ลงทะเบียน
@app.post("/users/")
async def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.employee_id == user.employee_id).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="รหัสพนักงานนี้มีในระบบแล้ว")
    face_encoding = get_face_encoding_from_base64(user.image_base64)
    if face_encoding is None:
        raise HTTPException(status_code=400, detail="ไม่พบใบหน้า")
    encoding_str = json.dumps(face_encoding.tolist())
    db_user = models.User(employee_id=user.employee_id, fullname=user.fullname, is_admin=user.is_admin, face_encoding=encoding_str, status="In", timestamp=datetime.now())
    db.add(db_user)
    db.commit()
    return {"message": "ลงทะเบียนสำเร็จ"}

# 🚀 2. สแกนเข้า-ออก (รวมการสั่งเปิดไฟไว้ที่นี่ด้วย)
@app.post("/scan/")
async def scan(data: schemas.ScanRequest, db: Session = Depends(get_db)):
    incoming_encoding = get_face_encoding_from_base64(data.image_base64)
    if incoming_encoding is None:
        raise HTTPException(status_code=400, detail="กล้องจับใบหน้าไม่ชัด")
    all_users = db.query(models.User).all()
    known_encodings = []
    known_users = []
    for u in all_users:
        if u.face_encoding and u.face_encoding != "dummy_data":
            try:
                known_encodings.append(np.array(json.loads(u.face_encoding)))
                known_users.append(u)
            except: continue
    
    face_distances = face_recognition.face_distance(known_encodings, incoming_encoding)
    best_match_index = np.argmin(face_distances)
    if face_distances[best_match_index] < 0.5:
        matched_user = known_users[best_match_index]
    else:
        raise HTTPException(status_code=404, detail="ใบหน้าไม่ตรงกับพนักงาน")

    matched_user.status = "Out" if matched_user.status == "In" else "In"
    matched_user.timestamp = datetime.now() 
    
    new_log = models.ScanLog(employee_id=matched_user.employee_id, fullname=matched_user.fullname, status=matched_user.status, timestamp=matched_user.timestamp)
    db.add(new_log)
    db.commit()
    
    # 🚀 สั่งเปิด Relay ช่องที่ 1 หลังจากสแกนผ่านสำเร็จ
    threading.Thread(target=trigger_sc840_relay, args=(1,)).start()
    
    return matched_user

# 🚀 3-6. ส่วนของ Logs, Users, Login, Update, Delete
@app.get("/scan/logs", response_model=list[schemas.LogResponse])
async def get_logs(db: Session = Depends(get_db)):
    return db.query(models.ScanLog).order_by(models.ScanLog.timestamp.desc()).all()

@app.get("/users/", response_model=list[schemas.UserResponse])
async def get_all_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

@app.post("/login/")
async def login(credentials: schemas.LoginRequest):
    if credentials.username == os.getenv("ADMIN_USER") and credentials.password == os.getenv("ADMIN_PASS"):
        return {"message": "Login Successful"}
    raise HTTPException(status_code=401, detail="รหัสไม่ถูกต้อง")

@app.put("/users/{emp_id}")
async def update_user(emp_id: str, data: schemas.UserUpdate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.employee_id == emp_id).first()
    if not user: raise HTTPException(status_code=404, detail="ไม่พบพนักงาน")
    user.fullname = data.fullname
    user.is_admin = data.is_admin
    db.commit()
    return {"message": "แก้ไขสำเร็จ"}

@app.delete("/users/{emp_id}")
async def delete_user(emp_id: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.employee_id == emp_id).first()
    if not user: raise HTTPException(status_code=404, detail="ไม่พบพนักงาน")
    db.delete(user)
    db.commit()
    return {"message": "ลบสำเร็จ"}