<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DynamicField extends Model
{
    use HasFactory;

    protected $table = 'campos_dinamicos';
    protected $primaryKey = 'id_campo';

    protected $fillable = [
        'modulo',
        'nombre_campo',
        'slug',
        'tipo',
        'opciones',
        'requerido',
        'incluir_en_reporte',
        'activo',
        'orden',
    ];

    protected $casts = [
        'opciones' => 'array',
        'requerido' => 'boolean',
        'incluir_en_reporte' => 'boolean',
        'activo' => 'boolean',
        'orden' => 'integer',
    ];

    public function valores(): HasMany
    {
        return $this->hasMany(DynamicFieldValue::class, 'id_campo', 'id_campo');
    }
}
