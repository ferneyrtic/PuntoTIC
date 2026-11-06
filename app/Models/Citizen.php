<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Citizen extends Model
{
    use HasFactory;

    protected $table = 'form_pvd';
    protected $primaryKey = 'id';
    public $incrementing = false;

    protected static function booted(): void
    {
        static::saving(function ($citizen) {
            if (empty($citizen->id) && !empty($citizen->documento)) {
                $num = preg_replace('/\D/', '', (string)$citizen->documento);
                $citizen->id = !empty($num) ? (int)$num : (int)(substr((string)time(), -8) . rand(10, 99));
            }
            if (empty($citizen->id_form_pvd)) {
                $citizen->id_form_pvd = $citizen->id;
            }
            if (empty($citizen->tipo_id) && !empty($citizen->id_tipo)) {
                $citizen->tipo_id = $citizen->id_tipo;
            } elseif (empty($citizen->id_tipo) && !empty($citizen->tipo_id)) {
                $citizen->id_tipo = $citizen->tipo_id;
            }
            if (empty($citizen->tipo_id)) {
                $citizen->tipo_id = 1;
                $citizen->id_tipo = 1;
            }
        });
    }

    protected $fillable = [
        'id',
        'id_form_pvd',
        'documento',
        'id_tipo',
        'tipo_id',
        'nombres',
        'apellidos',
        'fecha_nac',
        'edad',
        'genero',
        'correo',
        'telefono',
        'direccion',
        'barrio',
        'zona',
        'up',
        'estrato',
        'grupo_etnico',
        'nivel_educativo', // 100% editable
        'ocupacion',
        'g_poblacional',
        't_aseguramiento',
        'id_punto',
        'id_gestor',
        'activo',
    ];

    protected $casts = [
        'fecha_nac' => 'date',
        'edad' => 'integer',
        'estrato' => 'integer',
        'activo' => 'boolean',
    ];

    protected $appends = ['nombre_completo', 'id_form_pvd', 'documento', 'id_tipo'];

    protected function nombreCompleto(): Attribute
    {
        return Attribute::make(
            get: fn () => trim("{$this->nombres} {$this->apellidos}")
        );
    }

    public function getIdFormPvdAttribute()
    {
        return $this->attributes['id_form_pvd'] ?? $this->attributes['id'] ?? null;
    }

    public function getDocumentoAttribute()
    {
        return $this->attributes['documento'] ?? (isset($this->attributes['id']) ? (string)$this->attributes['id'] : '');
    }

    public function getIdTipoAttribute()
    {
        return $this->attributes['id_tipo'] ?? $this->attributes['tipo_id'] ?? null;
    }

    public function setDocumentoAttribute($value)
    {
        $this->attributes['documento'] = (string)$value;
        if (! isset($this->attributes['id']) || empty($this->attributes['id'])) {
            $num = preg_replace('/\D/', '', (string)$value);
            if (!empty($num)) {
                $this->attributes['id'] = (int)$num;
            } else {
                $this->attributes['id'] = (int)(substr((string)time(), -7) . rand(100, 999));
            }
        }
        if (! isset($this->attributes['id_form_pvd']) || empty($this->attributes['id_form_pvd'])) {
            $this->attributes['id_form_pvd'] = $this->attributes['id'];
        }
    }

    public function setIdTipoAttribute($value)
    {
        $this->attributes['id_tipo'] = $value;
        $this->attributes['tipo_id'] = $value;
    }

    public function tipoDocumento(): BelongsTo
    {
        return $this->belongsTo(DocumentType::class, 'id_tipo', 'id_tipo');
    }

    public function punto(): BelongsTo
    {
        return $this->belongsTo(Point::class, 'id_punto', 'id_punto');
    }

    public function gestor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_gestor', 'id');
    }

    public function visitas(): HasMany
    {
        return $this->hasMany(Visit::class, 'id_form_pvd', 'id_form_pvd')->orderBy('created_at', 'desc');
    }

    public function prestamos(): HasMany
    {
        return $this->hasMany(RoomLoan::class, 'id_form_pvd', 'id_form_pvd')->orderBy('created_at', 'desc');
    }

    public function impresiones(): HasMany
    {
        return $this->hasMany(PrintRecord::class, 'id_form_pvd', 'id_form_pvd')->orderBy('created_at', 'desc');
    }

    public function valoresCamposDinamicos(): HasMany
    {
        return $this->hasMany(DynamicFieldValue::class, 'entidad_id', 'id_form_pvd')
            ->where('entidad_tipo', 'form_pvd');
    }

    // Query Scopes
    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (blank($term)) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($term) {
            $q->where('documento', 'like', "%{$term}%")
              ->orWhere('id', 'like', "%{$term}%")
              ->orWhere('nombres', 'like', "%{$term}%")
              ->orWhere('apellidos', 'like', "%{$term}%")
              ->orWhere('correo', 'like', "%{$term}%")
              ->orWhere('telefono', 'like', "%{$term}%");
        });
    }

    public function scopeFilterByPoint(Builder $query, $pointId): Builder
    {
        return $pointId ? $query->where('id_punto', $pointId) : $query;
    }

    public function scopeFilterByZone(Builder $query, ?string $zone): Builder
    {
        return $zone ? $query->where('zona', $zone) : $query;
    }

    public function scopeInactiveLongerThan(Builder $query, int $days = 60): Builder
    {
        $threshold = Carbon::now()->subDays($days);
        return $query->whereDoesntHave('visitas', function (Builder $q) use ($threshold) {
            $q->where('created_at', '>=', $threshold);
        });
    }
}
