<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PuntosVdSeeder extends Seeder
{
    public function run(): void
    {
        $puntos = [
            [
                'id_punto' => 1,
                'nombre_punto' => 'Punto Vive Digital PLUS',
                'codigo' => 'PVD-PLUS',
                'direccion' => 'Calle 15 # 21-30, Centro',
                'barrio_vereda' => 'Centro',
                'zona' => 'Urbana',
                'telefono' => '3142001122',
                'responsable_nombre' => 'Coordinación PVD PLUS',
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_punto' => 2,
                'nombre_punto' => 'Punto Vive Digital Tradicional',
                'codigo' => 'PVD-TRAD',
                'direccion' => 'Carrera 18 # 12-45',
                'barrio_vereda' => 'La Independencia',
                'zona' => 'Urbana',
                'telefono' => '3142003344',
                'responsable_nombre' => 'Coordinación PVD Tradicional',
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_punto' => 3,
                'nombre_punto' => 'Aula Digital Dinamarca',
                'codigo' => 'AD-DINAMARCA',
                'direccion' => 'Vereda Dinamarca, I.E. Dinamarca',
                'barrio_vereda' => 'Vereda Dinamarca',
                'zona' => 'Rural',
                'telefono' => '3142005566',
                'responsable_nombre' => 'Gestor Dinamarca',
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_punto' => 4,
                'nombre_punto' => 'Aula Digital Chichimene',
                'codigo' => 'AD-CHICHIMENE',
                'direccion' => 'Vereda Chichimene, Caserío Principal',
                'barrio_vereda' => 'Vereda Chichimene',
                'zona' => 'Rural',
                'telefono' => '3142007788',
                'responsable_nombre' => 'Gestor Chichimene',
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('puntos_vd')->upsert($puntos, ['id_punto'], ['nombre_punto', 'codigo', 'direccion', 'barrio_vereda', 'zona', 'telefono', 'responsable_nombre', 'activo', 'updated_at']);
    }
}
