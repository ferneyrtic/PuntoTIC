<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Training extends Model
{
    use HasFactory;

    protected $table = 'capacitaciones';

    protected $primaryKey = 'id_capacitacion';

    protected $fillable = [
        'id_punto',
        'titulo',
        'slug',
        'descripcion',
        'categoria',
        'tipo',
        'instructor',
        'fecha_inicio',
        'fecha_fin',
        'horario',
        'duracion_horas',
        'cupos_totales',
        'cupos_disponibles',
        'requisitos',
        'dirigido_a',
        'imagen_url',
        'color_tema',
        'activo',
        'destacado',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'duracion_horas' => 'integer',
        'cupos_totales' => 'integer',
        'cupos_disponibles' => 'integer',
        'activo' => 'boolean',
        'destacado' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (Training $training) {
            if (empty($training->slug)) {
                $baseSlug = Str::slug($training->titulo);
                $slug = $baseSlug;
                $counter = 1;
                while (static::where('slug', $slug)->exists()) {
                    $slug = "{$baseSlug}-{$counter}";
                    $counter++;
                }
                $training->slug = $slug;
            }

            if ($training->cupos_disponibles === null) {
                $training->cupos_disponibles = $training->cupos_totales ?? 25;
            }
        });
    }

    public function punto(): BelongsTo
    {
        return $this->belongsTo(Point::class, 'id_punto', 'id_punto');
    }

    public function inscripciones(): HasMany
    {
        return $this->hasMany(TrainingRegistration::class, 'id_capacitacion', 'id_capacitacion');
    }

    public function scopeActive($query)
    {
        return $query->where('activo', true);
    }

    public function scopeFeatured($query)
    {
        return $query->where('destacado', true);
    }
}
