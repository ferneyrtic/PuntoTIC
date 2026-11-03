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
    public function index(Request $request): Response
    {
        if (! $request->user()?->hasRole('Administrador')) {
            abort(403, 'Acceso denegado: Se requieren privilegios de Administrador.');
        }

        $settings = Setting::all();
        $auditLogs = AuditLog::with('usuario')->latest('created_at')->limit(50)->get();

        return Inertia::render('Settings/Index', [
            'settings' => $settings,
            'auditLogs' => $auditLogs,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        if (! $request->user()?->hasRole('Administrador')) {
            abort(403, 'Acceso denegado: Se requieren privilegios de Administrador.');
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
            'ACTUALIZACION_CONFIGURACION',
            'Configuracion',
            'sistema',
            $anteriores,
            $data['settings']
        );

        return redirect()->route('configuracion.index')
            ->with('success', 'Configuración del sistema guardada.');
    }
}
