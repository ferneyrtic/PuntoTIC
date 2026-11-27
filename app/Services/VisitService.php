<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Citizen;
use App\Models\DynamicFieldValue;
use App\Models\Visit;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class VisitService
{
    public function __construct(
        protected CitizenService $citizenService,
        protected MLService $mlService
    ) {}

    /**
     * Listado paginado de visitas con filtros y relaciones.
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Visit::with([
            'ciudadano.tipoDocumento',
            'punto',
            'categoria',
            'subcategoria',
            'gestor',
        ])
        ->dateBetween($filters['fecha_desde'] ?? null, $filters['fecha_hasta'] ?? null)
        ->filterByPoint($filters['id_punto'] ?? null)
        ->filterByCategory($filters['id_categoria'] ?? null);

        if (! empty($filters['id_subcategoria'])) {
            $query->where('id_subcategoria', $filters['id_subcategoria']);
        }

        if (! empty($filters['search'])) {
            $term = trim($filters['search']);
            $query->whereHas('ciudadano', function ($q) use ($term) {
                $q->where('documento', 'like', "%{$term}%")
                  ->orWhere('id', 'like', "%{$term}%")
                  ->orWhere('nombres', 'like', "%{$term}%")
                  ->orWhere('apellidos', 'like', "%{$term}%");
            });
        }

        return $query->latest('created_at')->paginate($perPage)->withQueryString();
    }

    /**
     * Registra una visita en una transacción ACID.
     * Si el ciudadano no existe, lo crea primero.
     */
    public function registerVisit(array $data): Visit
    {
        return DB::transaction(function () use ($data) {
            $citizenId = $data['id_form_pvd'] ?? null;
            $pointId = Auth::user()?->id_punto ?: ($data['id_punto'] ?? 1);
            $point = \App\Models\Point::find($pointId);
            $isAulaDigital = $point?->es_aula_digital ?? in_array($pointId, [3, 4]);

            // Caso A: Registro rápido de Aula Digital (Niños/Estudiantes sin cédula o cédula ingresada en campo único)
            if (! $citizenId && empty($data['documento']) && (! empty($data['nombres']) || ! empty($data['nombre_completo']))) {
                $rawInput = trim($data['nombre_completo'] ?? ($data['nombres'] ?? ''));

                // Si el gestor digitó un número de cédula o documento en el campo único de búsqueda
                $potentialDoc = preg_replace('/\D/', '', $rawInput);
                if (strlen($potentialDoc) >= 5 && (is_numeric($rawInput) || strlen($potentialDoc) === strlen($rawInput))) {
                    $existingByDoc = Citizen::where('documento', $potentialDoc)
                        ->orWhere('id', (int) $potentialDoc)
                        ->orWhere('id_form_pvd', (int) $potentialDoc)
                        ->first();
                    if ($existingByDoc) {
                        $citizenId = $existingByDoc->id ?: $existingByDoc->id_form_pvd;
                    }
                }

                if (! $citizenId) {
                    $nombres = trim($data['nombres'] ?? '');
                    $apellidos = trim($data['apellidos'] ?? '');

                    if (empty($apellidos) && ! empty($data['nombre_completo'])) {
                        $parts = preg_split('/\s+/', trim($data['nombre_completo']), 2);
                        $nombres = $parts[0];
                        $apellidos = $parts[1] ?? 'Estudiante';
                    }

                    $prefix = str_contains(strtolower($point?->nombre_punto ?? ''), 'chichimene') ? 'CHI' : 'DIN';

                    // Buscar si el ciudadano/menor ya vino anteriormente a esta sede o a otra sede
                    $existingChild = Citizen::where('nombres', $nombres)
                        ->where('apellidos', $apellidos)
                        ->orderByRaw("CASE WHEN id_punto = ? THEN 0 ELSE 1 END", [$pointId ?: 0])
                        ->first();

                    if ($existingChild) {
                        $citizenId = $existingChild->id ?: $existingChild->id_form_pvd;
                    } else {
                        // Encontrar el número consecutivo más alto para este prefijo
                        $highestDoc = Citizen::where('documento', 'like', "ESC-{$prefix}-%")
                            ->orderByDesc('documento')
                            ->value('documento');

                        $highestNum = 0;
                        if ($highestDoc && preg_match('/ESC-' . preg_quote($prefix, '/') . '-(\d+)/', $highestDoc, $matches)) {
                            $highestNum = (int) $matches[1];
                        }

                        $prefixNumeric = (int) ("99" . $pointId);
                        $highestId = Citizen::where('id', '>=', $prefixNumeric * 1000000)
                            ->where('id', '<', ($prefixNumeric + 1) * 1000000)
                            ->max('id');
                        $highestIdNum = $highestId ? ($highestId % 1000000) : 0;

                        $nextNum = max($highestNum, $highestIdNum) + 1;

                        // Bucle de seguridad para garantizar unicidad absoluta
                        do {
                            $autoDoc = sprintf("ESC-%s-%05d", $prefix, $nextNum);
                            $numericId = (int) ("99" . $pointId . sprintf("%06d", $nextNum));
                            $exists = Citizen::where('documento', $autoDoc)
                                ->orWhere('id', $numericId)
                                ->orWhere('id_form_pvd', $numericId)
                                ->exists();
                            if ($exists) {
                                $nextNum++;
                            }
                        } while ($exists);

                        $citizen = $this->citizenService->createCitizen([
                            'id' => $numericId,
                            'id_form_pvd' => $numericId,
                            'documento' => $autoDoc,
                            'id_tipo' => 2, // Tarjeta de Identidad / Escolar
                            'nombres' => $nombres,
                            'apellidos' => $apellidos ?: 'Estudiante',
                            'barrio' => $point?->nombre_punto ?? 'Corregimiento',
                            'zona' => 'Rural',
                            'estrato' => 1,
                            'grupo_etnico' => 'NINGUNO',
                            'nivel_educativo' => 'Primaria / Escolar',
                            'ocupacion' => 'ESTUDIANTE',
                            'g_poblacional' => 'Estudiante Menor de Edad',
                            'id_punto' => $pointId,
                            'id_gestor' => Auth::id(),
                        ]);
                        $citizenId = $citizen->id ?: $citizen->id_form_pvd;
                    }
                }
            }
            // Caso B: Registro tradicional PVD con número de documento
            elseif (! $citizenId && ! empty($data['documento'])) {
                $docClean = trim((string) $data['documento']);
                $citizen = Citizen::where('documento', $docClean)
                    ->orWhere('id', is_numeric($docClean) ? (int)$docClean : 0)
                    ->first();
                if (! $citizen) {
                    $citizen = $this->citizenService->createCitizen([
                        'documento' => $data['documento'],
                        'id_tipo' => $data['id_tipo'] ?? 1,
                        'nombres' => $data['nombres'] ?? 'Ciudadano',
                        'apellidos' => $data['apellidos'] ?? '',
                        'fecha_nac' => $data['fecha_nac'] ?? null,
                        'genero' => $data['genero'] ?? null,
                        'correo' => $data['correo'] ?? null,
                        'telefono' => $data['telefono'] ?? null,
                        'direccion' => $data['direccion'] ?? null,
                        'barrio' => $data['barrio'] ?? null,
                        'zona' => $data['zona'] ?? ($isAulaDigital ? 'Rural' : 'Urbana'),
                        'up' => $data['up'] ?? null,
                        'estrato' => $data['estrato'] ?? 1,
                        'grupo_etnico' => $data['grupo_etnico'] ?? 'NINGUNO',
                        'nivel_educativo' => $data['nivel_educativo'] ?? 'PRIMARIA',
                        'ocupacion' => $data['ocupacion'] ?? 'Empleado',
                        'g_poblacional' => $data['g_poblacional'] ?? null,
                        't_aseguramiento' => $data['t_aseguramiento'] ?? null,
                        'id_punto' => $pointId,
                        'id_gestor' => Auth::id(),
                    ]);
                } else {
                    // Actualizar datos de aseguramiento / Sisbén o contacto si se proporcionaron nuevos
                    $updatable = array_filter([
                        'telefono' => $data['telefono'] ?? null,
                        'correo' => $data['correo'] ?? null,
                        't_aseguramiento' => $data['t_aseguramiento'] ?? null,
                        'nivel_educativo' => $data['nivel_educativo'] ?? null,
                        'ocupacion' => $data['ocupacion'] ?? null,
                        'barrio' => $data['barrio'] ?? null,
                        'zona' => $data['zona'] ?? null,
                        'up' => $data['up'] ?? null,
                        'estrato' => $data['estrato'] ?? null,
                    ], fn ($val) => ! is_null($val) && $val !== '');

                    if (! empty($updatable['barrio']) && empty($updatable['up'])) {
                        $meta = CitizenService::resolveBarrioMeta($updatable['barrio']);
                        if ($meta) {
                            $updatable['up'] = $meta['up'];
                            $updatable['zona'] = $meta['zona'];
                        }
                    }

                    if (! empty($updatable)) {
                        $citizen->update($updatable);
                    }
                }
                $citizenId = $citizen->id ?: $citizen->id_form_pvd;
            }

            // Categoría y subcategoría por defecto si es registro rápido / aula digital
            $idCategoria = $data['id_categoria'] ?? null;
            $subId = $data['id_subcategoria'] ?? null;
            $servicioTexto = ! empty($data['servicio_texto']) ? $data['servicio_texto'] : null;

            if (! empty($data['es_registro_rapido'])) {
                $lowerTxt = mb_strtolower((string) $servicioTexto);
                if (str_contains($lowerTxt, 'clase') || str_contains($lowerTxt, 'lúdica') || str_contains($lowerTxt, 'ludica') || str_contains($lowerTxt, 'taller')) {
                    $idCategoria = 66; // Capacitación y Formación Digital
                    $subId = null;
                } else {
                    $idCategoria = 64; // Conectividad y Gobierno Digital
                    $subId = 366;      // Consultas académicas y tareas estudiantiles
                    if (! $servicioTexto) {
                        $servicioTexto = 'Acceso a computador y tareas escolares';
                    }
                }
            } else {
                if (! $idCategoria && $isAulaDigital) {
                    $idCategoria = 64;
                }
                if (! $servicioTexto && $subId) {
                    $sub = \App\Models\SubCategory::find($subId);
                    $servicioTexto = $sub?->nombre;
                }
                if (! $servicioTexto && $isAulaDigital) {
                    $servicioTexto = 'Acceso a computador y tareas escolares';
                }
            }

            $visit = Visit::create([
                'id_form_pvd' => $citizenId,
                'id_punto' => $pointId,
                'id_categoria' => $idCategoria,
                'id_subcategoria' => $subId,
                'servicio_texto' => $servicioTexto,
                'descripcion' => $data['descripcion'] ?? ($isAulaDigital ? 'Ingreso de menor de edad a sala digital' : null),
                'id_gestor' => Auth::id(),
                'duracion_minutos' => $data['duracion_minutos'] ?? ($isAulaDigital ? 60 : 30),
            ]);

            // Guardar campos dinámicos si se enviaron
            if (! empty($data['campos_dinamicos']) && is_array($data['campos_dinamicos'])) {
                foreach ($data['campos_dinamicos'] as $fieldId => $value) {
                    DynamicFieldValue::updateOrCreate(
                        [
                            'id_campo' => $fieldId,
                            'entidad_tipo' => 'visitas',
                            'entidad_id' => $visit->id_visita,
                        ],
                        ['valor' => is_array($value) ? json_encode($value) : (string) $value]
                    );
                }
            }

            AuditLog::registrar(
                'REGISTRAR_VISITA',
                'visitas',
                (string) $visit->id_visita,
                null,
                $visit->toArray()
            );

            StatsService::invalidateCache();

            return $visit->load(['ciudadano', 'punto', 'categoria', 'subcategoria', 'gestor']);
        });
    }
}
