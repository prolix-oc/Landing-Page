import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // TEMPORARILY DISABLED - Auth setup needed
  // TODO: Set up GitHub OAuth credentials to enable authentication

  // Check if user is authenticated for admin routes
  // if (request.nextUrl.pathname.startsWith('/admin')) {
  //   const token = await getToken({
  //     req: request,
  //     secret: process.env.NEXTAUTH_SECRET
  //   });

  //   // If not authenticated, redirect to sign in
  //   if (!token) {
  //     const signInUrl = new URL('/auth/signin', request.url);
  //     signInUrl.searchParams.set('callbackUrl', request.url);
  //     return NextResponse.redirect(signInUrl);
  //   }

  //   // Check if user is allowed (only Coneja-Chibi)
  //   const allowedUsers = ['Coneja-Chibi'];
  //   if (!allowedUsers.includes(token.name as string)) {
  //     return NextResponse.redirect(new URL('/', request.url));
  //   }
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

