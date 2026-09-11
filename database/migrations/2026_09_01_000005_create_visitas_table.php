<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visitas', function (Blueprint $table) {
            $table->id('id_visita');
            $table->unsignedBigInteger('id_form_pvd')->index();
            $table->unsignedBigInteger('id_punto')->index();
            $table->unsignedBigInteger('id_categoria')->nullable()->index();
            $table->unsignedBigInteger('id_subcategoria')->nullable()->index();
            $table->string('servicio_texto', 200)->nullable();
            $table->text('descripcion')->nullable();
            $table->unsignedBigInteger('id_gestor')->nullable()->index();
            $table->unsignedSmallInteger('duracion_minutos')->default(30);
            $table->timestamps();

            $table->foreign('id_form_pvd')->references('id_form_pvd')->on('form_pvd')->cascadeOnDelete();
            $table->foreign('id_punto')->references('id_punto')->on('puntos_vd')->cascadeOnDelete();
            $table->foreign('id_categoria')->references('id_categoria')->on('categorias')->nullOnDelete();
            $table->foreign('id_subcategoria')->references('id_subcategoria')->on('sub_categorias')->nullOnDelete();
            $table->foreign('id_gestor')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visitas');
    }
};
