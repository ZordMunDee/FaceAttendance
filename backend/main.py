from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
import models
import schemas
from database import engine, get_db

# 🚀 นำเข้าสมอง AI และเครื่องมือที่จำเป็น
import face_recognition
import numpy as np
import cv2
import base64
import json

import serial
import time
import threading

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🚀 พยายามเชื่อมต่อ RS232 (เปลี่ยน COM3 เป็นพอร์ตของเครื่อง)
try:
    ser = serial.Serial('COM3', 9600, timeout=1)
    print("✅ เชื่อมต่อ RS232 สำเร็จ")
except:
    ser = None
    print("❌ ไม่พบพอร์ต RS232")

# 🚀 ฟังก์ชันสั่งไฟ 3 วินาที
def trigger_light():
    if ser:
        ser.write(b'1')  # เปิดไฟ
        time.sleep(3)    # รอ 3 วินาที
        ser.write(b'0')  # ปิดไฟ
    else:
        print("💡 [Simulation] ไฟเปิด 3 วินาที...")

@app.post("/trigger-light/")
async def trigger_light_endpoint():
    threading.Thread(target=trigger_light).start()
    return {"message": "Light triggered"}
        
# 💡 ฟังก์ชันแปลงรูปภาพจากหน้าเว็บ (Base64) ให้ AI อ่านรู้เรื่อง
def get_face_encoding_from_base64(base64_string: str):
    try:
        # ตัดส่วนหัวของ Base64 ทิ้ง (ถ้ามี)
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]
            
        img_data = base64.b64decode(base64_string)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # AI ตัวนี้ต้องการรูปภาพในระบบสี RGB
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # สกัดจุดเด่นใบหน้า
        encodings = face_recognition.face_encodings(rgb_img)
        
        if len(encodings) == 0:
            return None # ไม่เจอหน้าคน
            
        return encodings[0] # คืนค่าใบหน้าแรกที่เจอ
    except Exception as e:
        print(f"Error decoding image: {e}")
        return None

# 🚀 1. ฟังก์ชันลงทะเบียน (จดจำใบหน้าจริงลง DB)
@app.post("/users/")
async def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # เช็คว่ามีรหัสพนักงานนี้ซ้ำไหม
    existing_user = db.query(models.User).filter(models.User.employee_id == user.employee_id).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="รหัสพนักงานนี้มีในระบบแล้ว")

    # สกัดใบหน้าจากรูปที่ส่งมา
    face_encoding = get_face_encoding_from_base64(user.image_base64)
    if face_encoding is None:
        raise HTTPException(status_code=400, detail="ไม่พบใบหน้าในรูปภาพ โปรดขยับหน้าเข้าใกล้กล้อง")

    # แปลง Array ของ AI เป็นข้อความ JSON เพื่อเก็บลงฐานข้อมูล
    encoding_str = json.dumps(face_encoding.tolist())

    db_user = models.User(
        employee_id=user.employee_id,
        fullname=user.fullname,
        is_admin=user.is_admin,
        face_encoding=encoding_str,
        status="In",               
        timestamp=datetime.now()    
    )
    db.add(db_user)
    db.commit()
    return {"message": "ลงทะเบียนสำเร็จ"}

# 🚀 2. สแกนเข้า-ออกงาน (เทียบใบหน้าจริง)
@app.post("/scan/", response_model=schemas.UserResponse)
async def scan(data: schemas.ScanRequest, db: Session = Depends(get_db)):
    # สกัดใบหน้าจากกล้องที่เพิ่งถ่ายส่งมา
    incoming_encoding = get_face_encoding_from_base64(data.image_base64)
    if incoming_encoding is None:
        raise HTTPException(status_code=400, detail="กล้องจับใบหน้าไม่ชัดเจน โปรดลองใหม่")

    # ดึงพนักงานทั้งหมดมาเทียบ
    all_users = db.query(models.User).all()
    if not all_users:
        raise HTTPException(status_code=404, detail="ฐานข้อมูลว่างเปล่า กรุณาลงทะเบียนก่อน")

    known_encodings = []
    known_users = []

    # เตรียมข้อมูลใบหน้าของทุกคนในระบบ
    for u in all_users:
        if u.face_encoding and u.face_encoding != "dummy_data":
            try:
                enc_list = json.loads(u.face_encoding)
                known_encodings.append(np.array(enc_list))
                known_users.append(u)
            except Exception:
                continue
    
    if not known_encodings:
        raise HTTPException(status_code=404, detail="ไม่มีข้อมูลใบหน้าพนักงานในระบบเลย")

    # 🧠 ให้ AI เทียบความเหมือน (ยิ่งค่าน้อย ยิ่งเหมือน)
    face_distances = face_recognition.face_distance(known_encodings, incoming_encoding)
    best_match_index = np.argmin(face_distances)

    # 🎯 ตั้งค่าความเข้มงวด (Threshold) - ค่าน้อยกว่า 0.5 ถือว่าหน้าตรงกันชัวร์ๆ (เปลี่ยนได้)
    if face_distances[best_match_index] < 0.5:
        matched_user = known_users[best_match_index]
    else:
        # ถ้าไม่มีใครหน้าเหมือนคนที่ยืนอยู่หน้ากล้องเลย
        raise HTTPException(status_code=404, detail="ใบหน้าไม่ตรงกับพนักงานคนใดในระบบ")

    # ถ้าเจอตัวแล้ว ก็สลับสถานะ เข้า/ออก
    matched_user.status = "Out" if matched_user.status == "In" else "In"
    matched_user.timestamp = datetime.now() 

    # บันทึกประวัติลงตาราง ScanLog ของพนักงานคนนั้น
    new_log = models.ScanLog(
        employee_id=matched_user.employee_id,
        fullname=matched_user.fullname,
        status=matched_user.status,
        timestamp=matched_user.timestamp
    )
    db.add(new_log)
    db.commit()
    db.refresh(matched_user)

    
    threading.Thread(target=trigger_light).start()

    return matched_user

# 🚀 3. ดึงประวัติมาแสดงที่ Dashboard
@app.get("/scan/logs", response_model=list[schemas.LogResponse])
async def get_logs(db: Session = Depends(get_db)):
    logs = db.query(models.ScanLog).order_by(models.ScanLog.timestamp.desc()).all()
    return logs

# 🚀 4. ดึงรายชื่อพนักงานทั้งหมด
@app.get("/users/", response_model=list[schemas.UserResponse])
async def get_all_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return users