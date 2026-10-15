<?php

namespace App\Http\Controllers;

use App\Models\Point;
use App\Models\Visit;
use App\Services\MLService;
use App\Services\StatsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        protected StatsService $statsService,
        protected MLService $mlService
    ) {}

    public function index(Request $request): Response
    {
        $rawPoint = $request->get('id_punto');
        $rawZona = $request->get('zona');
        $periodo = $request->get('periodo', 'mes');
        $fechaDesde = $request->get('fecha_desde');
        $fechaHasta = $request->get('fecha_hasta');

        $pointId = null;
        $zona = null;

        // Interpretación de selectores combinados
        if ($rawPoint === 'all' || $rawPoint === '' || $rawPoint === 'null') {
            $pointId = null;
            $zona = null;
        } elseif ($rawPoint === 'zona_rural' || $rawZona === 'Rural') {
            $pointId = null;
            $zona = 'Rural';
        } elseif ($rawPoint === 'zona_urbana' || $rawZona === 'Urbana') {
            $pointId = null;
            $zona = 'Urbana';
        } elseif (is_numeric($rawPoint)) {
            $pointId = (int) $rawPoint;
            $zona = null;
        }

        $stats = $this->statsService->getDashboardStats([
            'point_id' => $pointId,
            'zona' => $zona,
            'periodo' => $periodo,
            'fecha_desde' => $fechaDesde,
            'fecha_hasta' => $fechaHasta,
        ]);

        $churnAlerts = $this->mlService->getCitizensAtRiskOfChurn(5);
        $tomorrowLoad = $this->mlService->predictTomorrowLoad($pointId);

        $recentVisitsQuery = Visit::with(['ciudadano', 'punto', 'categoria', 'subcategoria', 'gestor']);
        if ($pointId) {
            $recentVisitsQuery->where('id_punto', $pointId);
        } elseif ($zona) {
            $recentVisitsQuery->whereHas('punto', fn($q) => $q->where('zona', $zona));
        }
        $recentVisits = $recentVisitsQuery->latest('created_at')->limit(8)->get();

        $points = Point::where('activo', true)
            ->get(['id_punto', 'nombre_punto', 'codigo', 'zona']);

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'churnAlerts' => $churnAlerts,
            'tomorrowLoad' => $tomorrowLoad,
            'recentVisits' => $recentVisits,
            'points' => $points,
            'filters' => [
                'id_punto' => $pointId,
                'zona' => $zona,
                'periodo' => $periodo,
                'fecha_desde' => $fechaDesde,
                'fecha_hasta' => $fechaHasta,
            ],
            'selectedPointId' => $pointId,
        ]);
    }
}
