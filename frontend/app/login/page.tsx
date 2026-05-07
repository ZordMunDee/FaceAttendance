"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const handleLogin = async () => {
    try {
      const response = await fetch("http://localhost:8000/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();

        localStorage.setItem("token", data.access_token);

        toast.success("Login success");
        router.push("/admin/management");
      } else {
        toast.error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง!");
      }
    } catch (err) {
      toast.error("ไม่สามารถเชื่อมต่อ Server ได้");
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center p-6 relative"
      style={{
        backgroundImage: "url('/background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* overlay */}
      <div className="absolute inset-0 bg-blue-200/30 backdrop-blur-sm" />

      {/* box */}
      <div className="relative w-full max-w-md text-center space-y-6">
        <h1 className="text-4xl font-semibold text-slate-800">Sign in</h1>

        {/* FORM */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="space-y-4"
        >
          {/* username */}
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-6 py-4 rounded-xl bg-white/80 shadow-md backdrop-blur-md border border-white/40 focus:outline-none focus:ring-2 focus:ring-blue-300 text-black"
          />

          {/* password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 pr-12 rounded-xl bg-white/80 shadow-md backdrop-blur-md border border-white/40 focus:outline-none focus:ring-2 focus:ring-blue-300 text-black"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* remember */}
          <div className="flex items-center gap-2 text-sm text-slate-700 justify-start px-2">
            <input type="checkbox" className="accent-blue-500" />
            <span className="text-white">Remember me</span>
          </div>

          {/* button */}
          <button
            type="submit"
            className="w-full py-4 rounded-xl text-white text-lg font-medium shadow-md 
            bg-gradient-to-r from-[#0a1d37] via-blue-900 to-blue-400 
            hover:from-[#08162a] hover:via-blue-600 hover:to-blue-300 
            active:scale-[0.98] transition-all duration-200"
          >
            Login
          </button>
        </form>
      </div>
    </main>
  );
}
