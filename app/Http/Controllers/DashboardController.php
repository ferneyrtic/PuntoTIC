<?php

namespace App\Http\Controllers;

use App\Models\Point;
use App\Models\Training;
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

        $points = Cache::remember('welcome_points_list_v3', 600, function () {
            $rawPoints = Point::where('activo', true)
                ->whereNotIn('id_punto', [5, 6])
                ->get(['id_punto', 'nombre_punto', 'zona', 'direccion', 'barrio_vereda', 'telefono'])
                ->toArray();

            $sedesMeta = [
                1 => [
                    'alias' => 'Sede Juan Rozo (PVD PLUS)',
                    'barrio' => 'Centro / I.E. Juan Rozo',
                    'direccion' => 'Calle 13 # 18-45',
                    'equipos' => '28 Computadores Portátiles · Proyector Interactivo · Fibra Óptica 300 Mbps',
                    'horario' => 'Lunes a Viernes: 8:00 AM - 12:00 M y 2:00 PM - 6:00 PM',
                    'map_query' => 'Institucion Educativa Juan Rozo, Acacias, Meta',
                    'badge' => 'Sede PLUS Urbana',
                    'tipo_sede' => 'Urbana',
                    'imagen' => 'images/sedes/sede_juan_rozo.jpg',
                ],
                2 => [
                    'alias' => 'Sede Las Colinas (PVD Tradicional)',
                    'barrio' => 'Barrio Las Colinas',
                    'direccion' => 'Carrera 20 # 14-30',
                    'equipos' => '24 Equipos de Cómputo · Sala de Capacitación · Conectividad Dedicada',
                    'horario' => 'Lunes a Viernes: 8:00 AM - 12:00 M y 2:00 PM - 6:00 PM',
                    'map_query' => 'Barrio Las Colinas, Acacias, Meta',
                    'badge' => 'Sede Urbana',
                    'tipo_sede' => 'Urbana',
                    'imagen' => 'images/sedes/sede_las_colinas.jpg',
                ],
                3 => [
                    'alias' => 'Aula Digital Vereda Dinamarca',
                    'barrio' => 'Vereda Dinamarca',
                    'direccion' => 'Corregimiento Dinamarca · I.E. Dinamarca',
                    'equipos' => '16 Equipos Portátiles · Conectividad Satelital / Fibra Rural · Espacio Comunal',
                    'horario' => 'Lunes a Viernes: 8:00 AM - 1:00 PM y Jornadas Comunitarias',
                    'map_query' => 'Vereda Dinamarca, Acacias, Meta',
                    'badge' => 'Aula Rural',
                    'tipo_sede' => 'Rural',
                    'imagen' => 'images/sedes/sede_dinamarca.jpg',
                ],
                4 => [
                    'alias' => 'Aula Digital Vereda Chichimene',
                    'barrio' => 'Vereda Chichimene',
                    'direccion' => 'Vereda Chichimene · Caserío Principal',
                    'equipos' => '18 Equipos de Cómputo · Internet de Alta Velocidad · Sala de Reuniones JAC',
                    'horario' => 'Lunes a Viernes: 8:00 AM - 1:00 PM y Talleres Sábados',
                    'map_query' => 'Vereda Chichimene, Acacias, Meta',
                    'badge' => 'Aula Rural',
                    'tipo_sede' => 'Rural',
                    'imagen' => 'images/sedes/sede_chichimene.jpg',
                ],
            ];

            return array_map(function ($p) use ($sedesMeta) {
                $meta = $sedesMeta[$p['id_punto']] ?? [];

                return array_merge($p, $meta);
            }, $rawPoints);
        });

        $capacitaciones = Training::with('punto')
            ->active()
            ->orderBy('destacado', 'desc')
            ->orderBy('fecha_inicio', 'asc')
            ->get();

        return Inertia::render('Welcome', [
            'points' => $points,
            'capacitaciones' => $capacitaciones,
            'statsSummary' => [
                'ciudadanos' => 23976,
                'atenciones' => 158147,
                'sedes_activas' => count($points),
                'costo' => '100% Gratuito',
            ],
        ]);
    }

    public function index(Request $request): Response|RedirectResponse
    {
        if ($request->user()?->hasRole(['Usuario', 'Ciudadano']) || $request->user()?->es_usuario_ciudadano) {
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
