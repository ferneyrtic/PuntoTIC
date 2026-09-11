<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditLog extends Model
{
    public $timestamps = false;
    protected $table = 'auditoria_logs';
    protected $primaryKey = 'id_log';

    protected $fillable = [
        'user_id',
        'accion',
        'modulo',
        'registro_id',
        'datos_anteriores',
        'datos_nuevos',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected $casts = [
        'datos_anteriores' => 'array',
        'datos_nuevos' => 'array',
        'created_at' => 'datetime',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public static function registrar(string $accion, string $modulo, ?string $registroId = null, ?array $antiguos = null, ?array $nuevos = null): self
    {
        return static::create([
            'user_id' => Auth::id(),
            'accion' => $accion,
            'modulo' => $modulo,
            'registro_id' => $registroId,
            'datos_anteriores' => $antiguos,
            'datos_nuevos' => $nuevos,
            'ip_address' => Request::ip(),
            'user_agent' => substr(Request::userAgent() ?? '', 0, 255),
            'created_at' => now(),
        ]);
    }
}
