'use client';

import { useState } from "react"; // 🚀 ใช้ State แทน
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus } from "lucide-react";
import RegisterPage from "../RegisterForm";


export function AddUserDialog() {
  const [open, setOpen] = useState(false); // 🚀 สร้าง State มาคุม

  return (
    <>
      {/* 1. ปุ่มกดธรรมดา ไม่ต้องมี asChild ให้กวนใจ TypeScript */}
      <Button 
        onClick={() => setOpen(true)} 
        className="bg-emerald-600 hover:bg-emerald-500 shadow-lg"
      >
        <Plus className="mr-2 h-4 w-4" /> เพิ่มพนักงานใหม่
      </Button>

      {/* 2. ตัว Dialog ที่ผูกกับ State */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[700px] bg-slate-900 border-slate-800 text-slate-50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <UserPlus className="text-emerald-500" />
              ลงทะเบียนพนักงานใหม่
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 overflow-y-auto max-h-[80vh]">
            {/* 🚀 ส่งฟังก์ชันปิดไปให้ RegisterForm ด้วย เผื่อลงทะเบียนเสร็จแล้วอยากให้ปิดเอง */}
            <RegisterPage />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}