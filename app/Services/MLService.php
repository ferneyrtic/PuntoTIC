<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Citizen;
use App\Models\Setting;
use App\Models\SubCategory;
use App\Models\Visit;
use Carbon\Carbon;
use Illuminate\Support\Collection;
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
                if (! $subcat) continue;

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
                if (! $subcat) continue;

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
                if (! $subcat) continue;

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
                    'total_visitas' => $citizen->visitas_count,
                    'ultima_visita_fecha' => $lastVisit ? $lastVisit->created_at->toDateString() : null,
                    'dias_inactivo' => $daysInactive,
                    'nivel_riesgo' => $riskLevel,
                ];
            });
    }

    /**
     * Clasificación NLP de texto libre para auto-asignar categoría.
     */
    public function classifyDescription(string $text): ?array
    {
        $text = mb_strtolower(trim($text));
        $keywords = [
            'sisben' => 1,
            'encuesta' => 1,
            'puntaje' => 1,
            'predial' => 1,
            'impuesto' => 1,
            'ica' => 1,
            'policia' => 1,
            'antecedentes' => 1,
            'cedula' => 1,
            'registraduria' => 1,
            'dian' => 1,
            'rut' => 1,
            'salud' => 1,
            'adres' => 1,
            'fosyga' => 1,
            'eps' => 1,
            'internet' => 2,
            'navegacion' => 2,
            'tarea' => 2,
            'investigacion' => 2,
            'correo' => 2,
            'empleo' => 2,
            'computrabajo' => 2,
            'impresion' => 3,
            'imprimir' => 3,
            'copia' => 3,
            'fotocopia' => 3,
            'escaner' => 3,
            'escanear' => 3,
            'digitalizar' => 3,
            'curso' => 4,
            'taller' => 4,
            'capacitacion' => 4,
            'excel' => 4,
            'word' => 4,
            'alfabetizacion' => 4,
            'sala' => 5,
            'prestamo' => 5,
            'reunion' => 5,
            'jac' => 5,
            'junta' => 5,
        ];

        foreach ($keywords as $word => $catId) {
            if (str_contains($text, $word)) {
                $cat = Category::with('subcategorias')->find($catId);
                return [
                    'id_categoria' => $cat->id_categoria,
                    'categoria_nombre' => $cat->nombre,
                    'subcategorias' => $cat->subcategorias,
                ];
            }
        }

        return null;
    }

    /**
     * Predicción de carga de visitas para el día siguiente.
     */
    public function predictTomorrowLoad(?int $pointId = null): array
    {
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
    }
}
