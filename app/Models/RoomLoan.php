<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoomLoan extends Model
{
    use HasFactory;

    protected $table = 'prestamo_sala';
    protected $primaryKey = 'id_prestamo';

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
        return $this->belongsTo(Citizen::class, 'id_form_pvd', 'id_form_pvd');
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
