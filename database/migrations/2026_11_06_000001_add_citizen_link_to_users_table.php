<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('documento', 50)->nullable()->index()->after('email');
            $table->unsignedBigInteger('id_form_pvd')->nullable()->index()->after('documento');

            $table->foreign('id_form_pvd')->references('id_form_pvd')->on('form_pvd')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['id_form_pvd']);
            $table->dropColumn(['documento', 'id_form_pvd']);
        });
    }
};
