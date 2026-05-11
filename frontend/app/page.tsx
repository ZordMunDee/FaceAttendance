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

  const [latecomers, setLatecomers] = useState<any[]>([]);

  // =========================
  // FETCH DATA
  // =========================
  useEffect(() => {
    const fetchLatecomers = async () => {
      try {
        const res = await fetch(`${API_URL}/stats/latecomers/`);
        const data = await res.json();

        // กรองคนที่ถูกลบทิ้ง (ต้องแก้ที่ Backend ด้วยถึงจะชัวร์ 100%)
        const activeUsers = Array.isArray(data)
          ? data.filter(
              (user) => user.is_deleted !== true && user.is_deleted !== 1,
            )
          : [];

        setLatecomers(activeUsers);
      } catch (e) {
        console.error("ดึงข้อมูลคนสายไม่สำเร็จ", e);
        setLatecomers([]);
      }
    };

    fetchLatecomers();
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
    date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });

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
      className="flex min-h-screen font-sans bg-no-repeat bg-center bg-fixed"
      style={{
        backgroundImage: "url('/background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* ================= LEFT ================= */}
      <div className="flex-1 relative flex flex-col items-center justify-center bg-black/10 backdrop-blur-[2px]">
        {/* LOGO */}
        <div className="absolute top-12 left-14">
          <Image
            src="/logo.png"
            alt="Logo"
            width={200} // ใส่ตัวเลขขนาดที่ต้องการ
            height={200} // ใส่ค่าเริ่มต้นไว้ก่อน
            style={{ width: "100%", height: "auto" }} // ✅ เพิ่มบรรทัดนี้เพื่อรักษา Aspect Ratio
          />
        </div>

        {/* TIME */}
        <div className="text-center mb-12 text-white drop-shadow-lg">
          <h1 className="text-[140px] font-bold leading-none tracking-tight">
            {time ? formatTime(time) : "00:00"}
          </h1>
          <p className="text-3xl font-bold mt-4">
            {time ? formatDate(time) : "กำลังโหลด..."}
          </p>
        </div>

        {/* BUTTONS */}
        <div className="flex flex-col gap-6 w-[400px]">
          <button
            onClick={() => router.push("/scan?type=In")}
            className="bg-white hover:bg-gray-100 text-[#1a365d] text-2xl font-extrabold py-6 rounded-3xl shadow-xl transition-transform hover:scale-105"
          >
            เข้างาน
          </button>
          <button
            onClick={() => router.push("/scan?type=Out")}
            className="bg-white hover:bg-gray-100 text-[#1a365d] text-2xl font-extrabold py-6 rounded-3xl shadow-xl transition-transform hover:scale-105"
          >
            ออกงาน
          </button>
        </div>

        {/* LOGIN */}
        <div className="absolute bottom-8 left-10">
          <Link
            href="/login"
            className="flex items-center gap-2 text-white font-medium hover:opacity-80 transition-opacity"
          >
            <LogIn size={24} />
            <span className="text-lg drop-shadow-md">เข้าสู่ระบบ</span>
          </Link>
        </div>
      </div>

      {/* ================= RIGHT ================= */}
      <div className="w-[500px] bg-[#d5e2f1] flex flex-col p-10 shadow-2xl rounded-l-3xl z-10">
        {/* HEADER */}
        <div className="text-center mb-16 text-[#1a365d]">
          <h2 className="text-4xl font-extrabold mb-2">The Latecomers Club</h2>
          <p className="text-base font-bold opacity-80">
            ประจำเดือน{" "}
            {new Date().toLocaleDateString("th-TH", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* ================= PODIUM ================= */}
        <div className="flex justify-center items-end gap-4 h-72 mb-10">
          {podiumData.map((item, index) => {
            if (!item.person) return <div key={index} className="w-[120px]" />;

            const isFirst = item.rank === 1;
            // รองรับทั้งกรณี Backend ส่งมาเป็น name หรือ fullname
            const personName = item.person.fullname || item.person.name;
            const employeeId = item.person.employee_id;

            return (
              <div
                key={personName}
                className={`flex flex-col items-center relative ${item.wrapperClass}`}
              >
                {/* 🚀 ป้าย Flex อันดับ (Rank Badge) */}
                <div
                  className={`absolute -top-4 -right-2 w-10 h-10 rounded-full flex items-center justify-center font-black text-xl shadow-lg z-30 border-2 border-white
                  ${item.rank === 1 ? "bg-yellow-400 text-yellow-900" : item.rank === 2 ? "bg-slate-300 text-slate-800" : "bg-amber-700 text-white"}`}
                >
                  #{item.rank}
                </div>

                {/* มงกุฎที่ 1 */}
                {isFirst && (
                  <Crown className="text-yellow-500 fill-yellow-400 w-14 h-14 absolute -top-14 z-20 drop-shadow-lg animate-bounce" />
                )}

                {/* 🚀 AVATAR (ดึงรูปจริงจาก Database/Uploads) */}
                <div className="relative z-10 mb-[-15px]">
                  <Image
                    src={`${API_URL}/uploads/${employeeId}.jpg`} // ดึงรูปจริงจากรหัสพนักงาน
                    alt={personName}
                    width={100}
                    height={100}
                    unoptimized
                    onError={(e) => {
                      // ถ้าไม่เจอรูปจริง ให้เอาการ์ตูนมาแปะแทน
                      e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${personName}`;
                    }}
                    className={`rounded-full bg-blue-100 object-cover ${item.avatarClass}`}
                  />
                </div>

                {/* RIBBON (โชว์จำนวนครั้งที่สาย) */}
                <div
                  className={`w-16 flex flex-col items-center justify-start pt-2 font-black text-3xl shadow-lg relative z-0 ${item.bgColor} ${item.textColor} ${item.ribbonHeight}`}
                  style={{
                    clipPath:
                      "polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)",
                  }}
                >
                  {item.person.count}
                  <span className="text-[10px] uppercase mt-[-4px] opacity-80">
                    ครั้ง
                  </span>
                </div>

                {/* NAMES & TITLES */}
                <div className="text-center mt-3 h-20">
                  <p className="font-extrabold text-[#1a365d] text-[11px] uppercase tracking-wide opacity-80 leading-tight mb-1">
                    {item.title}
                  </p>
                  <p className="font-bold text-[#1a365d] text-sm leading-tight">
                    {personName}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= LIST (อันดับ 4 เป็นต้นไป) ================= */}
        <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
          {others.map((person, idx) => {
            const personName = person.fullname || person.name;
            const employeeId = person.employee_id;
            return (
              <div
                key={personName}
                className="flex justify-between items-center bg-[#bdcce0] p-3 rounded-2xl shadow-sm hover:bg-[#a6b9d1] transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Badge บอกอันดับในลิสต์ */}
                  <span className="font-black text-[#1a365d] opacity-50 w-4">
                    {idx + 4}
                  </span>

                  {/* รูปคนในลิสต์ (รูปจริง) */}
                  <Image
                    src={`${API_URL}/uploads/${employeeId}.jpg`}
                    alt={personName}
                    width={40}
                    height={40}
                    unoptimized
                    onError={(e) => {
                      e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${personName}`;
                    }}
                    className="rounded-full bg-white border-2 border-white object-cover h-10 w-10"
                  />
                  <span className="font-bold text-[#1a365d] text-lg">
                    {personName}
                  </span>
                </div>

                <div className="flex items-end gap-1 mr-2">
                  <span className="font-black text-2xl text-[#1a365d]">
                    {person.count}
                  </span>
                  <span className="text-xs font-bold text-[#1a365d] mb-1 opacity-70">
                    ครั้ง
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
