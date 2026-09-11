<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('form_pvd', function (Blueprint $table) {
            $table->id('id_form_pvd');
            $table->string('documento', 50)->unique()->index();
            $table->unsignedBigInteger('id_tipo')->nullable()->default(1);
            $table->string('nombres', 100)->index();
            $table->string('apellidos', 100)->index();
            $table->date('fecha_nac')->nullable();
            $table->unsignedSmallInteger('edad')->nullable();
            $table->string('genero', 30)->nullable();
            $table->string('correo', 150)->nullable();
            $table->string('telefono', 50)->nullable();
            $table->string('direccion', 255)->nullable();
            $table->string('barrio', 120)->nullable();
            $table->enum('zona', ['Urbana', 'Rural'])->default('Urbana')->index();
            $table->string('up', 100)->nullable(); // Comuna / Vereda / Unidad Poblacional
            $table->unsignedTinyInteger('estrato')->nullable();
            $table->string('grupo_etnico', 100)->nullable();
            $table->string('nivel_educativo', 100)->nullable()->index(); // 100% editable
            $table->string('ocupacion', 100)->nullable();
            $table->string('g_poblacional', 150)->nullable(); // Discapacidad, Víctima, Tercera edad, etc.
            $table->string('t_aseguramiento', 100)->nullable(); // Subsidiado, Contributivo, etc.
            $table->unsignedBigInteger('id_punto')->nullable()->index();
            $table->unsignedBigInteger('id_gestor')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->foreign('id_tipo')->references('id_tipo')->on('tipo_id')->nullOnDelete();
            $table->foreign('id_punto')->references('id_punto')->on('puntos_vd')->nullOnDelete();
            $table->foreign('id_gestor')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('form_pvd');
    }
};
