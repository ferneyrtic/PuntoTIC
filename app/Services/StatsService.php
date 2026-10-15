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
use Illuminate\Support\Facades\DB;

class StatsService
{
    /**
     * Resumen completo de métricas del Dashboard con soporte de ámbitos y períodos.
     *
     * @param array|int|null $params Filtros del dashboard (point_id, zona, periodo, fecha_desde, fecha_hasta)
     */
    public function getDashboardStats(array|int|null $params = null): array
    {
        // Normalización retrocompatible
        if (is_int($params) || is_null($params)) {
            $filters = ['point_id' => $params];
        } else {
            $filters = $params;
        }

        $pointId = !empty($filters['point_id']) ? (int) $filters['point_id'] : null;
        $zona = !empty($filters['zona']) && in_array($filters['zona'], ['Urbana', 'Rural']) ? $filters['zona'] : null;

        // Si se selecciona un punto específico, la zona queda implícita por ese punto
        if ($pointId) {
            $zona = null;
        }

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
        $comparativaSedes = $this->calculateSedeComparison($startDate, $endDate);

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
        $periodo = $filters['periodo'] ?? 'mes';
        $now = Carbon::now();

        switch ($periodo) {
            case 'hoy':
                $start = Carbon::today()->startOfDay();
                $end = Carbon::today()->endOfDay();
                $label = 'Hoy (' . $start->format('d/m/Y') . ')';
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
                $label = 'Año ' . $now->year;
                break;

            case 'custom':
                $start = !empty($filters['fecha_desde'])
                    ? Carbon::parse($filters['fecha_desde'])->startOfDay()
                    : Carbon::now()->startOfMonth();
                $end = !empty($filters['fecha_hasta'])
                    ? Carbon::parse($filters['fecha_hasta'])->endOfDay()
                    : Carbon::now()->endOfDay();
                $label = $start->format('d/m/Y') . ' - ' . $end->format('d/m/Y');
                break;

            case 'mes':
            default:
                $periodo = 'mes';
                $start = Carbon::now()->startOfMonth();
                $end = Carbon::now()->endOfDay();
                $label = ucfirst($now->locale('es')->monthName) . ' ' . $now->year;
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

        $deltaVisitasHoy = $visitasAyer > 0
            ? round((($visitasHoy - $visitasAyer) / $visitasAyer) * 100)
            : ($visitasHoy > 0 ? 100 : 0);

        // Ciudadanos únicos en el período
        $ciudadanosUnicos = (clone $visitasQuery)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('id_form_pvd')
            ->distinct('id_form_pvd')
            ->count('id_form_pvd');

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

        // Préstamos de salas en el período
        $prestamosQuery = RoomLoan::query();
        if ($targetPointIds) {
            $prestamosQuery->whereIn('id_punto', $targetPointIds);
        }
        $prestamosPeriodo = (clone $prestamosQuery)
            ->whereBetween('fecha_prestamo', [$startDate->toDateString(), $endDate->toDateString()])
            ->count();
        $asistentesPeriodo = (int) (clone $prestamosQuery)
            ->whereBetween('fecha_prestamo', [$startDate->toDateString(), $endDate->toDateString()])
            ->sum('num_asistentes');
        $prestamosHoy = (clone $prestamosQuery)
            ->whereDate('fecha_prestamo', Carbon::today())
            ->count();

        return [
            'visitas_periodo' => $visitasPeriodo,
            'visitas_hoy' => $visitasHoy,
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
            'visitas_mes' => $visitasPeriodo,
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
            $rawHourly = (clone $query)
                ->selectRaw("strftime('%H', created_at) as hora, count(*) as total")
                ->groupBy(DB::raw("strftime('%H', created_at)"))
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

        // Si es 'ano' o 'trimestre', agrupamos por mes
        if ($periodoKey === 'ano' || $periodoKey === 'trimestre') {
            $rawMonthly = (clone $query)
                ->selectRaw("substr(created_at, 1, 7) as mes, count(*) as total")
                ->groupBy(DB::raw("substr(created_at, 1, 7)"))
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
            ->selectRaw("substr(created_at, 1, 10) as fecha, count(*) as total")
            ->groupBy(DB::raw("substr(created_at, 1, 10)"))
            ->pluck('total', 'fecha')
            ->toArray();

        $series = [];
        $cursor = $startDate->copy()->startOfDay();
        // Limitamos a máximo 31 días en el gráfico diario para evitar saturación
        if ($cursor->diffInDays($endDate) > 31) {
            $cursor = $endDate->copy()->subDays(30)->startOfDay();
        }

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
    protected function calculateSedeComparison(Carbon $startDate, Carbon $endDate): array
    {
        $allPoints = Point::where('activo', true)->get();

        // Visitas por punto en el período
        $visitsByPoint = Visit::whereBetween('created_at', [$startDate, $endDate])
            ->select('id_punto', DB::raw('count(*) as total'))
            ->groupBy('id_punto')
            ->pluck('total', 'id_punto')
            ->toArray();

        // Impresiones por punto en el período
        $printsByPoint = PrintRecord::whereBetween('created_at', [$startDate, $endDate])
            ->select('id_punto', DB::raw('sum(numero_hojas) as total'))
            ->groupBy('id_punto')
            ->pluck('total', 'id_punto')
            ->toArray();

        // Préstamos por punto en el período
        $loansByPoint = RoomLoan::whereBetween('fecha_prestamo', [$startDate->toDateString(), $endDate->toDateString()])
            ->select('id_punto', DB::raw('count(*) as total_prestamos, sum(num_asistentes) as total_asistentes'))
            ->groupBy('id_punto')
            ->get()
            ->keyBy('id_punto');

        $totalMunicipal = array_sum($visitsByPoint) ?: 1;

        return $allPoints->map(function ($p) use ($visitsByPoint, $printsByPoint, $loansByPoint, $totalMunicipal) {
            $visitas = $visitsByPoint[$p->id_punto] ?? 0;
            $hojas = (int) ($printsByPoint[$p->id_punto] ?? 0);
            $prestamoInfo = $loansByPoint->get($p->id_punto);
            $prestamos = $prestamoInfo ? (int) $prestamoInfo->total_prestamos : 0;
            $asistentes = $prestamoInfo ? (int) $prestamoInfo->total_asistentes : 0;
            $porcentaje = round(($visitas / $totalMunicipal) * 100, 1);

            return [
                'id_punto' => $p->id_punto,
                'nombre_punto' => $p->nombre_punto,
                'codigo' => $p->codigo,
                'zona' => $p->zona,
                'es_aula_digital' => $p->es_aula_digital,
                'total_visitas' => $visitas,
                'total_hojas' => $hojas,
                'total_prestamos' => $prestamos,
                'total_asistentes' => $asistentes,
                'porcentaje' => $porcentaje,
            ];
        })->sortByDesc('total_visitas')->values()->toArray();
    }

    /**
     * Estadísticas de Trámites en Línea (Top trámites y solicitudes).
     */
    protected function calculateTramitesStats(?array $targetPointIds, Carbon $startDate, Carbon $endDate): array
    {
        $query = Visit::query()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where(function ($q) {
                $q->where('id_categoria', 1) // Trámites en Línea
                  ->orWhereNotNull('id_subcategoria')
                  ->orWhereNotNull('servicio_texto');
            });

        if ($targetPointIds) {
            $query->whereIn('id_punto', $targetPointIds);
        }

        $totalTramites = (clone $query)->count();

        // Conteo agrupado por subcategoría
        $subCounts = (clone $query)
            ->whereNotNull('id_subcategoria')
            ->select('id_subcategoria', DB::raw('count(*) as total'))
            ->groupBy('id_subcategoria')
            ->pluck('total', 'id_subcategoria')
            ->toArray();

        $subcategories = SubCategory::whereIn('id_subcategoria', array_keys($subCounts))
            ->get(['id_subcategoria', 'nombre'])
            ->map(function ($sub) use ($subCounts, $totalTramites) {
                $count = $subCounts[$sub->id_subcategoria] ?? 0;
                $pct = $totalTramites > 0 ? round(($count / $totalTramites) * 100, 1) : 0;
                return [
                    'id_subcategoria' => $sub->id_subcategoria,
                    'nombre' => $sub->nombre,
                    'total' => $count,
                    'porcentaje' => $pct,
                ];
            })
            ->sortByDesc('total')
            ->take(8)
            ->values()
            ->toArray();

        return [
            'total_atenciones' => $totalTramites,
            'top_tramites' => $subcategories,
        ];
    }

    /**
     * Estadísticas de Formación Digital y Demografía de Ciudadanos.
     */
    protected function calculateFormacionStats(?array $targetPointIds, Carbon $startDate, Carbon $endDate): array
    {
        $visitsQuery = Visit::query()->whereBetween('created_at', [$startDate, $endDate]);
        if ($targetPointIds) {
            $visitsQuery->whereIn('id_punto', $targetPointIds);
        }

        // Visitas de formación (categoría 4)
        $formacionVisitas = (clone $visitsQuery)->where('id_categoria', 4)->count();

        // Obtenemos los ciudadanos únicos atendidos en este período para la analítica demográfica
        $citizenIds = (clone $visitsQuery)
            ->whereNotNull('id_form_pvd')
            ->distinct('id_form_pvd')
            ->pluck('id_form_pvd')
            ->toArray();

        $citizens = Citizen::whereIn('id_form_pvd', $citizenIds)->get();
        $totalCitizens = $citizens->count() ?: 1;

        // 1. Demografía por Género
        $generoCounts = $citizens->groupBy('genero')->map->count();
        $generoStats = [
            'femenino' => $generoCounts['Femenino'] ?? 0,
            'masculino' => $generoCounts['Masculino'] ?? 0,
            'otro' => ($generoCounts['Otro'] ?? 0) + ($generoCounts['No especificado'] ?? 0),
        ];

        // 2. Demografía por Grupos Etarios
        $etarios = [
            'jovenes' => 0,      // 14 - 28 años
            'adultos' => 0,      // 29 - 59 años
            'adulto_mayor' => 0, // 60+ años
            'ninos' => 0,        // 0 - 13 años
        ];

        foreach ($citizens as $c) {
            $edad = (int) $c->edad;
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

        // 3. Demografía por Nivel Educativo
        $educacion = $citizens->groupBy(fn($c) => $c->nivel_educativo ?: 'Sin Registrar')
            ->map(fn($group) => $group->count())
            ->sortDesc()
            ->take(5)
            ->toArray();

        // 4. Demografía por Zona de Origen
        $zonaOrigen = [
            'urbana' => $citizens->where('zona', 'Urbana')->count(),
            'rural' => $citizens->where('zona', 'Rural')->count(),
        ];

        return [
            'total_formacion_visitas' => $formacionVisitas,
            'total_ciudadanos_analizados' => $citizens->count(),
            'genero' => $generoStats,
            'grupos_edad' => $etarios,
            'nivel_educativo' => $educacion,
            'zona_residencia' => $zonaOrigen,
        ];
    }

    /**
     * Estadísticas de Préstamos de Salas y Espacios Comunitarios.
     */
    protected function calculateSalasStats(?array $targetPointIds, Carbon $startDate, Carbon $endDate): array
    {
        $query = RoomLoan::query()
            ->whereBetween('fecha_prestamo', [$startDate->toDateString(), $endDate->toDateString()]);

        if ($targetPointIds) {
            $query->whereIn('id_punto', $targetPointIds);
        }

        $totalEventos = (clone $query)->count();
        $totalAsistentes = (int) (clone $query)->sum('num_asistentes');
        $promedioAsistentes = $totalEventos > 0 ? round($totalAsistentes / $totalEventos) : 0;

        // Desglose por tipo de actividad
        $porTipo = (clone $query)
            ->select('tipo_actividad', DB::raw('count(*) as eventos, sum(num_asistentes) as asistentes'))
            ->groupBy('tipo_actividad')
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
        $visitsQuery = Visit::whereBetween('created_at', [$startDate, $endDate]);
        if ($targetPointIds) {
            $visitsQuery->whereIn('id_punto', $targetPointIds);
        }

        $visitsByCategory = (clone $visitsQuery)
            ->select('id_categoria', DB::raw('count(*) as total'))
            ->groupBy('id_categoria')
            ->pluck('total', 'id_categoria')
            ->toArray();

        return Category::all()
            ->map(function ($cat) use ($visitsByCategory, $totalVisitas) {
                $count = $visitsByCategory[$cat->id_categoria] ?? 0;
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
            ->sortByDesc('total_visitas')
            ->values()
            ->toArray();
    }
}
