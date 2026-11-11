<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Point;
use App\Models\RoomLoan;
use App\Services\StatsService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class RoomLoanController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isGlobal = $user ? $user->tieneAlcanceGlobal() : false;

        $filters = $request->only(['fecha_desde', 'fecha_hasta', 'id_punto', 'estado', 'tipo_actividad', 'search']);

        if (! $isGlobal && $user && $user->id_punto) {
            $filters['id_punto'] = (int) $user->id_punto;
        }

        $loans = RoomLoan::with(['ciudadano', 'punto', 'gestor'])
            ->dateBetween($filters['fecha_desde'] ?? null, $filters['fecha_hasta'] ?? null)
            ->when($filters['id_punto'] ?? null, fn ($q, $p) => $q->where(function($sub) use ($p) {
                $sub->where('id_punto', $p)->orWhere('id_puntos', $p);
            }))
            ->when($filters['estado'] ?? null, fn ($q, $e) => $q->where('estado', $e))
            ->when($filters['tipo_actividad'] ?? null, fn ($q, $t) => $q->where('tipo_actividad', $t))
            ->when($filters['search'] ?? null, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('nombre_responsable_texto', 'like', "%{$search}%")
                        ->orWhere('observaciones', 'like', "%{$search}%")
                        ->orWhereHas('ciudadano', function ($c) use ($search) {
                            $c->where('nombres', 'like', "%{$search}%")
                                ->orWhere('apellidos', 'like', "%{$search}%")
                                ->orWhere('documento', 'like', "%{$search}%");
                        });
                });
            })
            ->orderByRaw('COALESCE(fecha_prestamo, DATE(created_at)) DESC')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        $pointsQuery = Point::where('activo', true);
        if (! $isGlobal && $user && $user->id_punto) {
            $pointsQuery->where('id_punto', $user->id_punto);
        }
        $points = $pointsQuery->get(['id_punto', 'nombre_punto']);
        $tiposActividad = RoomLoan::select('tipo_actividad')
            ->distinct()
            ->orderBy('tipo_actividad')
            ->pluck('tipo_actividad');

        // Eventos completos para la vista de calendario
        $selectedMonth = $request->get('mes', now()->format('Y-m'));
        try {
            $monthCarbon = Carbon::createFromFormat('Y-m', $selectedMonth);
        } catch (\Exception $e) {
            $monthCarbon = now();
            $selectedMonth = now()->format('Y-m');
        }

        $monthStart = $monthCarbon->copy()->startOfMonth()->subDays(7)->toDateString();
        $monthEnd = $monthCarbon->copy()->endOfMonth()->addDays(7)->toDateString();

        $calendarLoans = RoomLoan::with(['ciudadano', 'punto'])
            ->whereBetween('fecha_prestamo', [$monthStart, $monthEnd])
            ->when($filters['id_punto'] ?? null, fn ($q, $p) => $q->where(function($sub) use ($p) {
                $sub->where('id_punto', $p)->orWhere('id_puntos', $p);
            }))
            ->when($filters['tipo_actividad'] ?? null, fn ($q, $t) => $q->where('tipo_actividad', $t))
            ->orderBy('fecha_prestamo')
            ->get();

        return Inertia::render('RoomLoans/Index', [
            'loans' => $loans,
            'calendarLoans' => $calendarLoans,
            'selectedMonth' => $selectedMonth,
            'filters' => $filters,
            'points' => $points,
            'tiposActividad' => $tiposActividad,
            'pendingCount' => RoomLoan::where('estado', 'Pendiente')
                ->when(! $isGlobal && $user?->id_punto, fn ($q) => $q->where('id_punto', $user->id_punto))
                ->count(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = Auth::user();
        $isGlobal = $user ? $user->tieneAlcanceGlobal() : false;

        $validated = $request->validate([
            'id_form_pvd' => ['nullable', 'exists:form_pvd,id_form_pvd'],
            'nombre_responsable_texto' => ['nullable', 'string', 'max:150'],
            'id_punto' => ['required', 'exists:puntos_vd,id_punto'],
            'tipo_actividad' => ['required', 'string', 'max:150'],
            'num_asistentes' => ['required', 'integer', 'min:1', 'max:500'],
            'fecha_prestamo' => ['required', 'date'],
            'hora_inicio' => ['nullable', 'string'],
            'hora_fin' => ['nullable', 'string'],
            'observaciones' => ['nullable', 'string'],
            'estado' => ['required', 'in:Pendiente,Reservado,En curso,Completado,Cancelado'],
        ]);

        if (! $isGlobal && $user && $user->id_punto) {
            $validated['id_punto'] = (int) $user->id_punto;
        }

        $validated['id_gestor'] = Auth::id();

        $loan = RoomLoan::create($validated);

        AuditLog::registrar(
            accion: 'PRESTAMO_SALA',
            modulo: 'prestamos',
            registroId: (string) $loan->id_prestamo,
            antiguos: null,
            nuevos: [
                'tipo_actividad' => $loan->tipo_actividad,
                'asistentes' => $loan->num_asistentes,
                'fecha_prestamo' => $loan->fecha_prestamo,
                'id_punto' => $loan->id_punto,
                'estado' => $loan->estado,
            ]
        );

        StatsService::invalidateCache();

        return redirect()->route('prestamos.index')
            ->with('success', 'Préstamo de sala registrado con éxito.');
    }

    public function update(Request $request, RoomLoan $prestamo): RedirectResponse
    {
        $loan = $prestamo;

        $validated = $request->validate([
            'estado' => ['required', 'in:Pendiente,Reservado,En curso,Completado,Cancelado'],
            'tipo_actividad' => ['nullable', 'string', 'max:150'],
            'observaciones' => ['nullable', 'string'],
            'respuesta_gestor' => ['nullable', 'string', 'max:1000'],
        ]);

        $oldData = [
            'estado' => $loan->estado,
            'tipo_actividad' => $loan->tipo_actividad,
            'observaciones' => $loan->observaciones,
            'respuesta_gestor' => $loan->respuesta_gestor,
        ];

        if (Auth::check()) {
            $loan->id_gestor = Auth::id();
        }

        $loan->update($validated);

        AuditLog::registrar(
            accion: 'ACTUALIZAR_PRESTAMO',
            modulo: 'prestamos',
            registroId: (string) $loan->id_prestamo,
            antiguos: $oldData,
            nuevos: $validated
        );

        StatsService::invalidateCache();

        $msg = $validated['estado'] === 'Cancelado'
            ? 'Solicitud rechazada y motivo notificado al ciudadano.'
            : 'Estado del préstamo actualizado exitosamente.';

        return redirect()->back()->with('success', $msg);
    }
}
