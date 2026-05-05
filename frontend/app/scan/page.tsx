import { ScanFace, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScanInterface } from "@/components/ScanInterface";

export default function ScanPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-2xl flex justify-between items-center mb-8">
        <Button variant="ghost" asChild className="text-slate-400">
          <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> เมนูหลัก</Link>
        </Button>
        <div className="flex items-center gap-2 text-blue-400">
          <ScanFace size={24} />
          <span className="font-bold uppercase tracking-widest text-lg">Live Scan</span>
        </div>
      </div>

      
      <ScanInterface />
    </main>
  );
}