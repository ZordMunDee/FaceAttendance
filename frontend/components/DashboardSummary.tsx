'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, CheckCircle } from "lucide-react";
import { LogEntry } from "@/services/user-service";

export function DashboardSummary({ logs }: { logs: LogEntry[] }) {
  // Logic คำนวณข้อมูลเบื้องต้น
  const totalLogs = logs.length;
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(log => log.timestamp.startsWith(today)).length;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="bg-slate-900 border-slate-800 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">รายการทั้งหมด</CardTitle>
          <Users className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalLogs} รายการ</div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">สแกนวันนี้</CardTitle>
          <Clock className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{todayLogs} รายการ</div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">สถานะระบบ</CardTitle>
          <CheckCircle className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-400">Online</div>
        </CardContent>
      </Card>
    </div>
  );
}