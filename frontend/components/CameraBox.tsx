// frontend/src/components/CameraBox.tsx
import Webcam from "react-webcam";
import { Card } from "@/components/ui/card";
import { Camera, Loader2 } from "lucide-react";

interface CameraBoxProps {
  webcamRef: React.RefObject<Webcam | null>;
  overlayColor?: string;
  statusText?: string; 
  progress?: number;   
}

export function CameraBox({ webcamRef, overlayColor = "border-emerald-500/50", statusText, progress = 0 }: CameraBoxProps) {
  return (
    <Card className="p-2 bg-slate-900 border-slate-800 shadow-2xl relative overflow-hidden group">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
        mirrored={true}
        className="rounded-lg w-full h-auto object-cover"
      />
      
      {/* HUD Overlay: บอกสถานะ AI */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
        <div className={`w-48 h-64 border-2 border-dashed ${overlayColor} rounded-[3rem] transition-all duration-500`}></div>
        
        {statusText && (
          <div className="mt-4 bg-black/70 backdrop-blur-md px-6 py-2 rounded-full border border-white/20 animate-in fade-in zoom-in duration-300">
            <p className="text-white font-bold text-sm tracking-widest uppercase">{statusText}</p>
          </div>
        )}
      </div>

      {/* Progress Bar ด้านล่าง */}
      <div className="absolute bottom-0 left-0 h-1.5 bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
    </Card>
  );
}