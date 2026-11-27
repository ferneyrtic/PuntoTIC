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

        $points = Cache::remember('welcome_points_list_v6', 600, function () {
            $rawPoints = Point::where('activo', true)
                ->whereNotIn('id_punto', [5, 6])
                ->get(['id_punto', 'nombre_punto', 'zona', 'direccion', 'barrio_vereda', 'telefono'])
                ->toArray();

            $sedesMeta = [
                1 => [
                    'alias' => 'PVD PLUS',
                    'subtitulo' => 'Sede Juan Rozo',
                    'barrio' => 'Centro / I.E. Juan Rozo',
                    'direccion' => 'Calle 13 # 18-45',
                    'equipos' => '28 Computadores Portátiles · Proyector Interactivo · Fibra Óptica 300 Mbps',
                    'horario' => 'Lun - Vie: 8:00 AM - 12:00 M y 2:00 PM - 6:00 PM · Sáb: 9:00 AM - 12:00 M',
                    'map_query' => 'Punto Vive Digital Plus Acacias Meta',
                    'map_url' => 'https://www.google.com/maps/place/Punto+Vive+Digital+Plus+Acac%C3%ADas+Meta/@3.9920474,-73.7494067,18.13z/data=!4m9!1m2!2m1!1sBarrio+Las+Colinas,+Acacias,+Meta!3m5!1s0x8e3e39ae66661c2f:0xdde3258583992c24!8m2!3d3.9928138!4d-73.7479761!16s%2Fg%2F11tx0zrktw',
                    'badge' => 'Sede PLUS Urbana',
                    'tipo_sede' => 'Urbana',
                    'imagen' => 'images/sedes/sede_juan_rozo.jpg?v=2',
                ],
                2 => [
                    'alias' => 'PVD Tradicional',
                    'subtitulo' => 'Sede Las Colinas',
                    'barrio' => 'Barrio Las Colinas',
                    'direccion' => 'Carrera 20 # 14-30',
                    'equipos' => '24 Equipos de Cómputo · Sala de Capacitación · Conectividad Dedicada',
                    'horario' => 'Lun - Vie: 8:00 AM - 12:00 M y 2:00 PM - 6:00 PM · Sáb: 9:00 AM - 12:00 M',
                    'map_query' => 'Punto Vive Digital Tradicional',
                    'map_url' => 'https://www.google.com/maps/place/Punto+Vive+Digital+Tradicional/@3.9918633,-73.7864848,17z/data=!4m9!1m2!2m1!1sBarrio+Las+Colinas,+Acacias,+Meta!3m5!1s0x8e3e392e0657f5a3:0xf42524670c7be9db!8m2!3d3.9918621!4d-73.7836426!16s%2Fg%2F11cn6bmpyl',
                    'badge' => 'Sede Urbana',
                    'tipo_sede' => 'Urbana',
                    'imagen' => 'images/sedes/sede_las_colinas.jpg?v=2',
                ],
                3 => [
                    'alias' => 'Aula Digital',
                    'subtitulo' => 'Vereda Dinamarca',
                    'barrio' => 'Vereda Dinamarca',
                    'direccion' => 'Corregimiento Dinamarca · I.E. Dinamarca',
                    'equipos' => '16 Equipos Portátiles · Conectividad Satelital / Fibra Rural · Espacio Comunal',
                    'horario' => 'Lun - Vie: 8:00 AM - 12:00 M y 2:00 PM - 6:00 PM · Sáb: 9:00 AM - 12:00 M',
                    'map_query' => 'Aula Digital de Dinamarca',
                    'map_url' => 'https://www.google.com/maps/place/Aula+Digital+de+Dinamarca/@3.8996342,-73.4707674,18.57z/data=!4m15!1m8!3m7!1s0x8e3e1ffe857b8803:0x333b3f5bf05e8e97!2sDinamarca,+Acac%C3%ADas,+Meta!3b1!8m2!3d3.897552!4d-73.468692!16s%2Fg%2F11bc8db1m8!3m5!1s0x8e3e1f005e718c5b:0x2b926f1854556ade!8m2!3d3.8993583!4d-73.4700706!16s%2Fg%2F11vwsbnrh7',
                    'badge' => 'Aula Rural',
                    'tipo_sede' => 'Rural',
                    'imagen' => 'images/sedes/sede_dinamarca.jpg?v=2',
                ],
                4 => [
                    'alias' => 'Aula Digital',
                    'subtitulo' => 'Vereda Chichimene',
                    'barrio' => 'Vereda Chichimene',
                    'direccion' => 'Vereda Chichimene · Caserío Principal',
                    'equipos' => '18 Equipos de Cómputo · Internet de Alta Velocidad · Sala de Reuniones JAC',
                    'horario' => 'Lun - Vie: 8:00 AM - 12:00 M y 2:00 PM - 6:00 PM · Sáb: 9:00 AM - 12:00 M',
                    'map_query' => '3.9149956525963274,-73.68419759439956',
                    'map_url' => 'https://www.google.com/maps/search/?api=1&query=3.9149956525963274,-73.68419759439956',
                    'badge' => 'Aula Rural',
                    'tipo_sede' => 'Rural',
                    'imagen' => 'images/sedes/sede_chichimene.jpg?v=2',
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
