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
  RefreshCw,
  CalendarIcon,
  LayoutDashboard,
  UserPlus,
  LogOut,
  Menu,
  ScanFace,
  Download,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Calendar } from "@/components/ui/calendar";
import { useRouter, usePathname } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { toast } from "sonner";
import AccountGroupIcon from "@iconify-react/mdi/account-group";
import AccountHardHatOutlineIcon from "@iconify-react/mdi/account-hard-hat-outline";
import AccountAlertOutlineIcon from "@iconify-react/mdi/account-alert-outline";
import AccountArrowUpOutlineIcon from "@iconify-react/mdi/account-arrow-up-outline";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export function DashboardClient() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      color: "text-[#0A1D37]",
      bg: "bg-[#8CAEC9]",
      icon: <AccountGroupIcon className="w-15 h-15 text-[#0A1D37]" />,
    },
    {
      label: "ปกติ",
      val: summary.onTime,
      color: "text-[#134B0D]",
      bg: "bg-[#7CB677]",
      icon: <AccountHardHatOutlineIcon className="w-15 h-15 text-[#134B0D]" />,
    },
    {
      label: "มาสาย",
      val: summary.late,
      color: "text-[#4E1213]",
      bg: "bg-[#DF797B]",
      icon: <AccountAlertOutlineIcon className="w-15 h-15 text-[#4E1213]" />,
    },
    {
      label: "นอกเวลา",
      val: summary.overtime,
      color: "text-[#766800]",
      bg: "bg-[#DFDF79]",
      icon: <AccountArrowUpOutlineIcon className="w-15 h-15 text-[#766800]" />,
    },
  ];

 // 🚀 ฟังก์ชันดาวน์โหลด CSV (โหลดเหมาทั้งเดือน)
  const downloadCSV = () => {
    // 1. หาว่าตอนนี้กำลังดูเดือน/ปีอะไรอยู่ (ดูจาก date ที่เลือก หรือถ้าไม่มีก็เอาเดือนปัจจุบัน)
    const targetDate = date || new Date();
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();

    // 2. ดึงข้อมูลจาก logs ทั้งหมด (ไม่ใช่แค่ที่โชว์ในตาราง) มากรองเอาเฉพาะเดือนที่ตรงกัน
    const monthlyLogs = logs.filter((log) => {
      const d = new Date(log.timestamp);
      return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    });

    if (monthlyLogs.length === 0) {
      toast.error("ไม่มีข้อมูลสแกนในเดือนนี้เลยครับ");
      return;
    }

    // 3. สร้างหัวตาราง (Header)
    const headers = ["ชื่อ-นามสกุล", "ID พนักงาน", "วันที่", "เวลา", "สถานะ"];

    // 4. แปลงข้อมูลรายเดือนเป็นแถว (เรียงใหม่ให้สวยงาม)
    const rows = monthlyLogs.map((log) => {
      const dateStr = new Date(log.timestamp).toLocaleDateString("th-TH", {
        timeZone: "Asia/Bangkok",
      });
      const timeStr = new Date(log.timestamp).toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Bangkok",
      });
      const statusStr =
        log.status === "In"
          ? "เข้างาน"
          : log.status === "Out"
            ? "ออกงาน"
            : "มาสาย";

      return [
        `"${log.fullname}"`,
        `"${log.employee_id}"`,
        `"${dateStr}"`,
        `"${timeStr}"`,
        `"${statusStr}"`,
      ].join(",");
    });

    // 5. รวม Header กับข้อมูลเข้าด้วยกัน (ใส่ \uFEFF ให้ Excel อ่านภาษาไทยได้)
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows].join("\n");

    // 6. ตั้งชื่อไฟล์ให้ตรงกับเดือนนั้นๆ
    const monthName = targetDate.toLocaleDateString("th-TH", { month: "long", year: "numeric" });
    const fileName = `Attendance_Log_${monthName.replace(/\s+/g, "_")}.csv`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`ดาวน์โหลดข้อมูลของเดือน${monthName} สำเร็จ!`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#eaf0f6]">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#eaf0f6] text-slate-900 font-sans selection:bg-[#4a6396]/30 overflow-hidden relative">
      {/* 🌑 Overlay สีดำโปร่งแสงตอนเปิด Sidebar มือถือ */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)} // กดพื้นหลังเพื่อปิด
        />
      )}

      {/* ================= SIDEBAR ================= */}
      {/* 🎨 แก้ไขคลาสตรงนี้ให้ลอย (Fixed) และสไลด์ได้บนจอมือถือ แต่ฝังตัว (Static) บนจอคอม */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-[#4a6396] text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:h-full lg:shadow-lg",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-6 flex items-center justify-between lg:justify-start gap-4 text-xl font-bold tracking-wide border-b border-white/10 lg:border-none">
          <div className="flex items-center gap-3">
            <Menu className="w-6 h-6 hidden lg:block" />
            MANAGEMENT
          </div>
          {/* ปุ่มปิด Sidebar สำหรับมือถือ */}
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
                className={`w-full justify-start rounded-full text-base px-6 h-12 transition-colors ${isActive("/admin/management") ? "bg-white text-gray-800 font-semibold" : "text-white hover:bg-white/10"}`}
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
        {/* 🎨 เพิ่มปุ่ม Hamburger 3 ขีด เข้ามาด้านซ้ายมือ สำหรับเปิด Sidebar */}
        <header className="h-16 bg-white flex items-center justify-between px-4 sm:px-8 shadow-sm shrink-0 border-b border-gray-100 z-10">
          {/* ปุ่ม Hamburger (โชว์เฉพาะ lg ลงมา) */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-slate-500 hover:bg-slate-100 rounded-full"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </Button>

          {/* Profile ทางขวา */}
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
          {/* TITLE SECTION */}
          <div className="mb-6 sm:mb-8 shrink-0">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#324565]">
              {/* 🚀 บังคับโชว์วันที่เสมอ ถ้าเผลอกดยกเลิกวันในปฏิทิน จะเด้งกลับมาโชว์วันปัจจุบันทันที! */}
              {(date || new Date()).toLocaleDateString("th-TH", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </h2>
            <p className="text-sm text-gray-400 font-medium mt-1">
              ภาพรวมการสแกนเข้า-ออกงานประจำวัน
            </p>
          </div>

          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
            {cards.map((card, idx) => (
              <div
                key={idx}
                className={`${card.bg} rounded-2xl sm:rounded-[2rem] border border-gray-200 p-5 sm:p-8 flex justify-between items-center shadow-sm transition-transform hover:scale-[1.02]`}
              >
                <div className="flex flex-col">
                  <p
                    className={`text-xs sm:text-base font-bold uppercase tracking-wide mb-1 ${card.color}`}
                  >
                    {card.label}
                  </p>
                  <p
                    className={`text-3xl sm:text-5xl font-black ${card.color}`}
                  >
                    {card.val}
                  </p>
                </div>
                {card.icon}
              </div>
            ))}
          </div>

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            {/* CALENDAR (LEFT) */}
            <div className="col-span-1 lg:col-span-5 xl:col-span-5 flex flex-col h-full">
              <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 shadow-sm p-4 sm:p-8 flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 flex justify-center scale-95 sm:scale-100 lg:scale-105">
                  <Calendar
                    mode="single"
                    selected={date}
                    // 🚀 1. เปลี่ยนตรง onSelect เป็นแบบนี้ครับ (ดักไม่ให้เป็นค่าว่าง)
                    onSelect={(newDate) => {
                      if (newDate) setDate(newDate);
                    }}
                    month={date}
                    onMonthChange={setDate}
                    locale={th}
                    className="w-full h-full p-0 bg-white [&_.rdp-caption]:hidden [&_.rdp-head_cell]:text-[#c0c7d2] [&_.rdp-head_cell]:font-bold [&_.rdp-head_cell]:uppercase [&_.rdp-day_selected]:bg-[#abc0d8] [&_.rdp-day_selected]:text-white [&_.rdp-day_selected]:font-bold [&_.rdp-day]:rounded-full [&_.rdp-day_today]:text-[#4a6396] [&_.rdp-day_today]:font-black"
                  />
                </div>
              </div>
            </div>

            {/* TABLE (RIGHT) */}
            <div className="col-span-1 lg:col-span-7 xl:col-span-7 h-full">
              <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col h-full overflow-hidden">
                {/* HEADER FILTERS */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 sm:p-8 gap-4 border-b border-gray-100">
                  <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full sm:w-auto">
                    <Popover>
                      <PopoverTrigger asChild>
                        <div
                          role="button"
                          tabIndex={0}
                          className={cn(
                            "inline-flex items-center justify-start rounded-full bg-gray-100 border border-gray-200 px-4 h-10 sm:h-11 w-full sm:max-w-[180px] text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-[#abc0d8]/50",
                            !date && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-gray-400 shrink-0" />
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

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="h-10 sm:h-11 bg-white border border-gray-200 px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-[#abc0d8]/50 w-full sm:w-auto"
                    >
                      <option value="all">สถานะ: ทั้งหมด</option>
                      <option value="In">สถานะ: เข้างาน</option>
                      <option value="Out">สถานะ: ออกงาน</option>
                      <option value="Late">สถานะ: สาย</option>
                    </select>
                  </div>

                  <div className="flex gap-2 sm:gap-3 items-center w-full sm:w-auto justify-end">
                    <Button
                      variant="outline"
                      onClick={downloadCSV}
                      className="h-10 sm:h-11 bg-white border border-gray-200 px-4 sm:px-6 rounded-full text-xs sm:text-sm font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors shadow-sm w-full sm:w-auto"
                    >
                      <Download className="mr-2 h-4 w-4 text-emerald-600 shrink-0" />
                      โหลด CSV
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={fetchData}
                      className="rounded-full text-gray-400 hover:text-blue-600 h-10 w-10 shrink-0 bg-gray-50"
                    >
                      <RefreshCw
                        size={18}
                        className={isRefreshing ? "animate-spin" : ""}
                      />
                    </Button>
                  </div>
                </div>

                {/* TABLE BODY */}
                {/* ================= TABLE BODY ================= */}
                {/* 🚀 ทริค: ใช้ [&>div] ยิงคำสั่งทะลุเข้าไปหา wrapper ของ shadcn โดยตรง เพื่อไม่ให้เกิด Scroll ซ้อนกัน */}
                <div className="flex-1 w-full [&>div]:max-h-[340pxpx] sm:[&>div]:max-h-[380px] [&>div]:overflow-auto [&>div]:custom-scrollbar">
                  <Table className="min-w-[600px]">
                    {/* 🚀 ใส่ sticky top-0 ตรงนี้ และใส่เงาบางๆ (shadow-sm) ให้ดูมีมิติเวลาเลื่อนทับข้อมูล */}
                    <TableHeader className="sticky top-0 bg-white z-20 shadow-sm ring-1 ring-black/5">
                      <TableRow className="bg-transparent hover:bg-transparent border-none">
                        <TableHead className="pl-4 sm:pl-8 uppercase text-[10px] sm:text-xs font-bold text-gray-500 py-4 sm:py-5">
                          ชื่อ
                        </TableHead>
                        <TableHead className="text-center uppercase text-[10px] sm:text-xs font-bold text-gray-500 py-4 sm:py-5">
                          วันที่
                        </TableHead>
                        <TableHead className="text-center uppercase text-[10px] sm:text-xs font-bold text-gray-500 py-4 sm:py-5">
                          เข้างาน
                        </TableHead>
                        <TableHead className="text-center uppercase text-[10px] sm:text-xs font-bold text-gray-500 py-4 sm:py-5">
                          ออกงาน
                        </TableHead>
                        <TableHead className="text-right pr-4 sm:pr-8 uppercase text-[10px] sm:text-xs font-bold text-gray-500 py-4 sm:py-5">
                          สถานะ
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {filteredLogs.map((log, i) => (
                        <TableRow
                          key={i}
                          className={cn(
                            "h-14 sm:h-16 border-none hover:bg-slate-100 transition-colors",
                            i % 2 !== 0 ? "bg-[#f0f7ff]" : "bg-white",
                          )}
                        >
                          <TableCell className="pl-4 sm:pl-8 py-0">
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-800 text-xs sm:text-sm">
                                {log.fullname}
                              </span>
                              <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium">
                                ID: {log.employee_id}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="text-center font-bold text-gray-800 py-0 text-xs sm:text-sm">
                            {new Date(log.timestamp).toLocaleDateString(
                              "th-TH",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                timeZone: "Asia/Bangkok",
                              },
                            )}
                          </TableCell>

                          <TableCell className="text-center font-semibold text-gray-700 py-0 text-xs sm:text-sm">
                            {log.status === "Out"
                              ? "-"
                              : new Date(log.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  timeZone: "Asia/Bangkok",
                                })}
                          </TableCell>

                          <TableCell className="text-center font-semibold text-gray-700 py-0 text-xs sm:text-sm">
                            {log.status !== "Out"
                              ? "-"
                              : new Date(log.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  timeZone: "Asia/Bangkok",
                                })}
                          </TableCell>

                          <TableCell className="text-right pr-4 sm:pr-8 py-0">
                            <Badge
                              variant="secondary"
                              className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[11px] font-extrabold border-none 
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
                      {filteredLogs.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="h-32 text-center text-gray-400 font-medium"
                          >
                            ไม่มีข้อมูลในวันที่เลือก
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
