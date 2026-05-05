'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle2, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { userService } from "@/services/user-service";
import { useRouter } from 'next/navigation';

export default function RegisterForm() {
  const webcamRef = useRef<Webcam>(null);
  const modelRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const [regData, setRegData] = useState({ fullname: '', employee_id: '', is_admin: false });
  
  const [popup, setPopup] = useState<{show: boolean; type: 'success' | 'error'; title: string; subtitle: string;}>({ show: false, type: 'success', title: '', subtitle: '' });
  const [step, setStep] = useState<'idle' | 'look_straight' | 'blink' | 'turn_right' | 'done'>('idle');
  const [progress, setProgress] = useState(0);

  const router = useRouter();

  // Load AI Model
  useEffect(() => {
    const initAI = async () => {
      try {
        const faceDetection = (window as any).faceLandmarksDetection;
        if (!faceDetection) return;
        const detector = await faceDetection.createDetector(
          faceDetection.SupportedModels.MediaPipeFaceMesh,
          { runtime: 'tfjs', refineLandmarks: true, maxFaces: 1 }
        );
        modelRef.current = detector;
        setIsModelReady(true);
        console.log("✅ AI Model Ready!");
      } catch (e) {
        console.error("AI Init Error:", e);
      }
    };
    // หน่วงเวลาเล็กน้อยให้ Script โหลดเสร็จก่อน
    setTimeout(initAI, 1000);
  }, []);

  const analyzePose = useCallback((face: any) => {
    const keypoints = face.keypoints;
    if (!keypoints) return;

    const leftEyeHeight = Math.abs(keypoints[159].y - keypoints[145].y);
    const nose = keypoints[1];
    const leftEdge = keypoints[234];
    const rightEdge = keypoints[454];
    const nosePos = (nose.x - leftEdge.x) / (rightEdge.x - leftEdge.x);

    // ปรับปรุง State Machine ให้ทำงานแม่นยำ
    if (step === 'look_straight' && nosePos > 0.35 && nosePos < 0.65) {
      setStep('blink'); setProgress(40); toast.info("กระพริบตาเลย!");
    } else if (step === 'blink' && leftEyeHeight < 5.0) {
      setStep('turn_right'); setProgress(70); toast.info("หันหน้าไปทางขวา!");
    } else if (step === 'turn_right' && nosePos > 0.6) {
      setStep('done'); setProgress(100);
    }
  }, [step]);

  // ระบบ Loop ที่เสถียรที่สุด
  const detect = useCallback(async () => {
    if (modelRef.current && webcamRef.current?.video?.readyState === 4) {
      const faces = await modelRef.current.estimateFaces(webcamRef.current.video, { flipHorizontal: true });
      if (faces && faces[0]) {
        analyzePose(faces[0]);
      }
    }
    // สั่งรันวนไปเรื่อยๆ จนกว่า step จะเป็น done
    if (step !== 'done') {
      requestAnimationFrame(detect);
    }
  }, [analyzePose, step]);

  // ปุ่มกดเริ่ม
  const startLivenessCheck = () => {
    if (!regData.fullname || !regData.employee_id) return toast.error("กรอกข้อมูลให้ครบ");
    console.log("🚀 Detection Started");
    setStep('look_straight');
    setProgress(10);
    detect();
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-6 flex flex-col items-center">
      <Button variant="ghost" asChild className="mb-8"><Link href="/"><ArrowLeft className="mr-2" /> เมนูหลัก</Link></Button>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <div className="relative aspect-video rounded-3xl overflow-hidden border-2 border-slate-800 bg-slate-900 shadow-2xl">
          <Webcam ref={webcamRef} mirrored className="w-full h-full object-cover" />
          {step !== 'idle' && step !== 'done' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 font-bold text-lg text-center p-4">
              {step === 'look_straight' && "มองตรงมาที่กล้อง"}
              {step === 'blink' && "กะพริบตา 1 ครั้ง"}
              {step === 'turn_right' && "ค่อยๆ หันหน้าไปทางขวา"}
            </div>
          )}
          {step === 'done' && <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/50"><CheckCircle2 size={80} /></div>}
        </div>

        <Card className="bg-slate-900 p-6 space-y-4">
          <Input placeholder="รหัสพนักงาน" value={regData.employee_id} onChange={(e) => setRegData({...regData, employee_id: e.target.value})} />
          <Input placeholder="ชื่อ-นามสกุล" value={regData.fullname} onChange={(e) => setRegData({...regData, fullname: e.target.value})} />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={regData.is_admin} onChange={(e) => setRegData({...regData, is_admin: e.target.checked})} /> Admin
          </label>
          
          <Button 
            onClick={startLivenessCheck} 
            className="w-full bg-emerald-600 hover:bg-emerald-500" 
            disabled={!isModelReady || step !== 'idle'}
          >
            {!isModelReady ? <Loader2 className="animate-spin mr-2" /> : "เริ่มสแกนใบหน้า"}
          </Button>

          <Button 
            onClick={async () => {
                setLoading(true);
                try {
                    const img = webcamRef.current?.getScreenshot();
                    await userService.register({ ...regData, image_base64: img || '' });
                    setPopup({ show: true, type: 'success', title: 'สำเร็จ', subtitle: 'ลงทะเบียนแล้ว' });
                    setTimeout(() => router.push('/'), 2000);
                } catch { toast.error("ลงทะเบียนพลาด"); setLoading(false); }
            }} 
            disabled={step !== 'done' || loading} 
            className="w-full"
          >
            {loading ? <Loader2 className="animate-spin" /> : "บันทึกข้อมูล"}
          </Button>
          <Progress value={progress} />
        </Card>
      </div>
      
      {/* Popup Section */}
      {popup.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-lg p-6">
          <div className="bg-emerald-600 p-12 rounded-[2.5rem] text-center">
            <CheckCircle2 size={80} className="mx-auto mb-4" />
            <h2 className="text-3xl font-bold">{popup.title}</h2>
          </div>
        </div>
      )}
    </main>
  );
}