"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ScanFace,
  Menu,
  Image as ImageIcon,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    fullname: "",
    position: "",
    employee_id: "",
    image_url: "", // สมมติว่า Backend ส่ง URL รูปหรือ Base64 มาให้
  });

  // โหลดข้อมูลพนักงานตอนเปิดหน้า
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("ข้อมูลที่ได้จาก API:", res.data); // 💡 ลองเปิด Console F12 ดูว่ามันส่งอะไรมาบ้าง

        setUserData({
          fullname: res.data.fullname,
          position: res.data.position || "",
          employee_id: res.data.employee_id,
          // 🚀 ดึงรูปจากโฟลเดอร์ uploads โดยใช้ ID พนักงานได้เลย!
          image_url: `http://127.0.0.1:8000/uploads/${res.data.employee_id}.jpg`,
        });
      } catch (error) {
        toast.error("ไม่สามารถดึงข้อมูลได้");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchUser();
  }, [id]);

  return (
    <div className="flex h-screen bg-[#eaf0f6] font-sans selection:bg-[#4a6396]/30">
      {/* 🟦 Sidebar (ยึดตามดีไซน์เดิม) */}
      <aside className="w-64 bg-[#4a6396] text-white flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-4 text-xl font-bold tracking-wide">
          <Menu className="w-6 h-6" /> MANAGEMENT
        </div>
        <nav className="flex-1 mt-4">
          <ul className="space-y-1">
            <li>
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-3 px-6 py-3 text-white hover:bg-white/10 transition-colors"
              >
                <LayoutDashboard className="w-5 h-5" /> <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link
                href="/admin/management"
                className="flex items-center gap-3 px-6 py-3 text-white bg-white/10"
              >
                <ScanFace className="w-5 h-5" /> <span>Face Management</span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* ⬜️ Main Layout */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white flex items-center justify-end px-8 shadow-sm shrink-0">
          {/* Header เหมือนเดิม */}
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

        <main className="flex-1 overflow-y-auto p-8">
          <h1 className="text-2xl font-bold text-[#324565] mb-6">
            รายละเอียดพนักงาน
          </h1>

          <div className="bg-white rounded-3xl p-10 shadow-sm w-full max-w-6xl">
            {loading ? (
              <div className="flex justify-center py-20 text-gray-400">
                กำลังโหลดข้อมูล...
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                {/* 📝 Left Section: Form (Disabled) */}
                <div className="flex flex-col gap-6">
                  <div className="space-y-2">
                    <Label className="text-gray-900 font-semibold text-base">
                      ชื่อ-นามสกุล
                    </Label>
                    <Input
                      value={userData.fullname}
                      disabled
                      className="h-12 border-gray-300 rounded-lg focus-visible:ring-[#4a6396] text-gray-900 disabled:bg-gray-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-900 font-semibold text-base">
                      ตำแหน่ง
                    </Label>
                    <Input
                      value={userData.position || "-"}
                      disabled
                      className="h-12 border-gray-300 rounded-lg focus-visible:ring-[#4a6396] text-gray-900 disabled:bg-gray-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-900 font-semibold text-base">
                      ID
                    </Label>
                    <Input
                      value={userData.employee_id}
                      disabled
                      className="h-12 border-gray-300 rounded-lg focus-visible:ring-[#4a6396] text-gray-900 disabled:bg-gray-100"
                    />
                  </div>
                </div>

                {/* 📸 Right Section: แสดงรูปภาพ */}
                <div className="flex flex-col">
                  <div className="relative aspect-[4/3] w-full max-w-lg mx-auto rounded-2xl overflow-hidden bg-slate-100 border-4 border-[#d9d9d9] flex items-center justify-center">
                    {userData.image_url ? (
                      <img
                        src={userData.image_url}
                        alt="Face"
                        className="w-full h-full object-cover"
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

            {/* 🔘 Action Buttons */}
            <div className="flex justify-center gap-4 mt-12 xl:justify-start">
              <Button
                asChild
                className="px-8 h-12 bg-[#233559] hover:bg-[#1a2844] text-white rounded-lg font-medium shadow-sm cursor-pointer"
              >
                <Link href={`/admin/management/edit/${id}`}>แก้ไขข้อมูล</Link>
              </Button>
              <Button
                variant="ghost"
                asChild
                className="px-8 h-12 bg-[#c8c8c8] text-gray-800 hover:bg-gray-300 rounded-lg font-medium"
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
