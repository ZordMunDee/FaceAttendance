"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Users,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Moon,
  CalendarIcon,
  Settings2,
  LayoutDashboard,
  UserCheck,
  UserPlus,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Calendar } from "@/components/ui/calendar";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function DashboardClient() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [statusFilter, setStatusFilter] = useState("all");
  const [employeeCount, setEmployeeCount] = useState(0);

  const pathname = usePathname();

  const router = useRouter();

  // 🚀 ฟังก์ชัน Logout
  const handleLogout = () => {
    // 1. ลบสถานะ Login ออกจากเครื่อง
    localStorage.removeItem("isAdminLoggedIn");
    localStorage.removeItem("adminName");

    // 2. ดีดกลับไปหน้า Login
    router.push("/login");
  };

  const [adminProfile, setAdminProfile] = useState({
    name: "Admin",
    role: "ADMIN",
  });

  const isActive = (path: string) => pathname === path;

  // ================= FETCH =================
  const fetchData = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const [userRes, logRes, empRes] = await Promise.all([
        api.get("/users/"),
        api.get("/scan/logs"),
        api.get("/employees/count"), // 👈 เพิ่มตัวนี้
      ]);

      setLogs(logRes.data);
      setEmployeeCount(empRes.data.total); // 👈 สำคัญ
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ================= FILTER BY DATE =================
  const filteredByDate = useMemo(() => {
    if (!date) return logs;

    return logs.filter((log) => {
      const d = new Date(log.timestamp);
      return (
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate()
      );
    });
  }, [logs, date]);

  // ================= FILTER BY STATUS =================
  const filteredLogs = useMemo(() => {
    if (statusFilter === "all") return filteredByDate;
    return filteredByDate.filter((l) => l.status === statusFilter);
  }, [filteredByDate, statusFilter]);

  // ================= SUMMARY =================
  const summary = useMemo(() => {
    return {
      total: employeeCount,
      onTime: filteredByDate.filter(
        (l) => l.status === "In" && new Date(l.timestamp).getHours() < 9,
      ).length,
      late: filteredByDate.filter((l) => l.status === "Late").length,
      overtime: filteredByDate.filter(
        (l) => l.status === "Out" && new Date(l.timestamp).getHours() >= 17,
      ).length,
    };
  }, [filteredByDate]);

  const cards = [
    {
      label: "พนักงานทั้งหมด",
      val: summary.total,
      color: "text-slate-800",
      bg: "bg-white",
      icon: <Users className="w-5 h-5 text-slate-600" />,
    },
    {
      label: "มาทำงานปกติ",
      val: summary.onTime,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
    },
    {
      label: "เข้างานสาย",
      val: summary.late,
      color: "text-rose-600",
      bg: "bg-rose-50",
      icon: <AlertCircle className="w-5 h-5 text-rose-600" />,
    },
    {
      label: "ทำงานล่วงเวลา",
      val: summary.overtime,
      color: "text-amber-600",
      bg: "bg-amber-50",
      icon: <Clock className="w-5 h-5 text-amber-600" />,
    },
  ];

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <p className="text-slate-500 mt-3">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 bg-[#0A1D37] border-r border-slate-200 p-6 flex flex-col text-white">
        <h1 className="text-xl font-bold mb-8 flex items-center gap-2">
          <Settings2 className="text-emerald-500" /> MANAGEMENT
        </h1>

        <nav className="space-y-4 flex-1">
          {/* DASHBOARD */}
          <Link href="/admin/dashboard" className="w-full block">
            <Button
              variant="ghost"
              className={`w-full justify-start ${
                isActive("/admin/dashboard")
                  ? "bg-white text-slate-900 shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>

          {/* FACE MANAGEMENT */}
          <Link href="/admin/management" className="w-full block">
            <Button
              variant="ghost"
              className={`w-full justify-start ${
                isActive("/admin/management")
                  ? "bg-white text-slate-900 shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Face Management
            </Button>
          </Link>

          {/* REGISTER (เหมือน Management page) */}
          <Button
            variant="ghost"
            onClick={() => router.push("/register")}
            className={`w-full justify-start ${
              isActive("/register")
                ? "bg-emerald-500 text-white shadow-md"
                : "text-emerald-400 hover:bg-slate-800"
            }`}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            ลงทะเบียนพนักงานใหม่
          </Button>
        </nav>

        {/* LOGOUT */}
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-red-400 hover:bg-slate-800"
        >
          <LogOut className="mr-2 h-4 w-4" />
          ออกจากระบบ
        </Button>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 p-10 overflow-y-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              Attendance Dashboard
            </h2>
            <p className="text-slate-500 mt-1">
              สรุปข้อมูลการลงเวลาทำงานพนักงาน
            </p>
          </div>

          {/* ADMIN CARD */}
          <div className="flex items-center gap-4 bg-white p-2 pr-5 rounded-full shadow-sm border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              <ShieldCheck size={20} />
            </div>

            <div>
              <p className="text-sm font-bold leading-none">
                {adminProfile.name}
              </p>
              <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1">
                Administrator
              </p>
            </div>
          </div>
        </div>

        {/* ================= SUMMARY ================= */}
        <div className="grid grid-cols-4 gap-6 mb-10">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className={`${card.bg} rounded-3xl border border-slate-200 shadow-sm p-6 transition-transform hover:scale-[1.02]`}
            >
              {/* header */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                  {card.label}
                </p>

                {card.icon}
              </div>

              {/* value */}
              <p className={`text-4xl font-black mt-3 ${card.color}`}>
                {card.val}
              </p>
            </div>
          ))}
        </div>

        {/* ================= MAIN GRID ================= */}
        <div className="grid grid-cols-12 gap-8">
          {/* CALENDAR */}
          <div className="col-span-4">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 flex flex-col">
              {/* header */}
              <div className="flex items-center gap-2 mb-4 text-slate-800">
                <CalendarIcon size={18} />
                <h3 className="font-bold">ปฏิทินตรวจสอบ</h3>
              </div>

              {/* calendar */}
              <div className="flex-1 flex">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="w-full h-full rounded-2xl border border-slate-200 bg-white shadow-sm p-4
        [&_.rdp]:w-full
        [&_.rdp-table]:w-full
        [&_.rdp-cell]:w-full"
                />
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="col-span-8">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
              {/* HEADER */}
              <div className="flex justify-between items-center p-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-6 bg-blue-600 rounded-full" />
                  <h3 className="font-bold text-lg">รายการลงเวลาล่าสุด</h3>
                </div>

                <div className="flex gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-100 px-4 py-2 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="In">เข้างาน</option>
                    <option value="Out">ออกงาน</option>
                    <option value="Late">สาย</option>
                  </select>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={fetchData}
                    className="rounded-xl border-slate-200"
                  >
                    <RefreshCw
                      size={18}
                      className={isRefreshing ? "animate-spin" : ""}
                    />
                  </Button>
                </div>
              </div>

              {/* TABLE BODY */}
              <div className="flex-1 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="pl-8 uppercase text-[11px] font-black text-slate-400">
                        Employee
                      </TableHead>

                      <TableHead className="text-center uppercase text-[11px] font-black text-slate-400">
                        Time
                      </TableHead>

                      <TableHead className="text-right pr-8 uppercase text-[11px] font-black text-slate-400">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredLogs.map((log, i) => (
                      <TableRow
                        key={i}
                        className="border-b border-slate-50 hover:bg-slate-50/50 h-16"
                      >
                        <TableCell className="pl-8">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">
                              {log.fullname}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono uppercase">
                              {log.employee_id}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-center font-medium text-slate-600">
                          {new Date(log.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>

                        <TableCell className="text-right pr-8">
                          <span
                            className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase
                          ${
                            log.status === "In"
                              ? "bg-emerald-100 text-emerald-700"
                              : log.status === "Late"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-blue-100 text-blue-700"
                          }`}
                          >
                            {log.status === "In" ? "On Time" : log.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ================= STAT CARD =================
function StatCard({ title, value, icon, color = "text-white" }: any) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between">
          <div>
            <p className="text-xs text-slate-500">{title}</p>
            <h2 className={`text-2xl font-bold ${color}`}>{value}</h2>
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
