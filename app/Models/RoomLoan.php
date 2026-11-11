<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Schema;

class RoomLoan extends Model
{
    use HasFactory;

    protected $table = 'prestamo_sala';

    public static function getTableColumns(): array
    {
        try {
            return Schema::getColumnListing('prestamo_sala');
        } catch (\Throwable $e) {
            return [];
        }
    }

    public function getKeyName()
    {
        $cols = static::getTableColumns();

        return in_array('id', $cols, true) ? 'id' : 'id_prestamo';
    }

    protected static function booted(): void
    {
        static::saving(function ($loan) {
            $cols = static::getTableColumns();
            if (empty($cols)) {
                return;
            }

            if (in_array('nombre', $cols, true) && empty($loan->nombre)) {
                $loan->attributes['nombre'] = $loan->nombre_responsable_texto ?: 'Ciudadano';
            }
            if (in_array('nombre_responsable_texto', $cols, true) && empty($loan->nombre_responsable_texto)) {
                $loan->attributes['nombre_responsable_texto'] = $loan->attributes['nombre'] ?? 'Ciudadano';
            }
            if (in_array('telefono', $cols, true) && empty($loan->telefono)) {
                $loan->attributes['telefono'] = '3000000000';
            }
            if (in_array('id_puntos', $cols, true) && empty($loan->id_puntos)) {
                $loan->attributes['id_puntos'] = $loan->id_punto ?: 1;
            }
            if (in_array('id_punto', $cols, true) && empty($loan->id_punto)) {
                $loan->attributes['id_punto'] = $loan->attributes['id_puntos'] ?? 1;
            }
            if (in_array('tipo_prestamo', $cols, true) && empty($loan->tipo_prestamo)) {
                $loan->attributes['tipo_prestamo'] = $loan->tipo_actividad ?: 'Reunión comunitaria';
            }
            if (in_array('tipo_actividad', $cols, true) && empty($loan->tipo_actividad)) {
                $loan->attributes['tipo_actividad'] = $loan->attributes['tipo_prestamo'] ?? 'Reunión comunitaria';
            }
            if (in_array('id_gestores', $cols, true) && empty($loan->id_gestores) && ! empty($loan->id_gestor)) {
                $loan->attributes['id_gestores'] = $loan->id_gestor;
            }
            if (in_array('fecha_prestamo', $cols, true) && empty($loan->fecha_prestamo)) {
                $loan->attributes['fecha_prestamo'] = now()->toDateString();
            }

            foreach ($loan->attributes as $key => $val) {
                if (! in_array($key, $cols, true)) {
                    unset($loan->attributes[$key]);
                }
            }
        });
    }

    protected $fillable = [
        'id_form_pvd',
        'nombre_responsable_texto',
        'id_punto',
        'id_gestor',
        'tipo_actividad',
        'num_asistentes',
        'fecha_prestamo',
        'hora_inicio',
        'hora_fin',
        'observaciones',
        'respuesta_gestor',
        'estado',
    ];

    protected $casts = [
        'fecha_prestamo' => 'date',
        'num_asistentes' => 'integer',
    ];

    protected $appends = ['id_prestamo'];

    public function getIdPrestamoAttribute()
    {
        return $this->attributes['id_prestamo'] ?? $this->attributes['id'] ?? null;
    }

    public function getNombreResponsableTextoAttribute()
    {
        return $this->attributes['nombre_responsable_texto'] ?? $this->attributes['nombre'] ?? '';
    }

    public function getIdPuntoAttribute()
    {
        return $this->attributes['id_punto'] ?? $this->attributes['id_puntos'] ?? null;
    }

    public function getIdGestorAttribute()
    {
        return $this->attributes['id_gestor'] ?? $this->attributes['id_gestores'] ?? null;
    }

    public function ciudadano(): BelongsTo
    {
        return $this->belongsTo(Citizen::class, 'id_form_pvd');
    }

    public function punto(): BelongsTo
    {
        return $this->belongsTo(Point::class, 'id_punto', 'id_punto');
    }

    public function gestor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_gestor', 'id');
    }

    public function scopeDateBetween(Builder $query, ?string $from, ?string $to): Builder
    {
        if ($from) {
            $query->whereDate('fecha_prestamo', '>=', $from);
        }
        if ($to) {
            $query->whereDate('fecha_prestamo', '<=', $to);
        }

        return $query;
    }
}
