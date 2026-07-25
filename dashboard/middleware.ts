import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/ar', request.url));
  }

  const locale = request.nextUrl.pathname.split('/')[1];
  if (locale !== 'ar' && locale !== 'en') {
    return NextResponse.redirect(new URL('/ar', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
