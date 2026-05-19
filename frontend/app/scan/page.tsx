"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, MapPin, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScanInterface } from "@/components/ScanInterface";

// ตั้งค่าพิกัดของ บริษัท
const COMPANY_LOCATION = {
  lat: 14.09793555084266, // ละติจูดของกรุงเทพฯ
  lng: 100.61026345693386, // ลองจิจูดของกรุงเทพฯ
  maxRadius: 100,
};

// 🚀 สูตรคำนวณระยะห่าง
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

function ScanContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") as "In" | "Out" | null;

  const [time, setTime] = useState<Date | null>(null);

  const [checkingLocation, setCheckingLocation] = useState(true);
  const [isLocationValid, setIsLocationValid] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

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

  const checkGPS = () => {
    setCheckingLocation(true);

    if (!navigator.geolocation) {
      setLocationMessage("เบราว์เซอร์ของคุณไม่รองรับระบบ GPS");
      setCheckingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        const distance = calculateDistance(
          userLat,
          userLng,
          COMPANY_LOCATION.lat,
          COMPANY_LOCATION.lng,
        );

        if (distance <= COMPANY_LOCATION.maxRadius) {
          setIsLocationValid(true);
          // 🚀 2. ถ้าผ่าน ให้เก็บพิกัดเตรียมส่งให้กล้อง
          setUserCoords({ lat: userLat, lng: userLng });
        } else {
          setIsLocationValid(false);
          setLocationMessage(
            `คุณอยู่ห่างจากบริษัท ${Math.round(distance)} เมตร (ต้องไม่เกิน ${COMPANY_LOCATION.maxRadius} เมตร)`,
          );
        }
        setCheckingLocation(false);
      },
      (error) => {
        console.error(error);
        setIsLocationValid(false);
        setLocationMessage(
          "กรุณาเปิด GPS (Location) และกดอนุญาตให้เว็บไซต์เข้าถึงพิกัดของคุณ",
        );
        setCheckingLocation(false);
      },
      { enableHighAccuracy: true, maximumAge: 0 }, // บังคับให้ขอพิกัดใหม่ที่แม่นยำที่สุด
    );
  };

  useEffect(() => {
    checkGPS(); // ดึง GPS ทันทีที่เปิดหน้านี้
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#cce0fc] to-[#e6f0fa] text-[#1a365d] flex flex-col relative overflow-x-hidden font-sans p-4 sm:p-6 md:p-10">
      {/* 🚀 HEADER AREA */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-4 sm:gap-0 mb-6 sm:mb-10 relative z-20">
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

        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 bg-white/60 backdrop-blur-md px-6 py-2 rounded-full font-bold shadow-sm">
          โหมด: {type === "In" ? "เข้างาน" : "ออกงาน"}
        </div>

        <div className="text-left sm:text-right w-full sm:w-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-none tracking-tight">
            {time ? formatTime(time) : "00:00"}
          </h1>
          <p className="text-xs sm:text-sm md:text-base mt-1 sm:mt-2 opacity-80 font-medium">
            {time ? formatDate(time) : "กำลังโหลด..."}
          </p>
        </div>
      </header>

      <div className="md:hidden flex justify-center mb-6 w-full z-20">
        <div className="bg-white/60 backdrop-blur-md px-6 py-2 rounded-full font-bold shadow-sm text-sm">
          โหมด: {type === "In" ? "เข้างาน" : "ออกงาน"}
        </div>
      </div>

      {/* 📷 SCAN CONTAINER & GPS LOGIC */}
      <div className="flex-1 flex items-center justify-center w-full z-10">
        <div className="w-full max-w-2xl bg-white/60 p-6 sm:p-8 md:p-10 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl backdrop-blur-md border border-white/50 flex flex-col items-center">
          {/* เงื่อนไขที่ 1: กำลังตรวจสอบ GPS */}
          {checkingLocation ? (
            <div className="flex flex-col items-center justify-center h-64 text-[#1a365d]">
              <Loader2 className="w-12 h-12 mb-4 animate-spin opacity-80" />
              <h2 className="text-xl font-bold">กำลังตรวจสอบพิกัด GPS...</h2>
              <p className="opacity-70 mt-2 text-sm">
                กรุณารอสักครู่ ระบบกำลังค้นหาตำแหน่งของคุณ
              </p>
            </div>
          ) : /* เงื่อนไขที่ 2: พิกัดไม่ผ่าน หรือไม่ได้เปิด GPS */
          !isLocationValid ? (
            <div className="flex flex-col items-center justify-center text-center p-4">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-red-600 mb-2">
                ไม่อยู่ในพื้นที่บริษัท
              </h2>
              <p className="text-gray-700 font-medium mb-6 max-w-sm">
                {locationMessage}
              </p>
              <Button
                onClick={checkGPS}
                className="bg-[#1a365d] hover:bg-[#122643] text-white rounded-full px-8"
              >
                <MapPin className="w-4 h-4 mr-2" />
                เช็คพิกัดอีกครั้ง
              </Button>
            </div>
          ) : (
            /* เงื่อนไขที่ 3: พิกัดผ่าน! เปิดกล้องได้ */
            <>
              <div className="flex items-center gap-2 mb-6 sm:mb-8 text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-bold">อยู่ในพื้นที่บริษัท</span>
              </div>

              <h2 className="text-center text-xl sm:text-2xl font-bold mb-6 text-[#1a365d]">
                โปรดจัดใบหน้าให้อยู่ในกรอบ
              </h2>

              <div className="w-full max-w-xs sm:max-w-md">
                <ScanInterface
                  type={type}
                  lat={userCoords?.lat}
                  lng={userCoords?.lng}
                />
              </div>
            </>
          )}
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
