<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChristmasTree extends Model
{
    use HasFactory;

    protected $table = 'arboles_navidad';

    protected $fillable = [
        'user_id',
        'id_punto',
        'nombre_gestor',
        'nombre_punto',
        'decoraciones',
        'mensaje',
        'luces_activas',
        'reacciones_count',
    ];

    protected $casts = [
        'decoraciones' => 'array',
        'luces_activas' => 'boolean',
        'reacciones_count' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function point(): BelongsTo
    {
        return $this->belongsTo(Point::class, 'id_punto', 'id_punto');
    }
}
