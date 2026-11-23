<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('prestamo_sala_participantes')) {
            Schema::create('prestamo_sala_participantes', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('id_prestamo')->index();
                // Ciudadano registrado en el sistema (opcional, puede ser externo)
                $table->unsignedBigInteger('id_form_pvd')->nullable()->index();
                // Fallback para participantes no registrados
                $table->string('nombre_libre', 150)->nullable();
                $table->string('documento_libre', 30)->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('prestamo_sala_participantes');
    }
};
