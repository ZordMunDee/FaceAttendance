"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation"; // 🚀 1. นำเข้า useRouter
import Image from "next/image";

export default function HomePage() {
  const [time, setTime] = useState<Date | null>(null);
  const router = useRouter(); // 🚀 2. เรียกใช้งาน router

  const [latecomers, setLatecomers] = useState<any[]>([]);
  useEffect(() => {
    const fetchLatecomers = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/stats/latecomers/");
        const data = await res.json();
        setLatecomers(data);
      } catch (e) {
        console.error("ดึงข้อมูลคนสายไม่สำเร็จ", e);
      }
    };
    fetchLatecomers();
  }, []);

  // 3. ปรับตรงส่วน map ข้อมูล
  // ใช้ slice(0, 3) สำหรับ Podium และ slice(3) สำหรับรายการที่เหลือ
  const top3 = latecomers.slice(0, 3);
  const others = latecomers.slice(3);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ฟังก์ชันจัดฟอร์แมตวันที่
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("th-TH", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // // 🏆 Mock Data สำหรับ Leaderboard ฝั่งขวา
  // const latecomers = [
  //   { name: "Kitty Kitiya", count: 4, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kitty" },
  //   { name: "Prinya Jaidee", count: 3, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Prinya" },
  //   { name: "Matee Yupa", count: 2, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Matee1" },
  //   { name: "Matee Yupa", count: 1, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Matee2" },
  // ];

  return (
    <main
      className="flex min-h-screen font-sans bg-no-repeat bg-center bg-fixed"
      style={{
        backgroundImage: "url('/background.png')",

        // ✅ แก้จาก 100% 100% → cover (ไม่ทำภาพยืดเสียรูป)
        backgroundSize: "cover",

        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",

        // ❌ ลบ pixelated (มันทำ UI แตกและดูเก่า)
        imageRendering: "auto",

        // @ts-ignore (ถ้าใช้ TypeScript)
        MsImageRendering: "auto",
        WebkitImageRendering: "auto",
        MozImageRendering: "auto",
      }}
    >
      {/* ================= ฝั่งซ้าย (Main Content) ================= */}
      <div className="flex-1 relative flex flex-col items-center justify-center bg-white/30 backdrop-blur-sm">
        {/* เวลาและวันที่ */}
        <div className="text-center mb-10 text-[#1a365d]">
          <h1 className="text-[120px] font-bold leading-none tracking-tight">
            {time ? formatTime(time) : "00:00"}
          </h1>
          <p className="text-3xl font-medium mt-4">
            {time ? formatDate(time) : "กำลังโหลด..."}
          </p>
        </div>

        {/* ปุ่ม เข้างาน / ออกงาน */}
        <div className="flex flex-col gap-6 w-full max-w-[400px]">
          <button
            onClick={() => router.push("/scan?type=In")}
            className="w-full bg-white hover:bg-slate-50 text-[#1a365d] text-2xl font-bold py-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-transform active:scale-95"
          >
            เข้างาน
          </button>

          <button
            onClick={() => router.push("/scan?type=Out")}
            className="w-full bg-white hover:bg-slate-50 text-[#1a365d] text-2xl font-bold py-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-transform active:scale-95"
          >
            ออกงาน
          </button>
        </div>

        {/* ปุ่ม Login มุมซ้ายล่าง */}
        <div className="absolute bottom-6 left-6">
          <Link
            href="/login"
            className="flex items-center gap-2 text-[#1a365d] hover:text-blue-700 font-medium transition-colors"
          >
            <LogIn size={20} />
            <span>เข้าสู่ระบบ</span>
          </Link>
        </div>
      </div>

      {/* ================= ฝั่งขวา (Leaderboard) ================= */}
      <div className="w-[450px] bg-[#d3e2f2]/80 backdrop-blur-md flex flex-col p-8 shadow-[-20px_0_40px_rgba(0,0,0,0.1)] relative z-10">
        {/* Header */}
        <div className="text-center mb-8 text-[#1a365d]">
          <h2 className="text-3xl font-bold mb-1">The Latecomers Club</h2>
          <p className="text-sm font-medium opacity-80">
            {new Date().toLocaleDateString("th-TH", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* 🏆 Top 3 Podium */}
        <div className="flex justify-center items-end gap-6 h-72 mb-10 mt-4">
          {(() => {
            const displayArray = [top3[1], top3[0], top3[2]].filter(Boolean);

            return displayArray.map((person, index) => {
              const rank = index === 1 ? 1 : index === 0 ? 2 : 3;
              const isFirst = rank === 1;

              return (
                <div
                  key={index}
                  className={`flex flex-col items-center transition-all duration-300 hover:scale-105 ${
                    isFirst ? "w-[140px]" : "w-[110px]"
                  }`}
                >
                  {/* 👑 crown */}
                  {isFirst && (
                    <div className="text-5xl absolute -top-12 drop-shadow-lg animate-bounce">
                      👑
                    </div>
                  )}

                  {/* avatar */}
                  <div className="relative">
                    <Image
                      src={
                        person.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name}`
                      }
                      alt={person.name}
                      width={90}
                      height={90}
                      unoptimized
                      className={`rounded-full bg-white border-4 shadow-lg ${
                        isFirst
                          ? "w-20 h-20 border-yellow-400"
                          : "w-16 h-16 border-[#d3e2f2]"
                      }`}
                    />

                    {/* glow effect สำหรับที่ 1 */}
                    {isFirst && (
                      <div className="absolute inset-0 rounded-full bg-yellow-300 blur-xl opacity-40 -z-10"></div>
                    )}
                  </div>

                  {/* podium */}
                  <div
                    className={`w-full mt-[-10px] flex items-start justify-center pt-3 relative rounded-t-xl shadow-xl transition-all duration-300 ${
                      isFirst
                        ? "h-36 bg-gradient-to-b from-[#1a365d] to-[#0f223d]"
                        : rank === 2
                          ? "h-28 bg-gradient-to-b from-[#a8c7fa] to-[#7fb0ff]"
                          : "h-24 bg-gradient-to-b from-[#b7d0f5] to-[#8fb8f0]"
                    }`}
                  >
                    {/* rank badge */}
                    <div className="absolute -top-5 w-11 h-11 bg-amber-500 rounded-full flex items-center justify-center text-white font-black text-lg shadow-md border-2 border-white">
                      {rank}
                    </div>
                  </div>

                  {/* name */}
                  <div className="text-center mt-4 text-[#1a365d]">
                    <p
                      className={`font-bold ${isFirst ? "text-sm" : "text-xs opacity-90"}`}
                    >
                      {person.name}
                    </p>
                  </div>
                </div>
              );
            });
          })()}
        </div>

        {/* 📋 รายชื่ออันดับอื่นๆ */}
        <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {others.map((person, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-[#c0d6ef]/50 p-3 rounded-lg text-[#1a365d]"
            >
              <div className="flex items-center gap-4">
                <Image
                  src={
                    person.avatar ||
                    "https://api.dicebear.com/7.x/avataaars/svg?seed=" +
                      person.name
                  }
                  alt={person.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full bg-white"
                />
                <span className="font-bold">{person.name}</span>
              </div>

              <span className="font-black text-xl mr-4">{person.count}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
