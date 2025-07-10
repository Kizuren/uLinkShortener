import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const response = NextResponse.next();
  
  try {
    if (path === '/dashboard' || 
        path === '/admin' || 
        path.startsWith('/api/link/') || 
        path.startsWith('/dashboard/') || 
        path.startsWith('/admin/')) {
      
      const token = await getToken({ 
        req: request,
        secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-testing'
      });
      
      // Not authenticated
      if (!token) {
        return NextResponse.redirect(new URL('/', request.url));
      }
      
      // Check token expiration
      const now = Math.floor(Date.now() / 1000);
      if (token.exp && (token.exp as number) < now) {
        return NextResponse.redirect(new URL('/api/auth/signout?callbackUrl=/', request.url));
      }
      
      // Check admin access
      if ((path === '/admin' || path.startsWith('/admin/')) && !token.isAdmin) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    
    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    // On error, still allow the request to proceed
    return response;
  }
}

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*', 
    '/admin',
    '/admin/:path*',
    '/api/link/:path*',
    '/api/auth/sessions/:path*'
  ]
};