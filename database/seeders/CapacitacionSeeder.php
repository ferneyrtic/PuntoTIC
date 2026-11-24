<?php

namespace Database\Seeders;

use App\Models\Training;
use Illuminate\Database\Seeder;

class CapacitacionSeeder extends Seeder
{
    public function run(): void
    {
        $cursos = [
            [
                'id_punto' => 1, // PVD PLUS - Juan Rozo
                'titulo' => 'Alfabetización Digital & Celular para Adulto Mayor',
                'slug' => 'alfabetizacion-digital-adulto-mayor',
                'descripcion' => 'Aprende desde cero el manejo de teléfonos inteligentes, WhatsApp, videollamadas con familiares, navegación segura y consulta de citas médicas en línea.',
                'categoria' => 'Inclusión & Adulto Mayor',
                'tipo' => 'Taller Práctico',
                'instructor' => 'Ing. Juan Carlos Morales (Gestor PVD PLUS)',
                'fecha_inicio' => now()->addDays(5)->toDateString(),
                'fecha_fin' => now()->addDays(20)->toDateString(),
                'horario' => 'Martes y Jueves · 8:30 AM - 10:30 AM',
                'duracion_horas' => 16,
                'cupos_totales' => 20,
                'cupos_disponibles' => 14,
                'requisitos' => 'Traer teléfono inteligente personal y documento de identidad.',
                'dirigido_a' => 'Adultos mayores de 55 años y personas sin experiencia digital.',
                'color_tema' => 'emerald',
                'activo' => true,
                'destacado' => true,
            ],
            [
                'id_punto' => 2, // PVD Tradicional - Las Colinas
                'titulo' => 'Excel & Herramientas Ofimáticas para el Empleo',
                'slug' => 'excel-herramientas-ofimaticas-empleo',
                'descripcion' => 'Domina fórmulas esenciales, tablas dinámicas, hojas de cálculo, elaboración de hojas de vida profesionales y redacción formal de informes laborales.',
                'categoria' => 'Ofimática & Empleabilidad',
                'tipo' => 'Curso Corto Certificado',
                'instructor' => 'Lic. Diana Patricia Silva',
                'fecha_inicio' => now()->addDays(7)->toDateString(),
                'fecha_fin' => now()->addDays(28)->toDateString(),
                'horario' => 'Lunes a Miércoles · 2:00 PM - 4:00 PM',
                'duracion_horas' => 24,
                'cupos_totales' => 24,
                'cupos_disponibles' => 8,
                'requisitos' => 'Manejo básico de teclado y ratón.',
                'dirigido_a' => 'Jóvenes, bachilleres, buscadores de empleo y comerciantes.',
                'color_tema' => 'blue',
                'activo' => true,
                'destacado' => true,
            ],
            [
                'id_punto' => 4, // Aula Digital Chichimene
                'titulo' => 'Robótica Educativa & Pensamiento Lógico Infantil',
                'slug' => 'robotica-pensamiento-logico-infantil',
                'descripcion' => 'Iniciación creativa a la programación mediante bloques Scratch, desafíos de robótica básica y resolución de problemas lógicos para niños y jóvenes.',
                'categoria' => 'Programación & Robótica',
                'tipo' => 'Taller Creativo',
                'instructor' => 'Ing. Felipe Ospina',
                'fecha_inicio' => now()->addDays(10)->toDateString(),
                'fecha_fin' => now()->addDays(25)->toDateString(),
                'horario' => 'Viernes y Sábados · 9:00 AM - 11:30 AM',
                'duracion_horas' => 20,
                'cupos_totales' => 18,
                'cupos_disponibles' => 11,
                'requisitos' => 'Edad entre 8 y 15 años. Autorización de padre o acudiente.',
                'dirigido_a' => 'Niños, niñas y jóvenes de la Vereda Chichimene y sectores rurales.',
                'color_tema' => 'purple',
                'activo' => true,
                'destacado' => true,
            ],
            [
                'id_punto' => 3, // Aula Digital Dinamarca
                'titulo' => 'Marketing Digital & Ventas por Redes Sociales para Emprendedores',
                'slug' => 'marketing-digital-emprendedores-rurales',
                'descripcion' => 'Diseño de piezas publicitarias con Canva, catálogo digital en WhatsApp Business, fotografía de productos campesinos y estrategias de comercialización local.',
                'categoria' => 'Emprendimiento & Negocios',
                'tipo' => 'Curso Corto',
                'instructor' => 'Facilitador TIC Dinamarca',
                'fecha_inicio' => now()->addDays(12)->toDateString(),
                'fecha_fin' => now()->addDays(26)->toDateString(),
                'horario' => 'Lunes y Jueves · 3:00 PM - 5:00 PM',
                'duracion_horas' => 16,
                'cupos_totales' => 20,
                'cupos_disponibles' => 15,
                'requisitos' => 'Tener una idea de negocio, emprendimiento rural o producto.',
                'dirigido_a' => 'Emprendedores, artesanos, productores agropecuarios y comunidad.',
                'color_tema' => 'amber',
                'activo' => true,
                'destacado' => false,
            ],
            [
                'id_punto' => null, // Toda la red / Virtual
                'titulo' => 'Trámites de Estado en Línea & Seguridad Digital Ciudadana',
                'slug' => 'tramites-estado-seguridad-digital',
                'descripcion' => 'Aprende a expedir certificados de antecedentes (Policía, Procuraduría, Contraloría), consultar el SISBÉN IV, RUNT, RUT y proteger tu identidad de fraudes cibernéticos.',
                'categoria' => 'Trámites en Línea',
                'tipo' => 'Seminario Práctico',
                'instructor' => 'Equipo de Facilitadores Secretaría TIC',
                'fecha_inicio' => now()->addDays(3)->toDateString(),
                'fecha_fin' => now()->addDays(10)->toDateString(),
                'horario' => 'Miércoles · 4:00 PM - 6:00 PM',
                'duracion_horas' => 8,
                'cupos_totales' => 35,
                'cupos_disponibles' => 22,
                'requisitos' => 'Documento de identidad nacional.',
                'dirigido_a' => 'Ciudadanía general del Municipio de Acacías.',
                'color_tema' => 'teal',
                'activo' => true,
                'destacado' => false,
            ],
        ];

        foreach ($cursos as $c) {
            Training::updateOrCreate(
                ['slug' => $c['slug']],
                $c
            );
        }
    }
}
