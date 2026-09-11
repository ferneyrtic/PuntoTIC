<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            PuntosVdSeeder::class,
            TipoIdSeeder::class,
            CategoriasSeeder::class,
            RolesAndPermissionsSeeder::class,
            SettingsSeeder::class,
            SampleDataSeeder::class,
        ]);
    }
}
