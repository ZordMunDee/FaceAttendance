# ✅ อัปเกรดเป็น Node.js 20 ตามที่ Next.js ร้องขอ
FROM node:20-alpine

WORKDIR /app

# ติดตั้ง dependencies
COPY package*.json ./
RUN npm install

# ก๊อปปี้โค้ดทั้งหมด
COPY . .

# Build โปรเจกต์
RUN npm run build

# รัน Next.js
CMD ["npm", "run", "start"]