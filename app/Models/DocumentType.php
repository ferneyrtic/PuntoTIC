<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DocumentType extends Model
{
    use HasFactory;

    protected $table = 'tipo_id';
    protected $primaryKey = 'id_tipo';

    protected $fillable = [
        'sigla',
        'nombre_tipo',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function ciudadanos(): HasMany
    {
        return $this->hasMany(Citizen::class, 'id_tipo', 'id_tipo');
    }
}
