<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    use HasFactory;

    protected $table = 'categorias';
    protected $primaryKey = 'id_categoria';

    protected $fillable = [
        'id_categoria',
        'nombre',
        'descripcion',
        'icono',
        'color',
        'orden',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'orden' => 'integer',
    ];

    protected $appends = ['id_categoria'];

    public function getIdCategoriaAttribute()
    {
        return $this->attributes['id_categoria'] ?? $this->attributes['id'] ?? null;
    }

    public function subcategorias(): HasMany
    {
        return $this->hasMany(SubCategory::class, 'categoria_id', 'id_categoria')
            ->where('activo', true)
            ->orderBy('orden');
    }

    public function visitas(): HasMany
    {
        return $this->hasMany(Visit::class, 'id_categoria', 'id_categoria');
    }
}
