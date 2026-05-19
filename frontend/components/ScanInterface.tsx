'use client';

import { useState, useRef } from 'react';
import { CameraBox } from "./CameraBox";
import { Button } from "./ui/button";
import { ScanFace, Loader2, Check, X } from "lucide-react";
import { useRouter } from 'next/navigation';

// 🚀 1. เพิ่มการรับค่า lat และ lng เข้ามาใน Props
export function ScanInterface({ type, lat, lng }: { type: 'In' | 'Out' | null, lat?: number | null, lng?: number | null }) {
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
      const res = await fetch(`${API_URL}/scan/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: img,
          scan_type: type,
          // 🚀 2. แนบพิกัด GPS ส่งขึ้นรถไฟไปให้ Backend ด้วย!
          lat: lat,
          lng: lng
        })
      });

      if (!res.ok) {
        const errorData = await res.json(); 
        throw new Error(errorData.detail || "ไม่พบใบหน้า"); 
      }

      const data = await res.json();

      const status = (data.status || "").toString().toLowerCase();
      const fullname = data.fullname || "พนักงาน";

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

      fetch(`${API_URL}/trigger-light/`, { method: "POST" }).catch(console.warn);

      setPopup({ show: true, type: 'success', title, subtitle });

      setTimeout(() => {
        router.push('/'); 
      }, 2500);

    } catch (err: any) {
      const isDuplicate = err.message.includes("แล้ววันนี้");

      setPopup({ 
        show: true, 
        type: 'error', 
        title: isDuplicate ? 'แจ้งเตือนการสแกนซ้ำ' : 'ไม่พบใบหน้า', 
        subtitle: err.message 
      });

      setTimeout(() => {
        setPopup(prev => ({ ...prev, show: false }));
        setLoading(false);
      }, 3500); 
    }
  };

  return (
    <>
      <div className="space-y-4 sm:space-y-6 w-full relative z-10 animate-in fade-in duration-500">
        
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-slate-800 bg-slate-900 shadow-xl sm:shadow-2xl aspect-square sm:aspect-[4/3]">
          <CameraBox webcamRef={webcamRef} />
        </div>

        <Button 
          onClick={handleScan} 
          disabled={loading || !type} 
          className={`w-full h-14 sm:h-20 text-lg sm:text-2xl font-black rounded-xl sm:rounded-2xl relative z-50 transition-all ${
            loading ? 'bg-slate-800' : 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)] sm:shadow-[0_0_20px_rgba(37,99,235,0.3)]' 
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-2 sm:gap-3">
              <Loader2 className="animate-spin w-5 h-5 sm:w-7 sm:h-7" /> 
              กำลังประมวลผล...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <ScanFace className="w-5 h-5 sm:w-7 sm:h-7" /> 
              สแกนใบหน้าเพื่อ{type === 'In' ? 'เข้างาน' : 'ออกงาน'}
            </span>
          )}
        </Button>
      </div>

      {popup.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md px-4 sm:px-6">
          <div className={`w-full max-w-[90%] sm:max-w-lg rounded-[1.5rem] sm:rounded-[2rem] p-8 sm:p-10 flex flex-col items-center justify-center text-center shadow-2xl animate-in zoom-in duration-300 ${popup.type === 'success' ? 'bg-[#59A869]' : 'bg-[#C64E40]'}`}>
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center mb-6 sm:mb-8 shadow-inner">
              {popup.type === 'success' 
                ? <Check className="text-[#59A869] w-8 h-8 sm:w-14 sm:h-14" /> 
                : <X className="text-[#C64E40] w-8 h-8 sm:w-14 sm:h-14" />
              }
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-3">{popup.title}</h2>
            <p className="text-lg sm:text-2xl font-medium text-white/90">{popup.subtitle}</p>
          </div>
        </div>
      )}
    </>
  );
}