<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Point;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    /**
     * Muestra el panel completo de Trazabilidad, Auditoría y Notificaciones del Sistema.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['modulo', 'accion', 'user_id', 'fecha_desde', 'fecha_hasta', 'search']);

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

        // Métricas de auditoría
        $totalEventos = AuditLog::count();
        $eventosHoy = AuditLog::whereDate('created_at', Carbon::today())->count();
        $usuariosActivos = AuditLog::distinct('user_id')->count('user_id');

        // Opciones para filtros
        $modulos = AuditLog::select('modulo')->distinct()->whereNotNull('modulo')->orderBy('modulo')->pluck('modulo');
        $acciones = AuditLog::select('accion')->distinct()->whereNotNull('accion')->orderBy('accion')->pluck('accion');
        $usuarios = User::select('id', 'name', 'email', 'id_punto')->orderBy('name')->get();
        $points = Point::where('activo', true)->get(['id_punto', 'nombre_punto']);

        return Inertia::render('AuditLogs/Index', [
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
