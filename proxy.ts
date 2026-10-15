import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getSessionSecret } from '@/lib/session-secret';

const secretKey = getSessionSecret();

const protectedRoutes = ['/dashboard', '/admin', '/deposit', '/transfer', '/withdraw', '/profile', '/run-backfill'];

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;
    
    // Revisar si la ruta actual es una de las rutas protegidas
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    if (isProtectedRoute) {
        const session = req.cookies.get('session')?.value;

        // 1. Si no hay token de sesión en absoluto, al login
        if (!session) {
            return NextResponse.redirect(new URL('/login', req.url));
        }

        try {
            // 2. Verificar criptográficamente que el JWT es válido y no expirado/falsificado
            const { payload } = await jwtVerify(session, secretKey);
            
            // 3. (Extra) Proteger módulo administrador
            if (pathname.startsWith('/admin') && payload.role !== 'ADMIN') {
                 // Si entra a admin pero no tiene rol ADMIN, regresarlo al dashboard
                 return NextResponse.redirect(new URL('/dashboard', req.url));
            }
            
            // Si todo está correcto, permitirle acceder a la página que solicitó
            return NextResponse.next();
        } catch (error) {
            // El JWT caducó o fue alterado: borrar sesión mandándolo al login
            return NextResponse.redirect(new URL('/login', req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
  // Aplicar el middleware solo cuando el cliente navega explícitamente a estas rutas privadas
  matcher: ['/dashboard/:path*', '/admin/:path*', '/deposit/:path*', '/transfer/:path*', '/withdraw/:path*', '/profile/:path*', '/run-backfill/:path*'],
};
