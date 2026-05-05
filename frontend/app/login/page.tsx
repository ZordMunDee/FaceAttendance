"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const response = await fetch("http://localhost:8000/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        // 🚀 ออกตั๋ว VIP ลงเครื่อง
        localStorage.setItem("isAdminLoggedIn", "true");
        toast.success("เข้าสู่ระบบ Admin สำเร็จ!");
        router.push("/admin/management"); 
      } else {
        // 🚀 แจ้งเตือนเมื่อรหัสผิด
        toast.error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง!");
      }
    } catch (e) {
      toast.error("ไม่สามารถเชื่อมต่อกับ Server ได้");
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <Card className="w-full max-w-sm bg-slate-900 border-slate-800 p-8 space-y-6">
        <div className="text-center">
          <Lock className="mx-auto text-emerald-500 mb-2" size={40} />
          <h1 className="text-2xl font-bold text-white">ADMIN LOGIN</h1>
        </div>

        <div className="space-y-4">
          <Input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-slate-950 border-slate-700 text-white"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-slate-950 border-slate-700 text-white"
          />
        </div>

        <Button
          onClick={handleLogin}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
        >
          เข้าสู่ระบบ
        </Button>

        <Button variant="ghost" asChild className="w-full text-slate-400 hover:text-white">
          <Link href="/">
            <ArrowLeft className="mr-2" size={16} /> กลับหน้าหลัก
          </Link>
        </Button>
      </Card>
    </main>
  );
}