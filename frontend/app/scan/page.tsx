"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation"; // 1. นำเข้า hook นี้
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScanInterface } from "@/components/ScanInterface";

// 2. สร้าง Component ย่อยเพื่อดึงค่าจาก URL
function ScanContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") as "In" | "Out" | null; // ดึง 'In' หรือ 'Out'

  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  const formatDate = (date: Date) =>
    date.toLocaleDateString("th-TH", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#cce0fc] to-[#e6f0fa] text-[#1a365d] flex flex-col items-center justify-center relative overflow-hidden font-sans px-6 py-10">
      {/* 🔙 back button */}
      <div className="absolute top-6 left-6 z-50">
        <Button
          variant="ghost"
          asChild
          className="text-[#1a365d] hover:bg-white/50"
        >
          <Link href="/">
            <ArrowLeft className="mr-2 h-5 w-5" />
            ย้อนกลับ
          </Link>
        </Button>
      </div>

      {/* 🟦 mode chip */}
      <div className="absolute top-8 z-10 bg-white/60 backdrop-blur-md px-6 py-2 rounded-full font-bold shadow-md">
        โหมด: {type === "In" ? "เข้างาน" : "ออกงาน"}
      </div>

      {/* ⏰ time section → ย้ายไปซ้ายบน */}
      <div className="absolute top-6 right-6 text-right z-10">
        <h1 className="text-5xl sm:text-6xl font-bold leading-none tracking-tight">
          {time ? formatTime(time) : "00:00"}
        </h1>
        <p className="text-sm sm:text-base mt-1 opacity-80">
          {time ? formatDate(time) : "กำลังโหลด..."}
        </p>
      </div>

      {/* 📷 scan container */}
      <div className="w-full max-w-2xl relative z-10 bg-white/60 p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-md border border-white/50">
        <h2 className="text-center text-2xl font-bold mb-8">
          โปรดจัดใบหน้าให้อยู่ในกรอบ
        </h2>

        {/* 📷 กล้องให้อยู่กลางจริง */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md aspect-square flex items-center justify-center">
            <ScanInterface type={type} />
          </div>
        </div>
      </div>
    </main>
  );
}

// 3. ใช้ Suspense ห่อไว้ เพื่อป้องกัน Error ตอนโหลดหน้า
export default function ScanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          กำลังโหลด...
        </div>
      }
    >
      <ScanContent />
    </Suspense>
  );
}
