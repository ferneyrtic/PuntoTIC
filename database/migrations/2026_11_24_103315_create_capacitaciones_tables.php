<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('capacitaciones')) {
            Schema::create('capacitaciones', function (Blueprint $table) {
                $table->id('id_capacitacion');
                $table->unsignedBigInteger('id_punto')->nullable()->index();
                $table->string('titulo', 255);
                $table->string('slug', 255)->unique();
                $table->text('descripcion');
                $table->string('categoria', 100)->default('Ofimática');
                $table->string('tipo', 50)->default('Taller'); // Taller, Curso Corto, Diplomado, Seminario
                $table->string('instructor', 150)->nullable();
                $table->date('fecha_inicio')->nullable();
                $table->date('fecha_fin')->nullable();
                $table->string('horario', 150)->nullable();
                $table->unsignedSmallInteger('duracion_horas')->default(20);
                $table->unsignedSmallInteger('cupos_totales')->default(25);
                $table->unsignedSmallInteger('cupos_disponibles')->default(25);
                $table->text('requisitos')->nullable();
                $table->string('dirigido_a', 150)->nullable();
                $table->string('imagen_url', 500)->nullable();
                $table->string('color_tema', 50)->default('emerald');
                $table->boolean('activo')->default(true);
                $table->boolean('destacado')->default(false);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('inscripciones_capacitacion')) {
            Schema::create('inscripciones_capacitacion', function (Blueprint $table) {
                $table->id('id_inscripcion');
                $table->unsignedBigInteger('id_capacitacion');
                $table->unsignedBigInteger('id_form_pvd')->nullable()->index();
                $table->string('documento', 50)->index();
                $table->string('nombres', 100);
                $table->string('apellidos', 100);
                $table->string('telefono', 50);
                $table->string('correo', 150)->nullable();
                $table->enum('estado', ['preinscrito', 'confirmado', 'asistio', 'cancelado'])->default('preinscrito');
                $table->text('observaciones')->nullable();
                $table->timestamps();

                $table->foreign('id_capacitacion')
                    ->references('id_capacitacion')
                    ->on('capacitaciones')
                    ->cascadeOnDelete();

                $table->unique(['id_capacitacion', 'documento'], 'uniq_inscripcion_doc');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('inscripciones_capacitacion');
        Schema::dropIfExists('capacitaciones');
    }
};
