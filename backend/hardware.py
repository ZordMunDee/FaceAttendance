# backend/hardware.py
import serial
import time
import threading

# ตั้งค่าพอร์ต (Mac มักจะเป็น '/dev/cu.usbserial-xxx', ส่วนเครื่องจริง/Raspberry Pi มักจะเป็น '/dev/ttyUSB0')
SERIAL_PORT = '/dev/ttyUSB0' 
BAUD_RATE = 9600

def send_door_signal():
    """ฟังก์ชันคุยกับฮาร์ดแวร์ผ่านสาย RS232/USB"""
    try:
        # พยายามเชื่อมต่อกับฮาร์ดแวร์
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        print("\n🔌 [HARDWARE] ส่งสัญญาณ: ปลดล็อกประตู (ไฟเขียวติด) 🟢")
        ser.write(b'OPEN\n') # ส่งคำสั่ง OPEN (ตัวหนังสือ) ไปให้บอร์ด
        
        time.sleep(3) # แช่ไฟไว้ 3 วินาที ให้คนเดินผ่าน
        
        print("🔌 [HARDWARE] ส่งสัญญาณ: ล็อกประตู (ไฟแดงติด) 🔴\n")
        ser.write(b'CLOSE\n') # ส่งคำสั่ง CLOSE ไปปิด
        ser.close()
        
    except Exception as e:
        # ถ้าไม่ได้เสียบสายฮาร์ดแวร์ ให้จำลองการทำงานบน Terminal แทน (Mac จะได้ไม่พัง)
        print(f"\n⚠️ [HARDWARE MOCK] ไม่พบสายเชื่อมต่อ RS232: จำลองการเปิดประตู 3 วินาที 🟢")
        time.sleep(3)
        print("⚠️ [HARDWARE MOCK] จำลองการปิดประตูเสร็จสิ้น 🔴\n")

def trigger_door_unlock():
    """
    เรียกใช้ฟังก์ชันนี้จาก API 
    (ใช้ Threading เพื่อให้ API ตอบกลับหน้าเว็บได้ทันที ไม่ต้องรอประตูเปิดเสร็จ 3 วินาที)
    """
    thread = threading.Thread(target=send_door_signal)
    thread.start()