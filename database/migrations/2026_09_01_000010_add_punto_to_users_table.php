<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'name')) {
                $table->string('name')->nullable()->after('id');
            }
            if (! Schema::hasColumn('users', 'id_punto')) {
                $table->unsignedBigInteger('id_punto')->nullable()->after('password');
            }
            if (! Schema::hasColumn('users', 'telefono')) {
                $table->string('telefono', 50)->nullable()->after('id_punto');
            }
            if (! Schema::hasColumn('users', 'cargo')) {
                $table->string('cargo', 100)->default('Gestor')->after('telefono');
            }
            if (! Schema::hasColumn('users', 'activo')) {
                $table->boolean('activo')->default(true)->after('cargo');
            }
        });

        if (Schema::hasColumn('users', 'names') && Schema::hasColumn('users', 'name')) {
            \Illuminate\Support\Facades\DB::table('users')->whereNull('name')->update([
                'name' => \Illuminate\Support\Facades\DB::raw('names')
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['id_punto']);
            $table->dropColumn(['id_punto', 'telefono', 'cargo', 'activo']);
        });
    }
};
