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
} from "lucide-react"; // 🚀 เพิ่มไอคอนใหม่
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import axios from "axios";

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

export default function ManagementPage() {
  type User = {
    employee_id: string;
    fullname: string;
  };

  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState({
    name: "Admin",
    role: "ADMIN",
  });


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
    router.push(`/edit/${employee_id}`);
  };

  // 🚀 ฟังก์ชัน Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isAdminLoggedIn");
    localStorage.removeItem("adminName");

    toast.success("ออกจากระบบสำเร็จ");

    router.replace("/login");
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* 🚀 Sidebar: เปลี่ยนเป็นสีน้ำเงินเข้มตามรูป */}
      <aside className="w-64 bg-[#0A1D37] border-r border-slate-200 p-6 flex flex-col text-white">
        <h1 className="text-xl font-bold mb-8 flex items-center gap-2">
          <Settings2 className="text-emerald-500" /> MANAGEMENT
        </h1>

        <nav className="space-y-4 flex-1">
          <Link href="/admin/management/dashboard" className="w-full block">
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:text-white"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
            </Button>
          </Link>
          {/* ปุ่ม Active ให้ใช้สีพื้นหลังเข้มขึ้นนิดนึง */}
          <Button
            variant="secondary"
            className="w-full justify-start bg-slate-800 text-white"
          >
            <UserCheck className="mr-2 h-4 w-4" /> Face Management
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-emerald-400 hover:bg-slate-800"
            onClick={() => router.push("/register")}
          >
            <UserPlus className="mr-2 h-4 w-4" /> ลงทะเบียนพนักงานใหม่
          </Button>
        </nav>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-red-400 hover:bg-slate-800"
        >
          <LogOut className="mr-2 h-4 w-4" /> ออกจากระบบ
        </Button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Face Management</h2>
          <div className="flex items-center gap-6">
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search"
                className="pl-8 bg-white border-slate-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {/* Admin Profile */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">
                  {adminProfile.name}
                </p>
                <p className="text-xs text-emerald-600">{adminProfile.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                <ShieldCheck className="text-emerald-600" size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* ตารางข้อมูล: เปลี่ยนเป็นพื้นหลังขาว ขอบเทาอ่อน */}
        {/* 🚀 ตารางข้อมูล: ใช้ grid-cols-3 เพื่อล็อคความกว้างแต่ละคอลัมน์ให้เท่ากันเป๊ะ */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              {/* ใช้ grid-cols-3 แบ่ง 3 ส่วนเท่าๆ กัน */}
              <TableRow className="grid grid-cols-3 items-center h-14 border-b border-slate-200 hover:bg-transparent">
                <TableHead className="pl-6 text-slate-600">
                  ชื่อ-นามสกุล
                </TableHead>
                <TableHead className="text-center text-slate-600">
                  สถานะข้อมูลใบหน้า
                </TableHead>
                <TableHead className="text-right pr-6 text-slate-600">
                  การแก้ไข
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {users.map((u) => (
                <TableRow
                  key={u.employee_id}
                  // ใช้ grid-cols-3 เหมือนกัน เพื่อให้ตรงกับ Header
                  className="grid grid-cols-3 items-center h-16 border-b border-slate-100 hover:bg-slate-100 even:bg-blue-50"
                >
                  <TableCell className="font-medium pl-6 text-slate-900 truncate">
                    {u.fullname}
                  </TableCell>

                  {/* สถานะจะอยู่ตรงกลางของช่องที่ 2 เสมอ */}
                  <TableCell className="text-emerald-600 flex justify-center">
                    <span className="text-center">กำลังใช้งาน</span>
                  </TableCell>

                  {/* ปุ่มจะอยู่ขวาสุดของช่องที่ 3 เสมอ */}
                  <TableCell className="pr-6 flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-500 hover:text-emerald-600"
                      onClick={() => handleEdit(u.employee_id)}
                    >
                      <Settings2 size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-500 hover:text-red-600"
                      onClick={() => handleDelete(u.employee_id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-500 hover:text-blue-600"
                      onClick={() => router.push(`/view/${u.employee_id}`)}
                    >
                      <Eye size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
