<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campos_dinamicos', function (Blueprint $table) {
            $table->id('id_campo');
            $table->enum('modulo', ['form_pvd', 'visitas', 'prestamo_sala', 'registro_impresion'])->default('visitas')->index();
            $table->string('nombre_campo', 100);
            $table->string('slug', 100);
            $table->enum('tipo', ['texto', 'numero', 'lista', 'fecha', 'booleano'])->default('texto');
            $table->json('opciones')->nullable(); // Para listas desplegables: ["PC", "Tablet", "Celular"]
            $table->boolean('requerido')->default(false);
            $table->boolean('incluir_en_reporte')->default(true);
            $table->boolean('activo')->default(true);
            $table->integer('orden')->default(0);
            $table->timestamps();
        });

        Schema::create('valores_campos_dinamicos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_campo')->index();
            $table->string('entidad_tipo', 50)->index(); // 'visitas', 'form_pvd', etc.
            $table->unsignedBigInteger('entidad_id')->index();
            $table->text('valor')->nullable();
            $table->timestamps();

            $table->foreign('id_campo')->references('id_campo')->on('campos_dinamicos')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('valores_campos_dinamicos');
        Schema::dropIfExists('campos_dinamicos');
    }
};
