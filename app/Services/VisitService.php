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
            $pointId = $data['id_punto'] ?? Auth::user()?->id_punto ?? 1;
            $point = \App\Models\Point::find($pointId);
            $isAulaDigital = $point?->es_aula_digital ?? in_array($pointId, [3, 4]);

            // Caso A: Registro rápido de Aula Digital (Niños/Estudiantes sin cédula)
            if (! $citizenId && empty($data['documento']) && (! empty($data['nombres']) || ! empty($data['nombre_completo']))) {
                $nombres = trim($data['nombres'] ?? '');
                $apellidos = trim($data['apellidos'] ?? '');

                if (empty($apellidos) && ! empty($data['nombre_completo'])) {
                    $parts = preg_split('/\s+/', trim($data['nombre_completo']), 2);
                    $nombres = $parts[0];
                    $apellidos = $parts[1] ?? 'Estudiante';
                }

                $prefix = str_contains(strtolower($point?->nombre_punto ?? ''), 'chichimene') ? 'CHI' : 'DIN';

                // Buscar si el menor ya vino anteriormente a esta sede
                $existingChild = Citizen::where('id_punto', $pointId)
                    ->where('nombres', $nombres)
                    ->where('apellidos', $apellidos)
                    ->first();

                if ($existingChild) {
                    $citizenId = $existingChild->id_form_pvd;
                } else {
                    $count = Citizen::where('documento', 'like', "ESC-{$prefix}-%")->count() + 1;
                    $autoDoc = sprintf("ESC-%s-%05d", $prefix, $count);

                    $citizen = $this->citizenService->createCitizen([
                        'documento' => $autoDoc,
                        'id_tipo' => 2, // Tarjeta de Identidad / Escolar
                        'nombres' => $nombres,
                        'apellidos' => $apellidos ?: 'Estudiante',
                        'barrio' => $point?->nombre_punto ?? 'Corregimiento',
                        'zona' => 'Rural',
                        'nivel_educativo' => 'Primaria / Escolar',
                        'g_poblacional' => 'Estudiante Menor de Edad',
                        'id_punto' => $pointId,
                        'id_gestor' => Auth::id(),
                    ]);
                    $citizenId = $citizen->id_form_pvd;
                }
            }
            // Caso B: Registro tradicional PVD con número de documento
            elseif (! $citizenId && ! empty($data['documento'])) {
                $citizen = Citizen::where('documento', trim($data['documento']))->first();
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
                        'estrato' => $data['estrato'] ?? null,
                        'grupo_etnico' => $data['grupo_etnico'] ?? null,
                        'nivel_educativo' => $data['nivel_educativo'] ?? null,
                        'ocupacion' => $data['ocupacion'] ?? null,
                        'g_poblacional' => $data['g_poblacional'] ?? null,
                        't_aseguramiento' => $data['t_aseguramiento'] ?? null,
                        'id_punto' => $pointId,
                        'id_gestor' => Auth::id(),
                    ]);
                }
                $citizenId = $citizen->id_form_pvd;
            }

            // Categoría por defecto si es aula digital y no se seleccionó
            $idCategoria = $data['id_categoria'] ?? null;
            if (! $idCategoria && $isAulaDigital) {
                $idCategoria = \App\Models\Category::where('activo', true)->first()?->id_categoria ?? 1;
            }

            $visit = Visit::create([
                'id_form_pvd' => $citizenId,
                'id_punto' => $pointId,
                'id_categoria' => $idCategoria,
                'id_subcategoria' => $data['id_subcategoria'] ?? null,
                'servicio_texto' => $data['servicio_texto'] ?? ($isAulaDigital ? 'Acceso Libre a Computadores y Tareas Escolares' : null),
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

            return $visit->load(['ciudadano', 'punto', 'categoria', 'subcategoria', 'gestor']);
        });
    }
}
