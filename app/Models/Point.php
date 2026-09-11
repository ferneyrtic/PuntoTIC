<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Point extends Model
{
    use HasFactory;

    protected $table = 'puntos_vd';
    protected $primaryKey = 'id_punto';

    protected $fillable = [
        'nombre_punto',
        'codigo',
        'direccion',
        'barrio_vereda',
        'zona',
        'telefono',
        'responsable_nombre',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    protected $appends = [
        'es_aula_digital',
    ];

    public function getEsAulaDigitalAttribute(): bool
    {
        return in_array($this->id_punto, [3, 4]) || str_contains(strtolower($this->nombre_punto), 'aula digital');
    }

    public function ciudadanos(): HasMany
    {
        return $this->hasMany(Citizen::class, 'id_punto', 'id_punto');
    }

    public function visitas(): HasMany
    {
        return $this->hasMany(Visit::class, 'id_punto', 'id_punto');
    }

    public function prestamos(): HasMany
    {
        return $this->hasMany(RoomLoan::class, 'id_punto', 'id_punto');
    }

    public function impresiones(): HasMany
    {
        return $this->hasMany(PrintRecord::class, 'id_punto', 'id_punto');
    }

    public function usuarios(): HasMany
    {
        return $this->hasMany(User::class, 'id_punto', 'id_punto');
    }
}
