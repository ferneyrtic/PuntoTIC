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
        'key',
        'value',
    ];

    protected static function booted(): void
    {
        static::saving(function ($setting) {
            if (!empty($setting->clave) && empty($setting->key)) {
                $setting->key = $setting->clave;
            } elseif (!empty($setting->key) && empty($setting->clave)) {
                $setting->clave = $setting->key;
            }
            if ($setting->valor !== null && $setting->value === null) {
                $setting->value = (string) $setting->valor;
            } elseif ($setting->value !== null && $setting->valor === null) {
                $setting->valor = (string) $setting->value;
            }
        });
    }

    public static function get(string $key, $default = null)
    {
        $setting = static::where('clave', $key)
            ->orWhere('key', $key)
            ->first();
        if (! $setting) {
            return $default;
        }

        $val = $setting->valor ?? $setting->value;
        $tipo = $setting->tipo ?? 'string';

        return match ($tipo) {
            'boolean' => filter_var($val, FILTER_VALIDATE_BOOLEAN),
            'integer' => (int) $val,
            'json' => json_decode($val, true),
            default => $val,
        };
    }

    public static function set(string $key, $value, ?string $type = null, ?string $description = null): void
    {
        $tipo = $type ?? (is_bool($value) ? 'boolean' : (is_int($value) ? 'integer' : (is_array($value) ? 'json' : 'string')));
        $storedValue = is_array($value) ? json_encode($value) : (is_bool($value) ? ($value ? 'true' : 'false') : (string) $value);

        static::updateOrCreate(
            ['clave' => $key],
            [
                'key' => $key,
                'valor' => $storedValue,
                'value' => $storedValue,
                'tipo' => $tipo,
                'descripcion' => $description,
            ]
        );
    }
}
