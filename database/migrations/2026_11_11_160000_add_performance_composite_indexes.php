<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Visitas: Índices compuestos para dashboard (filtros por punto y fechas)
        if (Schema::hasTable('visitas')) {
            Schema::table('visitas', function (Blueprint $table) {
                if (! Schema::hasIndex('visitas', 'idx_visitas_punto_created_form')) {
                    $table->index(['id_punto', 'created_at', 'id_form_pvd'], 'idx_visitas_punto_created_form');
                }
                if (! Schema::hasIndex('visitas', 'idx_visitas_created_punto')) {
                    $table->index(['created_at', 'id_punto'], 'idx_visitas_created_punto');
                }
                if (! Schema::hasIndex('visitas', 'idx_visitas_created_form')) {
                    $table->index(['created_at', 'id_form_pvd'], 'idx_visitas_created_form');
                }
            });
        }

        // 2. Registro Impresión: Índice compuesto para métricas y reportes por punto y fecha
        if (Schema::hasTable('registro_impresion')) {
            Schema::table('registro_impresion', function (Blueprint $table) {
                if (! Schema::hasIndex('registro_impresion', 'idx_impresion_punto_created')) {
                    $table->index(['id_punto', 'created_at'], 'idx_impresion_punto_created');
                }
            });
        }

        // 3. Préstamo Sala: Índice compuesto para consultas por sede y fecha
        if (Schema::hasTable('prestamo_sala')) {
            Schema::table('prestamo_sala', function (Blueprint $table) {
                if (! Schema::hasIndex('prestamo_sala', 'idx_prestamo_punto_fecha')) {
                    $table->index(['id_punto', 'fecha_prestamo'], 'idx_prestamo_punto_fecha');
                }
            });
        }

        // 4. Form PVD: Índice de documento para búsquedas rápidas de ciudadanos
        if (Schema::hasTable('form_pvd')) {
            Schema::table('form_pvd', function (Blueprint $table) {
                if (! Schema::hasIndex('form_pvd', 'idx_form_pvd_documento')) {
                    $table->index('documento', 'idx_form_pvd_documento');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('visitas')) {
            Schema::table('visitas', function (Blueprint $table) {
                if (Schema::hasIndex('visitas', 'idx_visitas_punto_created_form')) {
                    $table->dropIndex('idx_visitas_punto_created_form');
                }
                if (Schema::hasIndex('visitas', 'idx_visitas_created_punto')) {
                    $table->dropIndex('idx_visitas_created_punto');
                }
                if (Schema::hasIndex('visitas', 'idx_visitas_created_form')) {
                    $table->dropIndex('idx_visitas_created_form');
                }
            });
        }

        if (Schema::hasTable('registro_impresion')) {
            Schema::table('registro_impresion', function (Blueprint $table) {
                if (Schema::hasIndex('registro_impresion', 'idx_impresion_punto_created')) {
                    $table->dropIndex('idx_impresion_punto_created');
                }
            });
        }

        if (Schema::hasTable('prestamo_sala')) {
            Schema::table('prestamo_sala', function (Blueprint $table) {
                if (Schema::hasIndex('prestamo_sala', 'idx_prestamo_punto_fecha')) {
                    $table->dropIndex('idx_prestamo_punto_fecha');
                }
            });
        }

        if (Schema::hasTable('form_pvd')) {
            Schema::table('form_pvd', function (Blueprint $table) {
                if (Schema::hasIndex('form_pvd', 'idx_form_pvd_documento')) {
                    $table->dropIndex('idx_form_pvd_documento');
                }
            });
        }
    }
};
