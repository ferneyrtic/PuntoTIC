<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DynamicFieldValue extends Model
{
    use HasFactory;

    protected $table = 'valores_campos_dinamicos';

    protected $fillable = [
        'id_campo',
        'entidad_tipo',
        'entidad_id',
        'valor',
    ];

    public function campo(): BelongsTo
    {
        return $this->belongsTo(DynamicField::class, 'id_campo', 'id_campo');
    }
}
