<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('categorias')) {
            Schema::create('categorias', function (Blueprint $table) {
                $table->id('id_categoria');
                $table->string('nombre', 120);
                $table->string('descripcion', 255)->nullable();
                $table->string('icono', 50)->default('Folder');
                $table->string('color', 20)->default('#1B6B35');
                $table->integer('orden')->default(0);
                $table->boolean('activo')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('sub_categorias')) {
            Schema::create('sub_categorias', function (Blueprint $table) {
                $table->id('id_subcategoria');
                $table->foreignId('categoria_id')->constrained('categorias', 'id_categoria')->cascadeOnDelete();
                $table->string('nombre', 150);
                $table->string('descripcion', 255)->nullable();
                $table->integer('orden')->default(0);
                $table->boolean('activo')->default(true);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('sub_categorias');
        Schema::dropIfExists('categorias');
    }
};
