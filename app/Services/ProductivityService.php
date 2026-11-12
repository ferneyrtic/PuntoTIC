<?php

namespace App\Services;

use App\Models\Citizen;
use App\Models\Point;
use App\Models\PrintRecord;
use App\Models\RoomLoan;
use App\Models\User;
use App\Models\Visit;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ProductivityService
{
    /**
     * Calcula los KPIs, métricas operativas y bitácora de productividad para el Administrador.
     */
    public function getRendicionCuentas(array $filters): array
    {
        // 1. Resolver el rango de fechas
        [$desde, $hasta, $periodoKey, $periodoLabel] = $this->resolverRangoFechas($filters);

        $gestorId = ! empty($filters['gestor_id']) ? (int) $filters['gestor_id'] : null;
        $idPunto = ! empty($filters['id_punto']) ? (int) $filters['id_punto'] : null;
        $zona = ! empty($filters['zona']) && in_array(strtoupper($filters['zona']), ['URBANA', 'RURAL'])
            ? strtoupper($filters['zona'])
            : null;

        // 2. Información del gestor seleccionado (si aplica)
        $gestorSeleccionado = null;
        if ($gestorId) {
            $user = User::with('punto')->find($gestorId);
            if ($user) {
                $gestorSeleccionado = [
                    'id' => $user->id,
                    'name' => $user->name,
                    'documento' => $user->documento ?? 'No registrado',
                    'email' => $user->email,
                    'cargo' => $user->cargo ?? $user->rol_principal ?? 'Gestor Punto Vive Digital',
                    'nombre_punto' => $user->punto?->nombre_punto ?? 'Sede no asignada',
                    'zona' => $user->punto?->zona ?? 'Urbana',
                ];
            }
        }

        // 3. Consultas base con filtros de ámbito
        // A. Visitas / Atenciones
        $visitasQuery = Visit::whereBetween('created_at', [$desde, $hasta]);
        $this->aplicarFiltrosAmbito($visitasQuery, $gestorId, $idPunto, $zona);

        $totalVisitas = (clone $visitasQuery)->count();

        // B. Nuevos Ciudadanos Enrolados
        $ciudadanosQuery = Citizen::whereBetween('created_at', [$desde, $hasta]);
        if ($gestorId) {
            $ciudadanosQuery->where('id_gestor', $gestorId);
        }
        if ($idPunto) {
            $ciudadanosQuery->where('id_punto', $idPunto);
        }
        if ($zona) {
            $ciudadanosQuery->where('zona', $zona);
        }
        $totalNuevosCiudadanos = (clone $ciudadanosQuery)->count();

        // C. Préstamos de Sala
        $prestamosQuery = RoomLoan::whereBetween('created_at', [$desde, $hasta]);
        if ($gestorId) {
            $prestamosQuery->where('id_gestor', $gestorId);
        }
        if ($idPunto) {
            $prestamosQuery->where('id_punto', $idPunto);
        }
        $totalPrestamos = (clone $prestamosQuery)->count();
        $totalAforoPrestamos = (clone $prestamosQuery)->sum('num_asistentes') ?? 0;

        // D. Impresiones
        $impresionesQuery = PrintRecord::whereBetween('created_at', [$desde, $hasta]);
        if ($gestorId) {
            $impresionesQuery->where('id_gestor', $gestorId);
        }
        if ($idPunto) {
            $impresionesQuery->where('id_punto', $idPunto);
        }
        $totalImpresiones = (clone $impresionesQuery)->count();
        $totalHojasImpresas = (clone $impresionesQuery)->sum('numero_hojas') ?? 0;

        // 4. Días Activos en el Período y Promedio Diario
        $driver = DB::getDriverName();
        $dateExpr = $driver === 'sqlite' ? "strftime('%Y-%m-%d', created_at)" : 'DATE(created_at)';

        $diasActivos = (clone $visitasQuery)
            ->select(DB::raw("{$dateExpr} as fecha_dia"))
            ->distinct()
            ->pluck('fecha_dia')
            ->count();

        $diasActivos = max(1, $diasActivos);
        $promedioDiario = round($totalVisitas / $diasActivos, 1);

        // 5. Desglose de Servicios Atendidos
        $serviciosRaw = (clone $visitasQuery)
            ->select('servicio', DB::raw('count(*) as total'))
            ->groupBy('servicio')
            ->orderByDesc('total')
            ->limit(6)
            ->get();

        $desgloseServicios = [];
        $colores = ['#059669', '#2563eb', '#7c3aed', '#d97706', '#0284c7', '#dc2626'];
        $idx = 0;
        foreach ($serviciosRaw as $s) {
            $nombre = ! empty($s->servicio) ? trim($s->servicio) : 'Atención General';
            $porcentaje = $totalVisitas > 0 ? round(($s->total / $totalVisitas) * 100, 1) : 0;
            $desgloseServicios[] = [
                'nombre' => $nombre,
                'total' => $s->total,
                'porcentaje' => $porcentaje,
                'color' => $colores[$idx % count($colores)],
            ];
            $idx++;
        }

        // 6. Curva de Actividad Temporal Diaria (últimos días o serie del período)
        $serieDiariaRaw = (clone $visitasQuery)
            ->select(DB::raw("{$dateExpr} as fecha"), DB::raw('count(*) as atenciones'))
            ->groupBy('fecha')
            ->orderBy('fecha')
            ->get();

        $serieDiaria = $serieDiariaRaw->map(function ($item) {
            $f = Carbon::parse($item->fecha);

            return [
                'fecha' => $f->format('d/m'),
                'fecha_completa' => $f->translatedFormat('d M'),
                'atenciones' => (int) $item->atenciones,
            ];
        });

        // 7. Franjas Horarias de Mayor Actividad
        $timeExpr = $driver === 'sqlite' ? "cast(strftime('%H', created_at) as integer)" : 'HOUR(created_at)';

        $visitasPorHora = (clone $visitasQuery)
            ->select(DB::raw("{$timeExpr} as hora"), DB::raw('count(*) as total'))
            ->groupBy('hora')
            ->get();

        $franjaManana = 0;   // 07:00 a 11:59
        $franjaTarde = 0;    // 12:00 a 17:59
        $franjaNoche = 0;    // 18:00+

        foreach ($visitasPorHora as $vh) {
            $h = (int) $vh->hora;
            if ($h < 12) {
                $franjaManana += $vh->total;
            } elseif ($h < 18) {
                $franjaTarde += $vh->total;
            } else {
                $franjaNoche += $vh->total;
            }
        }

        // 8. Bitácora de Acciones Significativas Recientes
        $accionesRecientes = $this->obtenerFeedAccionesSignificativas($desde, $hasta, $gestorId, $idPunto);

        // 9. Listados para los Filtros del Administrador
        $gestores = User::role([
            'Gestor PVD',
            'Gestor Aula Digital',
            'Gestor',
            'Coordinador PVD',
            'Coordinador Aula Digital',
            'Coordinador General',
        ])
            ->where('activo', true)
            ->with('punto:id_punto,nombre_punto,zona')
            ->orderBy('name')
            ->get(['id', 'name', 'documento', 'email', 'cargo', 'id_punto'])
            ->map(function ($g) {
                return [
                    'id' => $g->id,
                    'name' => $g->name,
                    'documento' => $g->documento,
                    'cargo' => $g->cargo ?? $g->rol_principal ?? 'Gestor',
                    'sede' => $g->punto?->nombre_punto ?? 'Sin asignar',
                    'zona' => $g->punto?->zona ?? 'Urbana',
                ];
            });

        $puntos = Point::where('activo', true)
            ->orderBy('nombre_punto')
            ->get(['id_punto', 'nombre_punto', 'zona']);

        return [
            'periodo' => [
                'key' => $periodoKey,
                'label' => $periodoLabel,
                'desde' => $desde->format('Y-m-d'),
                'hasta' => $hasta->format('Y-m-d'),
                'desde_humana' => $desde->translatedFormat('d M Y'),
                'hasta_humana' => $hasta->translatedFormat('d M Y'),
            ],
            'filtros' => [
                'gestor_id' => $gestorId,
                'id_punto' => $idPunto,
                'zona' => $zona,
            ],
            'gestor_seleccionado' => $gestorSeleccionado,
            'kpis' => [
                'total_visitas' => $totalVisitas,
                'total_nuevos_ciudadanos' => $totalNuevosCiudadanos,
                'total_prestamos' => $totalPrestamos,
                'total_aforo_prestamos' => $totalAforoPrestamos,
                'total_impresiones' => $totalImpresiones,
                'total_hojas_impresas' => $totalHojasImpresas,
                'dias_activos' => $diasActivos,
                'promedio_diario' => $promedioDiario,
            ],
            'desglose_servicios' => $desgloseServicios,
            'serie_diaria' => $serieDiaria,
            'franjas_horarias' => [
                'manana' => $franjaManana,
                'tarde' => $franjaTarde,
                'noche' => $franjaNoche,
            ],
            'acciones_recientes' => $accionesRecientes,
            'catalogo_gestores' => $gestores,
            'catalogo_puntos' => $puntos,
        ];
    }

    /**
     * Aplica filtros de Gestor, Punto y Zona a la consulta.
     */
    private function aplicarFiltrosAmbito($query, ?int $gestorId, ?int $idPunto, ?string $zona): void
    {
        if ($gestorId) {
            $query->where('visitas.id_gestor', $gestorId);
        }

        if ($idPunto) {
            $query->where('visitas.id_punto', $idPunto);
        }

        if ($zona) {
            $query->whereHas('punto', function ($q) use ($zona) {
                $q->where('zona', $zona);
            });
        }
    }

    /**
     * Resuelve el rango de fechas a partir de filtros preestablecidos o personalizados.
     */
    private function resolverRangoFechas(array $filters): array
    {
        $periodo = $filters['periodo'] ?? 'mes_actual';

        switch ($periodo) {
            case 'hoy':
                $desde = now()->startOfDay();
                $hasta = now()->endOfDay();
                $label = 'Hoy ('.now()->translatedFormat('d M Y').')';
                break;

            case '7_dias':
                $desde = now()->subDays(6)->startOfDay();
                $hasta = now()->endOfDay();
                $label = 'Últimos 7 días ('.$desde->translatedFormat('d M').' - '.$hasta->translatedFormat('d M').')';
                break;

            case 'mes_anterior':
                $desde = now()->subMonth()->startOfMonth();
                $hasta = now()->subMonth()->endOfMonth();
                $label = 'Mes Anterior ('.$desde->translatedFormat('F Y').')';
                break;

            case 'trimestre':
                $desde = now()->firstOfQuarter()->startOfDay();
                $hasta = now()->lastOfQuarter()->endOfDay();
                $label = 'Trimestre Actual (T'.now()->quarter.' '.now()->year.')';
                break;

            case 'anio':
                $desde = now()->startOfYear();
                $hasta = now()->endOfYear();
                $label = 'Año Actual ('.now()->year.')';
                break;

            case 'personalizado':
                $desde = ! empty($filters['fecha_desde'])
                    ? Carbon::parse($filters['fecha_desde'])->startOfDay()
                    : now()->startOfMonth();
                $hasta = ! empty($filters['fecha_hasta'])
                    ? Carbon::parse($filters['fecha_hasta'])->endOfDay()
                    : now()->endOfDay();
                $label = 'Personalizado ('.$desde->format('d/m/Y').' a '.$hasta->format('d/m/Y').')';
                break;

            case 'mes_actual':
            default:
                $desde = now()->startOfMonth();
                $hasta = now()->endOfMonth();
                $label = 'Mes Actual ('.now()->translatedFormat('F Y').')';
                $periodo = 'mes_actual';
                break;
        }

        return [$desde, $hasta, $periodo, $label];
    }

    /**
     * Construye un feed unificado de acciones significativas realizadas en el período.
     */
    private function obtenerFeedAccionesSignificativas(Carbon $desde, Carbon $hasta, ?int $gestorId, ?int $idPunto): array
    {
        $feed = collect();

        // 1. Visitas más recientes
        $visitas = Visit::with(['ciudadano:id,id_form_pvd,nombres,apellidos,documento', 'gestor:id,name', 'punto:id_punto,nombre_punto'])
            ->whereBetween('created_at', [$desde, $hasta])
            ->when($gestorId, fn ($q) => $q->where('id_gestor', $gestorId))
            ->when($idPunto, fn ($q) => $q->where('id_punto', $idPunto))
            ->latest('created_at')
            ->limit(12)
            ->get();

        foreach ($visitas as $v) {
            $nombreC = $v->ciudadano ? trim($v->ciudadano->nombres.' '.$v->ciudadano->apellidos) : 'Ciudadano atendido';
            $docC = $v->ciudadano?->documento ? 'CC '.$v->ciudadano->documento : '';

            $feed->push([
                'id' => 'vis-'.$v->id_visitas,
                'tipo' => 'ATENCION_VENTANILLA',
                'color' => 'emerald',
                'icono' => 'Users',
                'titulo' => 'Atención Ciudadana en Sede',
                'detalle' => "Atendió a {$nombreC} ({$docC}) · Servicio: ".($v->servicio ?? 'Consulta general'),
                'duracion' => ($v->duracion_minutos ?? 30).' min',
                'sede' => $v->punto?->nombre_punto ?? 'Punto Vive Digital',
                'gestor' => $v->gestor?->name ?? 'Gestor de Ventanilla',
                'fecha_hora' => $v->created_at->format('d/m/Y H:i'),
                'timestamp' => $v->created_at->timestamp,
            ]);
        }

        // 2. Ciudadanos creados
        $ciudadanos = Citizen::with(['punto:id_punto,nombre_punto'])
            ->whereBetween('created_at', [$desde, $hasta])
            ->when($gestorId, fn ($q) => $q->where('id_gestor', $gestorId))
            ->when($idPunto, fn ($q) => $q->where('id_punto', $idPunto))
            ->latest('created_at')
            ->limit(8)
            ->get();

        foreach ($ciudadanos as $c) {
            $feed->push([
                'id' => 'ciu-'.$c->id,
                'tipo' => 'CREACION_CIUDADANO',
                'color' => 'blue',
                'icono' => 'UserCheck',
                'titulo' => 'Nuevo Ciudadano Enrolado',
                'detalle' => "Registró en la plataforma a {$c->nombres} {$c->apellidos} (Doc. {$c->documento}) · Zona {$c->zona}",
                'duracion' => null,
                'sede' => $c->punto?->nombre_punto ?? 'Punto Vive Digital',
                'gestor' => 'Gestor Registrador',
                'fecha_hora' => $c->created_at->format('d/m/Y H:i'),
                'timestamp' => $c->created_at->timestamp,
            ]);
        }

        // 3. Préstamos de sala
        $prestamos = RoomLoan::with(['punto:id_punto,nombre_punto', 'gestor:id,name'])
            ->whereBetween('created_at', [$desde, $hasta])
            ->when($gestorId, fn ($q) => $q->where('id_gestor', $gestorId))
            ->when($idPunto, fn ($q) => $q->where('id_punto', $idPunto))
            ->latest('created_at')
            ->limit(6)
            ->get();

        foreach ($prestamos as $p) {
            $feed->push([
                'id' => 'pre-'.$p->id_prestamo,
                'tipo' => 'PRESTAMO_SALA',
                'color' => 'purple',
                'icono' => 'DoorOpen',
                'titulo' => 'Préstamo de Infraestructura / Sala',
                'detalle' => "Actividad: {$p->tipo_actividad} · Aforo coordinado: {$p->num_asistentes} personas",
                'duracion' => 'Aforo '.$p->num_asistentes,
                'sede' => $p->punto?->nombre_punto ?? 'Punto Vive Digital',
                'gestor' => $p->gestor?->name ?? 'Gestor Encargado',
                'fecha_hora' => $p->created_at->format('d/m/Y H:i'),
                'timestamp' => $p->created_at->timestamp,
            ]);
        }

        // 4. Impresiones
        $impresiones = PrintRecord::with(['punto:id_punto,nombre_punto', 'gestor:id,name'])
            ->whereBetween('created_at', [$desde, $hasta])
            ->when($gestorId, fn ($q) => $q->where('id_gestor', $gestorId))
            ->when($idPunto, fn ($q) => $q->where('id_punto', $idPunto))
            ->latest('created_at')
            ->limit(6)
            ->get();

        foreach ($impresiones as $imp) {
            $feed->push([
                'id' => 'imp-'.$imp->id_impresion,
                'tipo' => 'IMPRESION_LABORAL',
                'color' => 'amber',
                'icono' => 'Printer',
                'titulo' => 'Trámite de Impresión Gratuita',
                'detalle' => "{$imp->numero_hojas} hojas de {$imp->tipo_impresion} tramitadas",
                'duracion' => "{$imp->numero_hojas} pág.",
                'sede' => $imp->punto?->nombre_punto ?? 'Punto Vive Digital',
                'gestor' => $imp->gestor?->name ?? 'Gestor Ventanilla',
                'fecha_hora' => $imp->created_at->format('d/m/Y H:i'),
                'timestamp' => $imp->created_at->timestamp,
            ]);
        }

        // Ordenar cronológicamente descendente
        return $feed->sortByDesc('timestamp')->values()->take(25)->all();
    }
}
