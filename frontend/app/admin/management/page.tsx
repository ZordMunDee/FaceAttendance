'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings2, UserPlus, Trash2, ShieldCheck, LogOut } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from 'next/navigation';

export default function ManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 🛡️ Guard: ตรวจตั๋ว VIP (ชื่อต้องตรงกันกับหน้า Login เป๊ะๆ)
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
    
    if (isLoggedIn !== 'true') {
      router.push('/login');
      return;
    }
    
    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:8000/users/");
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      toast.error("โหลดข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (empId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบพนักงานรหัส " + empId + " ?")) return;
    
    try {
      const res = await fetch(`http://localhost:8000/users/${empId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("ลบพนักงานสำเร็จ");
        fetchUsers();
      } else {
        toast.error("ลบข้อมูลล้มเหลวจาก Server");
      }
    } catch (e) {
      toast.error("ไม่สามารถติดต่อ Server ได้");
    }
  };

  const handleLogout = () => {
    // 🚀 ลบตั๋วทิ้งแล้วดีดกลับหน้า Login
    localStorage.removeItem('isAdminLoggedIn');
    toast.success("ออกจากระบบเรียบร้อย");
    router.push('/login');
  };

  // ป้องกันหน้ากระพริบตอนกำลังตรวจตั๋ว
  if (loading) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">กำลังตรวจสอบสิทธิ์...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-6 gap-4">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter">MANAGEMENT <span className="text-emerald-500">DASHBOARD</span></h1>
            <p className="text-slate-400 mt-1">ระบบจัดการพนักงานและสิทธิ์การเข้าถึง</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button onClick={handleLogout} variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10 flex-1 sm:flex-none">
              <LogOut className="mr-2 h-4 w-4" /> ออกจากระบบ
            </Button>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-500 text-white flex-1 sm:flex-none">
              <Link href="/register">
                <UserPlus className="mr-2 h-4 w-4" /> เพิ่มพนักงาน
              </Link>
            </Button>
          </div>
        </div>

        {/* Table Section */}
        <Card className="bg-slate-900 border-slate-800 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Settings2 className="text-emerald-500" /> รายชื่อพนักงานในระบบ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-950/50">
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="w-[150px]">รหัสพนักงาน</TableHead>
                    <TableHead>ชื่อ-นามสกุล</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                        ยังไม่มีข้อมูลพนักงานในระบบ
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => (
                      <TableRow key={u.employee_id} className="border-slate-800 hover:bg-slate-800/50 transition-colors">
                        <TableCell className="font-mono font-semibold text-emerald-400">{u.employee_id}</TableCell>
                        <TableCell className="font-medium">{u.fullname}</TableCell>
                        <TableCell>
                          {u.is_admin ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full w-fit border border-emerald-500/20">
                              <ShieldCheck size={14}/> Admin
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full w-fit border border-slate-700">
                              Employee
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(u.employee_id)} className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors">
                            <Trash2 size={18} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}