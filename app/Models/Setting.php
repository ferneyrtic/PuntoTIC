<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $table = 'settings';

    protected $fillable = [
        'clave',
        'valor',
        'descripcion',
        'tipo',
    ];

    public static function get(string $key, $default = null)
    {
        $setting = static::where('clave', $key)->first();
        if (! $setting) {
            return $default;
        }

        return match ($setting->tipo) {
            'boolean' => filter_var($setting->valor, FILTER_VALIDATE_BOOLEAN),
            'integer' => (int) $setting->valor,
            'json' => json_decode($setting->valor, true),
            default => $setting->valor,
        };
    }

    public static function set(string $key, $value, ?string $type = null, ?string $description = null): void
    {
        $tipo = $type ?? (is_bool($value) ? 'boolean' : (is_int($value) ? 'integer' : (is_array($value) ? 'json' : 'string')));
        $storedValue = is_array($value) ? json_encode($value) : (is_bool($value) ? ($value ? 'true' : 'false') : (string) $value);

        static::updateOrCreate(
            ['clave' => $key],
            [
                'valor' => $storedValue,
                'tipo' => $tipo,
                'descripcion' => $description,
            ]
        );
    }
}
