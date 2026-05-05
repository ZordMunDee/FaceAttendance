# backend/face_engine.py
import cv2
import face_recognition
import json
import numpy as np
import base64

def string_to_encode(encoding_str):
    """แปลง String จาก Database กลับเป็น Array"""
    return np.array(json.loads(encoding_str))

def encode_to_string(encoding):
    """แปลง Face Encoding เป็น String เพื่อเก็บลง Database"""
    return json.dumps(encoding.tolist())

def process_base64_image(base64_str):
    """แปลงรูปภาพจากหน้าเว็บ (Base64) ให้เป็นรูปภาพที่ AI อ่านได้"""
    # ตัด Header ของ Base64 ออกถ้ามี (เช่น data:image/jpeg;base64,)
    if ',' in base64_str:
        base64_str = base64_str.split(',')[1]
    
    img_data = base64.b64decode(base64_str)
    nparr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

def get_encoding_from_image(base64_str):
    """ดึงรหัสใบหน้าจากรูปภาพ Base64 (สำหรับลงทะเบียน)"""
    rgb_img = process_base64_image(base64_str)
    face_locations = face_recognition.face_locations(rgb_img)
    
    if not face_locations:
        return None, "มองไม่เห็นใบหน้า กรุณาถ่ายใหม่"
    
    encoding = face_recognition.face_encodings(rgb_img, face_locations)[0]
    return encoding, "สำเร็จ"

def recognize_from_image(base64_str, known_encodings, known_ids):
    """เทียบใบหน้าจากรูปภาพ Base64 (สำหรับสแกนเข้างาน)"""
    rgb_img = process_base64_image(base64_str)
    face_locations = face_recognition.face_locations(rgb_img)
    
    if not face_locations:
        return None
    
    face_encodings = face_recognition.face_encodings(rgb_img, face_locations)
    for face_encoding in face_encodings:
        matches = face_recognition.compare_faces(known_encodings, face_encoding, tolerance=0.45)
        face_distances = face_recognition.face_distance(known_encodings, face_encoding)
        
        if len(face_distances) > 0:
            best_match_index = np.argmin(face_distances)
            if matches[best_match_index]:
                return known_ids[best_match_index] # เจอตัวแล้ว!
                
    return None