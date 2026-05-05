import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Face Auth System",
  description: "Secure face authentication by Nice",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {/* 🚀 โหลดลำดับตามนี้เพื่อให้ TensorFlow ทำงานได้เสถียรที่สุดในโหมด TFJS Runtime */}
        <Script
          src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core@4.20.0"
          strategy="beforeInteractive"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter@4.20.0"
          strategy="beforeInteractive"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl@4.20.0"
          strategy="beforeInteractive"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/@tensorflow-models/face-landmarks-detection@1.0.5"
          strategy="beforeInteractive"
        />
        
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}