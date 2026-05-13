"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Webcam from "react-webcam";
import Link from "next/link";
import {
  LayoutDashboard,
  ScanFace,
  Menu,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Save,
  Camera,
  UserPlus,
  LogOut,
  X, 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import axios from "axios";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function EditPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // 🚀 State สำหรับคุม Sidebar บนมือถือ
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // State สำหรับคุมการเปิด/ปิดกล้อง
  const [showCamera, setShowCamera] = useState(false);

  const [regData, setRegData] = useState({
    fullname: "",
    position: "",
    employee_id: "",
    is_admin: false,
  });

  const [adminProfile] = useState({
    name: "Owen Radcliffe",
    role: "ADMIN",
  });

  const webcamRef = useRef<Webcam | null>(null);
  const [step, setStep] = useState<
    "idle" | "look_straight" | "blink" | "turn_right" | "done"
  >("idle");
  const [progress, setProgress] = useState(0);

  const isActive = (path: string) => pathname.includes(path);

  // 1. โหลดข้อมูลเดิมมาใส่ Form
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRegData({
          fullname: res.data.fullname,
          position: res.data.position || "",
          employee_id: res.data.employee_id,
          is_admin: res.data.is_admin || false,
        });
      } catch (error) {
        toast.error("ไม่สามารถดึงข้อมูลได้");
      } finally {
        setFetching(false);
      }
    };
    if (id) fetchUser();
  }, [id]);

  // 2. ฟังก์ชัน อัปเดตเฉพาะข้อมูล (ไม่เปลี่ยนหน้า)
  const handleUpdateInfoOnly = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/users/${id}`,
        {
          fullname: regData.fullname,
          position: regData.position,
          is_admin: regData.is_admin,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("อัปเดตข้อมูลสำเร็จ");
      router.push("/admin/management");
    } catch (error) {
      toast.error("อัปเดตข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  // 3. ฟังก์ชัน สแกนหน้าใหม่ + อัปเดตข้อมูล
  const startLivenessCheck = async () => {
    setLoading(true);
    try {
      setStep("look_straight");
      setProgress(25);
      await new Promise((r) => setTimeout(r, 3500));
      const img1 = webcamRef.current?.getScreenshot();

      if (!img1) {
        toast.error("ถ่ายรูปไม่สำเร็จ กรุณาลองใหม่");
        setStep("idle");
        setProgress(0);
        setLoading(false);
        return;
      }

      setStep("blink");
      setProgress(50);
      await new Promise((r) => setTimeout(r, 3000));

      setStep("turn_right");
      setProgress(75);
      await new Promise((r) => setTimeout(r, 3000));

      setStep("done");
      setProgress(100);

      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/users/${id}`,
        {
          fullname: regData.fullname,
          position: regData.position,
          image_base64: img1,
          is_admin: regData.is_admin,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast.success("อัปเดตข้อมูลใบหน้าสำเร็จ!");
      setTimeout(() => router.push("/admin/management"), 1500);
    } catch (error) {
      toast.error("ล้มเหลว");
      setStep("idle");
      setProgress(0);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isAdminLoggedIn");
    localStorage.removeItem("adminName");
    toast.success("ออกจากระบบสำเร็จ");
    router.replace("/");
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#eaf0f6] text-slate-900 font-sans selection:bg-[#4a6396]/30 overflow-hidden relative">
      {/* 🌑 Overlay สีดำโปร่งแสงตอนเปิด Sidebar มือถือ */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-[#4a6396] text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:h-screen lg:shadow-lg",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-6 flex items-center justify-between lg:justify-start gap-4 text-xl font-bold tracking-wide border-b border-white/10 lg:border-none">
          <div className="flex items-center gap-3">
            <Menu className="w-6 h-6 hidden lg:block" />
            MANAGEMENT
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white hover:bg-white/20 rounded-full"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="flex-1 mt-4 overflow-y-auto">
          <ul className="flex flex-col space-y-1 px-4">
            <li>
              <Button
                variant="ghost"
                onClick={() => {
                  router.push("/admin/management/dashboard");
                  setIsSidebarOpen(false);
                }}
                className={`w-full justify-start rounded-full text-base px-6 h-12 transition-colors ${
                  isActive("/admin/management/dashboard")
                    ? "bg-white text-gray-800 font-semibold shadow-md"
                    : "text-white hover:bg-white/10"
                }`}
              >
                <LayoutDashboard className="mr-3 h-5 w-5" />
                <span>Dashboard</span>
              </Button>
            </li>
            <li>
              <Button
                variant="ghost"
                onClick={() => {
                  router.push("/admin/management");
                  setIsSidebarOpen(false);
                }}
                className={`w-full justify-start rounded-full text-base px-6 h-12 transition-colors ${isActive("/admin/management") && !isActive("/register") ? "bg-white text-gray-800 font-semibold shadow-md" : "text-white hover:bg-white/10"}`}
              >
                <ScanFace className="mr-3 h-5 w-5" />
                <span>Face Management</span>
              </Button>
            </li>
            <li>
              <Button
                variant="ghost"
                onClick={() => {
                  router.push("/register");
                  setIsSidebarOpen(false);
                }}
                className={`w-full justify-start rounded-full text-base px-6 h-12 transition-colors ${isActive("/register") ? "bg-white text-gray-800 font-semibold shadow-md" : "text-white hover:bg-white/10"}`}
              >
                <UserPlus className="mr-3 h-5 w-5" />
                <span>ลงทะเบียนใหม่</span>
              </Button>
            </li>
          </ul>
        </nav>
        <div className="p-4 border-t border-white/10 mt-auto">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-center text-red-200 hover:bg-red-900/50 rounded-full h-11"
          >
            <LogOut className="mr-2 h-4 w-4" /> ออกจากระบบ
          </Button>
        </div>
      </aside>

      {/* ================= MAIN WRAPPER ================= */}
      <div className="flex-1 flex flex-col overflow-hidden w-full min-w-0">
        {/* ⬜️ TOP NAVIGATION */}
        <header className="h-16 bg-white flex items-center justify-between px-4 sm:px-8 shadow-sm shrink-0 border-b border-gray-100 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-slate-500 hover:bg-slate-100 rounded-full"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </Button>

          <div className="flex items-center gap-3 ml-auto">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Owen"
              alt="Profile"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-100 border border-blue-200"
            />
            <div className="flex flex-col justify-center">
              <span className="text-sm font-bold text-gray-800">
                {adminProfile.name}
              </span>
              <span className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase">
                {adminProfile.role}
              </span>
            </div>
          </div>
        </header>

        {/* ⬜️ CONTENT AREA */}
        <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#324565]">
              แก้ไขข้อมูลพนักงาน
            </h1>
            <p className="text-sm text-gray-400 font-medium mt-1">
              อัปเดตข้อมูลส่วนตัวและใบหน้า
            </p>
          </div>

          <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 shadow-sm w-full max-w-6xl border border-gray-100">
            {fetching ? (
              <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-4">
                <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
                <span>กำลังโหลดข้อมูล...</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 sm:gap-12">
                  {/* 📝 Left Section: Form */}
                  <div className="flex flex-col gap-5 sm:gap-6">
                    <div className="space-y-2">
                      <Label className="text-gray-900 font-semibold text-sm sm:text-base">
                        ชื่อ-นามสกุล
                      </Label>
                      <Input
                        value={regData.fullname}
                        onChange={(e) =>
                          setRegData({ ...regData, fullname: e.target.value })
                        }
                        className="h-11 sm:h-12 border-gray-300 rounded-lg focus-visible:ring-[#4a6396] text-gray-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-900 font-semibold text-sm sm:text-base">
                        ตำแหน่ง
                      </Label>
                      <Input
                        value={regData.position}
                        onChange={(e) =>
                          setRegData({ ...regData, position: e.target.value })
                        }
                        className="h-11 sm:h-12 border-gray-300 rounded-lg focus-visible:ring-[#4a6396] text-gray-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-900 font-semibold text-sm sm:text-base">
                        ID (ห้ามแก้ไข)
                      </Label>
                      <Input
                        value={regData.employee_id}
                        disabled
                        className="h-11 sm:h-12 bg-gray-100 border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* 📸 Right Section: Image / Webcam */}
                  <div className="flex flex-col">
                    <div
                      className={`relative aspect-[4/3] w-full max-w-lg mx-auto rounded-2xl overflow-hidden bg-slate-900 border-4 transition-all duration-500 ${step === "idle" ? "border-[#d9d9d9]" : step === "done" ? "border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "border-[#4a6396]"}`}
                    >
                      {/* เช็คว่าเปิดกล้องหรือยัง ถ้ายังให้โชว์รูปเดิม */}
                      {!showCamera ? (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center relative group">
                          <img
                            src={`${API_URL}/uploads/${regData.employee_id}.jpg?t=${Date.now()}`}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://placehold.co/600x400/eeeeee/999999?text=No+Image";
                            }}
                          />
                          <div
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                            onClick={() => setShowCamera(true)}
                          >
                            <span className="text-white font-medium flex items-center gap-2 text-sm sm:text-base">
                              <Camera size={20} /> คลิกเพื่อถ่ายใหม่
                            </span>
                          </div>
                        </div>
                      ) : (
                        // ถ้าเปิดกล้องแล้วค่อยโชว์ Webcam
                        <>
                          <Webcam
                            ref={webcamRef}
                            mirrored
                            screenshotFormat="image/jpeg"
                            className="w-full h-full object-cover"
                          />

                          {step !== "idle" && (
                            <div className="absolute inset-0 flex flex-col items-center justify-between p-4 sm:p-6 pointer-events-none">
                              <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                                <div
                                  className={`w-2 h-2 rounded-full animate-pulse ${step === "done" ? "bg-emerald-500" : "bg-blue-400"}`}
                                />
                                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                                  {step === "look_straight"
                                    ? "มองหน้าตรง"
                                    : step === "blink"
                                      ? "กะพริบตา"
                                      : step === "turn_right"
                                        ? "หันไปทางขวา"
                                        : "วิเคราะห์สำเร็จ"}
                                </span>
                              </div>
                            </div>
                          )}
                          {step === "done" && (
                            <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center backdrop-blur-[2px]">
                              <div className="bg-emerald-500 text-white p-5 rounded-full shadow-[0_0_40px_rgba(16,185,129,0.5)]">
                                <CheckCircle2 size={56} />
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* โชว์ Progress เฉพาะตอนเปิดกล้อง */}
                    {showCamera && (
                      <div className="w-full max-w-lg mx-auto mt-4 px-2">
                        <Progress
                          value={progress}
                          className="h-2 bg-gray-200 [&>div]:bg-[#4a6396]"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 🔘 Action Buttons (Responsive Stack) */}
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-8 sm:mt-12 xl:justify-start">
                  {/* 🟢 ปุ่มบันทึกข้อมูล */}
                  <Button
                    onClick={handleUpdateInfoOnly}
                    disabled={loading || showCamera}
                    className="w-full sm:w-auto px-6 sm:px-8 h-11 sm:h-12 bg-emerald-600 hover:bg-[#3b82f6] text-white rounded-lg shadow-sm cursor-pointer transition-colors disabled:cursor-not-allowed"
                  >
                    <Save className="mr-2 h-4 w-4" /> บันทึกข้อมูล
                  </Button>

                  {/* 🔵 ปุ่มเปิดกล้อง / เริ่มสแกน */}
                  {!showCamera ? (
                    <Button
                      onClick={() => setShowCamera(true)}
                      className="w-full sm:w-auto px-6 sm:px-8 h-11 sm:h-12 bg-[#233559] hover:bg-[#3b82f6] text-white rounded-lg shadow-sm cursor-pointer transition-colors"
                    >
                      <Camera className="mr-2 h-4 w-4" /> อัปเดตใบหน้า
                    </Button>
                  ) : (
                    step === "idle" && (
                      <Button
                        onClick={startLivenessCheck}
                        disabled={loading}
                        className="w-full sm:w-auto px-6 sm:px-8 h-11 sm:h-12 bg-[#233559] hover:bg-[#3b82f6] text-white rounded-lg shadow-sm cursor-pointer transition-colors disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="animate-spin h-4 w-4 mr-2" />{" "}
                            กำลังประมวลผล...
                          </>
                        ) : (
                          "เริ่มสแกนใบหน้าใหม่"
                        )}
                      </Button>
                    )
                  )}

                  {/* ⚪️ ปุ่มยกเลิก / ย้อนกลับ */}
                  {showCamera && step === "idle" ? (
                    <Button
                      variant="outline"
                      onClick={() => setShowCamera(false)}
                      className="w-full sm:w-auto px-6 sm:px-8 h-11 sm:h-12 border-[#c8c8c8] text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                    >
                      ยกเลิกกล้อง
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      asChild
                      className="w-full sm:w-auto px-6 sm:px-8 h-11 sm:h-12 bg-[#c8c8c8] hover:bg-gray-300 text-gray-800 rounded-lg cursor-pointer transition-colors"
                    >
                      <Link href="/admin/management">ย้อนกลับ</Link>
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
