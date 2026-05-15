"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LogIn, Crown, Medal } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function HomePage() {
  const [time, setTime] = useState<Date | null>(null);
  const router = useRouter();
  const [retrospectiveData, setRetrospectiveData] = useState<any[]>([]);

  const [latecomers, setLatecomers] = useState<any[]>([]);

  // =========================
  // FETCH DATA
  // =========================
  useEffect(() => {
    // 1. ดึงข้อมูลคนสาย "เดือนปัจจุบัน" (สำหรับแท่น Podium)
    const fetchCurrentMonth = async () => {
      try {
        const res = await fetch(`${API_URL}/stats/latecomers/`);
        const data = await res.json();
        const activeUsers = Array.isArray(data)
          ? data.filter(
              (user) => user.is_deleted !== true && user.is_deleted !== 1,
            )
          : [];
        setLatecomers(activeUsers);
      } catch (e) {
        console.error("ดึงข้อมูลคนสายไม่สำเร็จ", e);
      }
    };

    // 2. ดึงข้อมูล "แชมป์ย้อนหลัง 3 เดือน" (จาก Database จริง)
    const fetchRetrospective = async () => {
      try {
        const results = [];
        const currentDate = new Date();

        // วนลูปดึงข้อมูลทีละเดือน ย้อนหลัง 3 เดือน
        for (let i = 1; i <= 3; i++) {
          const pastDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() - i,
            1,
          );
          const month = pastDate.getMonth() + 1; // 1-12
          const year = pastDate.getFullYear();
          const monthText = pastDate.toLocaleDateString("th-TH", {
            month: "long",
            year: "numeric",
          });

          // 🚀 ยิง API ไปหา Backend พร้อมระบุเดือนและปี
          const res = await fetch(
            `${API_URL}/stats/latecomers/?month=${month}&year=${year}`,
          );

          if (res.ok) {
            const data = await res.json();
            const activeUsers = Array.isArray(data)
              ? data.filter(
                  (user) => user.is_deleted !== true && user.is_deleted !== 1,
                )
              : [];

            if (activeUsers.length > 0) {
              // หาคนที่สายเยอะที่สุด (อันดับ 1 ของเดือนนั้น)
              const champion = activeUsers.sort(
                (a, b) => (b?.count || 0) - (a?.count || 0),
              )[0];

              results.push({
                monthText,
                name: champion.fullname || champion.name,
                count: champion.count,
                employeeId: champion.employee_id, // 👈 เก็บ ID ไว้ดึงรูปจริง
              });
            }
          }
        }
        setRetrospectiveData(results);
      } catch (e) {
        console.error("ดึงข้อมูลย้อนหลังไม่สำเร็จ", e);
      }
    };

    fetchCurrentMonth();
    fetchRetrospective();
  }, []);

  // =========================
  // SORT + RANKING
  // =========================
  const sortedLatecomers = [...latecomers].sort(
    (a, b) => (b?.count || 0) - (a?.count || 0),
  );

  const top3 = sortedLatecomers.slice(0, 3);
  const others = sortedLatecomers.slice(3);

  // =========================
  // CLOCK
  // =========================
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

  // =========================
  // 🚀 FLEX PODIUM LOGIC (เรียง 2, 1, 3)
  // =========================
  const podiumData = [
    {
      rank: 2,
      person: top3[1],
      bgColor: "bg-[#8ba3c7]",
      textColor: "text-[#1a365d]",
      title: "ตัวตึงถือถ้วยกาแฟ",
      ribbonHeight: "h-24",
      avatarClass: "w-20 h-20 border-4 border-slate-300",
      wrapperClass: "w-[120px]",
    },
    {
      rank: 1,
      person: top3[0],
      bgColor: "bg-[#ffd036]",
      textColor: "text-[#1a365d]",
      title: "CEO Chief Entries Overtime",
      ribbonHeight: "h-32",
      avatarClass:
        "w-24 h-24 border-4 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)]",
      wrapperClass: "w-[150px] -mt-12",
    },
    {
      rank: 3,
      person: top3[2],
      bgColor: "bg-[#b57a4c]",
      textColor: "text-white",
      title: "ผู้ประสบภัยรายวัน",
      ribbonHeight: "h-20",
      avatarClass: "w-20 h-20 border-4 border-amber-700",
      wrapperClass: "w-[120px]",
    },
  ];

  return (
    <main
      className="flex flex-col lg:flex-row min-h-screen font-sans bg-no-repeat bg-center bg-fixed overflow-x-hidden"
      style={{
        backgroundImage: "url('/background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* ================= LEFT ================= */}
      <div className="flex-1 w-full min-h-screen lg:min-h-0 relative flex flex-col items-center justify-center bg-black/10 backdrop-blur-[2px] p-4">
        {/* LOGO */}
        <div className="absolute top-6 left-6 sm:top-12 sm:left-14 w-[120px] sm:w-[200px]">
          <Image
            src="/logo.png"
            alt="Logo"
            width={200}
            height={200}
            style={{ width: "100%", height: "auto" }}
            priority
            className="w-full h-auto"
          />
        </div>

        {/* TIME */}
        <div className="text-center mb-8 sm:mb-12 text-white drop-shadow-lg mt-16 sm:mt-0">
          <h1 className="text-[80px] sm:text-[100px] lg:text-[140px] font-bold leading-none tracking-tight">
            {time ? formatTime(time) : "00:00"}
          </h1>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-2 sm:mt-4">
            {time ? formatDate(time) : "กำลังโหลด..."}
          </p>
        </div>

        {/* BUTTONS */}
        <div className="flex flex-col gap-4 sm:gap-6 w-full max-w-[320px] sm:max-w-[400px]">
          <button
            onClick={() => router.push("/scan?type=In")}
            className="bg-white hover:bg-gray-100 text-[#1a365d] text-xl sm:text-2xl font-extrabold py-4 sm:py-6 rounded-2xl sm:rounded-3xl shadow-xl transition-transform hover:scale-105"
          >
            เข้างาน
          </button>
          <button
            onClick={() => router.push("/scan?type=Out")}
            className="bg-white hover:bg-gray-100 text-[#1a365d] text-xl sm:text-2xl font-extrabold py-4 sm:py-6 rounded-2xl sm:rounded-3xl shadow-xl transition-transform hover:scale-105"
          >
            ออกงาน
          </button>
        </div>

        {/* LOGIN */}
        <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-10">
          <Link
            href="/login"
            className="flex items-center gap-2 text-white font-medium hover:opacity-80 transition-opacity"
          >
            <LogIn size={20} className="sm:w-6 sm:h-6" />
            <span className="text-base sm:text-lg drop-shadow-md">
              เข้าสู่ระบบ
            </span>
          </Link>
        </div>
      </div>

      {/* ================= RIGHT ================= */}
      <div className="w-full lg:w-[450px] xl:w-[500px] bg-[#d5e2f1] flex flex-col p-6 sm:p-10 shadow-2xl rounded-t-[3rem] lg:rounded-t-none lg:rounded-l-3xl z-10 min-h-screen lg:min-h-0">
        {/* HEADER */}
        <div className="text-center mb-10 sm:mb-16 text-[#1a365d] mt-4 sm:mt-0">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-2">
            The Latecomers Club
          </h2>
          <p className="text-sm sm:text-base font-bold opacity-80">
            ประจำเดือน{" "}
            {new Date().toLocaleDateString("th-TH", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* ================= PODIUM ================= */}
        <div className="flex justify-center items-end gap-2 sm:gap-4 h-64 sm:h-72 mb-8 sm:mb-10 transform scale-95 sm:scale-100 origin-bottom">
          {podiumData.map((item, index) => {
            if (!item.person)
              return <div key={index} className={item.wrapperClass} />;

            const isFirst = item.rank === 1;
            const personName = item.person.fullname || item.person.name;
            const employeeId = item.person.employee_id;

            return (
              <div
                key={personName}
                className={`flex flex-col items-center relative ${item.wrapperClass}`}
              >
                <div
                  className={`absolute -top-3 sm:-top-4 -right-1 sm:-right-2 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-lg sm:text-xl shadow-lg z-30 border-2 border-white ${item.rank === 1 ? "bg-yellow-400 text-yellow-900" : item.rank === 2 ? "bg-slate-300 text-slate-800" : "bg-amber-700 text-white"}`}
                >
                  #{item.rank}
                </div>
                {isFirst && (
                  <Crown className="text-yellow-500 fill-yellow-400 w-10 h-10 sm:w-14 sm:h-14 absolute -top-10 sm:-top-14 z-20 drop-shadow-lg animate-bounce" />
                )}

                <div className="relative z-10 mb-[-10px] sm:mb-[-15px]">
                  <Image
                    src={`${API_URL}/uploads/${employeeId}.jpg?t=${Date.now()}`}
                    alt={personName}
                    width={100}
                    height={100}
                    unoptimized
                    onError={(e) => {
                      e.currentTarget.srcset = `https://api.dicebear.com/7.x/avataaars/svg?seed=${personName}`;
                    }}
                    className={`rounded-full bg-blue-100 object-cover ${item.avatarClass}`}
                  />
                </div>

                <div
                  className={`w-14 sm:w-16 flex flex-col items-center justify-start pt-2 font-black text-2xl sm:text-3xl shadow-lg relative z-0 ${item.bgColor} ${item.textColor} ${item.ribbonHeight}`}
                  style={{
                    clipPath:
                      "polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)",
                  }}
                >
                  {item.person.count}
                  <span className="text-[8px] sm:text-[10px] uppercase mt-[-2px] sm:mt-[-4px] opacity-80">
                    ครั้ง
                  </span>
                </div>

                <div className="text-center mt-2 sm:mt-3 h-16 sm:h-20 px-1">
                  <p className="font-extrabold text-[#1a365d] text-[9px] sm:text-[11px] uppercase tracking-wide opacity-80 leading-tight mb-1">
                    {item.title}
                  </p>
                  <p className="font-bold text-[#1a365d] text-xs sm:text-sm leading-tight line-clamp-2">
                    {personName}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= TOP TIER RETROSPECTIVE (ดึงจาก DB จริง) ================= */}
        <div className="flex flex-col flex-1 lg:flex-none mt-2 sm:mt-4">
          <h3 className="text-xl sm:text-2xl font-extrabold text-[#1a365d] text-center mb-4 sm:mb-6">
            Top Tier Retrospective
          </h3>

          <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
            {retrospectiveData.length > 0 ? (
              retrospectiveData.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center bg-[#bdcce0] p-3 sm:p-4 rounded-[1.2rem] shadow-sm hover:bg-[#a6b9d1] transition-colors gap-3 sm:gap-4"
                >
                  {/* 🚀 รูปแชมป์เก่า (ดึงรูปจริงจาก Database เหมือนบนแท่น) */}
                  <Image
                    src={`${API_URL}/uploads/${item.employeeId}.jpg?t=${Date.now()}`}
                    alt={item.name}
                    width={50}
                    height={50}
                    unoptimized
                    onError={(e) => {
                      e.currentTarget.srcset = `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.name}`;
                    }}
                    className="rounded-full bg-white border-2 border-white object-cover h-12 w-12 sm:h-14 sm:w-14 shrink-0 shadow-sm"
                  />

                  {/* 📝 ข้อมูลตรงกลาง */}
                  <div className="flex flex-col flex-1">
                    <span className="text-[9px] sm:text-[11px] font-bold text-[#1a365d] opacity-75">
                      ครองแชมป์วัยเก๋า ประจำเดือน {item.monthText}
                    </span>
                    <span className="font-bold text-[#1a365d] text-sm sm:text-base leading-tight mt-0.5 line-clamp-1">
                      {item.name}
                    </span>
                  </div>

                  {/* 🔢 จำนวนครั้ง */}
                  <div className="flex items-center justify-end shrink-0 pr-2">
                    <span className="font-black text-2xl sm:text-3xl text-[#1a365d]">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-[#1a365d]/50 font-semibold py-4">
                ไม่มีข้อมูลย้อนหลัง
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
