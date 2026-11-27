<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Citizen;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CitizenService
{
    /**
     * Mapa cacheado de Barrio/Vereda -> ['up' => ..., 'zona' => 'Urbana'|'Rural']
     * construido a partir de los registros históricos validados en form_pvd.
     */
    public static function getBarriosMetaMap(): array
    {
        return Cache::remember('barrios_up_zona_meta_v1', 1800, function () {
            $rows = DB::table('form_pvd')
                ->selectRaw('UPPER(TRIM(barrio)) as b_key, TRIM(up) as up_val, UPPER(TRIM(zona)) as zona_val, COUNT(*) as c')
                ->whereNotNull('barrio')
                ->whereRaw("TRIM(barrio) != ''")
                ->whereNotNull('up')
                ->whereRaw("LOWER(TRIM(up)) NOT IN ('', 'null', 'otro', 'ninguna')")
                ->groupBy(DB::raw('UPPER(TRIM(barrio))'), DB::raw('TRIM(up)'), DB::raw('UPPER(TRIM(zona))'))
                ->orderByDesc('c')
                ->get();

            $meta = [];
            foreach ($rows as $row) {
                $key = (string) $row->b_key;
                if (isset($meta[$key])) {
                    continue;
                }
                $up = strtoupper((string) $row->up_val);
                $zonaRaw = (string) $row->zona_val;
                $zona = (str_contains($zonaRaw, 'RURAL') || str_starts_with($up, 'UPR')) ? 'Rural' : 'Urbana';
                $meta[$key] = [
                    'up' => $up,
                    'zona' => $zona,
                ];
            }

            return $meta;
        });
    }

    /**
     * Resuelve UP y Zona para un barrio/vereda dado.
     */
    public static function resolveBarrioMeta(?string $barrio): ?array
    {
        $key = mb_strtoupper(trim((string) $barrio));
        if ($key === '') {
            return null;
        }

        $map = self::getBarriosMetaMap();
        return $map[$key] ?? null;
    }

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
        $term = trim($document);
        return Citizen::with(['tipoDocumento', 'punto', 'visitas.categoria', 'visitas.subcategoria'])
            ->where(function ($q) use ($term) {
                $q->where('documento', $term)->orWhere('id', $term);
            })
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

            // Resolver UP / Zona automáticamente si no se especificó UP
            if (! empty($data['barrio']) && (empty($data['up']) || strcasecmp((string) $data['up'], 'null') === 0)) {
                $meta = self::resolveBarrioMeta($data['barrio']);
                if ($meta) {
                    $data['up'] = $meta['up'];
                    if (empty($data['zona'])) {
                        $data['zona'] = $meta['zona'];
                    }
                }
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

            // Si cambió el barrio o la UP venía vacía/'null', resolver UPZ/UPR automáticamente
            $oldBarrio = mb_strtoupper(trim((string) ($citizen->barrio ?? '')));
            $newBarrio = mb_strtoupper(trim((string) ($data['barrio'] ?? '')));
            $incomingUp = trim((string) ($data['up'] ?? ''));
            $oldUp = trim((string) ($citizen->up ?? ''));
            $upWasUnchanged = ($incomingUp === '' || strcasecmp($incomingUp, 'null') === 0 || $incomingUp === $oldUp);

            if ($newBarrio !== '' && ($newBarrio !== $oldBarrio || $incomingUp === '' || strcasecmp($incomingUp, 'null') === 0)) {
                $meta = self::resolveBarrioMeta($newBarrio);
                if ($meta && $upWasUnchanged) {
                    $data['up'] = $meta['up'];
                    $data['zona'] = $meta['zona'];
                }
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
