<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Visit extends Model
{
    use HasFactory;

    protected $table = 'visitas';
    protected $primaryKey = 'id_visita';

    protected $fillable = [
        'id_form_pvd',
        'id_punto',
        'id_categoria',
        'id_subcategoria',
        'servicio_texto',
        'descripcion',
        'id_gestor',
        'duracion_minutos',
    ];

    protected $casts = [
        'duracion_minutos' => 'integer',
        'created_at' => 'datetime',
    ];

    public function ciudadano(): BelongsTo
    {
        return $this->belongsTo(Citizen::class, 'id_form_pvd', 'id_form_pvd');
    }

    public function punto(): BelongsTo
    {
        return $this->belongsTo(Point::class, 'id_punto', 'id_punto');
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'id_categoria', 'id_categoria');
    }

    public function subcategoria(): BelongsTo
    {
        return $this->belongsTo(SubCategory::class, 'id_subcategoria', 'id_subcategoria');
    }

    public function gestor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_gestor', 'id');
    }

    public function valoresCamposDinamicos(): HasMany
    {
        return $this->hasMany(DynamicFieldValue::class, 'entidad_id', 'id_visita')
            ->where('entidad_tipo', 'visitas');
    }

    // Scopes
    public function scopeDateBetween(Builder $query, ?string $from, ?string $to): Builder
    {
        if ($from) {
            $query->whereDate('created_at', '>=', $from);
        }
        if ($to) {
            $query->whereDate('created_at', '<=', $to);
        }
        return $query;
    }

    public function scopeFilterByPoint(Builder $query, $pointId): Builder
    {
        return $pointId ? $query->where('id_punto', $pointId) : $query;
    }

    public function scopeFilterByCategory(Builder $query, $catId): Builder
    {
        return $catId ? $query->where('id_categoria', $catId) : $query;
    }
}
