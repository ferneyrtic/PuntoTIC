<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('puntos_vd', function (Blueprint $table) {
            $table->id('id_punto');
            $table->string('nombre_punto', 150);
            $table->string('codigo', 50)->nullable()->unique();
            $table->string('direccion', 255)->nullable();
            $table->string('barrio_vereda', 100)->nullable();
            $table->enum('zona', ['Urbana', 'Rural'])->default('Urbana');
            $table->string('telefono', 50)->nullable();
            $table->string('responsable_nombre', 150)->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('puntos_vd');
    }
};
