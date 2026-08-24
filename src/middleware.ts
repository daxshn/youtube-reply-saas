import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /dashboard and sub-routes
  if (pathname.startsWith('/dashboard')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || 'super-secret-nextauth-key-change-in-prod' });
    const adminEmail = process.env.ADMIN_EMAIL;

    // If no token or email doesn't match admin email
    if (!token || !token.email) {
      const url = req.nextUrl.clone();
      url.pathname = '/auth/signin';
      return NextResponse.redirect(url);
    }

    if (adminEmail && token.email.toLowerCase() !== adminEmail.toLowerCase()) {
      console.warn(`[Middleware Block] Non-admin email ${token.email} blocked from accessing ${pathname}`);
      const url = req.nextUrl.clone();
      url.pathname = '/auth/signin';
      url.searchParams.set('error', 'AccessDenied');
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
