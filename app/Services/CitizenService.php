<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Citizen;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CitizenService
{
    /**
     * Calcula la edad a partir de la fecha de nacimiento.
     */
    public function calculateAge(?string $birthDate): ?int
    {
        if (! $birthDate) {
            return null;
        }

        try {
            return Carbon::parse($birthDate)->age;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Busca un ciudadano por su número de documento con sus relaciones clave.
     */
    public function findByDocument(string $document): ?Citizen
    {
        return Citizen::with(['tipoDocumento', 'punto', 'visitas.categoria', 'visitas.subcategoria'])
            ->where('documento', trim($document))
            ->first();
    }

    /**
     * Listado paginado con filtros avanzados.
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Citizen::with(['tipoDocumento', 'punto'])
            ->withCount('visitas')
            ->search($filters['search'] ?? null)
            ->filterByPoint($filters['id_punto'] ?? null)
            ->filterByZone($filters['zona'] ?? null);

        if (! empty($filters['nivel_educativo'])) {
            $query->where('nivel_educativo', $filters['nivel_educativo']);
        }

        if (! empty($filters['estrato'])) {
            $query->where('estrato', $filters['estrato']);
        }

        $sortField = $filters['sort_by'] ?? 'created_at';
        $sortDirection = $filters['sort_dir'] ?? 'desc';
        $allowedSorts = ['id_form_pvd', 'documento', 'nombres', 'apellidos', 'edad', 'created_at', 'visitas_count'];

        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc');
        } else {
            $query->latest();
        }

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Crea un nuevo ciudadano garantizando atomicidad (ACID) y auditoría.
     */
    public function createCitizen(array $data): Citizen
    {
        return DB::transaction(function () use ($data) {
            // Auto calcular edad si viene fecha de nacimiento
            if (! empty($data['fecha_nac'])) {
                $data['edad'] = $this->calculateAge($data['fecha_nac']);
            }

            $citizen = Citizen::create($data);

            AuditLog::registrar(
                'CREAR_CIUDADANO',
                'form_pvd',
                (string) $citizen->id_form_pvd,
                null,
                $citizen->toArray()
            );

            return $citizen;
        });
    }

    /**
     * Actualiza TODOS los campos de un ciudadano (incluyendo nivel_educativo, etc.)
     * garantizando atomicidad y registro de cambios en auditoría.
     */
    public function updateCitizen(Citizen $citizen, array $data): Citizen
    {
        return DB::transaction(function () use ($citizen, $data) {
            $oldData = $citizen->toArray();

            if (! empty($data['fecha_nac'])) {
                $data['edad'] = $this->calculateAge($data['fecha_nac']);
            }

            $citizen->update($data);

            AuditLog::registrar(
                'ACTUALIZAR_CIUDADANO',
                'form_pvd',
                (string) $citizen->id_form_pvd,
                $oldData,
                $citizen->fresh()->toArray()
            );

            return $citizen->fresh(['tipoDocumento', 'punto']);
        });
    }

    /**
     * Obtiene estadísticas de ciudadanos para el dashboard.
     */
    public function getDemographicsSummary(?int $pointId = null): array
    {
        $base = Citizen::query()->filterByPoint($pointId);

        return [
            'total' => (clone $base)->count(),
            'por_zona' => (clone $base)->select('zona', DB::raw('count(*) as total'))->groupBy('zona')->pluck('total', 'zona')->toArray(),
            'por_genero' => (clone $base)->whereNotNull('genero')->select('genero', DB::raw('count(*) as total'))->groupBy('genero')->pluck('total', 'genero')->toArray(),
            'por_nivel_educativo' => (clone $base)->whereNotNull('nivel_educativo')->select('nivel_educativo', DB::raw('count(*) as total'))->groupBy('nivel_educativo')->pluck('total', 'nivel_educativo')->toArray(),
            'por_estrato' => (clone $base)->whereNotNull('estrato')->select('estrato', DB::raw('count(*) as total'))->groupBy('estrato')->pluck('total', 'estrato')->toArray(),
        ];
    }
}
