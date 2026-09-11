<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('clave', 100)->unique();
            $table->text('valor')->nullable();
            $table->string('descripcion', 255)->nullable();
            $table->string('tipo', 50)->default('string'); // string, boolean, json, integer
            $table->timestamps();
        });

        Schema::create('auditoria_logs', function (Blueprint $table) {
            $table->id('id_log');
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('accion', 50); // 'CREAR_CIUDADANO', 'ACTUALIZAR_CIUDADANO', 'REGISTRAR_VISITA', etc.
            $table->string('modulo', 50);
            $table->string('registro_id', 50)->nullable();
            $table->json('datos_anteriores')->nullable();
            $table->json('datos_nuevos')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auditoria_logs');
        Schema::dropIfExists('settings');
    }
};
