"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Settings2,
  Trash2,
  LayoutDashboard,
  UserCheck,
  Search,
  Eye,
  ShieldCheck,
  UserPlus,
  LogOut,
  Menu,
  AlertTriangle,
  ScanFace,
  X,
} from "lucide-react"; // 🚀 เพิ่มไอคอนใหม่
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

interface User {
  employee_id: string;
  fullname: string;
  position: string;
  face_encoding: string | null; // 👈 ตัวนี้แหละคือสถานะใบหน้า
  status: string;
}

export default function ManagementPage() {
  // type User = {
  //   employee_id: string;
  //   fullname: string;
  // };

  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState({
    name: "Admin",
    role: "ADMIN",
  });
  const isActive = (path: string) => pathname === path;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem("adminName") || "Owen Radcliffe";
    setAdminProfile({ name: name, role: "ADMIN" });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    fetchUsers();

    // 👇 สำคัญ: รีเฟรชตอนกลับมาหน้า
    const handleFocus = () => {
      fetchUsers();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const res = await api.get("/users/");

      if (res.data) {
        setUsers(res.data);
      }
    } catch (e: any) {
      console.error(e);

      if (e.response?.status === 401) {
        toast.error("Session หมดอายุ");
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }

      toast.error("โหลดข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  // 🚀 เพิ่มฟังก์ชันลบพนักงาน
  const handleDelete = async (employee_id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบพนักงานคนนี้?")) return;

    try {
      const res = await api.delete(`/users/${employee_id}`);

      if (res.status === 200) {
        toast.success("ลบข้อมูลสำเร็จ");
        fetchUsers();
      }
    } catch (e) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  // 🚀 เพิ่มฟังก์ชันนำทางไปหน้าแก้ไข (สมมติว่าไนซ์จะสร้างหน้า /edit/[id])
  const handleEdit = (employee_id: string) => {
    router.push(`/admin/management/edit/${employee_id}`);
  };

  // 🚀 ฟังก์ชัน Logout
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
                className={`w-full justify-start rounded-full text-base px-6 h-12 transition-colors ${isActive("/admin/management") ? "bg-white text-gray-800 font-semibold shadow-md" : "text-white hover:bg-white/10"}`}
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
                className="w-full justify-start rounded-full text-base px-6 h-12 text-white hover:bg-white/10"
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
        <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto w-full">
          {/* HEADER & SEARCH (Responsive) */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#324565]">
                Face Management
              </h2>
              <p className="text-sm text-gray-400 font-medium mt-1">
                จัดการข้อมูลใบหน้าและรายชื่อพนักงาน
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ค้นหารายชื่อพนักงาน..."
                className="pl-11 pr-4 bg-white border-none rounded-full h-11 shadow-sm focus-visible:ring-[#ffffff] w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* ================= TABLE AREA ================= */}
          <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col overflow-hidden w-full">
            <div className="overflow-x-auto custom-scrollbar">
              <Table className="min-w-[600px]">
                <TableHeader className="bg-transparent hover:bg-transparent">
                  <TableRow className="border-b border-gray-100 hover:bg-transparent">
                    <TableHead className="pl-6 sm:pl-10 uppercase text-[10px] sm:text-xs font-bold text-gray-400 py-4 sm:py-6">
                      ชื่อ-นามสกุล
                    </TableHead>
                    <TableHead className="text-center uppercase text-[10px] sm:text-xs font-bold text-gray-400 py-4 sm:py-6">
                      สถานะข้อมูลใบหน้า
                    </TableHead>
                    <TableHead className="text-right pr-6 sm:pr-10 uppercase text-[10px] sm:text-xs font-bold text-gray-400 py-4 sm:py-6">
                      การแก้ไข
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {users
                    .filter((u) =>
                      u.fullname.toLowerCase().includes(search.toLowerCase()),
                    )
                    .map((u, i) => (
                      <TableRow
                        key={u.employee_id}
                        className={cn(
                          "h-16 sm:h-20 border-none transition-colors hover:bg-slate-100",
                          i % 2 !== 0 ? "bg-[#f0f7ff]" : "bg-white",
                        )}
                      >
                        {/* 📸 เพิ่มรูป Avatar ลงในตาราง */}
                        <TableCell className="pl-6 sm:pl-10">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                              <img
                                src={`${API_URL}/uploads/${u.employee_id}.jpg?t=${Date.now()}`}
                                alt={u.fullname}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "https://placehold.co/100x100/eeeeee/999999?text=No+Image";
                                }}
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-800 text-sm sm:text-base">
                                {u.fullname}
                              </span>
                              <span className="text-[9px] sm:text-[11px] text-gray-400 font-medium">
                                ID: {u.employee_id}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "px-3 sm:px-5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[12px] font-extrabold border-none",
                              u.face_encoding
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-700",
                            )}
                          >
                            {u.face_encoding ? "กำลังใช้งาน" : "ไม่พบข้อมูล"}
                          </Badge>
                        </TableCell>

                        <TableCell className="pr-6 sm:pr-10">
                          <div className="flex gap-1 sm:gap-2 justify-end items-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full text-blue-500 hover:bg-blue-50"
                              onClick={() => handleEdit(u.employee_id)}
                            >
                              <Settings2
                                size={16}
                                className="sm:w-[18px] sm:h-[18px]"
                              />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full text-rose-500 hover:bg-rose-50"
                                >
                                  <Trash2
                                    size={16}
                                    className="sm:w-[18px] sm:h-[18px]"
                                  />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-[#bd4033] border-none rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-12 max-w-[90%] sm:max-w-[450px]">
                                <div className="flex flex-col items-center text-center">
                                  <div className="mb-6">
                                    <AlertTriangle
                                      size={60}
                                      className="text-white opacity-90 sm:w-20 sm:h-20"
                                      strokeWidth={1.5}
                                    />
                                  </div>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-white text-xl sm:text-3xl font-bold mb-6 sm:mb-8">
                                      ต้องการลบข้อมูลใบหน้า
                                    </AlertDialogTitle>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-center w-full">
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleDelete(u.employee_id)
                                      }
                                      className="bg-[#1a2e4c] hover:bg-[#1a2e4c]/90 text-white rounded-xl px-8 sm:px-10 h-10 sm:h-12 text-sm sm:text-base font-bold border-none w-full sm:w-auto"
                                    >
                                      ยืนยัน
                                    </AlertDialogAction>
                                    <AlertDialogCancel className="bg-[#bcbcbc] hover:bg-[#bcbcbc]/90 text-gray-800 rounded-xl px-8 sm:px-10 h-10 sm:h-12 text-sm sm:text-base font-bold border-none mt-0 w-full sm:w-auto">
                                      ยกเลิก
                                    </AlertDialogCancel>
                                  </AlertDialogFooter>
                                </div>
                              </AlertDialogContent>
                            </AlertDialog>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full text-slate-400 hover:bg-slate-100"
                              onClick={() =>
                                router.push(
                                  `/admin/management/view/${u.employee_id}`,
                                )
                              }
                            >
                              <Eye
                                size={16}
                                className="sm:w-[18px] sm:h-[18px]"
                              />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  {users.length === 0 && !loading && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="py-20 text-center text-gray-400 font-medium"
                      >
                        ไม่พบรายชื่อพนักงานในระบบ
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
