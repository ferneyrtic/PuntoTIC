<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TipoIdSeeder extends Seeder
{
    public function run(): void
    {
        $tipos = [
            ['id_tipo' => 1, 'sigla' => 'CC', 'nombre_tipo' => 'Cédula de Ciudadanía', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['id_tipo' => 2, 'sigla' => 'TI', 'nombre_tipo' => 'Tarjeta de Identidad', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['id_tipo' => 3, 'sigla' => 'CE', 'nombre_tipo' => 'Cédula de Extranjería', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['id_tipo' => 4, 'sigla' => 'RC', 'nombre_tipo' => 'Registro Civil', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['id_tipo' => 5, 'sigla' => 'PA', 'nombre_tipo' => 'Pasaporte', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['id_tipo' => 6, 'sigla' => 'PPT', 'nombre_tipo' => 'Permiso por Protección Temporal', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
        ];

        DB::table('tipo_id')->upsert($tipos, ['id_tipo'], ['sigla', 'nombre_tipo', 'activo', 'updated_at']);
    }
}
