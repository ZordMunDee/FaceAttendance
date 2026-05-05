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
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, User, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserData {
  employee_id: string;
  fullname: string;
  is_admin: boolean;
}

export function UserManagementTable({ initialUsers }: { initialUsers: UserData[] }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-2xl">
      <Table>
        <TableHeader className="bg-slate-900">
          <TableRow className="border-slate-800 hover:bg-transparent">
            <TableHead className="text-slate-400">พนักงาน</TableHead>
            <TableHead className="text-slate-400">รหัสพนักงาน</TableHead>
            <TableHead className="text-slate-400">สิทธิ์การเข้าถึง</TableHead>
            <TableHead className="text-right text-slate-400">จัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialUsers && initialUsers.length > 0 ? (
            initialUsers.map((user) => (
              <TableRow key={user.employee_id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg">
                      <User size={18} className="text-slate-400" />
                    </div>
                    <span className="font-semibold">{user.fullname}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-slate-400">{user.employee_id}</TableCell>
                <TableCell>
                  {user.is_admin ? (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1">
                      <ShieldCheck size={12} /> Admin
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-500 border-slate-700">
                      Employee
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                      <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-400">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                ยังไม่มีข้อมูลพนักงานในระบบ
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}