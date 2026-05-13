"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ScanFace,
  Menu,
  Image as ImageIcon,
  ArrowLeft,
  UserPlus,
  LogOut,
  X, // 👈 เพิ่มไอคอน X สำหรับปิด Sidebar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axios from "axios";
import { cn } from "@/lib/utils"; // 👈 เพิ่ม utils สำหรับจัดการ class

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ViewPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  
  // 🚀 State สำหรับคุม Sidebar บนมือถือ
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [adminProfile] = useState({
    name: "Owen Radcliffe",
    role: "ADMIN",
  });

  const [userData, setUserData] = useState({
    fullname: "",
    position: "",
    employee_id: "",
    image_url: "",
  });

  const isActive = (path: string) => pathname.includes(path);

  // โหลดข้อมูลพนักงานตอนเปิดหน้า
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUserData({
          fullname: res.data.fullname,
          position: res.data.position || "",
          employee_id: res.data.employee_id,
          image_url: `${API_URL}/uploads/${res.data.employee_id}.jpg`,
        });
      } catch (error) {
        toast.error("ไม่สามารถดึงข้อมูลได้");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchUser();
  }, [id]);

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
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
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
                onClick={() => { router.push("/admin/management/dashboard"); setIsSidebarOpen(false); }}
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
                onClick={() => { router.push("/admin/management"); setIsSidebarOpen(false); }}
                className={`w-full justify-start rounded-full text-base px-6 h-12 transition-colors ${isActive("/admin/management") && !isActive("/register") ? "bg-white text-gray-800 font-semibold shadow-md" : "text-white hover:bg-white/10"}`}
              >
                <ScanFace className="mr-3 h-5 w-5" /> 
                <span>Face Management</span>
              </Button>
            </li>
            <li>
              <Button
                variant="ghost"
                onClick={() => { router.push("/register"); setIsSidebarOpen(false); }}
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
              รายละเอียดพนักงาน
            </h1>
            <p className="text-sm text-gray-400 font-medium mt-1">
              ข้อมูลส่วนตัวและรูปภาพใบหน้าปัจจุบัน
            </p>
          </div>

          <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 shadow-sm w-full max-w-6xl border border-gray-100">
            {loading ? (
              <div className="flex justify-center py-20 text-gray-400">
                กำลังโหลดข้อมูล...
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                
                {/* 📝 Left Section: Form (Disabled) */}
                <div className="flex flex-col gap-5 sm:gap-6">
                  <div className="space-y-2">
                    <Label className="text-gray-900 font-semibold text-sm sm:text-base">
                      ชื่อ-นามสกุล
                    </Label>
                    <Input
                      value={userData.fullname}
                      disabled
                      className="h-11 sm:h-12 border-gray-300 rounded-lg focus-visible:ring-[#4a6396] text-gray-900 disabled:bg-gray-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-900 font-semibold text-sm sm:text-base">
                      ตำแหน่ง
                    </Label>
                    <Input
                      value={userData.position || "-"}
                      disabled
                      className="h-11 sm:h-12 border-gray-300 rounded-lg focus-visible:ring-[#4a6396] text-gray-900 disabled:bg-gray-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-900 font-semibold text-sm sm:text-base">
                      ID
                    </Label>
                    <Input
                      value={userData.employee_id}
                      disabled
                      className="h-11 sm:h-12 border-gray-300 rounded-lg focus-visible:ring-[#4a6396] text-gray-900 disabled:bg-gray-100"
                    />
                  </div>
                </div>

                {/* 📸 Right Section: แสดงรูปภาพ */}
                <div className="flex flex-col">
                  <div className="relative aspect-[4/3] w-full max-w-lg mx-auto rounded-2xl overflow-hidden bg-slate-100 border-4 border-[#d9d9d9] flex items-center justify-center shadow-sm">
                    {userData.image_url ? (
                      <img
                        src={`${userData.image_url}?t=${Date.now()}`}
                        alt="Face"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://placehold.co/600x400/eeeeee/999999?text=No+Image";
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center text-gray-400">
                        <ImageIcon size={48} className="mb-2 opacity-50" />
                        <p>ไม่มีรูปภาพใบหน้า</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 🔘 Action Buttons (Responsive Stack) */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-8 sm:mt-12 xl:justify-start">
              <Button
                asChild
                className="w-full sm:w-auto px-6 sm:px-8 h-11 sm:h-12 bg-[#233559] hover:bg-[#1a2844] text-white rounded-lg font-medium shadow-sm cursor-pointer transition-colors"
              >
                <Link href={`/admin/management/edit/${id}`}>แก้ไขข้อมูล</Link>
              </Button>
              <Button
                variant="ghost"
                asChild
                className="w-full sm:w-auto px-6 sm:px-8 h-11 sm:h-12 bg-[#c8c8c8] text-gray-800 hover:bg-gray-300 rounded-lg font-medium transition-colors"
              >
                <Link href="/admin/management">
                  <ArrowLeft className="mr-2 h-4 w-4" /> ย้อนกลับ
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}