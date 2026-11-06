<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prestamo_sala', function (Blueprint $table) {
            $table->string('estado', 40)->default('Pendiente')->change();
        });
    }

    public function down(): void
    {
        Schema::table('prestamo_sala', function (Blueprint $table) {
            $table->string('estado', 40)->default('Completado')->change();
        });
    }
};
