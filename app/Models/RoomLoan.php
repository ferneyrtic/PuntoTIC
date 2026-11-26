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

    protected static ?array $columnsCache = null;

    public static function getTableColumns(): array
    {
        if (static::$columnsCache !== null) {
            return static::$columnsCache;
        }

        try {
            return static::$columnsCache = Schema::getColumnListing('prestamo_sala');
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
            if (in_array('id_gestor', $cols, true) && empty($loan->id_gestor) && ! empty($loan->id_gestores)) {
                $loan->attributes['id_gestor'] = $loan->id_gestores;
            }
            if (in_array('fecha_prestamo', $cols, true) && empty($loan->fecha_prestamo)) {
                $loan->attributes['fecha_prestamo'] = now()->toDateString();
            }
            if (in_array('id_prestamo', $cols, true) && empty($loan->id_prestamo) && ! empty($loan->id)) {
                $loan->attributes['id_prestamo'] = $loan->id;
            }

            foreach ($loan->attributes as $key => $val) {
                if (! in_array($key, $cols, true)) {
                    unset($loan->attributes[$key]);
                }
            }
        });

        static::created(function ($loan) {
            $cols = static::getTableColumns();
            if (in_array('id_prestamo', $cols, true) && empty($loan->attributes['id_prestamo']) && ! empty($loan->id)) {
                \Illuminate\Support\Facades\DB::table('prestamo_sala')
                    ->where('id', $loan->id)
                    ->update(['id_prestamo' => $loan->id]);
                $loan->attributes['id_prestamo'] = $loan->id;
            }
        });
    }

    protected $fillable = [
        'id_form_pvd',
        'nombre_responsable_texto',
        'telefono',
        'id_punto',
        'id_gestor',
        'tipo_actividad',
        'sala_espacio',
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
        $fk = in_array('id_punto', static::getTableColumns(), true) ? 'id_punto' : 'id_puntos';

        return $this->belongsTo(Point::class, $fk, 'id_punto');
    }

    public function gestor(): BelongsTo
    {
        $fk = in_array('id_gestor', static::getTableColumns(), true) ? 'id_gestor' : 'id_gestores';

        return $this->belongsTo(User::class, $fk, 'id');
    }

    public function participantes(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(RoomLoanParticipant::class, 'id_prestamo', 'id');
    }

    public function scopeDateBetween(Builder $query, ?string $from, ?string $to): Builder
    {
        $dateCol = \Illuminate\Support\Facades\DB::raw('COALESCE(NULLIF(fecha_prestamo, "0000-00-00"), DATE(created_at))');

        if ($from) {
            $query->whereDate($dateCol, '>=', $from);
        }
        if ($to) {
            $query->whereDate($dateCol, '<=', $to);
        }

        return $query;
    }
}
