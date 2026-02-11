import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    console.warn("⚠️ [SECURITY WARNING] JWT_SECRET environment variable is missing. Using fallback 'dev-secret-key'. Change this in production!");
}

const secret = new TextEncoder().encode(JWT_SECRET);

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('auth-token')?.value;
    const { pathname } = request.nextUrl;

    // 1. Allow access to login and auth API
    if (pathname === '/login' || pathname.startsWith('/api/auth')) {
        return NextResponse.next();
    }

    // 2. Allow API ingestion (handled by internal API Key logic)
    if (pathname === '/api/logs' && request.method === 'POST') {
        return NextResponse.next();
    }

    // 3. Allow internal syslog-receiver access to settings and sources
    const host = request.headers.get('host') || "";
    const isInternal = host === 'localhost:3000' || host === '127.0.0.1:3000' || host === '::1:3000';
    const hasInternalKey = JWT_SECRET && request.headers.get('x-internal-key') === JWT_SECRET;

    if ((pathname === '/api/settings' || pathname === '/api/sources') &&
        request.method === 'GET' &&
        (isInternal || hasInternalKey)) {
        return NextResponse.next();
    }

    // Check if token exists and is valid
    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        await jose.jwtVerify(token, secret);
        return NextResponse.next();
    } catch (e: unknown) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('auth-token');
        return response;
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
    ],
};
