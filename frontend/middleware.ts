// ❌ ผิด: import { NextResponse } from 'next/link'
// ✅ ถูกต้อง:
import { NextResponse } from 'next/server' 
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // ดึง Role จาก Cookie (สมมติว่าเราเก็บไว้ตอนที่แสกนหน้า Admin สำเร็จ)
  const userRole = request.cookies.get('user_role')?.value;

  // ถ้าพยายามเข้าหน้า admin แต่ไม่ใช่ admin ให้ดีดกลับไปหน้าแรก
  if (request.nextUrl.pathname.startsWith('/admin') && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*', // ป้องกันทุกหน้าภายใต้ /admin
}
