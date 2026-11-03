<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Clickjacking protection: only allow framing from the same origin
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        // Prevent MIME type sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Legacy XSS filter for older browsers
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        // Referrer Policy: only send origin on cross-origin requests
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Permissions Policy: disable unused hardware APIs
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), payment=(), usb=()');

        // En producción o con HTTPS forzado: aplicar HSTS y Content-Security-Policy estricto
        // En entorno local (localhost), se omite el CSP para no bloquear Vite HMR (puerto 5173) ni scripts de desarrollo
        if (app()->isProduction() || config('app.force_https', false)) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

            $csp = "default-src 'self'; " .
                   "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " .
                   "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.bunny.net; " .
                   "font-src 'self' data: https://fonts.gstatic.com https://fonts.bunny.net; " .
                   "img-src 'self' data: https: blob:; " .
                   "connect-src 'self' ws: wss:; " .
                   "object-src 'none'; " .
                   "frame-ancestors 'self'; " .
                   "base-uri 'self'; " .
                   "form-action 'self';";

            $response->headers->set('Content-Security-Policy', $csp);
        }

        return $response;
    }
}
