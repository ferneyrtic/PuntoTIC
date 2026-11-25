<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrainingRegistration extends Model
{
    use HasFactory;

    protected $table = 'inscripciones_capacitacion';

    protected $primaryKey = 'id_inscripcion';

    protected $fillable = [
        'id_capacitacion',
        'id_form_pvd',
        'documento',
        'nombres',
        'apellidos',
        'telefono',
        'correo',
        'estado',
        'observaciones',
    ];

    public function capacitacion(): BelongsTo
    {
        return $this->belongsTo(Training::class, 'id_capacitacion', 'id_capacitacion');
    }

    public function ciudadano(): BelongsTo
    {
        return $this->belongsTo(Citizen::class, 'id_form_pvd', 'id_form_pvd');
    }
}
