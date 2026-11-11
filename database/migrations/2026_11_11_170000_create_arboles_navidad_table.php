<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('arboles_navidad')) {
            Schema::create('arboles_navidad', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
                $table->unsignedBigInteger('id_punto')->nullable();
                $table->string('nombre_gestor', 150);
                $table->string('nombre_punto', 150)->nullable();
                $table->json('decoraciones');
                $table->string('mensaje', 255)->nullable();
                $table->boolean('luces_activas')->default(true);
                $table->unsignedInteger('reacciones_count')->default(0);
                $table->timestamps();

                $table->foreign('id_punto')->references('id_punto')->on('puntos_vd')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('arboles_navidad');
    }
};
