<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function index(Request $request): Response|RedirectResponse
    {
        if (! $request->user()?->isAdmin() && ! $request->user()?->hasRole('Administrador')) {
            $user = $request->user();
            $target = ($user && ($user->hasRole(['Usuario', 'Ciudadano']) || $user->es_usuario_ciudadano))
                ? 'portal.index'
                : 'dashboard';

            return redirect()->route($target)->with('warning', 'No tienes permisos para acceder a la configuración del sistema.');
        }

        $settings = Setting::all();

        return Inertia::render('Settings/Index', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        if (! $request->user()?->isAdmin() && ! $request->user()?->hasRole('Administrador')) {
            $user = $request->user();
            $target = ($user && ($user->hasRole(['Usuario', 'Ciudadano']) || $user->es_usuario_ciudadano))
                ? 'portal.index'
                : 'dashboard';

            return redirect()->route($target)->with('warning', 'No tienes permisos para modificar la configuración.');
        }

        $data = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*' => ['nullable', 'string', 'max:500'],
        ]);

        $anteriores = Setting::all()->pluck('valor', 'clave')->toArray();

        foreach ($data['settings'] as $key => $val) {
            Setting::set(strip_tags((string) $key), strip_tags((string) $val));
        }

        // Registrar auditoría de seguridad
        AuditLog::registrar(
            accion: 'ACTUALIZAR_CONFIGURACION',
            modulo: 'configuracion',
            registroId: 'parametros_globales',
            antiguos: $anteriores,
            nuevos: $data['settings']
        );

        return redirect()->route('configuracion.index')
            ->with('success', 'Configuración del sistema guardada.');
    }
}
