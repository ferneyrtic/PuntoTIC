<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Citizen;
use App\Models\Point;
use App\Models\PrintRecord;
use App\Models\RoomLoan;
use App\Models\Visit;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class StatsService
{
    /**
     * Resumen completo de métricas del Dashboard.
     */
    public function getDashboardStats(?int $pointId = null): array
    {
        $today = Carbon::today();
        $todayStart = $today->copy()->startOfDay();
        $todayEnd = $today->copy()->endOfDay();
        $yesterdayStart = Carbon::yesterday()->startOfDay();
        $yesterdayEnd = Carbon::yesterday()->endOfDay();
        $thisMonthStart = Carbon::now()->startOfMonth();
        $lastMonthStart = Carbon::now()->subMonth()->startOfMonth();
        $lastMonthEnd = Carbon::now()->subMonth()->endOfMonth();

        // Visitas Hoy (rango indexado)
        $visitasHoy = Visit::when($pointId, fn($q) => $q->where('id_punto', $pointId))
            ->whereBetween('created_at', [$todayStart, $todayEnd])
            ->count();

        // Visitas Ayer (para calcular delta %)
        $visitasAyer = Visit::when($pointId, fn($q) => $q->where('id_punto', $pointId))
            ->whereBetween('created_at', [$yesterdayStart, $yesterdayEnd])
            ->count();

        $deltaVisitasHoy = $visitasAyer > 0
            ? round((($visitasHoy - $visitasAyer) / $visitasAyer) * 100)
            : ($visitasHoy > 0 ? 100 : 0);

        // Visitas Este Mes (rango indexado)
        $visitasMes = Visit::when($pointId, fn($q) => $q->where('id_punto', $pointId))
            ->where('created_at', '>=', $thisMonthStart)
            ->count();

        // Visitas Mes Anterior
        $visitasMesAnterior = Visit::when($pointId, fn($q) => $q->where('id_punto', $pointId))
            ->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])
            ->count();

        // Impresiones Hoy y Mes
        $impresionesHoyHojas = PrintRecord::when($pointId, fn($q) => $q->where('id_punto', $pointId))
            ->whereBetween('created_at', [$todayStart, $todayEnd])
            ->sum('numero_hojas');

        $impresionesMesHojas = PrintRecord::when($pointId, fn($q) => $q->where('id_punto', $pointId))
            ->where('created_at', '>=', $thisMonthStart)
            ->sum('numero_hojas');

        // Total Ciudadanos Registrados
        $totalCiudadanos = Citizen::when($pointId, fn($q) => $q->where('id_punto', $pointId))->count();
        $ciudadanosEstaSemana = Citizen::when($pointId, fn($q) => $q->where('id_punto', $pointId))
            ->where('created_at', '>=', Carbon::now()->startOfWeek())
            ->count();

        // Préstamos Activos / Hoy
        $prestamosHoy = RoomLoan::when($pointId, fn($q) => $q->where('id_punto', $pointId))
            ->whereDate('fecha_prestamo', $today)
            ->count();

        // Serie de 7 días para el gráfico (1 sola consulta agregada)
        $sevenDaysAgo = Carbon::today()->subDays(6)->startOfDay();
        $rawVisits = Visit::when($pointId, fn($q) => $q->where('id_punto', $pointId))
            ->where('created_at', '>=', $sevenDaysAgo)
            ->selectRaw("substr(created_at, 1, 10) as fecha, count(*) as total")
            ->groupBy(DB::raw("substr(created_at, 1, 10)"))
            ->pluck('total', 'fecha')
            ->toArray();

        $chart7Days = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $dateStr = $date->toDateString();
            $count = $rawVisits[$dateStr] ?? 0;

            $chart7Days[] = [
                'dia' => $date->locale('es')->isoFormat('ddd'),
                'fecha' => $dateStr,
                'visitas' => $count,
                'es_hoy' => $i === 0,
            ];
        }

        // Distribución por Categorías (1 sola consulta agregada)
        $visitsByCategory = Visit::when($pointId, fn($q) => $q->where('id_punto', $pointId))
            ->where('created_at', '>=', $thisMonthStart)
            ->select('id_categoria', DB::raw('count(*) as total'))
            ->groupBy('id_categoria')
            ->pluck('total', 'id_categoria')
            ->toArray();

        $catDistribution = Category::all()
            ->map(function ($cat) use ($visitsByCategory, $visitasMes) {
                $count = $visitsByCategory[$cat->id_categoria] ?? 0;
                $pct = $visitasMes > 0 ? round(($count / $visitasMes) * 100, 1) : 0;
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
            ->values();

        // Distribución por Puntos PVD (1 sola consulta agregada)
        $visitsByPoint = Visit::where('created_at', '>=', $thisMonthStart)
            ->select('id_punto', DB::raw('count(*) as total'))
            ->groupBy('id_punto')
            ->pluck('total', 'id_punto')
            ->toArray();

        $puntosStats = Point::where('activo', true)
            ->get()
            ->map(function ($p) use ($visitsByPoint) {
                return [
                    'id_punto' => $p->id_punto,
                    'nombre_punto' => $p->nombre_punto,
                    'zona' => $p->zona,
                    'total_visitas' => $visitsByPoint[$p->id_punto] ?? 0,
                ];
            })
            ->sortByDesc('total_visitas')
            ->values();

        return [
            'kpis' => [
                'visitas_hoy' => $visitasHoy,
                'delta_visitas_hoy' => $deltaVisitasHoy,
                'visitas_mes' => $visitasMes,
                'impresiones_hoy_hojas' => (int) $impresionesHoyHojas,
                'impresiones_mes_hojas' => (int) $impresionesMesHojas,
                'total_ciudadanos' => $totalCiudadanos,
                'ciudadanos_esta_semana' => $ciudadanosEstaSemana,
                'prestamos_hoy' => $prestamosHoy,
            ],
            'chart_7_dias' => $chart7Days,
            'distribucion_categorias' => $catDistribution,
            'distribucion_puntos' => $puntosStats,
        ];
    }
}
