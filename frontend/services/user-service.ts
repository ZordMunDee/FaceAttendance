import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export interface LogEntry {
  id: number;
  employee_id: string;
  fullname: string;
  status: string;
  timestamp: string;
}

export interface RegisterRequest {
  fullname: string;
  employee_id: string;
  image_base64: string;
  is_admin: boolean;
}

// 🚀 เพิ่ม Interface สำหรับข้อมูลพนักงาน
export interface UserData {
  employee_id: string;
  fullname: string;
  is_admin: boolean;
}

export const userService = {
  // ดึงข้อมูลประวัติสแกน
  getLogs: async (): Promise<LogEntry[]> => {
    const response = await axios.get(`${API_URL}/scan/logs`);
    return response.data;
  },

  // 🚀 เพิ่มฟังก์ชันดึงรายชื่อพนักงานทั้งหมด
  getAllUsers: async (): Promise<UserData[]> => {
    try {
      const response = await axios.get(`${API_URL}/users/`);
      return response.data;
    } catch (error) {
      console.error("Fetch users error:", error);
      return [];
    }
  },


 // สแกนใบหน้า (ส่งแค่รูปไปให้ AI วิเคราะห์)
  scan: async (image_base64: string) => {
    const response = await axios.post(`${API_URL}/scan/`, { 
      image_base64 
    });
    return response.data;
  },

  // ลงทะเบียน
  register: async (data: RegisterRequest) => {
    const response = await axios.post(`${API_URL}/users/`, data);
    return response.data;
  }
};