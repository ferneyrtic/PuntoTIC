<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Point;
use App\Models\User;
use App\Services\ProductivityService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    /**
     * Muestra el panel completo de Trazabilidad, Auditoría Técnica y Rendición de Cuentas PVD.
     */
    public function index(Request $request, ProductivityService $productivityService): Response|RedirectResponse
    {
        if (! $request->user()?->isAdmin()) {
            $user = $request->user();
            $target = ($user && ($user->hasRole(['Usuario', 'Ciudadano']) || $user->es_usuario_ciudadano))
                ? 'portal.index'
                : 'dashboard';

            return redirect()->route($target)->with('warning', 'No tienes permisos para acceder al registro de actividad.');
        }

        $filters = $request->only([
            'tab',
            'modulo',
            'accion',
            'user_id',
            'fecha_desde',
            'fecha_hasta',
            'search',
            'periodo',
            'gestor_id',
            'id_punto',
            'zona',
        ]);

        $activeTab = $filters['tab'] ?? 'rendicion';

        // 1. Datos para la pestaña de Rendición de Cuentas & Gestión Operativa del Personal
        $rendicion = $productivityService->getRendicionCuentas($filters);

        // 2. Consulta para la pestaña de Auditoría Técnica de Seguridad / Sistema
        $query = AuditLog::with(['usuario.punto', 'usuario.roles']);

        if (! empty($filters['modulo'])) {
            $query->where('modulo', $filters['modulo']);
        }

        if (! empty($filters['accion'])) {
            $query->where('accion', $filters['accion']);
        }

        if (! empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (! empty($filters['fecha_desde'])) {
            $query->where('created_at', '>=', Carbon::parse($filters['fecha_desde'])->startOfDay());
        }

        if (! empty($filters['fecha_hasta'])) {
            $query->where('created_at', '<=', Carbon::parse($filters['fecha_hasta'])->endOfDay());
        }

        if (! empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('registro_id', 'like', "%{$search}%")
                    ->orWhere('accion', 'like', "%{$search}%")
                    ->orWhere('modulo', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%")
                    ->orWhereHas('usuario', function ($sub) use ($search) {
                        $sub->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        $logs = $query->latest('created_at')->paginate(25)->withQueryString();

        // Métricas de auditoría técnica
        $totalEventos = AuditLog::count();
        $eventosHoy = AuditLog::whereDate('created_at', Carbon::today())->count();
        $usuariosActivos = AuditLog::distinct('user_id')->count('user_id');

        // Opciones para filtros técnicos
        $modulos = AuditLog::select('modulo')->distinct()->whereNotNull('modulo')->orderBy('modulo')->pluck('modulo');
        $acciones = AuditLog::select('accion')->distinct()->whereNotNull('accion')->orderBy('accion')->pluck('accion');
        $usuarios = User::select('id', 'name', 'email', 'id_punto')->orderBy('name')->get();
        $points = Point::where('activo', true)->get(['id_punto', 'nombre_punto', 'zona']);

        return Inertia::render('AuditLogs/Index', [
            'activeTab' => $activeTab,
            'rendicion' => $rendicion,
            'logs' => $logs,
            'filters' => $filters,
            'stats' => [
                'total_eventos' => $totalEventos,
                'eventos_hoy' => $eventosHoy,
                'usuarios_activos' => $usuariosActivos,
            ],
            'modulos' => $modulos,
            'acciones' => $acciones,
            'usuarios' => $usuarios,
            'points' => $points,
        ]);
    }
}
