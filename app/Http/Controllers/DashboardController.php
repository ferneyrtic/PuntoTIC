<?php

namespace App\Http\Controllers;

use App\Models\Point;
use App\Models\Visit;
use App\Services\MLService;
use App\Services\StatsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        protected StatsService $statsService,
        protected MLService $mlService
    ) {}

    public function welcome(): Response|RedirectResponse
    {
        if (Auth::check()) {
            $user = Auth::user();
            if ($user->hasRole(['Usuario', 'Ciudadano']) || $user->es_usuario_ciudadano) {
                return redirect()->route('portal.index');
            }

            return redirect()->route('dashboard');
        }

        $points = Cache::remember('welcome_points_list_v1', 1800, function () {
            return Point::where('activo', true)
                ->whereNotIn('id_punto', [5, 6])
                ->get(['id_punto', 'nombre_punto', 'zona', 'direccion'])
                ->toArray();
        });

        return Inertia::render('Welcome', [
            'points' => $points,
        ]);
    }

    public function index(Request $request): Response|RedirectResponse
    {
        if ($request->user()?->hasRole(['Usuario', 'Ciudadano'])) {
            return redirect()->route('portal.index');
        }

        $rawPoint = $request->get('id_punto');
        $rawZona = $request->get('zona');
        $fechaDesde = $request->get('fecha_desde');
        $fechaHasta = $request->get('fecha_hasta');
        $periodo = $request->get('periodo');
        if (! $periodo) {
            $periodo = ($fechaDesde || $fechaHasta) ? 'custom' : 'mes';
        }

        $pointId = null;
        $zona = null;
        $user = $request->user();
        $isGlobal = $user ? $user->tieneAlcanceGlobal() : false;

        // Interpretación de selectores de ámbito según permisos
        if (! $isGlobal && $user && $user->id_punto) {
            // Gestores/encargados de sede específica: bloqueados estrictamente a su punto
            $pointId = (int) $user->id_punto;
            $zona = null;
        } else {
            // Usuario con alcance global (David Mesa, Admin TIC, Coordinador General, Gestor Global)
            if ($rawPoint === 'all' || $rawPoint === 'null') {
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

        $allPoints = collect(Cache::remember('dashboard_active_points_v1', 600, function () {
            return Point::where('activo', true)->get(['id_punto', 'nombre_punto', 'codigo', 'zona'])->toArray();
        }));

        $recentVisitsQuery = Visit::with(['ciudadano', 'punto', 'categoria', 'subcategoria', 'gestor']);
        if ($pointId) {
            $recentVisitsQuery->where('id_punto', $pointId);
        } elseif ($zona) {
            $zonaIds = $allPoints->where('zona', $zona)->pluck('id_punto')->all();
            $recentVisitsQuery->whereIn('id_punto', ! empty($zonaIds) ? $zonaIds : [-1]);
        }
        $recentVisits = $recentVisitsQuery->latest('created_at')->limit(8)->get();

        $points = (! $isGlobal && $user && $user->id_punto)
            ? $allPoints->where('id_punto', (int) $user->id_punto)->values()->all()
            : $allPoints->values()->all();

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'churnAlerts' => $churnAlerts,
            'tomorrowLoad' => $tomorrowLoad,
            'recentVisits' => $recentVisits,
            'points' => $points,
            'canSelectScope' => $isGlobal,
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
