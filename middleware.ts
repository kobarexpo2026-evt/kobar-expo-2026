/**
 * Next.js Middleware for Route Protection in Vercel Deployment
 * Protects /admin routes against unauthenticated access.
 * 
 * When deploying to Next.js on Vercel, this file runs on the Edge runtime.
 */

// Edge Request / Response types compatible with Next.js Edge Runtime
interface EdgeRequest {
  nextUrl: {
    pathname: string;
  };
  url: string;
  cookies: {
    get: (name: string) => { value: string } | undefined;
  };
}

export async function middleware(request: EdgeRequest) {
  const { pathname } = request.nextUrl;

  // Hanya intercept rute /admin
  if (pathname.startsWith('/admin')) {
    // Kecualikan rute login publik
    if (pathname === '/admin/login') {
      return;
    }

    // Periksa cookie auth token Supabase
    const token = request.cookies.get('sb-access-token')?.value || 
                  request.cookies.get('supabase-auth-token')?.value;

    if (!token) {
      // Redirect ke halaman login admin
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return Response.redirect(loginUrl.toString(), 307);
    }
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
