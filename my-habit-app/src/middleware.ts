// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  // 1) 요청 헤더에서 Authorization 파싱
  const auth = req.headers.get('authorization') || '';
  const [scheme, encoded] = auth.split(' ');

  // 2) Basic Auth 스킴 및 값 체크
  if (scheme !== 'Basic' || !encoded) {
    return new Response('Authentication required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Protected Area"' },
    });
  }

  // 3) 디코딩: "id:pw"
  const decoded = Buffer.from(encoded, 'base64').toString();
  const [id, pw] = decoded.split(':');

  // 4) env 변수와 비교
  if (
    id !== process.env.BASIC_AUTH_ID ||
    pw !== process.env.BASIC_AUTH_PW
  ) {
    return new Response('Access denied', { status: 403 });
  }

  // 5) 통과
  return NextResponse.next();
}

// 미들웨어가 적용될 경로 지정 (Next.js 13+)
export const config = {
  matcher: [
    /*
      보호할 경로를 지정하세요.
      예: 전체 앱을 보호하려면 ['/((?!_next/static|_next/image|favicon.ico).*)']
      특정 API만 보호하려면 ['/api/:path*']
    */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
