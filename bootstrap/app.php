<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Spatie\Permission\Exceptions\UnauthorizedException;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;
use Symfony\Component\HttpKernel\Exception\HttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            SecurityHeaders::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (UnauthorizedException $e, Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json(['message' => 'Acceso denegado: se requieren permisos administrativos.'], 403);
            }

            $user = $request->user();
            $target = ($user && ($user->hasRole(['Usuario', 'Ciudadano']) || $user->es_usuario_ciudadano))
                ? 'portal.index'
                : 'dashboard';

            return redirect()->route($target)->with('warning', 'No tienes permisos para acceder a esta sección.');
        });

        $exceptions->render(function (HttpException $e, Request $request) {
            if ($e->getStatusCode() === 403 && ! ($request->expectsJson() || $request->is('api/*'))) {
                $user = $request->user();
                $target = ($user && ($user->hasRole(['Usuario', 'Ciudadano']) || $user->es_usuario_ciudadano))
                    ? 'portal.index'
                    : 'dashboard';

                return redirect()->route($target)->with('warning', 'No tienes permisos para acceder a esta sección.');
            }
        });
    })->create();
