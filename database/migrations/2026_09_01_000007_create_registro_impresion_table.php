<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('registro_impresion', function (Blueprint $table) {
            $table->id('id_impresion');
            $table->unsignedBigInteger('id_form_pvd')->nullable()->index(); // FK real al ciudadano
            $table->string('nombre_usuario_texto', 150)->nullable(); // Fallback
            $table->unsignedBigInteger('id_punto')->index();
            $table->unsignedBigInteger('id_gestor')->nullable()->index();
            $table->unsignedSmallInteger('numero_hojas')->default(1);
            $table->string('tipo_impresion', 100)->default('Documentos personales');
            $table->text('descripcion')->nullable();
            $table->timestamps();

            $table->foreign('id_form_pvd')->references('id_form_pvd')->on('form_pvd')->nullOnDelete();
            $table->foreign('id_punto')->references('id_punto')->on('puntos_vd')->cascadeOnDelete();
            $table->foreign('id_gestor')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registro_impresion');
    }
};
