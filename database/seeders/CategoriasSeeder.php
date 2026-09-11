<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategoriasSeeder extends Seeder
{
    public function run(): void
    {
        $categorias = [
            [
                'id_categoria' => 1,
                'nombre' => 'Trámites en Línea',
                'descripcion' => 'Gestión y consulta de trámites gubernamentales, locales y nacionales',
                'icono' => 'FileText',
                'color' => '#1A4A7A', // Azul institucional
                'orden' => 1,
                'activo' => true,
                'subs' => [
                    'SISBEN (Consulta, actualización y solicitudes)',
                    'Alcaldía de Acacías (Impuesto predial e ICA)',
                    'Antecedentes Judiciales y Policía Nacional',
                    'Registraduría (Cédula digital y certificados)',
                    'DIAN / RUT (Inscripción y actualización)',
                    'ADRES / Fosyga y Afiliaciones de Salud',
                    'ICBF y Bienestar Familiar',
                    'Pago en línea de servicios públicos (EMSAA, etc.)',
                    'Carpeta Ciudadana Digital',
                    'Otros trámites institucionales',
                ],
            ],
            [
                'id_categoria' => 2,
                'nombre' => 'Conectividad y Gobierno Digital',
                'descripcion' => 'Acceso libre a internet, equipos de cómputo y plataformas digitales',
                'icono' => 'Globe',
                'color' => '#1B6B35', // Verde Alcaldía
                'orden' => 2,
                'subs' => [
                    'Navegación general en Internet e investigación',
                    'Consultas académicas y tareas estudiantiles',
                    'Videollamadas, entrevistas y teletrabajo',
                    'Gestión de correo electrónico y almacenamiento en la nube',
                    'Postulación a ofertas de empleo y hojas de vida',
                ],
            ],
            [
                'id_categoria' => 3,
                'nombre' => 'Impresión y Digitalización',
                'descripcion' => 'Servicios de impresión, fotocopiado y escaneo de documentos',
                'icono' => 'Printer',
                'color' => '#F5A623', // Amarillo institucional
                'orden' => 3,
                'subs' => [
                    'Impresión de documentos de identidad y personales',
                    'Impresión de certificados y recibos de pago',
                    'Impresión de hojas de vida y soportes laborales',
                    'Digitalización / Escaneo de documentos físicos',
                    'Fotografías tamaño documento',
                ],
            ],
            [
                'id_categoria' => 4,
                'nombre' => 'Capacitación y Formación Digital',
                'descripcion' => 'Cursos, talleres y alfabetización digital para la comunidad',
                'icono' => 'GraduationCap',
                'color' => '#8B5CF6', // Violeta
                'orden' => 4,
                'subs' => [
                    'Alfabetización digital para adultos mayores',
                    'Ofimática básica e intermedia (Word, Excel, PowerPoint)',
                    'Uso seguro de internet y redes sociales para emprendedores',
                    'Seguridad informática y prevención de estafas digitales',
                    'Talleres de robótica y programación básica',
                ],
            ],
            [
                'id_categoria' => 5,
                'nombre' => 'Préstamo de Salas y Espacios',
                'descripcion' => 'Uso de las instalaciones para eventos comunitarios e institucionales',
                'icono' => 'Users',
                'color' => '#059669', // Esmeralda
                'orden' => 5,
                'subs' => [
                    'Reuniones de Juntas de Acción Comunal (JAC)',
                    'Capacitaciones institucionales de la Alcaldía',
                    'Talleres externos y reuniones comunitarias',
                    'Eventos culturales y educativos',
                ],
            ],
        ];

        foreach ($categorias as $cat) {
            $subs = $cat['subs'];
            unset($cat['subs']);
            $cat['created_at'] = now();
            $cat['updated_at'] = now();

            DB::table('categorias')->upsert([$cat], ['id_categoria'], ['nombre', 'descripcion', 'icono', 'color', 'orden', 'activo', 'updated_at']);

            $ordenSub = 1;
            foreach ($subs as $subNombre) {
                DB::table('sub_categorias')->updateOrInsert(
                    [
                        'categoria_id' => $cat['id_categoria'],
                        'nombre' => $subNombre,
                    ],
                    [
                        'descripcion' => null,
                        'orden' => $ordenSub++,
                        'activo' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
            }
        }
    }
}
