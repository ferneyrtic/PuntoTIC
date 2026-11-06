<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasFactory, HasRoles, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'documento',
        'id_form_pvd',
        'id_punto',
        'telefono',
        'cargo',
        'activo',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'activo' => 'boolean',
        ];
    }

    protected $appends = [
        'is_admin',
        'es_aula_digital',
        'rol_principal',
        'es_gestor_pvd',
        'es_usuario_ciudadano',
        'puede_acceder_aula_digital',
        'puede_acceder_pvd_general',
        'roles_nombres',
    ];

    public function getEsUsuarioCiudadanoAttribute(): bool
    {
        return $this->hasRole(['Usuario', 'Ciudadano']);
    }

    public function getIsAdminAttribute(): bool
    {
        return $this->hasRole('Administrador');
    }

    public function getRolesNombresAttribute(): array
    {
        return $this->roles->pluck('name')->toArray();
    }

    public function getEsAulaDigitalAttribute(): bool
    {
        return $this->punto?->es_aula_digital ?? in_array($this->id_punto, [3, 4]);
    }

    public function getRolPrincipalAttribute(): string
    {
        return $this->roles->first()?->name ?? $this->cargo ?? 'Gestor';
    }

    public function getEsGestorPvdAttribute(): bool
    {
        return $this->hasRole(['Coordinador PVD', 'Gestor PVD']) || (in_array($this->id_punto, [1, 2]) && ! $this->hasRole('Administrador'));
    }

    public function getPuedeAccederAulaDigitalAttribute(): bool
    {
        if ($this->hasRole('Administrador')) {
            return true;
        }

        // Si es coordinador o gestor de PVD, o su sede es PVD (1 o 2), NO tiene acceso a aula digital
        if ($this->hasRole(['Coordinador PVD', 'Gestor PVD']) || in_array($this->id_punto, [1, 2])) {
            return false;
        }

        // Si es de aula digital (roles o sedes 3 y 4)
        return $this->hasRole(['Coordinador Aula Digital', 'Gestor Aula Digital']) || in_array($this->id_punto, [3, 4]);
    }

    public function getPuedeAccederPvdGeneralAttribute(): bool
    {
        return true;
    }

    public function punto(): BelongsTo
    {
        return $this->belongsTo(Point::class, 'id_punto', 'id_punto');
    }

    public function ciudadano(): BelongsTo
    {
        return $this->belongsTo(Citizen::class, 'id_form_pvd', 'id_form_pvd');
    }

    /**
     * Vincula la cuenta de usuario con la ficha histórica o crea una si no existe.
     */
    public function vincularConCiudadano(?string $documento = null): ?Citizen
    {
        $doc = $documento ?? $this->documento;
        if (! $doc) {
            return null;
        }

        $citizen = Citizen::where('documento', $doc)->first();

        if (! $citizen) {
            $parts = explode(' ', trim($this->name));
            $nombres = $parts[0] ?? $this->name;
            $apellidos = isset($parts[1]) ? implode(' ', array_slice($parts, 1)) : 'Ciudadano';

            $citizen = Citizen::create([
                'documento' => $doc,
                'nombres' => $nombres,
                'apellidos' => $apellidos,
                'correo' => $this->email,
                'telefono' => $this->telefono,
                'activo' => true,
                'id_punto' => $this->id_punto ?? 1,
            ]);
        }

        $this->id_form_pvd = $citizen->id_form_pvd;
        $this->documento = $doc;
        $this->save();

        return $citizen;
    }

    public function visitasRegistradas(): HasMany
    {
        return $this->hasMany(Visit::class, 'id_gestor');
    }

    public function prestamosRegistrados(): HasMany
    {
        return $this->hasMany(RoomLoan::class, 'id_gestor');
    }

    public function impresionesRegistradas(): HasMany
    {
        return $this->hasMany(PrintRecord::class, 'id_gestor');
    }
}
