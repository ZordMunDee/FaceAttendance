import { DashboardClient } from "@/components/DashboardClient";

export const metadata = {
  title: "Attendance Dashboard | Nice System",
};

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
            Attendance Dashboard
          </h1>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-[0.2em]">
            Real-time Monitoring System
          </p>
        </div>

        {/* 🚀 เรียกใช้ Client Component */}
        <DashboardClient />
      </div>
    </main>
  );
}