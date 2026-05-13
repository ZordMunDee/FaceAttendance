"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScanInterface } from "@/components/ScanInterface";

function ScanContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") as "In" | "Out" | null;

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
    <main className="min-h-screen bg-gradient-to-br from-[#cce0fc] to-[#e6f0fa] text-[#1a365d] flex flex-col relative overflow-x-hidden font-sans p-4 sm:p-6 md:p-10">
      
      {/* 🚀 HEADER AREA (Responsive: พับเรียงบนมือถือ, กางออกบนจอใหญ่) */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-4 sm:gap-0 mb-6 sm:mb-10 relative z-20">
        
        {/* 🔙 back button */}
        <Button
          variant="ghost"
          asChild
          className="text-[#1a365d] hover:bg-white/50 -ml-2 sm:ml-0"
        >
          <Link href="/">
            <ArrowLeft className="mr-2 h-5 w-5" />
            ย้อนกลับ
          </Link>
        </Button>

        {/* 🟦 mode chip (ตรงกลางเฉพาะจอใหญ่) */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 bg-white/60 backdrop-blur-md px-6 py-2 rounded-full font-bold shadow-sm">
          โหมด: {type === "In" ? "เข้างาน" : "ออกงาน"}
        </div>

        {/* ⏰ time section */}
        <div className="text-left sm:text-right w-full sm:w-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-none tracking-tight">
            {time ? formatTime(time) : "00:00"}
          </h1>
          <p className="text-xs sm:text-sm md:text-base mt-1 sm:mt-2 opacity-80 font-medium">
            {time ? formatDate(time) : "กำลังโหลด..."}
          </p>
        </div>
      </header>

      {/* 🟦 mode chip (แสดงบนมือถือ) */}
      <div className="md:hidden flex justify-center mb-6 w-full z-20">
        <div className="bg-white/60 backdrop-blur-md px-6 py-2 rounded-full font-bold shadow-sm text-sm">
          โหมด: {type === "In" ? "เข้างาน" : "ออกงาน"}
        </div>
      </div>

      {/* 📷 scan container */}
      <div className="flex-1 flex items-center justify-center w-full z-10">
        <div className="w-full max-w-2xl bg-white/60 p-6 sm:p-8 md:p-10 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl backdrop-blur-md border border-white/50 flex flex-col items-center">
          <h2 className="text-center text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-[#1a365d]">
            โปรดจัดใบหน้าให้อยู่ในกรอบ
          </h2>

          {/* 📷 กล้องให้อยู่กลางจริง */}
          <div className="w-full max-w-xs sm:max-w-md w-full">
            <ScanInterface type={type} />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ScanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#e6f0fa] text-[#1a365d] font-bold">
          กำลังโหลด...
        </div>
      }
    >
      <ScanContent />
    </Suspense>
  );
}