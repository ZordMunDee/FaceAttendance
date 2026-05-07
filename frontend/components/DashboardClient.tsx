"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
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
  LogIn,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export function DashboardClient() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    onTime: 0,
    late: 0,
    overtime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 🚀 ฟังก์ชันคำนวณสถิติ (ปรับเวลาตามเงื่อนไขใหม่ของไนซ์)
  const calculateStats = (allUsers: any[], allLogs: any[]) => {
    const today = new Date().setHours(0, 0, 0, 0);
    const todayLogs = allLogs.filter(
      (log) => new Date(log.timestamp).setHours(0, 0, 0, 0) === today,
    );
    const userMap = new Map();

    todayLogs.forEach((log) => {
      if (!userMap.has(log.employee_id)) {
        userMap.set(log.employee_id, { firstIn: null, lastOut: null });
      }
      const userData = userMap.get(log.employee_id);
      const logTime = new Date(log.timestamp);
      const timeValue = logTime.getHours() + logTime.getMinutes() / 60;

      if (log.status === "In") {
        if (
          !userData.firstIn ||
          new Date(log.timestamp) < new Date(userData.firstIn.timestamp)
        ) {
          userData.firstIn = { timestamp: log.timestamp, timeValue };
        }
      } else if (log.status === "Out") {
        if (
          !userData.lastOut ||
          new Date(log.timestamp) > new Date(userData.lastOut.timestamp)
        ) {
          userData.lastOut = { timestamp: log.timestamp, timeValue };
        }
      }
    });

    let onTime = 0;
    let late = 0;
    let ot = 0;

    userMap.forEach((data) => {
      // ⏱️ เงื่อนไขเข้างานปกติ: ก่อน 08:30 น. (8.5)
      if (data.firstIn) {
        if (data.firstIn.timeValue <= 8.5) {
          onTime++;
        } else {
          late++;
        }
      }

      // ⏱️ เงื่อนไขนอกเวลา (OT): หลัง 17:30 น. (17.5)
      if (data.lastOut && data.lastOut.timeValue >= 17.5) {
        ot++;
      }
    });

    setStats({
      total: allUsers.length,
      onTime,
      late,
      overtime: ot,
    });
  };

  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [userRes, logRes] = await Promise.all([
        axios.get(`${API_URL}/users/`),
        axios.get(`${API_URL}/scan/logs`),
      ]);
      setLogs(logRes.data);
      calculateStats(userRes.data, logRes.data);
    } catch (error) {
      console.error("❌ Fetch Error:", error);
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
        <p className="text-slate-500 font-bold uppercase tracking-[0.2em]">
          กำลังคำนวณเวลาเข้า-ออก...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="พนักงานทั้งหมด"
          value={stats.total}
          unit="คน"
          icon={<Users className="text-blue-500" />}
        />
        <StatCard
          title="มาปกติ (ก่อน 08:30)"
          value={stats.onTime}
          unit="คน"
          icon={<CheckCircle2 className="text-emerald-500" />}
          color="text-emerald-500"
        />
        <StatCard
          title="มาสาย (หลัง 08:30)"
          value={stats.late}
          unit="คน"
          icon={<AlertCircle className="text-rose-500" />}
          color="text-rose-500"
        />
        <StatCard
          title="นอกเวลา (หลัง 17:30)"
          value={stats.overtime}
          unit="คน"
          icon={<Moon className="text-amber-500" />}
          color="text-amber-500"
        />
      </div>

      <Card className="bg-slate-900 border-slate-800 shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between p-8 border-b border-slate-800 bg-slate-950/20">
          <CardTitle className="text-xl font-bold flex items-center gap-2 text-white">
            <Clock size={22} className="text-emerald-500" /> รายการบันทึกวันนี้
          </CardTitle>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            disabled={isRefreshing}
            className="rounded-full border-slate-800"
          >
            <RefreshCw
              size={16}
              className={isRefreshing ? "animate-spin" : ""}
            />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-950/50">
              <TableRow className="border-slate-800">
                <TableHead className="pl-10 text-slate-400">ID</TableHead>
                <TableHead className="text-slate-400">ชื่อพนักงาน</TableHead>
                <TableHead className="text-slate-400">เวลาที่บันทึก</TableHead>
                <TableHead className="text-right pr-10 text-slate-400">
                  สถานะ
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length > 0 ? (
                logs.slice(0, 15).map((log: any, index: number) => (
                  <TableRow
                    key={index}
                    className="border-slate-800 hover:bg-slate-800/10"
                  >
                    <TableCell className="pl-10 font-mono text-emerald-500">
                      {log.employee_id}
                    </TableCell>
                    <TableCell className="font-bold text-slate-200">
                      {log.fullname}
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {new Date(log.timestamp).toLocaleTimeString("th-TH")}
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      <Badge
                        className={
                          log.status === "In"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : log.status === "Late"
                              ? "bg-rose-500/10 text-rose-500"
                              : "bg-amber-500/10 text-amber-500"
                        }
                      >
                        {log.status === "In"
                          ? "เข้างาน"
                          : log.status === "Late"
                            ? "มาสาย"
                            : "ออกงาน"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-10 text-slate-500"
                  >
                    ยังไม่มีข้อมูลของวันนี้
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// 🚀 1. สร้าง Interface เพื่อบอก Type ของข้อมูล
interface StatCardProps {
  title: string;
  value: number | string;
  unit: string;
  icon: React.ReactNode;
  color?: string; // ใส่ ? หมายความว่า "มีหรือไม่มีก็ได้" (เพราะเรามีค่า default ไว้แล้ว)
}

// 🚀 2. เอา StatCardProps ไปแปะหลังวงเล็บ
function StatCard({
  title,
  value,
  unit,
  icon,
  color = "text-white",
}: StatCardProps) {
  return (
    <Card className="bg-slate-900 border-slate-800 rounded-3xl shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-black ${color}`}>
          {value}{" "}
          <span className="text-xs font-medium text-slate-600 ml-1">
            {unit}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
