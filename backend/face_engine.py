# ============================================================
# ไฟล์: backend/face_engine.py (โค้ดฉบับสมบูรณ์ครบทุกฟังก์ชัน!)
# ============================================================
import cv2
import face_recognition
import json
import numpy as np

# ==========================================
# ส่วนที่ 1: ฟังก์ชันตัวช่วย (Helper Functions)
# ==========================================
def calculate_ear(eye):
    """คำนวณอัตราส่วนการลืมตา (Eye Aspect Ratio) เพื่อเช็คการกระพริบตา"""
    A = np.linalg.norm(np.array(eye[1]) - np.array(eye[5]))
    B = np.linalg.norm(np.array(eye[2]) - np.array(eye[4]))
    C = np.linalg.norm(np.array(eye[0]) - np.array(eye[3]))
    ear = (A + B) / (2.0 * C)
    return ear

def check_head_turn(nose_tip, chin):
    """คำนวณสัดส่วนการหันหน้า (ซ้าย/ขวา) เทียบจากจมูกและคาง"""
    nose_x = nose_tip[0][0]
    chin_left_x = chin[0][0]
    chin_right_x = chin[-1][0]
    
    left_dist = abs(nose_x - chin_left_x)
    right_dist = abs(nose_x - chin_right_x)
    
    if right_dist == 0: 
        right_dist = 0.001 # ป้องกัน Error หารด้วยศูนย์
        
    return left_dist / right_dist

def encode_to_string(encoding):
    """แปลง Face Encoding (Numpy Array) เป็น String เพื่อเก็บลง Database อย่างปลอดภัย"""
    return json.dumps(encoding.tolist())

