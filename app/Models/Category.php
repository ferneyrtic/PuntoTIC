<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    use HasFactory;

    protected $table = 'categorias';
    protected $primaryKey = 'id_categoria';

    protected $fillable = [
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

    public function subcategorias(): HasMany
    {
        return $this->hasMany(SubCategory::class, 'categoria_id', 'id_categoria')->orderBy('orden');
    }

    public function visitas(): HasMany
    {
        return $this->hasMany(Visit::class, 'id_categoria', 'id_categoria');
    }
}
