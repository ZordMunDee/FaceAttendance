'use client';

import { useState, useRef } from 'react';
import { CameraBox } from "./CameraBox";
import { Button } from "./ui/button";
import { ScanFace, Loader2, Check, X } from "lucide-react";
import { useRouter } from 'next/navigation';

export function ScanInterface({ type }: { type: 'In' | 'Out' | null }) {
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState<{
    show: boolean;
    type: 'success' | 'error';
    title: string;
    subtitle: string;
  }>({ show: false, type: 'success', title: '', subtitle: '' });

  const webcamRef = useRef<any>(null);
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleScan = async () => {
    if (loading || !type) return;

    const img = webcamRef.current?.getScreenshot();
    
    if (!img) {
      setPopup({ show: true, type: 'error', title: 'กล้องยังไม่พร้อม', subtitle: 'โปรดลองใหม่ค่ะ' });
      setTimeout(() => setPopup(prev => ({ ...prev, show: false })), 2000);
      return;
    }

    setLoading(true);

    try {
      // 🚀 ส่งทั้ง Base64 และ type ('In' หรือ 'Out') ไปที่ Backend
      const res = await fetch(`${API_URL}/scan/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: img,
          scan_type: type
        })
      });

      if (!res.ok) throw new Error("ไม่พบใบหน้า");
      const data = await res.json();

      // 🚀 จัดการสถานะที่ Backend ส่งกลับมา (In, Out, Late)
      const status = (data.status || "").toString().toLowerCase();
      const fullname = data.fullname || "พนักงาน";

      // 💡 คำนวณข้อความ Popup ตามสถานะ
      let title = `คุณ${fullname}`;
      let subtitle = "ทำรายการสำเร็จ";

      if (status === 'late') {
        title = `คุณ${fullname}`;
        subtitle = "เข้างานสาย!";
      } else if (status === 'in') {
        title = `ยินดีต้อนรับ คุณ${fullname}`;
        subtitle = "เข้างานสำเร็จ";
      } else {
        subtitle = "ออกงานสำเร็จ";
      }

      // สั่งเปิดไฟ
      fetch(`${API_URL}/trigger-light/`, { method: "POST" }).catch(console.warn);

      setPopup({ show: true, type: 'success', title, subtitle });

      setTimeout(() => {
        router.push('/'); 
      }, 2500);

    } catch (err: any) {
      setPopup({ show: true, type: 'error', title: 'ไม่พบใบหน้า', subtitle: 'โปรดลองใหม่อีกครั้ง' });
      setTimeout(() => {
        setPopup(prev => ({ ...prev, show: false }));
        setLoading(false);
      }, 2500);
    }
  };

  return (
    <>
      <div className="space-y-6 w-full max-w-lg relative z-10 animate-in fade-in duration-500">
        <div className="relative overflow-hidden rounded-3xl border-2 border-slate-800 bg-slate-900 shadow-2xl">
          <CameraBox webcamRef={webcamRef} />
        </div>

        <Button 
          onClick={handleScan} 
          disabled={loading || !type} 
          className={`w-full h-20 text-2xl font-black rounded-2xl relative z-50 transition-all ${
            loading ? 'bg-slate-800' : 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]' 
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-3"><Loader2 className="animate-spin" size={28} /> กำลังประมวลผล...</span>
          ) : (
            <span className="flex items-center gap-2"><ScanFace size={28} /> สแกนใบหน้าเพื่อ{type === 'In' ? 'เข้างาน' : 'ออกงาน'}</span>
          )}
        </Button>
      </div>

      {popup.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md px-6">
          <div className={`w-full max-w-lg rounded-[2rem] p-10 flex flex-col items-center justify-center text-center shadow-2xl ${popup.type === 'success' ? 'bg-[#59A869]' : 'bg-[#C64E40]'}`}>
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8">
              {popup.type === 'success' ? <Check size={56} className="text-[#59A869]" /> : <X size={56} className="text-[#C64E40]" />}
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">{popup.title}</h2>
            <p className="text-2xl font-medium text-white/90">{popup.subtitle}</p>
          </div>
        </div>
      )}
    </>
  );
}