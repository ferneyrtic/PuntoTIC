<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Point;
use App\Models\Setting;
use App\Models\Visit;
use App\Services\MLService;
use App\Services\StatsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        protected StatsService $statsService,
        protected MLService $mlService
    ) {}

    public function index(Request $request): Response|RedirectResponse
    {
        if ($request->user()?->hasRole(['Usuario', 'Ciudadano'])) {
            return redirect()->route('portal.index');
        }

        $rawPoint = $request->get('id_punto');
        $rawZona = $request->get('zona');
        $periodo = $request->get('periodo', 'mes');
        $fechaDesde = $request->get('fecha_desde');
        $fechaHasta = $request->get('fecha_hasta');

        $pointId = null;
        $zona = null;
        $user = $request->user();

        // Interpretación de selectores combinados
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
        } elseif ($rawPoint === null && $rawZona === null && $user && ! $user->hasRole('Administrador') && $user->id_punto) {
            // Gestores y Coordinadores inician por defecto con la vista de su propia sede
            $pointId = (int) $user->id_punto;
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
            $recentVisitsQuery->whereHas('punto', fn ($q) => $q->where('zona', $zona));
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

    /**
     * Actualización exclusiva de metas operativas mensuales por el Super Administrador.
     */
    public function updateMetas(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (! $user || ! $user->hasRole('Administrador')) {
            abort(403, 'Acceso denegado: únicamente el Super Administrador TIC puede modificar las metas operativas.');
        }

        $validated = $request->validate([
            'metas' => ['required', 'array'],
            'metas.1' => ['required', 'integer', 'min:1'],
            'metas.2' => ['required', 'integer', 'min:1'],
            'metas.3' => ['required', 'integer', 'min:1'],
            'metas.4' => ['required', 'integer', 'min:1'],
            'metas.consolidado' => ['required', 'integer', 'min:1'],
        ]);

        Setting::set('metas_mensuales_sedes', $validated['metas'], 'json', 'Metas mensuales de atenciones por sede');

        AuditLog::registrar(
            accion: 'ACTUALIZAR_METAS',
            modulo: 'configuracion',
            registroId: 'metas_mensuales',
            antiguos: null,
            nuevos: $validated['metas']
        );

        return back()->with('success', 'Metas operativas mensuales actualizadas exitosamente.');
    }
}
