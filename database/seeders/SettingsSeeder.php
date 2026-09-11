<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            [
                'clave' => 'allow_public_registration',
                'valor' => 'true',
                'descripcion' => 'Permite el formulario de autorregistro ciudadano externo en /registro-ciudadano',
                'tipo' => 'boolean',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'clave' => 'ml_prediction_enabled',
                'valor' => 'true',
                'descripcion' => 'Habilita el motor de predicción de trámites por historial y perfil ciudadano',
                'tipo' => 'boolean',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'clave' => 'nombre_institucional',
                'valor' => 'Alcaldía de Acacías - Puntos Vive Digital',
                'descripcion' => 'Nombre institucional del sistema para reportes',
                'tipo' => 'string',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'clave' => 'dias_alerta_inactividad',
                'valor' => '60',
                'descripcion' => 'Días sin visita para alertar a un ciudadano en riesgo de no retorno (IA Churn)',
                'tipo' => 'integer',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('settings')->upsert($settings, ['clave'], ['valor', 'descripcion', 'tipo', 'updated_at']);
    }
}
