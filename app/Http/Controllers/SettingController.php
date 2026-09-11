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
    public function index(): Response
    {
        $settings = Setting::all();
        $auditLogs = AuditLog::with('usuario')->latest('created_at')->limit(30)->get();

        return Inertia::render('Settings/Index', [
            'settings' => $settings,
            'auditLogs' => $auditLogs,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'settings' => ['required', 'array'],
        ]);

        foreach ($data['settings'] as $key => $val) {
            Setting::set($key, $val);
        }

        return redirect()->route('configuracion.index')
            ->with('success', 'Configuración del sistema guardada.');
    }
}
