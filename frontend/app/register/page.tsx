"use client";

import { useState, useRef } from "react";
import axios from "axios";
import Webcam from "react-webcam";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserPlus,
  Loader2,
  ShieldCheck,
  RefreshCw,
  ScanFace,
  CheckCircle2,
  User,
  Menu,
  LayoutDashboard,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import React from "react";


// 🚀 เปลี่ยน URL ตรงนี้ตามที่รัน Backend ไว้นะครับ
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();


  const isActive = (path: string) => pathname === path;
  // เพิ่ม position เข้าไปใน state เพื่อให้กรอกข้อมูลฟอร์มได้ครบตามดีไซน์
  const [regData, setRegData] = useState({
    fullname: "",
    position: "",
    employee_id: "",
  });
  const webcamRef = useRef<Webcam | null>(null);

  

  // Liveness States (Simulation Mode)
  const [step, setStep] = useState<
    "idle" | "look_straight" | "blink" | "turn_right" | "done"
  >("idle");
  const [progress, setProgress] = useState(0);

  

  // 🚀 ฟังก์ชันเริ่มการตรวจจับแบบ Step-by-Step
  // 🚀 ฟังก์ชันเริ่มการตรวจจับแบบ Step-by-Step
  const startLivenessCheck = async () => {
    if (!regData.fullname || !regData.employee_id) {
      toast.error("กรุณากรอกข้อมูลให้ครบก่อน");
      return;
    }

    setLoading(true);

    // =========================================
    // 🛑 1. แอบเช็ค Database ก่อนว่า ID ซ้ำไหม?
    // =========================================
    try {
      const token = localStorage.getItem("token");
      await axios.get(`${API_URL}/users/${regData.employee_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // ถ้าไม่มี Error แปลว่า "มีรหัสนี้ในระบบแล้ว!"
      toast.error("ลงทะเบียนไม่สำเร็จ", {
        description: "รหัสพนักงานนี้มีในระบบแล้ว! กรุณาใช้รหัสอื่น"
      });
      setLoading(false);
      return; // เตะกลับทันที ไม่ต้องเปิดกล้อง

    } catch (error: any) {
      // ถ้าได้ Error 404 แปลว่า "ยังไม่มีรหัสนี้" -> ลุยต่อได้!
      if (error.response?.status !== 404) {
        toast.error("เกิดข้อผิดพลาดในการตรวจสอบข้อมูล");
        setLoading(false);
        return;
      }
    }
    // =========================================

    try {
      // 🎬 เริ่มกระบวนการสแกนหน้า (Simulation)
      setStep("look_straight");
      setProgress(25);
      await new Promise((r) => setTimeout(r, 3500));

      const img1 = webcamRef.current?.getScreenshot();

      if (!img1) {
        toast.error("ไม่สามารถถ่ายรูปได้ กรุณาตรวจสอบการอนุญาตใช้งานกล้อง");
        setStep("idle");
        setProgress(0);
        setLoading(false);
        return;
      }

      setStep("blink");
      setProgress(50);
      toast.info("Step 2: กรุณากระพริบตา 1 ครั้ง");
      await new Promise((r) => setTimeout(r, 3000));

      setStep("turn_right");
      setProgress(75);
      toast.info("Step 3: กรุณาหันหน้าไปทางขวา");
      await new Promise((r) => setTimeout(r, 3000));

      setStep("done");
      setProgress(100);

      // 🚀 ส่งข้อมูลไปที่ Backend
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/users/`, {
        fullname: regData.fullname,
        employee_id: regData.employee_id,
        position: regData.position,
        image_base64: img1,
        is_admin: false,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("วิเคราะห์ใบหน้าสำเร็จ!");
      toast.success("ลงทะเบียนสำเร็จ!", {
        description: "ข้อมูลพนักงานถูกบันทึกเรียบร้อย",
      });

      // =========================================
      // 🚀 2. เด้งกลับไปหน้า Face Management เมื่อสำเร็จ
      // =========================================
      setTimeout(() => {
        router.push("/admin/management"); // พาเด้งกลับหน้าตาราง
      }, 2000);

    } catch (error: any) {
      console.log("🔥 ERROR DETAIL:", error.response?.data);

      const errorDetail = error.response?.data?.detail;
      let errorMessage = "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้";

      if (errorDetail === "exists") {
        errorMessage = "รหัสพนักงานนี้มีในระบบแล้ว!";
      } else if (errorDetail === "no face") {
        errorMessage = "ระบบตรวจไม่พบใบหน้า กรุณาอยู่ในที่สว่างและมองกล้อง";
      } else if (typeof errorDetail === "object") {
        errorMessage = "ส่งข้อมูลไม่ถูกต้อง กรุณาตรวจสอบฟอร์ม";
      } else if (errorDetail) {
        errorMessage = errorDetail;
      }

      toast.error("ลงทะเบียนไม่สำเร็จ", {
        description: errorMessage,
      });

      setStep("idle");
      setProgress(0);
      setLoading(false);
    }
  };

  const getStatusText = () => {
    switch (step) {
      case "look_straight":
        return "มองหน้าตรง";
      case "blink":
        return "กะพริบตา";
      case "turn_right":
        return "หันไปทางขวา";
      case "done":
        return "วิเคราะห์สำเร็จ";
      default:
        return "รอเริ่มการทำงาน";
    }
  };

  return (
    <div className="flex h-screen bg-[#eaf0f6] font-sans selection:bg-[#4a6396]/30">
      {/* 🟦 Sidebar (ยึดตามดีไซน์รูป) */}
      <aside className="w-64 bg-[#4a6396] text-white flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-4 text-xl font-bold tracking-wide">
          <Menu className="w-6 h-6" />
          MANAGEMENT
        </div>

        <nav className="flex-1 mt-4">
          <ul className="space-y-1">
            <li>
              <Link href="/admin/management/dashboard">
              <Button
                variant="ghost"
                className={`w-full justify-start rounded-full text-base px-6 h-12 transition-colors ${
                  isActive("/admin/management/dashboard")
                    ? "bg-white text-gray-800 font-semibold shadow-md"
                    : "text-white hover:bg-white/10"
                }`}
              >
                <LayoutDashboard className="mr-3 h-5 w-5" />
                Dashboard
              </Button>
              </Link>
            </li>
            <li>
              <Link href="/admin/management">
                <Button
                  variant="ghost"
                  className={`w-full justify-start rounded-full text-base px-6 h-12 transition-colors ${isActive("/admin/management") ? "bg-white text-gray-800 font-semibold" : "text-white hover:bg-white/10"}`}
                >
                  <ScanFace className="mr-3 h-5 w-5" /> Face Management
                </Button>
              </Link>
            </li>
            <li>
              <Button
                variant="ghost"
                className={`w-full justify-start rounded-full text-base px-6 h-12 transition-colors ${
                  isActive("/register")
                    ? "bg-white text-gray-800 font-semibold shadow-md"
                    : "text-white hover:bg-white/10"
                }`}
              >
                <UserPlus className="mr-3 h-5 w-5" />
                ลงทะเบียนพนักงานใหม่
              </Button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* ⬜️ Main Layout */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="h-16 bg-white flex items-center justify-end px-8 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Owen"
              alt="Profile"
              className="w-10 h-10 rounded-full bg-blue-100"
            />
            <div className="flex flex-col justify-center">
              <span className="text-sm font-bold text-gray-800">
                Owen Radcliffe
              </span>
              <span className="text-[10px] text-gray-500 font-semibold tracking-wider">
                ADMIN
              </span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          <h1 className="text-2xl font-bold text-[#324565] mb-6">
            ข้อมูลพนักงาน
          </h1>

          <div className="bg-white rounded-3xl p-10 shadow-sm w-full max-w-6xl">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
              {/* 📝 Left Section: Form */}
              <div className="flex flex-col gap-6">
                <div className="space-y-2">
                  <Label className="text-gray-900 font-semibold text-base">
                    ชื่อ-นามสกุล
                  </Label>
                  <Input
                    value={regData.fullname}
                    onChange={(e) =>
                      setRegData({ ...regData, fullname: e.target.value })
                    }
                    placeholder="กรุณากรอกชื่อ-นามสกุล"
                    disabled={loading || step === "done"}
                    className="h-12 border-gray-300 rounded-lg focus-visible:ring-[#4a6396] text-gray-900 disabled:bg-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-900 font-semibold text-base">
                    ตำแหน่ง
                  </Label>
                  <Input
                    value={regData.position}
                    onChange={(e) =>
                      setRegData({ ...regData, position: e.target.value })
                    }
                    placeholder="กรุณากรอกตำแหน่ง"
                    disabled={loading || step === "done"}
                    className="h-12 border-gray-300 rounded-lg focus-visible:ring-[#4a6396] text-gray-900 disabled:bg-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-900 font-semibold text-base">
                    ID
                  </Label>
                  <Input
                    value={regData.employee_id}
                    onChange={(e) =>
                      setRegData({ ...regData, employee_id: e.target.value })
                    }
                    placeholder="กรุณากรอกรหัสพนักงาน"
                    disabled={loading || step === "done"}
                    className="h-12 border-gray-300 rounded-lg focus-visible:ring-[#4a6396] text-gray-900 disabled:bg-gray-100"
                  />
                </div>
              </div>

              {/* 📸 Right Section: Camera Viewport */}
              <div className="flex flex-col">
                <div
                  className={`relative aspect-[4/3] w-full max-w-lg mx-auto rounded-2xl overflow-hidden bg-slate-900 border-4 transition-all duration-500 ${
                    step === "idle"
                      ? "border-[#d9d9d9]"
                      : step === "done"
                        ? "border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                        : "border-[#4a6396]"
                  }`}
                >
                  <Webcam
                    ref={webcamRef}
                    mirrored
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                      width: 1280,
                      height: 720,
                      facingMode: "user",
                    }}
                    className="w-full h-full object-cover"
                  />

                  {/* Overlay ข้อความสถานะ (คงเดิมจากของคุณ) */}
                  {step !== "idle" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-between p-6 pointer-events-none">
                      <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full animate-pulse ${step === "done" ? "bg-emerald-500" : "bg-blue-400"}`}
                        />
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                          {getStatusText()}
                        </span>
                      </div>

                      <div className="w-full max-w-sm bg-slate-900/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-center shadow-xl">
                        <p className="text-lg font-bold text-white flex items-center justify-center gap-2">
                          <ScanFace
                            size={20}
                            className={
                              step === "done"
                                ? "text-emerald-400"
                                : "text-blue-400"
                            }
                          />
                          {step === "look_straight" && "กรุณามองตรงมาที่กล้อง"}
                          {step === "blink" && "กรุณากะพริบตา 1 ครั้ง"}
                          {step === "turn_right" && "กรุณาหันหน้าไปทางขวา"}
                          {step === "done" && (
                            <span className="text-emerald-400">
                              ยืนยันตัวตนสำเร็จ!
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Effect เมื่อสำเร็จ */}
                  {step === "done" && (
                    <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center backdrop-blur-[2px] animate-in fade-in duration-500">
                      <div className="bg-emerald-500 text-white p-5 rounded-full shadow-[0_0_40px_rgba(16,185,129,0.5)]">
                        <CheckCircle2 size={56} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress Bar ใต้กล้อง */}
                <div className="w-full max-w-lg mx-auto mt-4 px-2">
                  <div className="flex justify-between text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                    <span>Verification Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress
                    value={progress}
                    className="h-2 bg-gray-200 [&>div]:bg-[#4a6396]"
                  />
                </div>
              </div>
            </div>

            {/* 🔘 Action Buttons */}
            <div className="flex justify-center gap-4 mt-12 xl:justify-start">
              {step === "idle" ? (
                <Button
                  onClick={startLivenessCheck}
                  disabled={loading}
                  className="px-8 h-12 bg-[#233559] text-white rounded-lg font-medium shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed hover:bg-[#3b82f6] hover:shadow-blue-500/20 hover:shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 animate-spin h-4 w-4" />{" "}
                      กำลังเตรียมระบบ...
                    </>
                  ) : (
                    "เริ่มขั้นตอนสแกนใบหน้า"
                  )}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="px-8 h-12 border-[#c8c8c8] text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> ยกเลิกและลองใหม่
                </Button>
              )}

              <Button
                variant="ghost"
                asChild
                className="px-8 h-12 bg-[#c8c8c8] text-gray-800 hover:bg-gray-300 rounded-lg font-medium"
              >
                <Link href="/admin/management">ย้อนกลับ</Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
