"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function HomePage() {
  const [time, setTime] = useState<Date | null>(null);
  const router = useRouter();

  // =========================
  // SAFE STATE (กันพัง)
  // =========================
  const [latecomers, setLatecomers] = useState<any[]>([]);

  // =========================
  // FETCH DATA (SAFE)
  // =========================
  useEffect(() => {
    const fetchLatecomers = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/stats/latecomers/");
        const data = await res.json();

        // 🔥 กัน API ไม่ได้ return array
        setLatecomers(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("ดึงข้อมูลคนสายไม่สำเร็จ", e);
        setLatecomers([]);
      }
    };

    fetchLatecomers();
  }, []);

  // =========================
  // SAFE SORT + RANKING
  // =========================
  const safeLatecomers = Array.isArray(latecomers) ? latecomers : [];

  const sortedLatecomers = [...safeLatecomers].sort(
    (a, b) => (b?.count || 0) - (a?.count || 0)
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
  // PODIUM FIX ORDER
  // =========================
  const displayArray = [top3[0], top3[1], top3[2]].filter(Boolean);

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
      <div className="flex-1 flex flex-col items-center justify-center bg-white/30 backdrop-blur-sm">

        {/* TIME */}
        <div className="text-center mb-10 text-[#1a365d]">
          <h1 className="text-[120px] font-bold">
            {time ? formatTime(time) : "00:00"}
          </h1>
          <p className="text-3xl mt-4">
            {time ? formatDate(time) : "กำลังโหลด..."}
          </p>
        </div>

        {/* BUTTONS */}
        <div className="flex flex-col gap-6 w-[400px]">
          <button
            onClick={() => router.push("/scan?type=In")}
            className="bg-white text-[#1a365d] text-2xl font-bold py-6 rounded-2xl shadow-md"
          >
            เข้างาน
          </button>

          <button
            onClick={() => router.push("/scan?type=Out")}
            className="bg-white text-[#1a365d] text-2xl font-bold py-6 rounded-2xl shadow-md"
          >
            ออกงาน
          </button>
        </div>

        {/* LOGIN */}
        <div className="absolute bottom-6 left-6">
          <Link href="/login" className="flex items-center gap-2 text-[#1a365d]">
            <LogIn size={20} />
            <span>เข้าสู่ระบบ</span>
          </Link>
        </div>
      </div>

      {/* ================= RIGHT ================= */}
      <div className="w-[450px] bg-[#d3e2f2]/80 backdrop-blur-md flex flex-col p-8">

        {/* HEADER */}
        <div className="text-center mb-8 text-[#1a365d]">
          <h2 className="text-3xl font-bold">The Latecomers Club</h2>
          <p className="text-sm opacity-80">
            {new Date().toLocaleDateString("th-TH", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* ================= PODIUM ================= */}
        <div className="flex justify-center items-end gap-6 h-72 mb-10">

          {displayArray.map((person, index) => {
            const rank = index + 1;
            const isFirst = rank === 1;

            return (
              <div
                key={person.name}
                className={`flex flex-col items-center ${
                  isFirst ? "w-[140px]" : "w-[110px]"
                }`}
              >
                {/* AVATAR */}
                <Image
                  src={
                    person.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name}`
                  }
                  alt={person.name}
                  width={90}
                  height={90}
                  unoptimized
                  className={`rounded-full border-4 ${
                    isFirst ? "border-yellow-400 w-20 h-20" : "w-16 h-16"
                  }`}
                />

                {/* PODIUM */}
                <div
                  className={`w-full mt-2 flex justify-center items-end rounded-t-xl text-white font-bold ${
                    rank === 1
                      ? "h-36 bg-blue-900"
                      : rank === 2
                      ? "h-28 bg-blue-500"
                      : "h-24 bg-blue-400"
                  }`}
                >
                  {rank}
                </div>

                <p className="mt-3 font-bold text-[#1a365d]">
                  {person.name}
                </p>
              </div>
            );
          })}
        </div>

        {/* ================= LIST ================= */}
        <div className="flex flex-col gap-2 overflow-y-auto">

          {others.map((person, index) => (
            <div
              key={person.name}
              className="flex justify-between items-center bg-white/40 p-3 rounded-lg"
            >
              <span className="font-bold text-[#1a365d]">
                {person.name}
              </span>

              <span className="font-black text-lg">
                {person.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}