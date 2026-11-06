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
        'id_tipo',
        'id_identificacion',
        'sigla',
        'nombre_tipo',
        'tipo_id',
        'activo',
    ];

    protected $appends = [
        'id_tipo',
        'nombre_tipo',
        'sigla',
        'activo',
    ];

    public function getIdTipoAttribute()
    {
        return $this->attributes['id_tipo'] ?? $this->attributes['id_identificacion'] ?? null;
    }

    public function getNombreTipoAttribute()
    {
        return $this->attributes['nombre_tipo'] ?? $this->attributes['tipo_id'] ?? null;
    }

    public function getSiglaAttribute()
    {
        if (! empty($this->attributes['sigla'])) {
            return $this->attributes['sigla'];
        }
        $name = $this->nombre_tipo ?? $this->attributes['tipo_id'] ?? '';
        if (stripos($name, 'Ciudadan') !== false) return 'CC';
        if (stripos($name, 'Tarjeta') !== false) return 'TI';
        if (stripos($name, 'Extranjer') !== false) return 'CE';
        if (stripos($name, 'Registro') !== false) return 'RC';
        if (stripos($name, 'Pasaporte') !== false) return 'PA';
        if (stripos($name, 'Permanencia') !== false || stripos($name, 'PPT') !== false) return 'PPT';
        return 'DOC';
    }

    public function getActivoAttribute()
    {
        return isset($this->attributes['activo']) ? (bool) $this->attributes['activo'] : true;
    }

    public function ciudadanos(): HasMany
    {
        return $this->hasMany(Citizen::class, 'id_tipo', 'id_tipo');
    }
}
