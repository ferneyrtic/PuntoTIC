<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrintRecord extends Model
{
    use HasFactory;

    protected $table = 'registro_impresion';
    protected $primaryKey = 'id_impresion';

    protected $fillable = [
        'id_form_pvd',
        'nombre_usuario_texto',
        'id_punto',
        'id_gestor',
        'numero_hojas',
        'tipo_impresion',
        'descripcion',
    ];

    protected $casts = [
        'numero_hojas' => 'integer',
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

    public function gestor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_gestor', 'id');
    }

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
}