# ==========================================
# ส่วนที่ 2: ระบบบันทึกใบหน้าแบบ Liveness Detection (ตอนเพิ่มพนักงานใหม่)
# ==========================================
def register_face_liveness():
    """เปิดหน้าต่างกล้อง สั่งให้กระพริบตา และหันหน้า ก่อนบันทึก"""
    
    cap = cv2.VideoCapture(0, cv2.CAP_AVFOUNDATION)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1) # บังคับให้ไม่ดองเฟรม (ลดความหน่วง)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    state = 0 
    face_encoding_result = None
    frame_count = 0

    # ตัวแปรสำหรับจำค่า (Cache) เพื่อให้หน้าจอลื่นไหล
    cached_top, cached_right, cached_bottom, cached_left = 0, 0, 0, 0
    cached_head_ratio = 1.0
    cached_avg_ear = 1.0
    has_face = False

    print("📸 กล้องกำลังเปิดสำหรับลงทะเบียน... (อาจใช้เวลา 1-3 วินาที)")

    while True:
        ret, frame = cap.read()
        if not ret: break

        frame = cv2.flip(frame, 1)
        frame_count += 1
        
        # คำนวณ AI แค่ 1 เฟรมเว้น 3 เฟรม และย่อขนาดรูป (ลดแล็ค)
        if frame_count % 4 == 0:
            rgb_small = cv2.cvtColor(cv2.resize(frame, (0, 0), fx=0.25, fy=0.25), cv2.COLOR_BGR2RGB)
            current_face_locations = face_recognition.face_locations(rgb_small, model="hog")
            
            if current_face_locations:
                has_face = True
                top, right, bottom, left = current_face_locations[0]
                cached_top, cached_right, cached_bottom, cached_left = top * 4, right * 4, bottom * 4, left * 4
                
                landmarks = face_recognition.face_landmarks(rgb_small, current_face_locations)
                if landmarks:
                    lm = landmarks[0]
                    cached_avg_ear = (calculate_ear(lm['left_eye']) + calculate_ear(lm['right_eye'])) / 2.0
                    cached_head_ratio = check_head_turn(lm['nose_tip'], lm['chin'])
            else:
                has_face = False

        # วาดหน้าจอ
        if has_face:
            cv2.rectangle(frame, (cached_left, cached_top), (cached_right, cached_bottom), (255, 0, 0), 2)

            text_color = (255, 255, 255) 
            bg_color = (0, 0, 0) 

            def draw_text(img, text, pos):
                cv2.putText(img, text, pos, cv2.FONT_HERSHEY_SIMPLEX, 1, bg_color, 4, cv2.LINE_AA)
                cv2.putText(img, text, pos, cv2.FONT_HERSHEY_SIMPLEX, 1, text_color, 2, cv2.LINE_AA)

            if state == 0:
                draw_text(frame, "Step 1: Look Straight", (20, 50))
                if 0.8 < cached_head_ratio < 1.2:
                    state = 1
            
            elif state == 1:
                draw_text(frame, "Step 2: Please BLINK", (20, 50))
                if cached_avg_ear < 0.22: 
                    state = 2
            
            elif state == 2:
                draw_text(frame, "Step 3: Turn LEFT or RIGHT", (20, 50))
                if cached_head_ratio > 1.5 or cached_head_ratio < 0.6: 
                    state = 3
            
            elif state == 3:
                draw_text(frame, "SUCCESS! Press 'Q' to save.", (20, 50))
                cv2.rectangle(frame, (cached_left, cached_top), (cached_right, cached_bottom), (0, 255, 0), 3)
                if face_encoding_result is None:
                    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    face_encoding_result = face_recognition.face_encodings(rgb_frame, [(cached_top, cached_right, cached_bottom, cached_left)])[0]

        else:
            cv2.putText(frame, "No face detected", (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

        cv2.imshow("Registration - Liveness Detection", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    
    if face_encoding_result is not None:
        return face_encoding_result, "สำเร็จ"
    else:
        return None, "ยกเลิกการสแกน"

# ==========================================
# ส่วนที่ 3: ระบบสแกนเพื่อบันทึกเวลาเข้างาน (Fast Recognition + หน่วงเวลา 3 วิ)
# ==========================================
def string_to_encode(encoding_str):
    """แปลง String จาก Database กลับเป็น Array เพื่อให้ AI คำนวณได้"""
    return np.array(json.loads(encoding_str))

def recognize_face(known_encodings, known_ids):
    """เปิดกล้องสแกนหน้าแบบรวดเร็ว และเทียบกับฐานข้อมูล"""
    import time # 🚀 นำเข้าไลบรารีสำหรับจับเวลา (ใส่ไว้ตรงนี้จะได้ไม่ต้องเลื่อนไปบนสุด)

    cap = cv2.VideoCapture(0, cv2.CAP_AVFOUNDATION)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    recognized_id = None
    frame_count = 0
    success_time = None # ตัวแปรสำหรับจำเวลาตอนที่สแกนเจอหน้า

    print("📸 ระบบกำลังเปิดกล้องสแกนเข้างาน...")

    while True:
        ret, frame = cap.read()
        if not ret: break
        
        frame = cv2.flip(frame, 1)
        frame_count += 1

        # 🚀 ถ้ายังไม่มีใครสแกนผ่าน ให้ค้นหาหน้าต่อไป
        if success_time is None:
            if frame_count % 3 == 0:
                rgb_small = cv2.cvtColor(cv2.resize(frame, (0, 0), fx=0.25, fy=0.25), cv2.COLOR_BGR2RGB)
                face_locations = face_recognition.face_locations(rgb_small, model="hog")
                face_encodings = face_recognition.face_encodings(rgb_small, face_locations)

                for face_encoding in face_encodings:
                    matches = face_recognition.compare_faces(known_encodings, face_encoding, tolerance=0.45) 
                    face_distances = face_recognition.face_distance(known_encodings, face_encoding)

                    if len(face_distances) > 0:
                        best_match_index = np.argmin(face_distances)
                        if matches[best_match_index]:
                            recognized_id = known_ids[best_match_index] # เจอตัวแล้ว!
                            success_time = time.time() # ⏱️ เริ่มจับเวลาทันที!
                            break
        
        # 🚀 ถ้าระบบจำหน้าได้แล้ว จะเข้าโหมด "นับถอยหลัง 3 วินาที"
        else:
            elapsed_time = time.time() - success_time
            countdown = 3 - int(elapsed_time)
            
            # วาดข้อความสีเขียวตัวใหญ่ๆ ให้พนักงานชื่นใจ
            cv2.putText(frame, f"MATCHED! ID: {recognized_id}", (20, 150), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 3)
            cv2.putText(frame, f"Success! Closing in {countdown}s...", (20, 200), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

            # ถ้าเวลาผ่านไปครบ 3 วินาที ให้ปิดกล้อง
            if elapsed_time >= 3.0:
                break

        # วาดหน้าจอ UI พื้นฐาน
        cv2.putText(frame, "Please look at the camera to Clock In/Out", (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        cv2.putText(frame, "Press 'Q' to cancel", (20, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
        cv2.imshow("Scanner - Clock In/Out", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    return recognized_id # ส่งรหัสพนักงานที่เจอ กลับไปให้ API