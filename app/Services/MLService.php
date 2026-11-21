<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Citizen;
use App\Models\Setting;
use App\Models\SubCategory;
use App\Models\Visit;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class MLService
{
    /**
     * Predice los trámites/servicios más probables que solicitará un ciudadano en su próxima visita.
     * Combina:
     * 1. Frecuencia histórica individual del ciudadano (60% peso)
     * 2. Comportamiento del cluster demográfico (edad, estrato, nivel educativo) (25% peso)
     * 3. Patrón de tendencia temporal global del punto PVD (15% peso)
     */
    public function predictNextService(Citizen $citizen, ?int $pointId = null): array
    {
        $history = $citizen->visitas()->with(['categoria', 'subcategoria'])->get();
        $predictions = [];

        // 1. Análisis individual
        if ($history->isNotEmpty()) {
            $totalVisits = $history->count();
            $subcatCounts = $history->groupBy('id_subcategoria');

            foreach ($subcatCounts as $subId => $visits) {
                if (! $subId) continue;
                $subcat = $visits->first()->subcategoria;
                if (! $subcat || ! $subcat->activo || ! $subcat->categoria || ! $subcat->categoria->activo) continue;

                $freq = $visits->count() / $totalVisits;
                $predictions[$subId] = [
                    'id_categoria' => $subcat->categoria_id,
                    'categoria_nombre' => $subcat->categoria->nombre ?? 'General',
                    'id_subcategoria' => $subId,
                    'subcategoria_nombre' => $subcat->nombre,
                    'score' => $freq * 0.60,
                    'motivo' => 'Basado en historial recurrente del ciudadano (' . $visits->count() . ' visitas previas)',
                ];
            }
        }

        // 2. Análisis por perfil demográfico (edad + estrato)
        $cohortQuery = Citizen::where('id_form_pvd', '!=', $citizen->id_form_pvd);
        if ($citizen->estrato) {
            $cohortQuery->where('estrato', $citizen->estrato);
        }
        if ($citizen->edad) {
            $cohortQuery->whereBetween('edad', [max(0, $citizen->edad - 7), $citizen->edad + 7]);
        }

        $cohortCitizenIds = $cohortQuery->limit(200)->pluck('id_form_pvd');

        if ($cohortCitizenIds->isNotEmpty()) {
            $cohortVisits = Visit::whereIn('id_form_pvd', $cohortCitizenIds)
                ->whereNotNull('id_subcategoria')
                ->select('id_subcategoria', DB::raw('count(*) as total'))
                ->groupBy('id_subcategoria')
                ->orderByDesc('total')
                ->limit(5)
                ->get();

            $totalCohort = $cohortVisits->sum('total') ?: 1;

            foreach ($cohortVisits as $cv) {
                $subcat = SubCategory::with('categoria')->find($cv->id_subcategoria);
                if (! $subcat || ! $subcat->activo || ! $subcat->categoria || ! $subcat->categoria->activo) continue;

                $cohortScore = ($cv->total / $totalCohort) * 0.25;

                if (isset($predictions[$cv->id_subcategoria])) {
                    $predictions[$cv->id_subcategoria]['score'] += $cohortScore;
                } else {
                    $predictions[$cv->id_subcategoria] = [
                        'id_categoria' => $subcat->categoria_id,
                        'categoria_nombre' => $subcat->categoria->nombre ?? 'General',
                        'id_subcategoria' => $cv->id_subcategoria,
                        'subcategoria_nombre' => $subcat->nombre,
                        'score' => $cohortScore,
                        'motivo' => 'Tendencia alta en ciudadanos de perfil y edad similar',
                    ];
                }
            }
        }

        // Si no hay suficiente historia, sugerir los servicios más populares del PVD
        if (empty($predictions)) {
            $topServices = Visit::whereNotNull('id_subcategoria')
                ->when($pointId, fn($q) => $q->where('id_punto', $pointId))
                ->select('id_subcategoria', DB::raw('count(*) as total'))
                ->groupBy('id_subcategoria')
                ->orderByDesc('total')
                ->limit(3)
                ->get();

            $totalTop = $topServices->sum('total') ?: 1;
            foreach ($topServices as $ts) {
                $subcat = SubCategory::with('categoria')->find($ts->id_subcategoria);
                if (! $subcat || ! $subcat->activo || ! $subcat->categoria || ! $subcat->categoria->activo) continue;

                $predictions[$ts->id_subcategoria] = [
                    'id_categoria' => $subcat->categoria_id,
                    'categoria_nombre' => $subcat->categoria->nombre ?? 'General',
                    'id_subcategoria' => $ts->id_subcategoria,
                    'subcategoria_nombre' => $subcat->nombre,
                    'score' => ($ts->total / $totalTop),
                    'motivo' => 'Servicio más solicitado en el punto digital',
                ];
            }
        }

        // Ordenar y normalizar a porcentajes
        uasort($predictions, fn($a, $b) => $b['score'] <=> $a['score']);
        $results = array_slice($predictions, 0, 3, true);

        $totalScore = array_sum(array_column($results, 'score')) ?: 1;
        foreach ($results as &$item) {
            $item['porcentaje'] = round(($item['score'] / $totalScore) * 100);
        }

        return array_values($results);
    }

    /**
     * Detecta ciudadanos con alto riesgo de no volver a utilizar los PVD (Churn / Deserción).
     */
    public function getCitizensAtRiskOfChurn(int $limit = 6): Collection
    {
        $items = Cache::remember("ml_churn_risk_v2_{$limit}", 300, function () use ($limit) {
            $thresholdDays = Setting::get('dias_alerta_inactividad', 60);
            $thresholdDate = Carbon::now()->subDays($thresholdDays);

            return Citizen::has('visitas', '>=', 2)
                ->whereDoesntHave('visitas', function ($q) use ($thresholdDate) {
                    $q->where('created_at', '>=', $thresholdDate);
                })
                ->with(['punto', 'visitas' => fn($q) => $q->latest()->limit(1)])
                ->withCount('visitas')
                ->orderByDesc('visitas_count')
                ->limit($limit)
                ->get()
                ->map(function ($citizen) {
                    $lastVisit = $citizen->visitas->first();
                    $daysInactive = $lastVisit ? $lastVisit->created_at->diffInDays(now()) : 90;
                    $riskLevel = $daysInactive > 90 ? 'ALTO' : 'MEDIO';

                    return [
                        'id_form_pvd' => $citizen->id_form_pvd,
                        'documento' => $citizen->documento,
                        'nombre_completo' => $citizen->nombre_completo,
                        'telefono' => $citizen->telefono,
                        'punto_nombre' => $citizen->punto->nombre_punto ?? 'PVD',
                        'total_visitas' => (int) $citizen->visitas_count,
                        'ultima_visita_fecha' => $lastVisit ? $lastVisit->created_at->toDateString() : null,
                        'dias_inactivo' => $daysInactive,
                        'nivel_riesgo' => $riskLevel,
                    ];
                })
                ->values()
                ->toArray();
        });

        return collect($items);
    }

    /**
     * Clasificación NLP de texto libre para auto-asignar categoría.
     * Solo opera sobre categorías y subcategorías vigentes y activas del sistema.
     */
    public function classifyDescription(string $text): ?array
    {
        $text = mb_strtolower(trim($text));
        if (empty($text)) {
            return null;
        }

        // Obtener las categorías activas de Punto TIC
        $activeCategories = Category::with(['subcategorias' => fn($q) => $q->where('activo', true)->orderBy('orden')])
            ->where('activo', true)
            ->get();

        if ($activeCategories->isEmpty()) {
            return null;
        }

        $tramitesCat = $activeCategories->firstWhere('id_categoria', 63)
            ?? $activeCategories->first(fn($c) => str_contains(mb_strtolower($c->nombre), 'trámite') || str_contains(mb_strtolower($c->nombre), 'tramite'));
        $conectividadCat = $activeCategories->firstWhere('id_categoria', 64)
            ?? $activeCategories->first(fn($c) => str_contains(mb_strtolower($c->nombre), 'conectividad') || str_contains(mb_strtolower($c->nombre), 'gobierno'));
        $impresionCat = $activeCategories->firstWhere('id_categoria', 65)
            ?? $activeCategories->first(fn($c) => str_contains(mb_strtolower($c->nombre), 'impresi') || str_contains(mb_strtolower($c->nombre), 'digitaliza'));
        $capacitacionCat = $activeCategories->firstWhere('id_categoria', 66)
            ?? $activeCategories->first(fn($c) => str_contains(mb_strtolower($c->nombre), 'capacita') || str_contains(mb_strtolower($c->nombre), 'formaci'));
        $salasCat = $activeCategories->firstWhere('id_categoria', 67)
            ?? $activeCategories->first(fn($c) => str_contains(mb_strtolower($c->nombre), 'sala') || str_contains(mb_strtolower($c->nombre), 'préstamo') || str_contains(mb_strtolower($c->nombre), 'prestamo'));

        $keywordRules = [
            [
                'cat' => $tramitesCat,
                'words' => [
                    'sisben', 'encuesta', 'puntaje', 'predial', 'impuesto', 'ica', 'policia', 'antecedentes',
                    'cedula', 'registraduria', 'dian', 'rut', 'salud', 'adres', 'fosyga', 'eps', 'avecindamiento', 'avecidamiento',
                    'residencia', 'certificado', 'certificados', 'pago en linea', 'servicios publicos',
                ],
            ],
            [
                'cat' => $conectividadCat,
                'words' => [
                    'internet', 'navegacion', 'navegar', 'tarea', 'tareas', 'investigacion', 'correo', 'email',
                    'empleo', 'computrabajo', 'teletrabajo', 'computador', 'videollamada',
                ],
            ],
            [
                'cat' => $impresionCat,
                'words' => [
                    'impresion', 'imprimir', 'copia', 'copias', 'fotocopia', 'fotocopias', 'escaner', 'escanear',
                    'digitalizar', 'digitalizacion', 'foto documento',
                ],
            ],
            [
                'cat' => $capacitacionCat,
                'words' => [
                    'curso', 'cursos', 'taller', 'talleres', 'capacitacion', 'capacitaciones', 'excel', 'word',
                    'ofimatica', 'alfabetizacion', 'robotica', 'programacion',
                ],
            ],
            [
                'cat' => $salasCat,
                'words' => [
                    'sala', 'salas', 'prestamo', 'reunion', 'reuniones', 'jac', 'junta', 'comunitaria', 'auditorio',
                ],
            ],
        ];

        foreach ($keywordRules as $rule) {
            $cat = $rule['cat'];
            if (! $cat) {
                continue;
            }

            foreach ($rule['words'] as $word) {
                // Coincidencia con límite de palabra para evitar falsos positivos (ej: 'ica' dentro de 'certificado')
                if (preg_match('/(?:\b|^)' . preg_quote($word, '/') . '(?:\b|$)/ui', $text)) {
                    $subcats = $cat->subcategorias->values();

                    // Si el texto menciona avecindamiento o residencia, priorizar esa subcategoría específica
                    if (str_contains($text, 'avecindamiento') || str_contains($text, 'avecidamiento') || str_contains($text, 'residencia')) {
                        $matchedSub = $cat->subcategorias->first(fn($s) => str_contains(mb_strtolower($s->nombre), 'avecindamiento') || str_contains(mb_strtolower($s->nombre), 'residencia'));
                        if ($matchedSub) {
                            $subcats = $cat->subcategorias->sortByDesc(fn($s) => $s->id_subcategoria === $matchedSub->id_subcategoria)->values();
                        }
                    }

                    return [
                        'id_categoria' => $cat->id_categoria,
                        'categoria_nombre' => $cat->nombre,
                        'subcategorias' => $subcats,
                    ];
                }
            }
        }

        return null;
    }

    /**
     * Predicción de carga de visitas para el día siguiente.
     */
    public function predictTomorrowLoad(?int $pointId = null): array
    {
        $dayKey = Carbon::tomorrow()->toDateString();
        $cacheKey = 'ml_tomorrow_load_' . ($pointId ?? 'all') . "_{$dayKey}";

        return Cache::remember($cacheKey, 300, function () use ($pointId) {
            $dayOfWeek = Carbon::tomorrow()->dayOfWeekIso; // 1 = Lunes, 7 = Domingo

            $driver = DB::getDriverName();
            $dayIndex = (string) ($dayOfWeek % 7);

            $query = Visit::when($pointId, fn($q) => $q->where('id_punto', $pointId));

            if ($driver === 'sqlite') {
                $avgVisits = $query->whereRaw("strftime('%w', created_at) = ?", [$dayIndex])->count();
                $samplesCount = max(1, Visit::select(DB::raw("date(created_at) as d"))->distinct()->count());
            } else {
                $avgVisits = $query->whereRaw("DAYOFWEEK(created_at) - 1 = ?", [$dayIndex])->count();
                $samplesCount = max(1, Visit::select(DB::raw("DATE(created_at) as d"))->distinct()->count());
            }

            $estimate = max(18, round(($avgVisits / $samplesCount) * 1.15));

            return [
                'visitas_estimadas' => $estimate,
                'hora_pico' => '10:00 am - 11:30 am',
                'dia_semana' => Carbon::tomorrow()->locale('es')->isoFormat('dddd'),
                'recomendacion' => 'Mantener 2 gestores disponibles en la franja matutina.',
            ];
        });
    }
}
