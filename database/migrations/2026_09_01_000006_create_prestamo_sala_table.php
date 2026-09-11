<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prestamo_sala', function (Blueprint $table) {
            $table->id('id_prestamo');
            $table->unsignedBigInteger('id_form_pvd')->nullable()->index(); // FK real al ciudadano responsable
            $table->string('nombre_responsable_texto', 150)->nullable(); // Fallback para compatibilidad
            $table->unsignedBigInteger('id_punto')->index();
            $table->unsignedBigInteger('id_gestor')->nullable()->index();
            $table->string('tipo_actividad', 150)->default('Reunión comunitaria');
            $table->unsignedSmallInteger('num_asistentes')->default(1);
            $table->date('fecha_prestamo');
            $table->time('hora_inicio')->nullable();
            $table->time('hora_fin')->nullable();
            $table->text('observaciones')->nullable();
            $table->enum('estado', ['Reservado', 'En curso', 'Completado', 'Cancelado'])->default('Completado');
            $table->timestamps();

            $table->foreign('id_form_pvd')->references('id_form_pvd')->on('form_pvd')->nullOnDelete();
            $table->foreign('id_punto')->references('id_punto')->on('puntos_vd')->cascadeOnDelete();
            $table->foreign('id_gestor')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prestamo_sala');
    }
};
