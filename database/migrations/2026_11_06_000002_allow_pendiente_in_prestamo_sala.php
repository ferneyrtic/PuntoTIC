<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        try {
            \Illuminate\Support\Facades\DB::statement("ALTER TABLE prestamo_sala MODIFY COLUMN estado VARCHAR(40) NOT NULL DEFAULT 'Pendiente';");
        } catch (\Throwable $e) {
            Schema::table('prestamo_sala', function (Blueprint $table) {
                $table->string('estado', 40)->default('Pendiente')->change();
            });
        }
    }

    public function down(): void
    {
        Schema::table('prestamo_sala', function (Blueprint $table) {
            $table->string('estado', 40)->default('Completado')->change();
        });
    }
};
