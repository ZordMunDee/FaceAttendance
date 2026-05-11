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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
    <div className="flex min-h-screen bg-[#eaf0f6] text-slate-900 font-sans selection:bg-[#4a6396]/30 overflow-hidden">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 bg-[#4a6396] text-white flex flex-col shrink-0 shadow-xl">
        <div className="p-6 flex items-center gap-4 text-xl font-bold tracking-wide">
          <Menu className="w-6 h-6" />
          MANAGEMENT
        </div>
        <nav className="flex-1 mt-4">
          <ul className="space-y-1 px-3">
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
                  className={`w-full justify-start rounded-full text-base px-6 h-12 transition-colors ${
                    isActive("/admin/management")
                      ? "bg-white text-gray-800 font-semibold shadow-md"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  <ScanFace className="mr-3 h-5 w-5" />
                  Face Management
                </Button>
              </Link>
            </li>
            <li>
              <Button
                variant="ghost"
                onClick={() => router.push("/register")}
                className="w-full justify-start rounded-full text-base px-6 h-12 text-white hover:bg-white/10"
              >
                <UserPlus className="mr-3 h-5 w-5" /> ลงทะเบียนพนักงานใหม่
              </Button>
            </li>
          </ul>
        </nav>
        <div className="p-4 border-t border-white/10">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-center text-red-100 hover:bg-red-900/40 rounded-full h-11"
          >
            <LogOut className="mr-2 h-4 w-4" /> ออกจากระบบ
          </Button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 p-10 overflow-y-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-extrabold text-[#324565]">
            Face Management
          </h2>
          <div className="flex items-center gap-6">
            <div className="relative w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ค้นหารายชื่อพนักงาน..."
                className="pl-11 pr-4 bg-white border-none rounded-full h-11 shadow-sm focus-visible:ring-[#abc0d8]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Owen"
                alt="Profile"
                className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200"
              />
              <div className="flex flex-col justify-center">
                <span className="text-sm font-bold text-gray-800">
                  {adminProfile.name}
                </span>
                <span className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase">
                  Admin
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= TABLE AREA ================= */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden flex flex-col">
          <Table>
            <TableHeader className="bg-transparent hover:bg-transparent">
              <TableRow className="border-b border-gray-100 hover:bg-transparent">
                <TableHead className="pl-10 uppercase text-xs font-bold text-gray-400 py-6">
                  ชื่อ-นามสกุล
                </TableHead>
                <TableHead className="text-center uppercase text-xs font-bold text-gray-400 py-6">
                  สถานะข้อมูลใบหน้า
                </TableHead>
                <TableHead className="text-right pr-10 uppercase text-xs font-bold text-gray-400 py-6">
                  การแก้ไข
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {users
                .filter((u) =>
                  u.fullname.toLowerCase().includes(search.toLowerCase()),
                ) // ✅ ใส่ Search Filter
                .map((u, i) => (
                  <TableRow
                    key={u.employee_id}
                    className={cn(
                      "h-20 border-none transition-colors hover:bg-slate-100",
                      i % 2 !== 0 ? "bg-[#f0f7ff]" : "bg-white",
                    )}
                  >
                    <TableCell className="pl-10">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800 text-base">
                          {u.fullname}
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium">
                          ID: {u.employee_id}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "px-5 py-1.5 rounded-full text-[12px] font-extrabold border-none",
                          u.face_encoding
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700",
                        )}
                      >
                        {u.face_encoding ? "กำลังใช้งาน" : "ไม่พบข้อมูล"}
                      </Badge>
                    </TableCell>

                    <TableCell className="pr-10">
                      <div className="flex gap-2 justify-end items-center">
                        {/* 1. ปุ่มแก้ไข */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-10 h-10 rounded-full text-blue-500 hover:bg-blue-50"
                          onClick={() => handleEdit(u.employee_id)}
                        >
                          <Settings2 size={18} />
                        </Button>

                        {/* 2. ปุ่มลบ (มาพร้อม Dialog สีแดง) */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-10 h-10 rounded-full text-rose-500 hover:bg-rose-50"
                            >
                              <Trash2 size={18} />
                            </Button>
                          </AlertDialogTrigger>

                          <AlertDialogContent className="bg-[#bd4033] border-none rounded-[2.5rem] p-12 max-w-[450px]">
                            <div className="flex flex-col items-center text-center">
                              <div className="mb-6">
                                <AlertTriangle
                                  size={80}
                                  className="text-white opacity-90"
                                  strokeWidth={1.5}
                                />
                              </div>

                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white text-3xl font-bold mb-8">
                                  ต้องการลบข้อมูลใบหน้า
                                </AlertDialogTitle>
                              </AlertDialogHeader>

                              <AlertDialogFooter className="flex-row gap-4 sm:justify-center w-full">
                                <AlertDialogAction
                                  onClick={() => handleDelete(u.employee_id)}
                                  className="bg-[#1a2e4c] hover:bg-[#1a2e4c]/90 text-white rounded-xl px-10 h-12 text-base font-bold border-none"
                                >
                                  ยืนยัน
                                </AlertDialogAction>
                                <AlertDialogCancel className="bg-[#bcbcbc] hover:bg-[#bcbcbc]/90 text-gray-800 rounded-xl px-10 h-12 text-base font-bold border-none mt-0">
                                  ยกเลิก
                                </AlertDialogCancel>
                              </AlertDialogFooter>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>

                        {/* 3. ปุ่มดูรายละเอียด */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-10 h-10 rounded-full text-slate-400 hover:bg-slate-100"
                          onClick={() => router.push(`/admin/management/view/${u.employee_id}`)}
                        >
                          <Eye size={18} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>

          {users.length === 0 && (
            <div className="py-20 text-center text-gray-400 font-medium">
              ไม่พบรายชื่อพนักงานในระบบ
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
