'use client';

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, User } from "lucide-react";
import { LogEntry } from "@/services/user-service";

export function AttendanceTable({ initialData }: { initialData: LogEntry[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  // ระบบค้นหาพนักงาน
  const filteredData = initialData.filter((log) =>
    log.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* แถบค้นหา */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          placeholder="ค้นหาชื่อหรือรหัสพนักงาน..."
          className="pl-10 bg-slate-900 border-slate-800 focus-visible:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* ตารางแสดงผล */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-slate-900">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="w-[150px] text-slate-400">รหัสพนักงาน</TableHead>
              <TableHead className="text-slate-400">ชื่อ-นามสกุล</TableHead>
              <TableHead className="text-slate-400">สถานะ</TableHead>
              <TableHead className="text-right text-slate-400">เวลาที่บันทึก</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((log) => (
                <TableRow key={log.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                  <TableCell className="font-mono text-blue-400">{log.employee_id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-800 rounded-full">
                        <User size={14} className="text-slate-400" />
                      </div>
                      <span className="font-medium">{log.fullname}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/5 text-emerald-400">
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-slate-500 text-sm">
                    {new Date(log.timestamp).toLocaleString('th-TH')}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                  ไม่พบข้อมูลประวัติ
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}