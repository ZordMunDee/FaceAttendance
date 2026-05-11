# ✅ อัปเกรดเป็น Node.js 20 ตามที่ Next.js ร้องขอ
FROM node:20-alpine

WORKDIR /app

# ติดตั้ง dependencies
COPY package*.json ./
RUN npm install

# ก๊อปปี้โค้ดทั้งหมด
COPY . .

ARG NEXT_PUBLIC_API_URL

# 2. เอาค่าที่รับมา ยัดใส่ Environment ของ Next.js
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Build โปรเจกต์
RUN npm run build

# รัน Next.js
CMD ["npm", "run", "start"]