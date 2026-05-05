import Link from 'next/link';
import { ScanFace, UserPlus, LayoutDashboard } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const menus = [
    { href: "/scan", title: "สแกนเวลาทำงาน", icon: ScanFace, color: "text-blue-500", hover: "hover:bg-blue-500/10" },
    { href: "/login", title: "เข้าสู่ระบบ (Admin)", icon: UserPlus, color: "text-emerald-500", hover: "hover:bg-emerald-500/10" },
    { href: "/dashboard", title: "ประวัติการทำงาน", icon: LayoutDashboard, color: "text-purple-500", hover: "hover:bg-purple-500/10" },
  ];

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-black text-white mb-12 tracking-tighter italic">FACE.AUTH <span className="text-blue-500">SYSTEM</span></h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {menus.map((menu) => (
          <Link key={menu.href} href={menu.href}>
            <Card className={`bg-slate-900 border-slate-800 transition-all duration-300 ${menu.hover} group cursor-pointer overflow-hidden`}>
              <CardContent className="p-8 flex flex-col items-center text-center">
                <menu.icon size={56} className={`${menu.color} mb-4 group-hover:scale-110 transition-transform`} />
                <h2 className="text-xl font-bold text-white">{menu.title}</h2>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}