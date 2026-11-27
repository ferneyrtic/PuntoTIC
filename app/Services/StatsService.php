<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Citizen;
use App\Models\Point;
use App\Models\PrintRecord;
use App\Models\RoomLoan;
use App\Models\SubCategory;
use App\Models\Visit;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class StatsService
{
    /**
     * Invalida la caché de estadísticas cuando ingresan nuevos registros operativos.
     */
    public static function invalidateCache(): void
    {
        Cache::add('stats_cache_version', 1, 86400);
        Cache::increment('stats_cache_version');
    }

    /**
     * Une el conteo real de participantes registrados por préstamo y excluye cancelados/rechazados.
     */
    protected function withEffectiveRoomLoanAttendees($query)
    {
        $participantsSub = DB::table('prestamo_sala_participantes')
            ->select('id_prestamo', DB::raw('COUNT(*) as real_count'))
            ->groupBy('id_prestamo');

        return $query
            ->leftJoinSub($participantsSub, 'psp_counts', function ($join) {
                $join->on(DB::raw('COALESCE(prestamo_sala.id_prestamo, prestamo_sala.id)'), '=', 'psp_counts.id_prestamo');
            })
            ->whereNotIn('prestamo_sala.estado', ['Cancelado', 'Rechazado']);
    }

    /**
     * Expresión SQL de asistentes efectivos por préstamo:
     * Cuenta ÚNICAMENTE los participantes reales registrados manualmente en
     * `prestamo_sala_participantes` (para todos los préstamos, actuales y anteriores).
     */
    protected function effectiveAttendeesSql(): string
    {
        return 'COALESCE(psp_counts.real_count, 0)';
    }

    /**
     * Resumen completo de métricas del Dashboard con soporte de ámbitos y períodos.
     *
     * @param  array|int|null  $params  Filtros del dashboard (point_id, zona, periodo, fecha_desde, fecha_hasta)
     */
    public function getDashboardStats(array|int|null $params = null): array
    {
        // Normalización retrocompatible
        if (is_int($params) || is_null($params)) {
            $filters = ['point_id' => $params];
        } else {
            $filters = $params;
        }

        $pointId = ! empty($filters['point_id'])
            ? (int) $filters['point_id']
            : (! empty($filters['id_punto']) ? (int) $filters['id_punto'] : null);
        $zona = ! empty($filters['zona']) && in_array($filters['zona'], ['Urbana', 'Rural']) ? $filters['zona'] : null;

        // Si se selecciona un punto específico, la zona queda implícita por ese punto
        if ($pointId) {
            $zona = null;
        }

        $version = Cache::get('stats_cache_version', 1);
        $cacheKey = 'dashboard_stats_v' . $version . '_' . md5(json_encode([
            'point_id' => $pointId,
            'zona' => $zona,
            'periodo' => $filters['periodo'] ?? 'mes',
            'fecha_desde' => $filters['fecha_desde'] ?? null,
            'fecha_hasta' => $filters['fecha_hasta'] ?? null,
            'today' => Carbon::today()->toDateString(),
        ]));

        return Cache::remember($cacheKey, 45, function () use ($pointId, $zona, $filters) {
            // 1. Ámbito de Sede
            $scopeInfo = $this->resolveScopeInfo($pointId, $zona);

            // 2. Rango Temporal
            [$startDate, $endDate, $periodoLabel, $periodoKey] = $this->resolveDateRange($filters);

            // 3. IDs de Puntos involucrados en el ámbito
            $targetPointIds = $this->getTargetPointIds($pointId, $zona);

            // 4. Métricas Clave (KPIs)
            $kpis = $this->calculateKpis($targetPointIds, $startDate, $endDate);

            // 5. Serie de Tiempo para el Gráfico
            $timeSeries = $this->calculateTimeSeries($targetPointIds, $startDate, $endDate, $periodoKey);

            // 6. Comparativa de Sedes (PVD Urbanos y Aulas Rurales)
            $comparativaSedes = $this->calculateSedeComparison($startDate, $endDate, $targetPointIds);

            // 7. Dependencia: Trámites en Línea y Servicios Institucionales
            $dependenciaTramites = $this->calculateTramitesStats($targetPointIds, $startDate, $endDate);

            // 8. Dependencia: Capacitación y Formación Digital + Demografía
            $dependenciaFormacion = $this->calculateFormacionStats($targetPointIds, $startDate, $endDate);

            // 9. Dependencia: Préstamo de Salas y Espacios
            $dependenciaSalas = $this->calculateSalasStats($targetPointIds, $startDate, $endDate);

            // 10. Dependencia: Impresiones y Consumibles
            $dependenciaImpresiones = $this->calculateImpresionesStats($targetPointIds, $startDate, $endDate);

            // 11. Distribución por Categorías Generales
            $distribucionCategorias = $this->calculateCategoryDistribution($targetPointIds, $startDate, $endDate, $kpis['visitas_periodo']);

            return [
                'scope' => $scopeInfo,
                'periodo' => [
                    'key' => $periodoKey,
                    'label' => $periodoLabel,
                    'fecha_desde' => $startDate->toDateString(),
                    'fecha_hasta' => $endDate->toDateString(),
                ],
                'kpis' => $kpis,
                'chart_serie' => $timeSeries,
                // Retrocompatibilidad con chart_7_dias si algún componente antiguo lo lee
                'chart_7_dias' => $timeSeries,
                'comparativa_sedes' => $comparativaSedes,
                'distribucion_puntos' => $comparativaSedes,
                'distribucion_categorias' => $distribucionCategorias,
                'dependencia_tramites' => $dependenciaTramites,
                'dependencia_formacion' => $dependenciaFormacion,
                'dependencia_salas' => $dependenciaSalas,
                'dependencia_impresiones' => $dependenciaImpresiones,
            ];
        });
    }

    /**
     * Resuelve los datos descriptivos del ámbito seleccionado.
     */
    protected function resolveScopeInfo(?int $pointId, ?string $zona): array
    {
        if ($pointId) {
            $point = Point::find($pointId);

            return [
                'id_punto' => $pointId,
                'zona' => $point?->zona,
                'tipo' => 'individual',
                'nombre' => $point ? $point->nombre_punto : 'Punto Digital',
                'es_rural' => $point?->zona === 'Rural',
            ];
        }

        if ($zona) {
            return [
                'id_punto' => null,
                'zona' => $zona,
                'tipo' => 'zona',
                'nombre' => $zona === 'Rural'
                    ? 'Aulas Digitales Rurales (Dinamarca + Chichimene)'
                    : 'Puntos Vive Digital Urbanos (PLUS + Tradicional)',
                'es_rural' => $zona === 'Rural',
            ];
        }

        return [
            'id_punto' => null,
            'zona' => null,
            'tipo' => 'consolidado',
            'nombre' => 'Red Municipal de Acacías (Consolidado General)',
            'es_rural' => false,
        ];
    }

    /**
     * Resuelve las fechas de inicio y fin para el período seleccionado.
     */
    protected function resolveDateRange(array $filters): array
    {
        $hasCustomDates = ! empty($filters['fecha_desde']) || ! empty($filters['fecha_hasta']);
        $periodo = $hasCustomDates ? 'custom' : ($filters['periodo'] ?? 'mes');
        $now = Carbon::now();

        switch ($periodo) {
            case 'hoy':
                $start = Carbon::today()->startOfDay();
                $end = Carbon::today()->endOfDay();
                $label = 'Hoy ('.$start->format('d/m/Y').')';
                break;

            case 'semana':
                $start = Carbon::now()->subDays(6)->startOfDay();
                $end = Carbon::now()->endOfDay();
                $label = 'Últimos 7 días';
                break;

            case 'trimestre':
                $start = Carbon::now()->subMonths(3)->startOfDay();
                $end = Carbon::now()->endOfDay();
                $label = 'Últimos 3 meses';
                break;

            case 'ano':
                $start = Carbon::now()->startOfYear();
                $end = Carbon::now()->endOfDay();
                $label = 'Año '.$now->year;
                break;

            case 'custom':
                $start = ! empty($filters['fecha_desde'])
                    ? Carbon::parse($filters['fecha_desde'])->startOfDay()
                    : Carbon::now()->startOfMonth();
                $end = ! empty($filters['fecha_hasta'])
                    ? Carbon::parse($filters['fecha_hasta'])->endOfDay()
                    : Carbon::now()->endOfDay();
                $label = $start->format('d/m/Y').' - '.$end->format('d/m/Y');
                break;

            case 'mes':
            default:
                $periodo = 'mes';
                $start = Carbon::now()->startOfMonth();
                $end = Carbon::now()->endOfDay();
                $label = ucfirst($now->locale('es')->monthName).' '.$now->year;
                break;
        }

        return [$start, $end, $label, $periodo];
    }

    /**
     * Obtiene la lista de IDs de puntos que aplican al filtro.
     */
    protected function getTargetPointIds(?int $pointId, ?string $zona): ?array
    {
        if ($pointId) {
            return [$pointId];
        }

        if ($zona) {
            return Point::where('zona', $zona)->where('activo', true)->pluck('id_punto')->toArray();
        }

        return null; // Null representa todos los puntos
    }

    /**
     * Calcula los KPIs generales para el ámbito y período.
     */
    protected function calculateKpis(?array $targetPointIds, Carbon $startDate, Carbon $endDate): array
    {
        $todayStart = Carbon::today()->startOfDay();
        $todayEnd = Carbon::today()->endOfDay();
        $yesterdayStart = Carbon::yesterday()->startOfDay();
        $yesterdayEnd = Carbon::yesterday()->endOfDay();

        // Visitas en el período
        $visitasQuery = Visit::query();
        if ($targetPointIds) {
            $visitasQuery->whereIn('id_punto', $targetPointIds);
        }
        $visitasPeriodo = (clone $visitasQuery)->whereBetween('created_at', [$startDate, $endDate])->count();
        $visitasHoy = (clone $visitasQuery)->whereBetween('created_at', [$todayStart, $todayEnd])->count();
        $visitasAyer = (clone $visitasQuery)->whereBetween('created_at', [$yesterdayStart, $yesterdayEnd])->count();

        // Préstamos de salas en el período (excluye Cancelados/Rechazados; suma participantes reales o aforo si ya está Completado/En curso)
        $prestamosQuery = $this->withEffectiveRoomLoanAttendees(RoomLoan::query());
        if ($targetPointIds) {
            $prestamosQuery->where(function ($sub) use ($targetPointIds) {
                $sub->whereIn('prestamo_sala.id_punto', $targetPointIds)->orWhereIn('prestamo_sala.id_puntos', $targetPointIds);
            });
        }
        $dateLoanCol = DB::raw('COALESCE(NULLIF(prestamo_sala.fecha_prestamo, "0000-00-00"), DATE(prestamo_sala.created_at))');
        $effectiveSumExpr = "COALESCE(SUM({$this->effectiveAttendeesSql()}), 0) as total_eff";

        $prestamosPeriodo = (clone $prestamosQuery)
            ->whereBetween($dateLoanCol, [$startDate->toDateString(), $endDate->toDateString()])
            ->whereIn('prestamo_sala.estado', ['Completado', 'En curso', 'Reservado'])
            ->count();
        $asistentesPeriodo = (int) ((clone $prestamosQuery)
            ->whereBetween($dateLoanCol, [$startDate->toDateString(), $endDate->toDateString()])
            ->selectRaw($effectiveSumExpr)
            ->value('total_eff') ?? 0);
        $asistentesHoy = (int) ((clone $prestamosQuery)
            ->whereDate($dateLoanCol, Carbon::today())
            ->selectRaw($effectiveSumExpr)
            ->value('total_eff') ?? 0);
        $asistentesAyer = (int) ((clone $prestamosQuery)
            ->whereDate($dateLoanCol, Carbon::yesterday())
            ->selectRaw($effectiveSumExpr)
            ->value('total_eff') ?? 0);
        $prestamosHoy = (clone $prestamosQuery)
            ->whereDate($dateLoanCol, Carbon::today())
            ->whereIn('prestamo_sala.estado', ['Completado', 'En curso'])
            ->count();

        // Total consolidado de atenciones (visitas individuales + asistentes a capacitaciones/cursos)
        $totalAtencionesPeriodo = $visitasPeriodo + $asistentesPeriodo;
        $totalAtencionesHoy = $visitasHoy + $asistentesHoy;
        $totalAtencionesAyer = $visitasAyer + $asistentesAyer;

        $deltaVisitasHoy = $totalAtencionesAyer > 0
            ? round((($totalAtencionesHoy - $totalAtencionesAyer) / $totalAtencionesAyer) * 100)
            : ($totalAtencionesHoy > 0 ? 100 : 0);

        // Ciudadanos únicos en el período (visitas individuales + participantes de capacitaciones)
        $ciudadanosVisitas = (clone $visitasQuery)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('id_form_pvd')
            ->distinct()
            ->pluck('id_form_pvd');

        $prestamoIdsEnPeriodo = (clone $prestamosQuery)
            ->whereBetween($dateLoanCol, [$startDate->toDateString(), $endDate->toDateString()])
            ->pluck('id');

        $ciudadanosPrestamos = DB::table('prestamo_sala_participantes')
            ->whereIn('id_prestamo', $prestamoIdsEnPeriodo)
            ->whereNotNull('id_form_pvd')
            ->distinct()
            ->pluck('id_form_pvd');

        $ciudadanosUnicos = $ciudadanosVisitas->merge($ciudadanosPrestamos)->unique()->count();

        // Total histórico de ciudadanos registrados en este ámbito
        $ciudadanosQuery = Citizen::query();
        if ($targetPointIds) {
            $ciudadanosQuery->whereIn('id_punto', $targetPointIds);
        }
        $totalCiudadanos = $ciudadanosQuery->count();

        // Impresiones en el período
        $impresionesQuery = PrintRecord::query();
        if ($targetPointIds) {
            $impresionesQuery->whereIn('id_punto', $targetPointIds);
        }
        $impresionesHojas = (int) (clone $impresionesQuery)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->sum('numero_hojas');
        $impresionesHoyHojas = (int) (clone $impresionesQuery)
            ->whereBetween('created_at', [$todayStart, $todayEnd])
            ->sum('numero_hojas');

        return [
            'visitas_periodo' => $totalAtencionesPeriodo,
            'visitas_individuales' => $visitasPeriodo,
            'visitas_hoy' => $totalAtencionesHoy,
            'delta_visitas_hoy' => $deltaVisitasHoy,
            'ciudadanos_unicos' => $ciudadanosUnicos,
            'total_ciudadanos' => $totalCiudadanos,
            'impresiones_hojas' => $impresionesHojas,
            'impresiones_hoy_hojas' => $impresionesHoyHojas,
            'impresiones_mes_hojas' => $impresionesHojas,
            'prestamos_salas' => $prestamosPeriodo,
            'asistentes_salas' => $asistentesPeriodo,
            'prestamos_hoy' => $prestamosHoy,
            // Retrocompatibilidad
            'visitas_mes' => $totalAtencionesPeriodo,
            'ciudadanos_esta_semana' => $ciudadanosUnicos,
        ];
    }

    /**
     * Serie temporal adaptativa para los gráficos.
     */
    protected function calculateTimeSeries(?array $targetPointIds, Carbon $startDate, Carbon $endDate, string $periodoKey): array
    {
        $query = Visit::query()->whereBetween('created_at', [$startDate, $endDate]);
        if ($targetPointIds) {
            $query->whereIn('id_punto', $targetPointIds);
        }

        // Si es 'hoy', agrupamos por hora (8:00 a 18:00)
        if ($periodoKey === 'hoy') {
            $driver = DB::connection()->getDriverName();
            $hourExpr = $driver === 'sqlite' ? "strftime('%H', created_at)" : "DATE_FORMAT(created_at, '%H')";

            $rawHourly = (clone $query)
                ->selectRaw("{$hourExpr} as hora, count(*) as total")
                ->groupBy(DB::raw($hourExpr))
                ->pluck('total', 'hora')
                ->toArray();

            $series = [];
            for ($h = 8; $h <= 18; $h++) {
                $hStr = str_pad($h, 2, '0', STR_PAD_LEFT);
                $series[] = [
                    'dia' => "{$h}:00",
                    'fecha' => "{$h}:00",
                    'visitas' => (int) ($rawHourly[$hStr] ?? 0),
                    'es_hoy' => true,
                ];
            }

            return $series;
        }

        // Si es 'ano' o 'trimestre', o 'custom' con más de 45 días, agrupamos por mes
        $diffDays = $startDate->diffInDays($endDate);
        if ($periodoKey === 'ano' || $periodoKey === 'trimestre' || ($periodoKey === 'custom' && $diffDays > 45)) {
            $rawMonthly = (clone $query)
                ->selectRaw('substr(created_at, 1, 7) as mes, count(*) as total')
                ->groupBy(DB::raw('substr(created_at, 1, 7)'))
                ->pluck('total', 'mes')
                ->toArray();

            $series = [];
            $cursor = $startDate->copy()->startOfMonth();
            while ($cursor->lte($endDate)) {
                $mKey = $cursor->format('Y-m');
                $series[] = [
                    'dia' => ucfirst($cursor->locale('es')->shortMonthName),
                    'fecha' => $cursor->format('M Y'),
                    'visitas' => (int) ($rawMonthly[$mKey] ?? 0),
                    'es_hoy' => $cursor->isCurrentMonth(),
                ];
                $cursor->addMonth();
            }

            return $series;
        }

        // Período 'semana', 'mes' o 'custom' (agrupación diaria)
        $rawDaily = (clone $query)
            ->selectRaw('substr(created_at, 1, 10) as fecha, count(*) as total')
            ->groupBy(DB::raw('substr(created_at, 1, 10)'))
            ->pluck('total', 'fecha')
            ->toArray();

        $series = [];
        $cursor = $startDate->copy()->startOfDay();

        while ($cursor->lte($endDate)) {
            $dateStr = $cursor->toDateString();
            $series[] = [
                'dia' => $cursor->locale('es')->isoFormat('ddd D'),
                'fecha' => $dateStr,
                'visitas' => (int) ($rawDaily[$dateStr] ?? 0),
                'es_hoy' => $cursor->isToday(),
            ];
            $cursor->addDay();
        }

        return $series;
    }

    /**
     * Comparativa detallada de todas las sedes y aulas digitales.
     */
    protected function calculateSedeComparison(Carbon $startDate, Carbon $endDate, ?array $targetPointIds = null): array
    {
        $pointsQuery = Point::where('activo', true);
        if ($targetPointIds && count($targetPointIds) > 0) {
            $pointsQuery->whereIn('id_punto', $targetPointIds);
        }
        $allPoints = $pointsQuery->get();

        // Visitas por punto en el período
        $visitsQuery = Visit::whereBetween('created_at', [$startDate, $endDate]);
        if ($targetPointIds && count($targetPointIds) > 0) {
            $visitsQuery->whereIn('id_punto', $targetPointIds);
        }
        $visitsByPoint = $visitsQuery
            ->select('id_punto', DB::raw('count(*) as total'))
            ->groupBy('id_punto')
            ->pluck('total', 'id_punto')
            ->toArray();

        // Impresiones por punto en el período
        $printsQuery = PrintRecord::whereBetween('created_at', [$startDate, $endDate]);
        if ($targetPointIds && count($targetPointIds) > 0) {
            $printsQuery->whereIn('id_punto', $targetPointIds);
        }
        $printsByPoint = $printsQuery
            ->select('id_punto', DB::raw('sum(numero_hojas) as total'))
            ->groupBy('id_punto')
            ->pluck('total', 'id_punto')
            ->toArray();

        // Préstamos por punto en el período
        $dateLoanCol = DB::raw('COALESCE(NULLIF(prestamo_sala.fecha_prestamo, "0000-00-00"), DATE(prestamo_sala.created_at))');
        $loansQuery = $this->withEffectiveRoomLoanAttendees(
            RoomLoan::whereBetween($dateLoanCol, [$startDate->toDateString(), $endDate->toDateString()])
        );
        if ($targetPointIds && count($targetPointIds) > 0) {
            $loansQuery->where(function ($sub) use ($targetPointIds) {
                $sub->whereIn('prestamo_sala.id_punto', $targetPointIds)->orWhereIn('prestamo_sala.id_puntos', $targetPointIds);
            });
        }
        $loansByPoint = $loansQuery
            ->select(DB::raw("COALESCE(prestamo_sala.id_punto, prestamo_sala.id_puntos) as id_punto, count(*) as total_prestamos, COALESCE(SUM({$this->effectiveAttendeesSql()}), 0) as total_asistentes"))
            ->groupBy(DB::raw('COALESCE(prestamo_sala.id_punto, prestamo_sala.id_puntos)'))
            ->get()
            ->keyBy('id_punto');

        $totalMunicipalVisitas = array_sum($visitsByPoint) ?: 0;
        $totalMunicipalAsistentes = (int) $loansByPoint->sum('total_asistentes');
        $totalMunicipal = ($totalMunicipalVisitas + $totalMunicipalAsistentes) ?: 1;

        return $allPoints->map(function ($p) use ($visitsByPoint, $printsByPoint, $loansByPoint, $totalMunicipal) {
            $visitas = $visitsByPoint[$p->id_punto] ?? 0;
            $hojas = (int) ($printsByPoint[$p->id_punto] ?? 0);
            $prestamoInfo = $loansByPoint->get($p->id_punto);
            $prestamos = $prestamoInfo ? (int) $prestamoInfo->total_prestamos : 0;
            $asistentes = $prestamoInfo ? (int) $prestamoInfo->total_asistentes : 0;
            $totalAtencionesPunto = $visitas + $asistentes;
            $porcentaje = round(($totalAtencionesPunto / $totalMunicipal) * 100, 1);

            return [
                'id_punto' => $p->id_punto,
                'nombre_punto' => $p->nombre_punto,
                'codigo' => $p->codigo,
                'zona' => $p->zona,
                'es_aula_digital' => $p->es_aula_digital,
                'total_visitas' => $totalAtencionesPunto,
                'visitas_individuales' => $visitas,
                'total_hojas' => $hojas,
                'total_prestamos' => $prestamos,
                'total_asistentes' => $asistentes,
                'porcentaje' => $porcentaje,
            ];
        })->sortByDesc('total_visitas')->values()->toArray();
    }

    /**
     * Estadísticas de Trámites en Línea y Servicios Solicitados (Top trámites y servicios).
     */
    protected function calculateTramitesStats(?array $targetPointIds, Carbon $startDate, Carbon $endDate): array
    {
        $query = DB::table('visitas')
            ->whereBetween('created_at', [$startDate, $endDate]);

        if ($targetPointIds) {
            $query->whereIn('id_punto', $targetPointIds);
        }

        $groupedRows = $query
            ->select('id_subcategoria', 'servicio', 'servicio_texto', DB::raw('count(*) as total'))
            ->groupBy('id_subcategoria', 'servicio', 'servicio_texto')
            ->get();

        $subIds = $groupedRows->pluck('id_subcategoria')->filter()->unique()->values()->toArray();
        $subNames = ! empty($subIds)
            ? SubCategory::whereIn('id_subcategoria', $subIds)->pluck('nombre', 'id_subcategoria')->toArray()
            : [];

        $merged = [];
        $totalAtenciones = 0;

        $legacyLabelMap = [
            'acceso a sala de informática' => 'Navegación libre e investigación en internet',
            'acceso a sala de informatica' => 'Navegación libre e investigación en internet',
            'refuerzo de tareas'           => 'Acceso a computador y tareas escolares',
            'gobierno digital'             => 'Gobierno Digital y Trámites Municipales',
            'capacitaciones'               => 'Capacitación y Formación Digital',
            'acceso a salón comunitario'   => 'Préstamo de Salas y Espacios',
            'acceso a salon comunitario'   => 'Préstamo de Salas y Espacios',
        ];

        foreach ($groupedRows as $row) {
            $count = (int) $row->total;
            if ($row->id_subcategoria && isset($subNames[$row->id_subcategoria])) {
                $label = $subNames[$row->id_subcategoria];
                $subId = (int) $row->id_subcategoria;
            } else {
                $rawText = trim((string) ($row->servicio_texto ?: $row->servicio ?: ''));
                // Normalizar espacios duros (&nbsp;) y espacios múltiples
                $label = trim(preg_replace('/\s+/u', ' ', str_replace("\u{00A0}", ' ', $rawText)));
                if ($label === '') {
                    $label = 'Atención PuntoTIC';
                }
                $lower = mb_strtolower($label);
                if (isset($legacyLabelMap[$lower])) {
                    $label = $legacyLabelMap[$lower];
                }
                $subId = null;
            }

            $key = mb_strtolower($label);
            if (! isset($merged[$key])) {
                $merged[$key] = [
                    'id_subcategoria' => $subId,
                    'nombre' => $label,
                    'total' => 0,
                ];
            }
            $merged[$key]['total'] += $count;
            $totalAtenciones += $count;
        }

        // Incluir asistentes efectivos de Préstamos de Salas / Capacitaciones en el ranking
        $loansQuery = $this->withEffectiveRoomLoanAttendees(RoomLoan::query());
        if ($targetPointIds) {
            $loansQuery->where(function ($sub) use ($targetPointIds) {
                $sub->whereIn('prestamo_sala.id_punto', $targetPointIds)->orWhereIn('prestamo_sala.id_puntos', $targetPointIds);
            });
        }
        $dateLoanCol = DB::raw('COALESCE(NULLIF(prestamo_sala.fecha_prestamo, "0000-00-00"), DATE(prestamo_sala.created_at))');
        $loanRows = $loansQuery
            ->whereBetween($dateLoanCol, [$startDate->toDateString(), $endDate->toDateString()])
            ->select('prestamo_sala.tipo_actividad', DB::raw("COALESCE(SUM({$this->effectiveAttendeesSql()}), 0) as total_asistentes"))
            ->groupBy('prestamo_sala.tipo_actividad')
            ->get();

        foreach ($loanRows as $lr) {
            $asist = (int) $lr->total_asistentes;
            if ($asist <= 0) {
                continue;
            }
            $label = trim((string) ($lr->tipo_actividad ?: 'Préstamo de Salas y Espacios'));
            $key = mb_strtolower($label);
            if (! isset($merged[$key])) {
                $merged[$key] = [
                    'id_subcategoria' => null,
                    'nombre' => $label,
                    'total' => 0,
                ];
            }
            $merged[$key]['total'] += $asist;
            $totalAtenciones += $asist;
        }

        uasort($merged, fn ($a, $b) => $b['total'] <=> $a['total']);
        $topList = array_slice(array_values($merged), 0, 8);

        $topTramites = [];
        foreach ($topList as $idx => $item) {
            $pct = $totalAtenciones > 0 ? round(($item['total'] / $totalAtenciones) * 100, 1) : 0;
            $topTramites[] = [
                'id_subcategoria' => $item['id_subcategoria'] ?? (10000 + $idx),
                'nombre' => $item['nombre'],
                'total' => $item['total'],
                'porcentaje' => $pct,
            ];
        }

        return [
            'total_atenciones' => $totalAtenciones,
            'top_tramites' => $topTramites,
        ];
    }

    /**
     * Estadísticas de Formación Digital y Demografía de Ciudadanos.
     */
    protected function calculateFormacionStats(?array $targetPointIds, Carbon $startDate, Carbon $endDate): array
    {
        $visitsQuery = DB::table('visitas')->whereBetween('created_at', [$startDate, $endDate]);
        if ($targetPointIds) {
            $visitsQuery->whereIn('id_punto', $targetPointIds);
        }

        // Visitas de formación reales (categoría 4/66 o servicios de capacitación/talleres/cursos, excluyendo refuerzo de tareas)
        $formacionVisitas = (clone $visitsQuery)
            ->where(function ($q) {
                $q->whereIn('id_categoria', [4, 66])
                    ->orWhere('servicio', 'like', '%capacita%')
                    ->orWhere('servicio_texto', 'like', '%capacita%')
                    ->orWhere('servicio', 'like', '%taller%')
                    ->orWhere('servicio_texto', 'like', '%taller%')
                    ->orWhere('servicio', 'like', '%curso%')
                    ->orWhere('servicio_texto', 'like', '%curso%');
            })
            ->count();

        // Sumar asistentes de préstamos de sala de tipo formativo (SENA, cursos, talleres, instituciones educativas)
        $loansFormacionQuery = $this->withEffectiveRoomLoanAttendees(RoomLoan::query());
        if ($targetPointIds) {
            $loansFormacionQuery->where(function ($sub) use ($targetPointIds) {
                $sub->whereIn('prestamo_sala.id_punto', $targetPointIds)->orWhereIn('prestamo_sala.id_puntos', $targetPointIds);
            });
        }
        $dateLoanCol = DB::raw('COALESCE(NULLIF(prestamo_sala.fecha_prestamo, "0000-00-00"), DATE(prestamo_sala.created_at))');
        $asistentesFormacionSalas = (int) ($loansFormacionQuery
            ->whereBetween($dateLoanCol, [$startDate->toDateString(), $endDate->toDateString()])
            ->where(function ($q) {
                $q->where('prestamo_sala.tipo_actividad', 'like', '%curso%')
                    ->orWhere('prestamo_sala.tipo_actividad', 'like', '%formativ%')
                    ->orWhere('prestamo_sala.tipo_actividad', 'like', '%capacita%')
                    ->orWhere('prestamo_sala.tipo_actividad', 'like', '%taller%')
                    ->orWhere('prestamo_sala.tipo_actividad', 'like', '%sena%')
                    ->orWhere('prestamo_sala.tipo_actividad', 'like', '%educativ%');
            })
            ->selectRaw("COALESCE(SUM({$this->effectiveAttendeesSql()}), 0) as total_eff")
            ->value('total_eff') ?? 0);

        $formacionVisitas += $asistentesFormacionSalas;

        // Obtenemos los ciudadanos únicos atendidos en este período (visitas + participantes de salas)
        $cols = Citizen::getTableColumns();
        $pkColumn = in_array('id', $cols, true) ? 'id' : 'id_form_pvd';

        $visitCitizenIds = (clone $visitsQuery)
            ->whereNotNull('id_form_pvd')
            ->distinct()
            ->pluck('id_form_pvd');

        $loanCitizenIds = DB::table('prestamo_sala_participantes as psp')
            ->join('prestamo_sala as ps', DB::raw('COALESCE(ps.id_prestamo, ps.id)'), '=', 'psp.id_prestamo')
            ->whereBetween(
                DB::raw('COALESCE(NULLIF(ps.fecha_prestamo, "0000-00-00"), DATE(ps.created_at))'),
                [$startDate->toDateString(), $endDate->toDateString()]
            )
            ->whereNotIn('ps.estado', ['Cancelado', 'Rechazado'])
            ->when($targetPointIds, function ($q) use ($targetPointIds) {
                $q->where(function ($sub) use ($targetPointIds) {
                    $sub->whereIn('ps.id_punto', $targetPointIds)->orWhereIn('ps.id_puntos', $targetPointIds);
                });
            })
            ->whereNotNull('psp.id_form_pvd')
            ->distinct()
            ->pluck('psp.id_form_pvd');

        $uniqueCitizenIds = $visitCitizenIds->merge($loanCitizenIds)->unique()->values()->all();

        $citizens = empty($uniqueCitizenIds)
            ? collect()
            : DB::table('form_pvd')
                ->whereIn($pkColumn, $uniqueCitizenIds)
                ->select(['genero', 'edad', 'fecha_nac', 'nivel_educativo', 'zona', 'grupo_etnico', 'ocupacion', 'g_poblacional'])
                ->get();

        $totalCitizens = $citizens->count() ?: 1;

        // 1. Demografía por Género (Normalización robusta insensible a mayúsculas/minúsculas)
        $generoStats = [
            'femenino' => 0,
            'masculino' => 0,
            'otro' => 0,
        ];

        foreach ($citizens as $c) {
            $gen = mb_strtoupper(trim($c->genero ?? ''));
            if ($gen === 'FEMENINO' || str_starts_with($gen, 'FEM')) {
                $generoStats['femenino']++;
            } elseif ($gen === 'MASCULINO' || str_starts_with($gen, 'MASC')) {
                $generoStats['masculino']++;
            } else {
                $generoStats['otro']++;
            }
        }

        // 2. Demografía por Grupos Etarios (Cálculo por campo edad o fecha_nac)
        $etarios = [
            'jovenes' => 0,      // 14 - 28 años
            'adultos' => 0,      // 29 - 59 años
            'adulto_mayor' => 0, // 60+ años
            'ninos' => 0,        // 0 - 13 años
        ];

        foreach ($citizens as $c) {
            $edad = null;
            if (is_numeric($c->edad) && (int) $c->edad > 0) {
                $edad = (int) $c->edad;
            } elseif ($c->fecha_nac) {
                try {
                    $edad = Carbon::parse($c->fecha_nac)->age;
                } catch (\Exception $e) {
                    $edad = null;
                }
            }

            if ($edad !== null) {
                if ($edad <= 13) {
                    $etarios['ninos']++;
                } elseif ($edad <= 28) {
                    $etarios['jovenes']++;
                } elseif ($edad <= 59) {
                    $etarios['adultos']++;
                } else {
                    $etarios['adulto_mayor']++;
                }
            }
        }

        $buildDist = function (callable $normalizer, string $field, int $limit = 8) use ($citizens, $totalCitizens): array {
            return $citizens
                ->groupBy(fn ($c) => $normalizer($c->{$field} ?? null))
                ->map(fn ($group, $label) => [
                    'nombre' => $label,
                    'total' => $group->count(),
                    'porcentaje' => round(($group->count() / $totalCitizens) * 100, 1),
                ])
                ->sortByDesc('total')
                ->take($limit)
                ->values()
                ->toArray();
        };

        // 3. Demografía por Nivel Educativo
        $normalizeEducacion = function (?string $raw): string {
            $v = mb_strtoupper(trim((string) $raw));
            if ($v === '' || $v === 'NULL') return 'Sin Registrar';
            if (str_contains($v, 'BACHILLERATO')) return str_contains($v, 'INCOMPLETO') ? 'Bachillerato Incompleto' : 'Bachillerato';
            if (str_contains($v, 'PRIMARIA')) return str_contains($v, 'INCOMPLETA') ? 'Primaria Incompleta' : 'Primaria';
            if (str_contains($v, 'TECNOLOG')) return 'Tecnológico';
            if (str_contains($v, 'TECNIC') || str_contains($v, 'TÉCNIC')) return 'Técnico';
            if (str_contains($v, 'PROFESIONAL') || str_contains($v, 'UNIVERSIT')) return 'Universitario / Profesional';
            if (str_contains($v, 'POSGRADO')) return 'Posgrado';
            if ($v === 'NINGUNO' || $v === 'NINGUNA') return 'Ninguno';
            return mb_convert_case(mb_strtolower($v), MB_CASE_TITLE, 'UTF-8');
        };
        $nivelEducativoDist = $buildDist($normalizeEducacion, 'nivel_educativo', 8);
        $educacion = collect($nivelEducativoDist)->pluck('total', 'nombre')->toArray();

        // 4. Demografía por Etnia
        $etniasDist = $buildDist(function (?string $raw): string {
            $v = mb_strtoupper(trim((string) $raw));
            if ($v === '' || $v === 'NULL' || $v === 'NINGUNO' || $v === 'NINGUNA') return 'Ninguno';
            if (str_contains($v, 'AFRO')) return 'Afrodescendiente';
            if (str_contains($v, 'INDIG') || str_contains($v, 'INDÍG')) return 'Indígena';
            if (str_contains($v, 'RAIZAL')) return 'Raizal';
            if (str_contains($v, 'PALENQ')) return 'Palenquero';
            if ($v === 'ROM' || str_contains($v, 'GITAN')) return 'Rom / Gitano';
            return mb_convert_case(mb_strtolower($v), MB_CASE_TITLE, 'UTF-8');
        }, 'grupo_etnico', 8);

        // 5. Demografía por Ocupación
        $ocupacionDist = $buildDist(function (?string $raw): string {
            $v = mb_strtoupper(trim((string) $raw));
            if ($v === '' || $v === 'NULL') return 'Sin Registrar';
            if ($v === 'AMA_CASA' || str_contains($v, 'AMA DE CASA') || str_contains($v, 'HOGAR')) return 'Ama de Casa';
            if (str_contains($v, 'INDEPEND') || str_contains($v, 'INDEPENT')) return 'Independiente';
            if (str_contains($v, 'ESTUDIANT')) return 'Estudiante';
            if (str_contains($v, 'EMPLEAD')) return 'Empleado';
            if (str_contains($v, 'DESEMPLEAD')) return 'Desempleado';
            if (str_contains($v, 'PENSION') || str_contains($v, 'JUBIL')) return 'Pensionado';
            return mb_convert_case(mb_strtolower(str_replace('_', ' ', $v)), MB_CASE_TITLE, 'UTF-8');
        }, 'ocupacion', 8);

        // 6. Demografía por Grupo Poblacional
        $poblacionalDist = $buildDist(function (?string $raw): string {
            $v = mb_strtoupper(trim((string) $raw));
            if ($v === '' || $v === 'NULL' || $v === 'NINGUNO' || $v === 'NINGUNA') return 'Ninguno';
            if (str_contains($v, 'DESPLAZ')) return 'Desplazados';
            if (str_contains($v, 'DISCAPAC')) return 'Personas con Discapacidad';
            if ($v === 'MADRESC' || str_contains($v, 'MADRE CABEZA')) return 'Madres Cabeza de Hogar';
            if (str_contains($v, 'MIGRANT')) return 'Migrantes';
            if (str_contains($v, 'VICTIM') || str_contains($v, 'VÍCTIM')) return 'Víctima del Conflicto';
            if (str_contains($v, 'LGTB') || str_contains($v, 'LGBT')) return 'Comunidad LGBTIQ+';
            return mb_convert_case(mb_strtolower($v), MB_CASE_TITLE, 'UTF-8');
        }, 'g_poblacional', 8);

        // 7. Demografía por Zona de Origen (Normalización insensible a URBANO/RURAL)
        $zonaOrigen = [
            'urbana' => 0,
            'rural' => 0,
        ];

        foreach ($citizens as $c) {
            $z = mb_strtoupper(trim($c->zona ?? ''));
            if (str_contains($z, 'RURAL')) {
                $zonaOrigen['rural']++;
            } else {
                $zonaOrigen['urbana']++;
            }
        }

        return [
            'total_formacion_visitas' => $formacionVisitas,
            'total_ciudadanos_analizados' => $citizens->count(),
            'genero' => $generoStats,
            'grupos_edad' => $etarios,
            'nivel_educativo' => $educacion,
            'nivel_educativo_distribucion' => $nivelEducativoDist,
            'etnias' => $etniasDist,
            'ocupacion' => $ocupacionDist,
            'grupos_poblacionales' => $poblacionalDist,
            'zona_residencia' => $zonaOrigen,
        ];
    }

    /**
     * Estadísticas de Préstamos de Salas y Espacios Comunitarios.
     */
    protected function calculateSalasStats(?array $targetPointIds, Carbon $startDate, Carbon $endDate): array
    {
        $dateLoanCol = DB::raw('COALESCE(NULLIF(prestamo_sala.fecha_prestamo, "0000-00-00"), DATE(prestamo_sala.created_at))');
        $query = $this->withEffectiveRoomLoanAttendees(
            RoomLoan::query()->whereBetween($dateLoanCol, [$startDate->toDateString(), $endDate->toDateString()])
        );

        if ($targetPointIds) {
            $query->where(function ($sub) use ($targetPointIds) {
                $sub->whereIn('prestamo_sala.id_punto', $targetPointIds)->orWhereIn('prestamo_sala.id_puntos', $targetPointIds);
            });
        }

        $totalEventos = (clone $query)->count();
        $totalAsistentes = (int) ((clone $query)
            ->selectRaw("COALESCE(SUM({$this->effectiveAttendeesSql()}), 0) as total_eff")
            ->value('total_eff') ?? 0);
        $promedioAsistentes = $totalEventos > 0 ? round($totalAsistentes / $totalEventos) : 0;

        // Desglose por tipo de actividad
        $porTipo = (clone $query)
            ->select('prestamo_sala.tipo_actividad', DB::raw("count(*) as eventos, COALESCE(SUM({$this->effectiveAttendeesSql()}), 0) as asistentes"))
            ->groupBy('prestamo_sala.tipo_actividad')
            ->get()
            ->map(function ($row) use ($totalEventos) {
                return [
                    'tipo' => $row->tipo_actividad,
                    'eventos' => (int) $row->eventos,
                    'asistentes' => (int) $row->asistentes,
                    'porcentaje' => $totalEventos > 0 ? round(($row->eventos / $totalEventos) * 100, 1) : 0,
                ];
            })
            ->sortByDesc('eventos')
            ->values()
            ->toArray();

        return [
            'total_eventos' => $totalEventos,
            'total_asistentes' => $totalAsistentes,
            'promedio_asistentes' => $promedioAsistentes,
            'actividades' => $porTipo,
        ];
    }

    /**
     * Estadísticas de Impresiones, Fotocopias y Digitalización.
     */
    protected function calculateImpresionesStats(?array $targetPointIds, Carbon $startDate, Carbon $endDate): array
    {
        $query = PrintRecord::query()->whereBetween('created_at', [$startDate, $endDate]);
        if ($targetPointIds) {
            $query->whereIn('id_punto', $targetPointIds);
        }

        $totalHojas = (int) (clone $query)->sum('numero_hojas');
        $totalRegistros = (clone $query)->count();
        $ciudadanosAtendidos = (clone $query)->distinct('id_form_pvd')->count('id_form_pvd');
        $promedioPorUsuario = $ciudadanosAtendidos > 0 ? round($totalHojas / $ciudadanosAtendidos, 1) : 0;

        // Desglose por tipo de impresión
        $tipos = (clone $query)
            ->select('tipo_impresion', DB::raw('count(*) as total_solicitudes, sum(numero_hojas) as total_hojas'))
            ->groupBy('tipo_impresion')
            ->get()
            ->map(function ($row) use ($totalHojas) {
                $hojas = (int) $row->total_hojas;

                return [
                    'tipo' => $row->tipo_impresion,
                    'solicitudes' => (int) $row->total_solicitudes,
                    'hojas' => $hojas,
                    'porcentaje' => $totalHojas > 0 ? round(($hojas / $totalHojas) * 100, 1) : 0,
                ];
            })
            ->sortByDesc('hojas')
            ->values()
            ->toArray();

        return [
            'total_hojas' => $totalHojas,
            'total_solicitudes' => $totalRegistros,
            'ciudadanos_atendidos' => $ciudadanosAtendidos,
            'promedio_hojas' => $promedioPorUsuario,
            'tipos' => $tipos,
        ];
    }

    /**
     * Distribución de Visitas por Categorías.
     */
    protected function calculateCategoryDistribution(?array $targetPointIds, Carbon $startDate, Carbon $endDate, int $totalVisitas): array
    {
        $visitsQuery = DB::table('visitas')->whereBetween('created_at', [$startDate, $endDate]);
        if ($targetPointIds) {
            $visitsQuery->whereIn('id_punto', $targetPointIds);
        }

        $groupedRows = $visitsQuery
            ->select('id_categoria', 'servicio', 'servicio_texto', DB::raw('count(*) as total'))
            ->groupBy('id_categoria', 'servicio', 'servicio_texto')
            ->get();

        $categories = Category::where('activo', true)->orderBy('orden')->get();
        if ($categories->isEmpty()) {
            $categories = Category::orderBy('orden')->get();
        }

        if ($categories->isEmpty() || $groupedRows->isEmpty()) {
            return [];
        }

        $catByKey = [
            'tramites' => $categories->first(fn ($c) => str_contains(mb_strtolower($c->nombre), 'trámite') || str_contains(mb_strtolower($c->nombre), 'tramite') || in_array((int) $c->id_categoria, [1, 63], true)),
            'conectividad' => $categories->first(fn ($c) => str_contains(mb_strtolower($c->nombre), 'conectividad') || in_array((int) $c->id_categoria, [2, 64], true)),
            'impresion' => $categories->first(fn ($c) => str_contains(mb_strtolower($c->nombre), 'impresi') || in_array((int) $c->id_categoria, [3, 65], true)),
            'capacitacion' => $categories->first(fn ($c) => str_contains(mb_strtolower($c->nombre), 'capacita') || str_contains(mb_strtolower($c->nombre), 'formaci') || in_array((int) $c->id_categoria, [4, 66], true)),
            'salas' => $categories->first(fn ($c) => str_contains(mb_strtolower($c->nombre), 'sala') || str_contains(mb_strtolower($c->nombre), 'espacio') || in_array((int) $c->id_categoria, [5, 67], true)),
        ];

        $catCounts = [];
        foreach ($categories as $cat) {
            $catCounts[$cat->id_categoria] = 0;
        }

        foreach ($groupedRows as $row) {
            $count = (int) $row->total;
            if ($row->id_categoria && isset($catCounts[$row->id_categoria])) {
                $catCounts[$row->id_categoria] += $count;

                continue;
            }

            $text = mb_strtolower(str_replace("\u{00A0}", ' ', trim(($row->servicio ?? '') . ' ' . ($row->servicio_texto ?? ''))));

            $targetCat = match (true) {
                str_contains($text, 'informática') || str_contains($text, 'informatica') || str_contains($text, 'internet') || str_contains($text, 'entretenimiento') || str_contains($text, 'emisora') || str_contains($text, 'navegaci') => $catByKey['conectividad'],
                str_contains($text, 'capacita') || str_contains($text, 'tarea') || str_contains($text, 'taller') || str_contains($text, 'curso') || str_contains($text, 'formaci') || str_contains($text, 'inducci') => $catByKey['capacitacion'],
                str_contains($text, 'salón') || str_contains($text, 'salon') || str_contains($text, 'sala') || str_contains($text, 'espacio') || str_contains($text, 'reuni') || str_contains($text, 'prestamo') || str_contains($text, 'préstamo') => $catByKey['salas'],
                str_contains($text, 'gobierno') || str_contains($text, 'trámite') || str_contains($text, 'tramite') || str_contains($text, 'sisben') || str_contains($text, 'dian') || str_contains($text, 'adres') || str_contains($text, 'antecedentes') || str_contains($text, 'impuesto') => $catByKey['tramites'],
                str_contains($text, 'impres') || str_contains($text, 'copia') || str_contains($text, 'escan') || str_contains($text, 'digitaliz') => $catByKey['impresion'],
                default => $catByKey['conectividad'] ?? $categories->first(),
            };

            if ($targetCat) {
                $catCounts[$targetCat->id_categoria] += $count;
            }
        }

        // Sumar los asistentes a cursos y préstamos de sala a la categoría de Salas
        if (isset($catByKey['salas']) && isset($catCounts[$catByKey['salas']->id_categoria])) {
            $loansQuery = $this->withEffectiveRoomLoanAttendees(RoomLoan::query());
            if ($targetPointIds) {
                $loansQuery->where(function ($sub) use ($targetPointIds) {
                    $sub->whereIn('prestamo_sala.id_punto', $targetPointIds)->orWhereIn('prestamo_sala.id_puntos', $targetPointIds);
                });
            }
            $dateLoanCol = DB::raw('COALESCE(NULLIF(prestamo_sala.fecha_prestamo, "0000-00-00"), DATE(prestamo_sala.created_at))');
            $asistentesSalas = (int) ($loansQuery
                ->whereBetween($dateLoanCol, [$startDate->toDateString(), $endDate->toDateString()])
                ->selectRaw("COALESCE(SUM({$this->effectiveAttendeesSql()}), 0) as total_eff")
                ->value('total_eff') ?? 0);
            $catCounts[$catByKey['salas']->id_categoria] += $asistentesSalas;
        }

        return $categories
            ->map(function ($cat) use ($catCounts, $totalVisitas) {
                $count = $catCounts[$cat->id_categoria] ?? 0;
                $pct = $totalVisitas > 0 ? round(($count / $totalVisitas) * 100, 1) : 0;

                return [
                    'id_categoria' => $cat->id_categoria,
                    'nombre' => $cat->nombre,
                    'color' => $cat->color,
                    'icono' => $cat->icono,
                    'total_visitas' => $count,
                    'porcentaje' => $pct,
                ];
            })
            ->filter(fn ($c) => $c['total_visitas'] > 0)
            ->sortByDesc('total_visitas')
            ->values()
            ->toArray();
    }
}
