# ใช้ Python 3.11
FROM python:3.11-slim

# ลง dependencies สำหรับ OpenCV และ Face Recognition
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 🚀 ติดตั้ง Library ตรงๆ โดยไม่ต้องพึ่งไฟล์ requirements.txt
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn[standard] \
    sqlalchemy \
    pymysql \
    opencv-python-headless \
    face-recognition \
    python-multipart \
    pydantic \
    pyserial \
    "python-jose[cryptography]"

# ก๊อปปี้โค้ดทั้งหมด
COPY . .

# รัน Backend (สมมติว่าเป็น FastAPI)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]