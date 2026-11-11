<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('arboles_navidad');

        Schema::create('arboles_navidad', function (Blueprint $table) {
            $table->id();
            $table->integer('user_id')->unique();
            $table->integer('id_punto')->nullable()->index();
            $table->string('nombre_gestor', 150);
            $table->string('nombre_punto', 150)->nullable();
            $table->json('decoraciones');
            $table->string('mensaje', 255)->nullable();
            $table->boolean('luces_activas')->default(true);
            $table->unsignedInteger('reacciones_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('arboles_navidad');
    }
};
