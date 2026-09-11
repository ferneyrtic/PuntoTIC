<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubCategory extends Model
{
    use HasFactory;

    protected $table = 'sub_categorias';
    protected $primaryKey = 'id_subcategoria';

    protected $fillable = [
        'categoria_id',
        'nombre',
        'descripcion',
        'orden',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'orden' => 'integer',
    ];

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'categoria_id', 'id_categoria');
    }

    public function visitas(): HasMany
    {
        return $this->hasMany(Visit::class, 'id_subcategoria', 'id_subcategoria');
    }
}
