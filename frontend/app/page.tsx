'use client';

import { useState } from 'react';
import axios from 'axios';
import { ScanFace, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';

// ตั้งค่า URL ของ Backend
const API_URL = 'http://127.0.0.1:8000';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // State สำหรับฟอร์มลงทะเบียน
  const [regData, setRegData] = useState({ fullname: '', employee_id: '' });

  // ฟังก์ชันยิง API สแกนเข้างาน
  const handleScan = async () => {
    setLoading(true);
    setMessage({ text: '📸 กำลังเปิดกล้องสแกน... กรุณามองที่กล้อง', type: 'info' });
    try {
      // ยิง API ไปกระตุกให้ Backend เปิดกล้องสแกน
      const res = await axios.post(`${API_URL}/scan/`);
      setMessage({ 
        text: `✅ ${res.data.message} (${res.data.status})`, 
        type: 'success' 
      });
    } catch (error: any) {
      setMessage({ 
        text: `❌ ${error.response?.data?.detail || 'เกิดข้อผิดพลาดในการสแกน'}`, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันยิง API ลงทะเบียนพนักงานใหม่
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regData.fullname || !regData.employee_id) return;
    
    setLoading(true);
    setMessage({ text: '📸 กำลังเปิดกล้องเพื่อลงทะเบียนใบหน้า...', type: 'info' });
    try {
      const res = await axios.post(`${API_URL}/users/`, regData);
      setMessage({ 
        text: `✅ ลงทะเบียน ${res.data.fullname} สำเร็จ!`, 
        type: 'success' 
      });
      setRegData({ fullname: '', employee_id: '' }); // เคลียร์ฟอร์ม
    } catch (error: any) {
      setMessage({ 
        text: `❌ ${error.response?.data?.detail || 'ลงทะเบียนไม่สำเร็จ'}`, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 font-sans">
      
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-2 tracking-wide text-blue-400">
          FACE AUTHENTICATION
        </h1>
        <p className="text-slate-400">ระบบบันทึกเวลาเข้า-ออกงานด้วยใบหน้า</p>
      </div>

      {/* กล่องแสดงข้อความแจ้งเตือน (Alert Box) */}
      {message.text && (
        <div className={`mb-8 p-4 rounded-lg w-full max-w-2xl flex items-center justify-center gap-3 text-lg font-medium transition-all ${
          message.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 
          message.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 
          'bg-blue-500/20 text-blue-400 border border-blue-500/50 animate-pulse'
        }`}>
          {message.type === 'success' && <CheckCircle2 />}
          {message.type === 'error' && <AlertCircle />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
        
        {/* โซนที่ 1: สแกนเข้างาน (ปุ่มใหญ่เบิ้ม) */}
        <div className="bg-slate-800 p-8 rounded-2xl shadow-xl flex flex-col items-center justify-center border border-slate-700">
          <ScanFace size={80} className="text-blue-500 mb-6" />
          <h2 className="text-2xl font-semibold mb-4">สแกนเข้า - ออกงาน</h2>
          <p className="text-slate-400 text-center mb-8">
            กดปุ่มด้านล่างแล้วมองที่กล้องเพื่อบันทึกเวลา
          </p>
          <button 
            onClick={handleScan}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white text-xl font-bold py-6 px-8 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-900/50"
          >
            {loading ? 'กำลังทำงาน...' : 'เริ่มสแกนใบหน้า'}
          </button>
        </div>

        {/* โซนที่ 2: ฟอร์มลงทะเบียนพนักงาน */}
        <div className="bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <UserPlus className="text-emerald-500" />
            <h2 className="text-2xl font-semibold">ลงทะเบียนพนักงานใหม่</h2>
          </div>
          
          <form onSubmit={handleRegister} className="flex flex-col gap-5">
            <div>
              <label className="block text-slate-400 text-sm font-medium mb-2">รหัสพนักงาน (Employee ID)</label>
              <input 
                type="text" 
                value={regData.employee_id}
                onChange={(e) => setRegData({...regData, employee_id: e.target.value})}
                disabled={loading}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="เช่น EMP002"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm font-medium mb-2">ชื่อ-นามสกุล (Full Name)</label>
              <input 
                type="text" 
                value={regData.fullname}
                onChange={(e) => setRegData({...regData, fullname: e.target.value})}
                disabled={loading}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="ชื่อ-นามสกุล พนักงาน"
                required
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white font-bold py-4 px-8 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-900/50"
            >
              บันทึกข้อมูลใบหน้า
            </button>
          </form>
        </div>

      </div>
    </main>
  );
}