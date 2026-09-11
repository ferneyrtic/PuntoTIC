<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Citizen extends Model
{
    use HasFactory;

    protected $table = 'form_pvd';
    protected $primaryKey = 'id_form_pvd';

    protected $fillable = [
        'documento',
        'id_tipo',
        'nombres',
        'apellidos',
        'fecha_nac',
        'edad',
        'genero',
        'correo',
        'telefono',
        'direccion',
        'barrio',
        'zona',
        'up',
        'estrato',
        'grupo_etnico',
        'nivel_educativo', // 100% editable
        'ocupacion',
        'g_poblacional',
        't_aseguramiento',
        'id_punto',
        'id_gestor',
        'activo',
    ];

    protected $casts = [
        'fecha_nac' => 'date',
        'edad' => 'integer',
        'estrato' => 'integer',
        'activo' => 'boolean',
    ];

    protected $appends = ['nombre_completo'];

    protected function nombreCompleto(): Attribute
    {
        return Attribute::make(
            get: fn () => trim("{$this->nombres} {$this->apellidos}")
        );
    }

    public function tipoDocumento(): BelongsTo
    {
        return $this->belongsTo(DocumentType::class, 'id_tipo', 'id_tipo');
    }

    public function punto(): BelongsTo
    {
        return $this->belongsTo(Point::class, 'id_punto', 'id_punto');
    }

    public function gestor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_gestor', 'id');
    }

    public function visitas(): HasMany
    {
        return $this->hasMany(Visit::class, 'id_form_pvd', 'id_form_pvd')->orderBy('created_at', 'desc');
    }

    public function prestamos(): HasMany
    {
        return $this->hasMany(RoomLoan::class, 'id_form_pvd', 'id_form_pvd')->orderBy('created_at', 'desc');
    }

    public function impresiones(): HasMany
    {
        return $this->hasMany(PrintRecord::class, 'id_form_pvd', 'id_form_pvd')->orderBy('created_at', 'desc');
    }

    public function valoresCamposDinamicos(): HasMany
    {
        return $this->hasMany(DynamicFieldValue::class, 'entidad_id', 'id_form_pvd')
            ->where('entidad_tipo', 'form_pvd');
    }

    // Query Scopes
    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (blank($term)) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($term) {
            $q->where('documento', 'like', "%{$term}%")
              ->orWhere('nombres', 'like', "%{$term}%")
              ->orWhere('apellidos', 'like', "%{$term}%")
              ->orWhere('correo', 'like', "%{$term}%")
              ->orWhere('telefono', 'like', "%{$term}%");
        });
    }

    public function scopeFilterByPoint(Builder $query, $pointId): Builder
    {
        return $pointId ? $query->where('id_punto', $pointId) : $query;
    }

    public function scopeFilterByZone(Builder $query, ?string $zone): Builder
    {
        return $zone ? $query->where('zona', $zone) : $query;
    }

    public function scopeInactiveLongerThan(Builder $query, int $days = 60): Builder
    {
        $threshold = Carbon::now()->subDays($days);
        return $query->whereDoesntHave('visitas', function (Builder $q) use ($threshold) {
            $q->where('created_at', '>=', $threshold);
        });
    }
}
