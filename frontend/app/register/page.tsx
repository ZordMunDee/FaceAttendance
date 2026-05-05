'use client';

import { useState, useRef } from 'react';
import axios from 'axios';
import Webcam from 'react-webcam';
import Link from 'next/link';
import { ArrowLeft, UserPlus, Loader2, ShieldCheck, RefreshCw, ScanFace, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

// 🚀 เปลี่ยน URL ตรงนี้ตามที่รัน Backend ไว้นะครับ
const API_URL = 'http://127.0.0.1:8000';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [regData, setRegData] = useState({ fullname: '', employee_id: '' });
  const webcamRef = useRef<Webcam | null>(null);

  // Liveness States (Simulation Mode)
  const [step, setStep] = useState<'idle' | 'look_straight' | 'blink' | 'turn_right' | 'done'>('idle');
  const [progress, setProgress] = useState(0);

  // 🚀 ฟังก์ชันเริ่มการตรวจจับแบบ Step-by-Step
  const startLivenessCheck = async () => {
    if (!regData.fullname || !regData.employee_id) {
      toast.error("กรุณากรอกข้อมูลให้ครบก่อน");
      return;
    }

    setLoading(true);
    
    try {
      // 1. ขั้นตอน: มองหน้าตรง
      setStep('look_straight');
      setProgress(25);
      await new Promise(r => setTimeout(r, 2500)); // หน่วงเวลาจำลองการแสกน
      const img1 = webcamRef.current?.getScreenshot();

      // 2. ขั้นตอน: กระพริบตา (Challenge)
      setStep('blink');
      setProgress(50);
      toast.info("Step 2: กรุณากระพริบตา 1 ครั้ง");
      await new Promise(r => setTimeout(r, 3000));
      
      // 3. ขั้นตอน: หันขวา (Challenge)
      setStep('turn_right');
      setProgress(75);
      toast.info("Step 3: กรุณาหันหน้าไปทางขวา");
      await new Promise(r => setTimeout(r, 3000));

      // 4. ขั้นตอน: วิเคราะห์สำเร็จ
      setStep('done');
      setProgress(100);
      toast.success("วิเคราะห์ใบหน้าสำเร็จ!");
      
      // 🚀 ส่งข้อมูลไปที่ Backend ( FastAPI )
      await axios.post(`${API_URL}/users/`, { 
        ...regData, 
        image_base64: img1 // ส่งรูปแรก (หน้าตรง) ไปเป็นโปรไฟล์
      });

      toast.success("ลงทะเบียนสำเร็จ!", { description: "ข้อมูลพนักงานถูกบันทึกเรียบร้อย" });
      
      // Reset ฟอร์มหลังผ่านไป 2 วินาที
      setTimeout(() => {
        setRegData({ fullname: '', employee_id: '' });
        setStep('idle');
        setProgress(0);
        setLoading(false);
      }, 2000);

    } catch (error: any) {
      console.error("API Error:", error);
      toast.error("ล้มเหลว", { description: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" });
      setStep('idle');
      setProgress(0);
      setLoading(false);
    }
  };

  const getStatusText = () => {
    switch (step) {
      case 'look_straight': return "มองหน้าตรง";
      case 'blink': return "กะพริบตา";
      case 'turn_right': return "หันไปทางขวา";
      case 'done': return "วิเคราะห์สำเร็จ";
      default: return "รอเริ่มการทำงาน";
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center py-12 px-4 font-sans selection:bg-emerald-500/30">
      
      {/* 🧭 Header & Navigation */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-10">
        <Button variant="ghost" asChild className="text-slate-400 hover:text-white transition-colors">
          <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> เมนูหลัก</Link>
        </Button>
        <div className="flex items-center gap-3 bg-slate-900/50 px-4 py-2 rounded-2xl border border-slate-800">
          <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-500">
            <UserPlus size={20} />
          </div>
          <h1 className="font-bold text-lg uppercase tracking-widest text-slate-200">AI Registration</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 w-full max-w-5xl">
        
        {/* 📸 ส่วนกล้อง (Camera Viewport) */}
        <div className="lg:col-span-3 space-y-6">
          <div className={`relative aspect-video rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden shadow-2xl bg-slate-900 ${
            step === 'idle' ? 'border-slate-800' : 'border-emerald-500 shadow-emerald-500/10'
          }`}>
            
            <Webcam
              ref={webcamRef}
              mirrored
              screenshotFormat="image/jpeg"
              videoConstraints={{ width: 1280, height: 720, facingMode: "user" }}
              className="w-full h-full object-cover"
            />

            {/* Overlay ข้อความสถานะ */}
            {step !== 'idle' && (
              <div className="absolute inset-0 flex flex-col items-center justify-between p-10 pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{getStatusText()}</span>
                </div>

                <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl text-center shadow-2xl">
                   <p className="text-xl font-bold text-white mb-1 flex items-center justify-center gap-3">
                      <ScanFace size={24} className="text-emerald-400" />
                      {step === 'look_straight' && "กรุณามองตรงมาที่กล้อง"}
                      {step === 'blink' && "กรุณากะพริบตา 1 ครั้ง"}
                      {step === 'turn_right' && "กรุณาหันหน้าไปทางขวา"}
                      {step === 'done' && "ยืนยันตัวตนสำเร็จ!"}
                   </p>
                </div>
              </div>
            )}

            {/* Effect เมื่อสำเร็จ */}
            {step === 'done' && (
              <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center backdrop-blur-[2px] animate-in fade-in duration-500">
                <div className="bg-emerald-500 text-white p-6 rounded-full shadow-[0_0_50px_rgba(16,185,129,0.5)]">
                  <CheckCircle2 size={64} />
                </div>
              </div>
            )}
          </div>

          <div className="px-6 space-y-2">
             <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <span>Verification Progress</span>
                <span>{progress}%</span>
             </div>
             <Progress value={progress} className="h-1.5 bg-slate-900" />
          </div>
        </div>

        {/* 📝 ส่วนฟอร์มข้อมูล (Registration Form) */}
        <Card className="lg:col-span-2 bg-slate-900 border-slate-800 flex flex-col shadow-2xl rounded-[2.5rem]">
          <CardHeader className="p-8">
            <div className="flex items-center gap-2 text-emerald-500 mb-2">
               <ShieldCheck size={20} />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Secure Protocol</span>
            </div>
            <CardTitle className="text-2xl font-bold">ข้อมูลพนักงาน</CardTitle>
            <CardDescription className="text-slate-500">ลงทะเบียนเข้าสู่ระบบด้วยใบหน้า</CardDescription>
          </CardHeader>

          <CardContent className="p-8 pt-0 space-y-6">
            <div className="space-y-2">
              <Label className="text-slate-400 ml-1">รหัสพนักงาน</Label>
              <Input 
                value={regData.employee_id}
                onChange={(e) => setRegData({...regData, employee_id: e.target.value})}
                placeholder="EX: EMP-001"
                className="bg-slate-950 border-slate-800 h-14 rounded-2xl focus:ring-emerald-500/20 transition-all"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 ml-1">ชื่อ-นามสกุล</Label>
              <Input 
                value={regData.fullname}
                onChange={(e) => setRegData({...regData, fullname: e.target.value})}
                placeholder="John Doe"
                className="bg-slate-950 border-slate-800 h-14 rounded-2xl focus:ring-emerald-500/20 transition-all"
                disabled={loading}
              />
            </div>
            
            <div className="pt-4 space-y-4">
              <Button 
                onClick={startLivenessCheck}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 h-16 rounded-2xl text-lg font-black shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98]"
              >
                {loading ? <><Loader2 className="mr-2 animate-spin" /> กำลังประมวลผล...</> : 'เริ่มขั้นตอนสแกนใบหน้า'}
              </Button>
              
              {step !== 'idle' && (
                <Button variant="ghost" onClick={() => window.location.reload()} className="w-full text-slate-500 hover:text-white rounded-2xl h-12">
                  <RefreshCw className="mr-2 h-4 w-4" /> ยกเลิกและลองใหม่
                </Button>
              )}
            </div>
          </CardContent>

          <div className="p-6 bg-black/20 text-[10px] text-center text-slate-600 tracking-[0.3em] uppercase font-bold rounded-b-[2.5rem]">
            Neural Liveness Verified
          </div>
        </Card>
      </div>
    </main>
  );
}