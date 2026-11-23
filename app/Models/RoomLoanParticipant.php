<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoomLoanParticipant extends Model
{
    protected $table = 'prestamo_sala_participantes';

    protected $fillable = [
        'id_prestamo',
        'id_form_pvd',
        'nombre_libre',
        'documento_libre',
    ];

    protected $appends = [
        'nombre_display',
        'documento_display',
    ];

    public function prestamo(): BelongsTo
    {
        return $this->belongsTo(RoomLoan::class, 'id_prestamo', 'id');
    }

    public function ciudadano(): BelongsTo
    {
        return $this->belongsTo(Citizen::class, 'id_form_pvd', 'id_form_pvd');
    }

    /**
     * Nombre para mostrar: prioriza el ciudadano registrado, luego el libre.
     */
    public function getNombreDisplayAttribute(): string
    {
        return $this->ciudadano?->nombre_completo
            ?? $this->nombre_libre
            ?? 'Participante';
    }

    /**
     * Documento para mostrar.
     */
    public function getDocumentoDisplayAttribute(): ?string
    {
        return $this->ciudadano?->documento
            ?? $this->documento_libre;
    }
}
