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
        $user = $request->user();
        $pointId = $request->get('id_punto', $user?->id_punto);

        $stats = $this->statsService->getDashboardStats($pointId);
        $churnAlerts = $this->mlService->getCitizensAtRiskOfChurn(5);
        $tomorrowLoad = $this->mlService->predictTomorrowLoad($pointId);

        $recentVisits = Visit::with(['ciudadano', 'punto', 'categoria', 'subcategoria', 'gestor'])
            ->when($pointId, fn($q) => $q->where('id_punto', $pointId))
            ->latest('created_at')
            ->limit(7)
            ->get();

        $points = Point::where('activo', true)->get(['id_punto', 'nombre_punto', 'codigo', 'zona']);

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'churnAlerts' => $churnAlerts,
            'tomorrowLoad' => $tomorrowLoad,
            'recentVisits' => $recentVisits,
            'points' => $points,
            'selectedPointId' => $pointId ? (int) $pointId : null,
        ]);
    }
}
