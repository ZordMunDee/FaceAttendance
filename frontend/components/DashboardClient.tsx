"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  AlertCircle,
  Moon,
  CalendarIcon,
  LayoutDashboard,
  UserCheck,
  UserPlus,
  LogOut,
  Menu,
  HardHat,
  ChevronLeft,
  ChevronRight,
  Search,
  ScanFace,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Calendar } from "@/components/ui/calendar";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { th } from "date-fns/locale";

export function DashboardClient() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 🔄 State หลักสำหรับวันที่ (จะ Sync กันทั้งหน้าจอ)
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [statusFilter, setStatusFilter] = useState("all");
  const [employeeCount, setEmployeeCount] = useState(0);

  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("isAdminLoggedIn");
    localStorage.removeItem("adminName");
    router.push("/");
  };

  const [adminProfile] = useState({
    name: "Owen Radcliffe",
    role: "ADMIN",
  });

  const isActive = (path: string) => pathname === path;

  // 📅 ฟังก์ชันเลื่อนเดือน
  const changeMonth = (offset: number) => {
    const current = date || new Date();
    const newDate = new Date(
      current.getFullYear(),
      current.getMonth() + offset,
      1,
    );
    setDate(newDate);
  };

  // 📅 ชื่อเดือนแบบ Dynamic ภาษาไทย
  const currentMonthYear = useMemo(() => {
    const d = date || new Date();
    return d.toLocaleDateString("th-TH", { month: "long", year: "numeric" });
  }, [date]);

  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [logRes, empRes] = await Promise.all([
        api.get("/scan/logs"),
        api.get("/employees/count"),
      ]);
      setLogs(logRes.data);
      setEmployeeCount(empRes.data.total);
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

  const filteredLogs = useMemo(() => {
    if (statusFilter === "all") return filteredByDate;
    return filteredByDate.filter((l) => l.status === statusFilter);
  }, [filteredByDate, statusFilter]);

  const summary = useMemo(() => {
    return {
      total: employeeCount,
      // ปกติ: นับเฉพาะคนที่สแกน In และเวลาต้องก่อน 09:00 น.
      onTime: filteredByDate.filter(
        (l) => l.status === "In" && new Date(l.timestamp).getHours() < 9,
      ).length,

      // สาย: นับเฉพาะคนที่สถานะเป็น Late
      late: filteredByDate.filter((l) => l.status === "Late").length,

      // นอกเวลา (OT): ต้องเป็นคนสแกน Out และเวลาต้องอยู่ระหว่าง 17:00 - 23:59 เท่านั้น
      overtime: filteredByDate.filter((l) => {
        const hour = new Date(l.timestamp).getHours();
        return l.status === "Out" && hour >= 17 && hour <= 23;
      }).length,
    };
  }, [filteredByDate, employeeCount]);

  const cards = [
    {
      label: "ทั้งหมด",
      val: summary.total,
      color: "text-[#324565]",
      bg: "bg-[#abc0d8]",
      icon: <Users className="w-10 h-10 text-[#324565]" />,
    },
    {
      label: "ปกติ",
      val: summary.onTime,
      color: "text-[#3e6a47]",
      bg: "bg-[#9bc291]",
      icon: <HardHat className="w-10 h-10 text-[#3e6a47]" />,
    },
    {
      label: "มาสาย",
      val: summary.late,
      color: "text-[#974c53]",
      bg: "bg-[#cd9ca1]",
      icon: <AlertCircle className="w-10 h-10 text-[#974c53]" />,
    },
    {
      label: "นอกเวลา",
      val: summary.overtime,
      color: "text-[#817b3d]",
      bg: "bg-[#e2e19b]",
      icon: <UserPlus className="w-10 h-10 text-[#817b3d]" />,
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#eaf0f6]">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#eaf0f6] text-slate-900 font-sans selection:bg-[#4a6396]/30 overflow-hidden">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 bg-[#4a6396] text-white flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-4 text-xl font-bold tracking-wide">
          <Menu className="w-6 h-6" />
          MANAGEMENT
        </div>
        <nav className="flex-1 mt-4">
          <ul className="space-y-1">
            <li>
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
            className="w-full justify-center text-red-200 hover:bg-red-900/50 rounded-full h-11"
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
            {date
              ? date.toLocaleDateString("th-TH", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "แผงควบคุมระบบ"}
          </h2>

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
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-gray-600 rounded-full"
            >
              <Moon size={16} />
            </Button>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-4 gap-6 mb-10">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className={`${card.bg} rounded-[2rem] border border-gray-200 p-8 flex justify-between items-center shadow-sm transition-transform hover:scale-[1.02]`}
            >
              <div className="flex flex-col">
                {/* 1. เอา Label ขึ้นก่อน พร้อมปรับฟอนต์ให้เล็กลงเล็กน้อยเพื่อความสวยงาม */}
                <p
                  className={`text-base font-bold uppercase tracking-wide mb-1 ${card.color}`}
                >
                  {card.label}
                </p>

                {/* 2. เอาตัวเลข (Value) ลงมาข้างล่าง และเน้นให้เด่นชัด */}
                <p className={`text-5xl font-black ${card.color}`}>
                  {card.val}
                </p>
              </div>

              {/* ไอคอนยังอยู่ที่เดิม (ขวาสุด) */}
              {card.icon}
            </div>
          ))}
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-12 gap-8">
          {/* CALENDAR (LEFT) */}
          <div className="col-span-4 flex flex-col h-full">
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-8 text-[#324565]">
                {/* <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-gray-400"
                  onClick={() => changeMonth(-1)}
                > 
                  <ChevronLeft size={24} />
                </Button>
                {/* <h3 className="font-extrabold text-xl">{currentMonthYear}</h3> */}
                {/* <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-gray-400"
                  onClick={() => changeMonth(1)}
                >
                  <ChevronRight size={24} />
                </Button> */}
              </div>
              <div className="flex-1 flex justify-center scale-105">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  month={date}
                  onMonthChange={setDate}
                  locale={th}
                  className="w-full h-full p-0 bg-white [&_.rdp-caption]:hidden [&_.rdp-head_cell]:text-[#c0c7d2] [&_.rdp-head_cell]:font-bold [&_.rdp-head_cell]:uppercase [&_.rdp-day_selected]:bg-[#abc0d8] [&_.rdp-day_selected]:text-white [&_.rdp-day_selected]:font-bold [&_.rdp-day]:rounded-full [&_.rdp-day_today]:text-[#4a6396] [&_.rdp-day_today]:font-black"
                />
              </div>
            </div>
          </div>

          {/* TABLE (RIGHT) */}
          <div className="col-span-8 h-full">
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col h-full overflow-hidden">
              {/* HEADER FILTERS */}
              <div className="flex justify-between items-center p-8 gap-4 border-b border-gray-100">
                <div className="flex gap-3 flex-1">
                  {/* 🔄 Search Date as Popover Calendar */}
                  <Popover>
                    <PopoverTrigger asChild>
                      {/* ✅ ใช้ div แทน Button และใส่สไตล์ให้เหมือนเดิมเป๊ะ */}
                      <div
                        role="button"
                        tabIndex={0}
                        className={cn(
                          "inline-flex items-center justify-start rounded-full bg-gray-100 border border-gray-200 px-4 h-11 w-full max-w-[200px] text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-[#abc0d8]/50",
                          !date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                        <span className="truncate">
                          {date ? format(date, "dd/MM/yyyy") : "เลือกวันที่"}
                        </span>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 rounded-2xl border-none shadow-2xl"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        locale={th}
                        initialFocus
                        className="bg-white rounded-2xl p-4 [&_.rdp-day_selected]:bg-[#abc0d8] [&_.rdp-day_selected]:text-white [&_.rdp-day]:rounded-full"
                      />
                    </PopoverContent>
                  </Popover>

                  <select className="h-11 bg-white border border-gray-200 px-4 py-2 rounded-full text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-[#abc0d8]/50 cursor-pointer">
                    <option>วันที่ทั้งหมด</option>
                  </select>
                </div>
                <div className="flex gap-3 items-center">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-11 bg-white border border-gray-200 px-6 py-2 rounded-full text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-[#abc0d8]/50"
                  >
                    <option value="all">สถานะ: ทั้งหมด</option>
                    <option value="In">สถานะ: เข้างาน</option>
                    <option value="Out">สถานะ: ออกงาน</option>
                    <option value="Late">สถานะ: สาย</option>
                  </select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={fetchData}
                    className="rounded-full text-gray-400 hover:text-blue-600 h-10 w-10"
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
                    <TableRow className="bg-transparent hover:bg-transparent border-none">
                      <TableHead className="pl-8 uppercase text-xs font-bold text-gray-500 py-5">
                        ชื่อ
                      </TableHead>
                      <TableHead className="text-center uppercase text-xs font-bold text-gray-500 py-5">
                        วันที่
                      </TableHead>
                      <TableHead className="text-center uppercase text-xs font-bold text-gray-500 py-5">
                        เข้างาน
                      </TableHead>
                      <TableHead className="text-center uppercase text-xs font-bold text-gray-500 py-5">
                        ออกงาน
                      </TableHead>
                      <TableHead className="text-right pr-8 uppercase text-xs font-bold text-gray-500 py-5">
                        สถานะ
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log, i) => (
                      <TableRow
                        key={i}
                        // 🎨 ปรับสีให้ชัดขึ้น: แถวเลขคี่ (1, 3, 5...) ให้เป็นสีฟ้าอ่อนสลับขาว
                        className={cn(
                          "h-16 border-none hover:bg-slate-100 transition-colors",
                          i % 2 !== 0 ? "bg-[#f0f7ff]" : "bg-white",
                        )}
                      >
                        <TableCell className="pl-8 py-0">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800">
                              {log.fullname}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">
                              ID: {log.employee_id}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-center font-bold text-gray-800 py-0">
                          {new Date(log.timestamp).toLocaleDateString("th-TH", {
                            year: "numeric",
                            month: "numeric",
                            day: "numeric",
                            timeZone: "Asia/Bangkok", // 👈 เพิ่มบรรทัดนี้
                          })}
                        </TableCell>

                        <TableCell className="text-center font-semibold text-gray-700 py-0">
                          {log.status === "Out"
                            ? "-"
                            : new Date(log.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              }) + " น."}
                        </TableCell>

                        <TableCell className="text-center font-semibold text-gray-700 py-0">
                          {log.status !== "Out"
                            ? "-"
                            : new Date(log.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              }) + " น."}
                        </TableCell>

                        <TableCell className="text-right pr-8 py-0">
                          <Badge
                            variant="secondary"
                            className={`px-4 py-1.5 rounded-full text-[11px] font-extrabold border-none 
            ${
              log.status === "In"
                ? "bg-emerald-100 text-emerald-800"
                : log.status === "Late"
                  ? "bg-rose-100 text-rose-800"
                  : "bg-blue-100 text-blue-800"
            }`}
                          >
                            {log.status === "In"
                              ? "On time"
                              : log.status === "Out"
                                ? "Out"
                                : log.status}
                          </Badge>
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
