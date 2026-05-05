'use client';

import { useState, useRef } from 'react';
import { CameraBox } from "./CameraBox";
import { Button } from "./ui/button";
import { userService } from "@/services/user-service";
import { Settings2, ScanFace, Loader2, Check, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';

export function ScanInterface() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 🚀 State สำหรับคุม Popup เต็มหน้าจอ
  const [popup, setPopup] = useState<{
    show: boolean;
    type: 'success' | 'error';
    title: string;
    subtitle: string;
  }>({ show: false, type: 'success', title: '', subtitle: '' });

  const webcamRef = useRef<any>(null);
  const router = useRouter();

  const handleScan = async () => {
    if (loading) return;

    const img = webcamRef.current?.getScreenshot();
    
    if (!img) {
      setPopup({
        show: true,
        type: 'error',
        title: 'กล้องยังไม่พร้อม',
        subtitle: 'โปรดรอสักครู่แล้วลองใหม่ค่ะ'
      });
      setTimeout(() => setPopup(prev => ({ ...prev, show: false })), 3000);
      return;
    }

    // 🚀 เพิ่มคำสั่งเปิดไฟ (Trigger Light) ทันทีที่เริ่มสแกน
    try {
        fetch("http://localhost:8000/trigger-light/", { method: "POST" });
    } catch (e) {
        console.warn("ไม่สามารถสั่งเปิดไฟได้:", e);
    }

    setLoading(true);

    try {
      const res = await userService.scan(img);
      const isCheckIn = res.status === 'In';
      
      // 🚀 1. แสดง Popup สีเขียว (สำเร็จ)
      setPopup({
        show: true,
        type: 'success',
        title: isCheckIn ? `ยินดีต้อนรับ คุณ${res.fullname}` : `คุณ${res.fullname}`,
        subtitle: isCheckIn ? 'เข้างาน สำเร็จ' : 'ออกงาน สำเร็จ'
      });

      if (res.is_admin) {
        setIsAdmin(true);
        setTimeout(() => {
          setPopup(prev => ({ ...prev, show: false }));
          setLoading(false);
        }, 2000);
      } else {
        setTimeout(() => {
          router.push('/'); 
        }, 2500);
      }

    } catch (err: any) {
      console.error("Scan Error:", err);
      
      // 🚀 3. แสดง Popup สีแดง (ไม่สำเร็จ)
      setPopup({
        show: true,
        type: 'error',
        title: 'ไม่พบใบหน้า',
        subtitle: 'โปรดลองใหม่อีกครั้งค่ะ'
      });

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
          disabled={loading} 
          className={`w-full h-20 text-2xl font-black rounded-2xl relative z-50 transition-all ${
            loading 
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-500 active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.3)]' 
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-3">
              <Loader2 className="animate-spin" size={28} />
              กำลังประมวลผล...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <ScanFace size={28} /> สแกนใบหน้า
            </span>
          )}
        </Button>

        {isAdmin && !popup.show && (
          <div className="pt-4 relative z-50">
            <Button 
              variant="outline" 
              asChild 
              className="w-full h-14 border-emerald-500/50 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-2xl animate-in zoom-in"
            >
              <Link href="/admin/users">
                <Settings2 className="mr-2 h-5 w-5" /> เข้าสู่ระบบจัดการ (Admin)
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* 🚀🚀 ส่วนของ Popup เต็มหน้าจอ 🚀🚀 */}
      {popup.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300 px-6">
          <div className={`w-full max-w-lg rounded-[2rem] p-10 sm:p-14 flex flex-col items-center justify-center text-center shadow-2xl animate-in zoom-in-95 duration-300 ${
            popup.type === 'success' ? 'bg-[#59A869]' : 'bg-[#C64E40]'
          }`}>
            
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-full flex items-center justify-center mb-8 shadow-inner">
              {popup.type === 'success' ? (
                <Check strokeWidth={4} size={56} className="text-[#59A869]" />
              ) : (
                <X strokeWidth={4} size={56} className="text-[#C64E40]" />
              )}
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-snug">
              {popup.title}
            </h2>
            <p className="text-2xl sm:text-3xl font-medium text-white/90">
              {popup.subtitle}
            </p>

          </div>
        </div>
      )}
    </>
  );
}