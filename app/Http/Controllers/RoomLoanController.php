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

        $filters = $request->only(['fecha_desde', 'fecha_hasta', 'id_punto', 'id_gestor', 'estado', 'tipo_actividad', 'search']);

        if (! $isGlobal && $user && $user->id_punto) {
            $filters['id_punto'] = (int) $user->id_punto;
        }

        $loans = RoomLoan::with(['ciudadano', 'punto', 'gestor', 'participantes.ciudadano'])
            ->dateBetween($filters['fecha_desde'] ?? null, $filters['fecha_hasta'] ?? null)
            ->when($filters['id_punto'] ?? null, fn ($q, $p) => $q->where(function($sub) use ($p) {
                $sub->where('id_punto', $p)->orWhere('id_puntos', $p);
            }))
            ->when($filters['id_gestor'] ?? null, fn ($q, $g) => $q->where(function($sub) use ($g) {
                $sub->where('id_gestor', $g)->orWhere('id_gestores', $g);
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
                        })
                        ->orWhereHas('gestor', function ($g) use ($search) {
                            $g->where('name', 'like', "%{$search}%")
                                ->orWhere('names', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            })
            ->orderByRaw('COALESCE(fecha_prestamo, DATE(created_at)) DESC')
            ->orderByDesc(in_array('id', RoomLoan::getTableColumns(), true) ? 'id' : 'id_prestamo')
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

        $gestores = \App\Models\User::where('activo', true)
            ->whereHas('roles', fn($r) => $r->whereIn('name', [
                'Gestor', 'Gestor PVD', 'Gestor Aula Digital', 'Gestor Global',
                'Coordinador', 'Coordinador General', 'Coordinador PVD', 'Coordinador Aula Digital', 'Administrador'
            ]))
            ->orderBy('name')
            ->get(['id', 'name', 'names', 'id_punto']);

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

        $calendarLoans = RoomLoan::with(['ciudadano', 'punto', 'gestor', 'participantes.ciudadano'])
            ->dateBetween($monthStart, $monthEnd)
            ->when($filters['id_punto'] ?? null, fn ($q, $p) => $q->where(function($sub) use ($p) {
                $sub->where('id_punto', $p)->orWhere('id_puntos', $p);
            }))
            ->when($filters['id_gestor'] ?? null, fn ($q, $g) => $q->where(function($sub) use ($g) {
                $sub->where('id_gestor', $g)->orWhere('id_gestores', $g);
            }))
            ->when($filters['tipo_actividad'] ?? null, fn ($q, $t) => $q->where('tipo_actividad', $t))
            ->orderByRaw('COALESCE(NULLIF(fecha_prestamo, "0000-00-00"), DATE(created_at)) ASC')
            ->get();

        return Inertia::render('RoomLoans/Index', [
            'loans' => $loans,
            'calendarLoans' => $calendarLoans,
            'selectedMonth' => $selectedMonth,
            'filters' => $filters,
            'points' => $points,
            'tiposActividad' => $tiposActividad,
            'gestores' => $gestores,
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
            'sala_espacio' => ['nullable', 'string', 'max:120'],
            'num_asistentes' => ['required', 'integer', 'min:1', 'max:500'],
            'fecha_prestamo' => ['required', 'date'],
            'hora_inicio' => ['nullable', 'string'],
            'hora_fin' => ['nullable', 'string'],
            'observaciones' => ['nullable', 'string'],
            'estado' => ['required', 'in:Pendiente,Reservado,En curso,Completado,Cancelado'],
            'participantes' => ['nullable', 'array'],
        ]);

        if (! $isGlobal && $user && $user->id_punto) {
            $validated['id_punto'] = (int) $user->id_punto;
        }

        $validated['id_gestor'] = Auth::id();

        $loan = RoomLoan::create($validated);

        if ($request->has('participantes') && is_array($request->participantes)) {
            $prestamoId = $loan->id_prestamo ?? $loan->getKey();
            foreach ($request->participantes as $part) {
                $idFormPvd = $part['id_form_pvd'] ?? null;

                // Auto-registro: crear ciudadano si trae nombres + apellidos + auto_registrar
                if (! $idFormPvd && ! empty($part['auto_registrar']) && ! empty($part['nombres'])) {
                    $documento = trim($part['documento'] ?? '');
                    $existing  = $documento ? \App\Models\Citizen::where('documento', $documento)->first() : null;
                    if (! $existing) {
                        $tipoId = (int) ($part['id_tipo'] ?? 1);
                        // tipo_id en BD es NOT NULL sin default → siempre incluirlo
                        // genero puede ser cadena vacía desde multipart; normalizar a valor válido
                        $genero = trim($part['genero'] ?? '');
                        $genero = in_array($genero, ['Masculino', 'Femenino', 'Otro', 'No binario', 'Prefiero no decir'], true)
                            ? $genero : 'Otro';
                        try {
                            $existing = \App\Models\Citizen::create([
                                'id_tipo'       => $tipoId,
                                'tipo_id'       => $tipoId,
                                'nombres'       => strtoupper(trim($part['nombres'])),
                                'apellidos'     => strtoupper(trim($part['apellidos'] ?? '')),
                                'documento'     => $documento ?: null,
                                'correo'        => $part['correo'] ? trim($part['correo']) : null,
                                'telefono'      => $part['telefono'] ? trim($part['telefono']) : null,
                                'genero'        => $genero,
                                'barrio'        => $part['barrio'] ? trim($part['barrio']) : null,
                                'g_poblacional' => trim($part['g_poblacional'] ?? '') ?: 'Ninguno',
                                'activo'        => true,
                                'id_punto'      => $loan->id_punto ?? null,
                                'id_gestor'     => Auth::id(),
                            ]);
                        } catch (\Throwable $e) {
                            \Illuminate\Support\Facades\Log::warning('AutoRegistro participante fallo: ' . $e->getMessage(), [
                                'documento' => $documento, 'nombres' => $part['nombres'] ?? '',
                            ]);
                            // Si falla la creación del ciudadano, guardar como libre para no perder el registro
                            $loan->participantes()->create([
                                'id_prestamo'     => $prestamoId,
                                'id_form_pvd'     => null,
                                'nombre_libre'    => strtoupper(trim(($part['nombres'] ?? '') . ' ' . ($part['apellidos'] ?? ''))),
                                'documento_libre' => $documento ?: null,
                            ]);
                            continue;
                        }
                    }
                    $idFormPvd = $existing->id_form_pvd ?? $existing->getKey();
                }

                if ($idFormPvd || ! empty($part['nombre_libre'])) {
                    $loan->participantes()->create([
                        'id_prestamo'     => $prestamoId,
                        'id_form_pvd'     => $idFormPvd,
                        'nombre_libre'    => $idFormPvd ? null : ($part['nombre_libre'] ?? null),
                        'documento_libre' => $idFormPvd ? null : ($part['documento_libre'] ?? null),
                    ]);
                }
            }
        }

        try {
            AuditLog::registrar(
                accion: 'PRESTAMO_SALA',
                modulo: 'prestamos',
                registroId: (string) ($loan->id_prestamo ?? $loan->id),
                antiguos: null,
                nuevos: [
                    'tipo_actividad' => $loan->tipo_actividad,
                    'asistentes' => $loan->num_asistentes,
                    'fecha_prestamo' => $loan->fecha_prestamo,
                    'id_punto' => $loan->id_punto,
                    'estado' => $loan->estado,
                ]
            );
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('AuditLog PRESTAMO_SALA failed: ' . $e->getMessage());
        }

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
            'sala_espacio' => ['nullable', 'string', 'max:120'],
            'observaciones' => ['nullable', 'string'],
            'respuesta_gestor' => ['nullable', 'string', 'max:1000'],
            'nombre_responsable_texto' => ['nullable', 'string', 'max:150'],
            'num_asistentes' => ['nullable', 'integer', 'min:1', 'max:500'],
            'fecha_prestamo' => ['nullable', 'date'],
            'hora_inicio' => ['nullable', 'string'],
            'hora_fin' => ['nullable', 'string'],
        ]);

        $oldData = [
            'estado' => $loan->estado,
            'tipo_actividad' => $loan->tipo_actividad,
            'observaciones' => $loan->observaciones,
            'respuesta_gestor' => $loan->respuesta_gestor,
            'nombre_responsable_texto' => $loan->nombre_responsable_texto,
            'num_asistentes' => $loan->num_asistentes,
            'fecha_prestamo' => $loan->fecha_prestamo,
        ];

        if (Auth::check()) {
            $loan->id_gestor = Auth::id();
        }

        $loan->update($validated);

        try {
            AuditLog::registrar(
                accion: 'ACTUALIZAR_PRESTAMO',
                modulo: 'prestamos',
                registroId: (string) ($loan->id_prestamo ?? $loan->id),
                antiguos: $oldData,
                nuevos: $validated
            );
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('AuditLog ACTUALIZAR_PRESTAMO failed: ' . $e->getMessage());
        }

        StatsService::invalidateCache();

        $msg = $validated['estado'] === 'Cancelado'
            ? 'Solicitud rechazada y motivo notificado al ciudadano.'
            : 'Estado del préstamo actualizado exitosamente.';

        return redirect()->back()->with('success', $msg);
    }
}
