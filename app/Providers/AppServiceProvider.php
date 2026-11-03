<?php

namespace App\Providers;

use App\Models\AuditLog;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // 1. Forzar HTTPS si está configurado en .env o si se encuentra en entorno de producción
        if (config('app.force_https', false) || app()->isProduction()) {
            URL::forceScheme('https');
        }

        // 2. Apagar forzosamente el modo DEBUG en producción (defensa en profundidad)
        if (app()->isProduction() && config('app.debug')) {
            config(['app.debug' => false]);
        }

        // 2. Política de contraseñas robustas (mínimo 8 caracteres, mayúsculas, minúsculas, números y símbolos en prod)
        Password::defaults(function () {
            $rule = Password::min(8);

            return app()->isProduction()
                ? $rule->letters()->mixedCase()->numbers()->symbols()->uncompromised()
                : $rule;
        });

        // 3. Vigilancia y registro de eventos de seguridad (Intentos fallidos, bloqueos y accesos exitosos)
        Event::listen(Failed::class, function (Failed $event) {
            try {
                AuditLog::create([
                    'user_id' => $event->user?->id,
                    'accion' => 'LOGIN_FALLIDO',
                    'modulo' => 'Seguridad',
                    'registro_id' => $event->user?->id ? (string) $event->user->id : null,
                    'datos_anteriores' => [
                        'email_intentado' => $event->credentials['email'] ?? 'desconocido',
                        'motivo' => 'Credenciales invalidas o usuario inexistente',
                    ],
                    'ip_address' => request()->ip(),
                    'user_agent' => substr(request()->userAgent() ?? '', 0, 255),
                    'created_at' => now(),
                ]);
            } catch (\Throwable) {
                // Silenciar para no interrumpir el flujo si la tabla de auditoría no está lista
            }
        });

        Event::listen(Lockout::class, function (Lockout $event) {
            try {
                AuditLog::create([
                    'user_id' => null,
                    'accion' => 'BLOQUEO_RATE_LIMIT',
                    'modulo' => 'Seguridad',
                    'datos_anteriores' => [
                        'ip' => request()->ip(),
                        'email_intentado' => request()->input('email', 'desconocido'),
                        'motivo' => 'Multiples intentos fallidos consecutivos (posible fuerza bruta)',
                    ],
                    'ip_address' => request()->ip(),
                    'user_agent' => substr(request()->userAgent() ?? '', 0, 255),
                    'created_at' => now(),
                ]);
            } catch (\Throwable) {
            }
        });

        Event::listen(Login::class, function (Login $event) {
            try {
                AuditLog::create([
                    'user_id' => $event->user->id,
                    'accion' => 'LOGIN_EXITOSO',
                    'modulo' => 'Autenticacion',
                    'registro_id' => (string) $event->user->id,
                    'datos_nuevos' => [
                        'usuario' => $event->user->name,
                        'email' => $event->user->email,
                        'rol' => $event->user->roles->first()?->name ?? $event->user->cargo,
                    ],
                    'ip_address' => request()->ip(),
                    'user_agent' => substr(request()->userAgent() ?? '', 0, 255),
                    'created_at' => now(),
                ]);
            } catch (\Throwable) {
            }
        });
    }
}
