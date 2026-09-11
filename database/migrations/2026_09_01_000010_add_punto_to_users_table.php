<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('id_punto')->nullable()->after('password');
            $table->string('telefono', 50)->nullable()->after('id_punto');
            $table->string('cargo', 100)->default('Gestor')->after('telefono');
            $table->boolean('activo')->default(true)->after('cargo');

            $table->foreign('id_punto')->references('id_punto')->on('puntos_vd')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['id_punto']);
            $table->dropColumn(['id_punto', 'telefono', 'cargo', 'activo']);
        });
    }
};
