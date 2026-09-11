<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Point;
use App\Models\DocumentType;
use App\Models\Category;
use App\Models\SubCategory;
use Carbon\Carbon;

class ImportProductionData extends Command
{
    protected $signature = 'pvd:import-production-data {--file= : Ruta al archivo SQL}';
    protected $description = 'Importa los 23.847 ciudadanos, 154.996 visitas, préstamos e impresiones de producción';

    public function handle(): int
    {
        $sqlPath = $this->option('file') ?: base_path('../backup_pvd_prod.sql');
        if (!file_exists($sqlPath)) {
            $this->error("No se encontró el archivo SQL en: {$sqlPath}");
            return 1;
        }

        $this->info("Iniciando importación desde: {$sqlPath}");
        $startTime = microtime(true);

        // Optimizar SQLite para inserciones masivas
        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA synchronous = OFF;');
            DB::statement('PRAGMA journal_mode = MEMORY;');
            DB::statement('PRAGMA foreign_keys = OFF;');
        } else {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        }

        // 1. IMPORTAR PUNTOS VIVE DIGITAL
        $this->info("--> 1. Importando Sedes Puntos Vive Digital...");
        DB::table('puntos_vd')->delete();
        $puntos = [
            ['id_punto' => 1, 'nombre_punto' => 'Vive Digital PLUS', 'zona' => 'Urbana', 'activo' => true],
            ['id_punto' => 2, 'nombre_punto' => 'Vive Digital Tradicional', 'zona' => 'Urbana', 'activo' => true],
            ['id_punto' => 3, 'nombre_punto' => 'Aula Digital Dinamarca', 'zona' => 'Rural', 'activo' => true],
            ['id_punto' => 4, 'nombre_punto' => 'Aula Digital Chichimene', 'zona' => 'Rural', 'activo' => true],
            ['id_punto' => 5, 'nombre_punto' => 'Registro Comerciantes (Histórico)', 'zona' => 'Urbana', 'activo' => false],
            ['id_punto' => 6, 'nombre_punto' => 'Capacitador Móvil (Histórico)', 'zona' => 'Urbana', 'activo' => false],
        ];
        DB::table('puntos_vd')->insert($puntos);

        // 2. IMPORTAR TIPOS DE IDENTIFICACIÓN
        $this->info("--> 2. Importando Tipos de Documento...");
        DB::table('tipo_id')->delete();
        $tipos = [
            ['id_tipo' => 1, 'sigla' => 'TI', 'nombre_tipo' => 'Tarjeta de Identidad'],
            ['id_tipo' => 2, 'sigla' => 'CC', 'nombre_tipo' => 'Cédula de Ciudadanía'],
            ['id_tipo' => 3, 'sigla' => 'CE', 'nombre_tipo' => 'Cédula de Extranjería'],
            ['id_tipo' => 4, 'sigla' => 'RC', 'nombre_tipo' => 'Registro Civil'],
            ['id_tipo' => 5, 'sigla' => 'PA', 'nombre_tipo' => 'Pasaporte'],
            ['id_tipo' => 6, 'sigla' => 'PPT', 'nombre_tipo' => 'Permiso por Protección Temporal'],
        ];
        DB::table('tipo_id')->insert($tipos);

        // 3. CARGAR CATEGORÍAS INSTITUCIONALES BASE
        $this->info("--> 3. Verificando Categorías de Servicios...");
        $this->seedCategories();

        // 4. IMPORTAR CIUDADANOS (FORM_PVD)
        $this->info("--> 4. Extrayendo e insertando Ciudadanos (form_pvd)...");
        $citizenDocToIdMap = [];
        $handle = fopen($sqlPath, 'r');
        $citizenBuffer = [];
        $totalCitizens = 0;

        DB::beginTransaction();
        DB::table('form_pvd')->truncate();

        while (($line = fgets($handle)) !== false) {
            if (str_starts_with($line, "INSERT INTO `form_pvd` VALUES ")) {
                $tuplesString = substr(trim($line), strlen("INSERT INTO `form_pvd` VALUES "));
                if (str_ends_with($tuplesString, ';')) {
                    $tuplesString = substr($tuplesString, 0, -1);
                }

                // Parse tuples
                $tuples = explode("),(", substr($tuplesString, 1, -1));
                foreach ($tuples as $tuple) {
                    $row = str_getcsv($tuple, ',', "'");
                    if (count($row) < 19) continue;

                    $rawId = trim($row[0]);
                    $tipoId = is_numeric($row[1]) ? (int)$row[1] : 2;
                    $nombres = trim($row[2] ?? '');
                    $apellidos = trim($row[3] ?? '');
                    $fechaNac = $this->cleanDate($row[4] ?? null);
                    $edad = is_numeric($row[5] ?? null) ? (int)$row[5] : null;
                    $genero = trim($row[6] ?? '');
                    $correo = trim($row[7] ?? '');
                    $telefono = trim($row[8] ?? '');
                    $direccion = trim($row[9] ?? '');
                    $barrio = trim($row[10] ?? '');
                    $zona = (isset($row[11]) && stripos($row[11], 'rural') !== false) ? 'Rural' : 'Urbana';
                    $up = trim($row[12] ?? '');
                    $estrato = is_numeric($row[13] ?? null) ? (int)$row[13] : 1;
                    $grupoEtnico = trim($row[14] ?? '');
                    $nivelEducativo = trim($row[15] ?? ''); // 100% editable
                    $gPoblacional = trim($row[16] ?? '');
                    $tAseguramiento = trim($row[17] ?? '');
                    $ocupacion = trim($row[18] ?? '');
                    $idPunto = is_numeric($row[20] ?? null) ? (int)$row[20] : 1;
                    $createdAt = $this->cleanDateTime($row[21] ?? null);
                    $updatedAt = $this->cleanDateTime($row[22] ?? null);

                    $citizenBuffer[] = [
                        'documento' => $rawId,
                        'id_tipo' => in_array($tipoId, [1, 2, 3, 4, 5, 6]) ? $tipoId : 2,
                        'nombres' => $nombres,
                        'apellidos' => $apellidos,
                        'fecha_nac' => $fechaNac,
                        'edad' => $edad,
                        'genero' => $genero,
                        'correo' => $correo,
                        'telefono' => $telefono,
                        'direccion' => $direccion,
                        'barrio' => $barrio,
                        'zona' => $zona,
                        'up' => $up,
                        'estrato' => $estrato,
                        'grupo_etnico' => $grupoEtnico,
                        'nivel_educativo' => $nivelEducativo,
                        'g_poblacional' => $gPoblacional,
                        't_aseguramiento' => $tAseguramiento,
                        'ocupacion' => $ocupacion,
                        'id_punto' => $idPunto,
                        'created_at' => $createdAt,
                        'updated_at' => $updatedAt,
                    ];

                    if (count($citizenBuffer) >= 1000) {
                        DB::table('form_pvd')->insert($citizenBuffer);
                        $totalCitizens += count($citizenBuffer);
                        $this->output->write("\r   -> Ciudadanos importados: {$totalCitizens}...");
                        $citizenBuffer = [];
                    }
                }
            }
        }
        if (!empty($citizenBuffer)) {
            DB::table('form_pvd')->insert($citizenBuffer);
            $totalCitizens += count($citizenBuffer);
        }
        DB::commit();
        $this->info("\n   [OK] Total Ciudadanos importados con éxito: {$totalCitizens}");

        // Construir mapa documento -> id_form_pvd en memoria
        $this->info("   -> Construyendo mapa de índice en memoria...");
        $docRows = DB::table('form_pvd')->select('id_form_pvd', 'documento')->get();
        foreach ($docRows as $dr) {
            $citizenDocToIdMap[$dr->documento] = $dr->id_form_pvd;
        }

        // 5. IMPORTAR VISITAS (154.996)
        $this->info("--> 5. Extrayendo e insertando Visitas (154.996)...");
        rewind($handle);
        $visitBuffer = [];
        $totalVisits = 0;

        DB::beginTransaction();
        DB::table('visitas')->truncate();

        while (($line = fgets($handle)) !== false) {
            if (str_starts_with($line, "INSERT INTO `visitas` VALUES ")) {
                $tuplesString = substr(trim($line), strlen("INSERT INTO `visitas` VALUES "));
                if (str_ends_with($tuplesString, ';')) {
                    $tuplesString = substr($tuplesString, 0, -1);
                }

                $tuples = explode("),(", substr($tuplesString, 1, -1));
                foreach ($tuples as $tuple) {
                    $row = str_getcsv($tuple, ',', "'");
                    if (count($row) < 6) continue;

                    $doc = trim($row[1]);
                    $servicio = trim($row[2] ?? 'Atención en sala');
                    $idPunto = is_numeric($row[3] ?? null) ? (int)$row[3] : 1;
                    $desc = isset($row[4]) && $row[4] !== 'NULL' ? trim($row[4]) : null;
                    $createdAt = $this->cleanDateTime($row[5] ?? null);
                    $updatedAt = $this->cleanDateTime($row[6] ?? null);

                    // Si el ciudadano existe en el mapa
                    $citizenId = $citizenDocToIdMap[$doc] ?? null;
                    if (!$citizenId) {
                        // Crear ciudadano mínimo si no existía en form_pvd
                        $newId = DB::table('form_pvd')->insertGetId([
                            'documento' => $doc,
                            'nombres' => 'Ciudadano',
                            'apellidos' => 'Acacías',
                            'zona' => 'Urbana',
                            'created_at' => $createdAt,
                            'updated_at' => $updatedAt,
                        ]);
                        $citizenDocToIdMap[$doc] = $newId;
                        $citizenId = $newId;
                    }

                    $visitBuffer[] = [
                        'id_form_pvd' => $citizenId,
                        'id_punto' => in_array($idPunto, [1, 2, 3, 4, 5, 6]) ? $idPunto : 1,
                        'servicio_texto' => $servicio,
                        'descripcion' => $desc,
                        'duracion_minutos' => 30,
                        'created_at' => $createdAt,
                        'updated_at' => $updatedAt,
                    ];

                    if (count($visitBuffer) >= 2000) {
                        DB::table('visitas')->insert($visitBuffer);
                        $totalVisits += count($visitBuffer);
                        $this->output->write("\r   -> Visitas importadas: {$totalVisits}...");
                        $visitBuffer = [];
                    }
                }
            }
        }
        if (!empty($visitBuffer)) {
            DB::table('visitas')->insert($visitBuffer);
            $totalVisits += count($visitBuffer);
        }
        DB::commit();
        $this->info("\n   [OK] Total Visitas importadas con éxito: {$totalVisits}");

        // 6. IMPORTAR PRÉSTAMOS DE SALA CON CLASIFICADOR INTELIGENTE
        $this->info("--> 6. Importando Préstamos de Sala con Clasificación Inteligente...");
        rewind($handle);
        $loansBuffer = [];
        $totalLoans = 0;

        DB::beginTransaction();
        DB::table('prestamo_sala')->truncate();

        while (($line = fgets($handle)) !== false) {
            if (str_starts_with($line, "INSERT INTO `prestamo_sala` VALUES ")) {
                $tuplesString = substr(trim($line), strlen("INSERT INTO `prestamo_sala` VALUES "));
                if (str_ends_with($tuplesString, ';')) {
                    $tuplesString = substr($tuplesString, 0, -1);
                }

                $tuples = explode("),(", substr($tuplesString, 1, -1));
                foreach ($tuples as $tuple) {
                    $row = str_getcsv($tuple, ',', "'");
                    if (count($row) < 7) continue;

                    $nombreResp = trim($row[1] ?? 'Responsable');
                    $idPunto = is_numeric($row[3] ?? null) ? (int)$row[3] : 1;
                    $tipo = trim($row[4] ?? '');
                    $otro = isset($row[5]) && $row[5] !== 'NULL' ? trim($row[5]) : '';
                    $createdAt = $this->cleanDateTime($row[7] ?? null);
                    $fechaPrestamo = substr($createdAt, 0, 10);

                    // Reclasificación inteligente
                    $actividad = $this->classifyRoomLoan($tipo, $otro, $nombreResp);
                    $obs = trim($otro ? "Detalle: {$otro}" : ($tipo ?: ''));

                    $loansBuffer[] = [
                        'nombre_responsable_texto' => $nombreResp,
                        'id_punto' => in_array($idPunto, [1, 2, 3, 4, 5, 6]) ? $idPunto : 1,
                        'tipo_actividad' => $actividad,
                        'num_asistentes' => 15,
                        'fecha_prestamo' => $fechaPrestamo,
                        'hora_inicio' => '09:00',
                        'hora_fin' => '11:00',
                        'observaciones' => $obs,
                        'estado' => 'Completado',
                        'created_at' => $createdAt,
                        'updated_at' => $createdAt,
                    ];
                }
            }
        }
        if (!empty($loansBuffer)) {
            DB::table('prestamo_sala')->insert($loansBuffer);
            $totalLoans = count($loansBuffer);
        }
        DB::commit();
        $this->info("   [OK] Total Préstamos de Sala importados y clasificados: {$totalLoans}");

        // 7. IMPORTAR REGISTRO DE IMPRESIONES
        $this->info("--> 7. Importando Registros de Impresiones...");
        rewind($handle);
        $printsBuffer = [];
        $totalPrints = 0;

        DB::beginTransaction();
        DB::table('registro_impresion')->truncate();

        while (($line = fgets($handle)) !== false) {
            if (str_starts_with($line, "INSERT INTO `registro_impresion` VALUES ")) {
                $tuplesString = substr(trim($line), strlen("INSERT INTO `registro_impresion` VALUES "));
                if (str_ends_with($tuplesString, ';')) {
                    $tuplesString = substr($tuplesString, 0, -1);
                }

                $tuples = explode("),(", substr($tuplesString, 1, -1));
                foreach ($tuples as $tuple) {
                    $row = str_getcsv($tuple, ',', "'");
                    if (count($row) < 5) continue;

                    $doc = trim($row[1] ?? '');
                    $numImp = is_numeric($row[2] ?? null) ? max(1, (int)$row[2]) : 1;
                    $idPunto = is_numeric($row[3] ?? null) ? (int)$row[3] : 1;
                    $createdAt = $this->cleanDateTime($row[4] ?? null);

                    $citizenId = $citizenDocToIdMap[$doc] ?? null;

                    $printsBuffer[] = [
                        'id_form_pvd' => $citizenId,
                        'nombre_usuario_texto' => $citizenId ? null : "C.C. {$doc}",
                        'id_punto' => in_array($idPunto, [1, 2, 3, 4, 5, 6]) ? $idPunto : 1,
                        'numero_hojas' => $numImp,
                        'tipo_impresion' => 'Impresión y Digitalización de Documentos',
                        'descripcion' => "Trámite de {$numImp} folios",
                        'created_at' => $createdAt,
                        'updated_at' => $createdAt,
                    ];
                }
            }
        }
        if (!empty($printsBuffer)) {
            DB::table('registro_impresion')->insert($printsBuffer);
            $totalPrints = count($printsBuffer);
        }
        DB::commit();
        $this->info("   [OK] Total Impresiones importadas: {$totalPrints}");

        fclose($handle);

        $duration = round(microtime(true) - $startTime, 2);
        $this->info("\n=== MIGRACIÓN COMPLETADA EXITOSAMENTE EN {$duration} SEGUNDOS ===");
        return 0;
    }

    private function cleanDate(?string $date): ?string
    {
        if (!$date || $date === 'NULL' || $date === '0000-00-00' || strlen($date) < 8) return null;
        try {
            return Carbon::parse($date)->toDateString();
        } catch (\Exception $e) {
            return null;
        }
    }

    private function cleanDateTime(?string $dt): string
    {
        if (!$dt || $dt === 'NULL' || $dt === '0000-00-00 00:00:00') return now()->toDateTimeString();
        try {
            return Carbon::parse($dt)->toDateTimeString();
        } catch (\Exception $e) {
            return now()->toDateTimeString();
        }
    }

    private function classifyRoomLoan(string $tipo, ?string $otro, ?string $nombre): string
    {
        $text = mb_strtolower(($tipo ?? '') . ' ' . ($otro ?? '') . ' ' . ($nombre ?? ''), 'UTF-8');

        if (str_contains($text, 'sena') || str_contains($text, 'capacitac') || str_contains($text, 'formacion') || str_contains($text, 'taller') || str_contains($text, 'curso') || str_contains($text, 'instructor') || str_contains($text, 'clase')) {
            return 'Convenios Formativos y Cursos SENA / Alcaldía';
        }
        if (str_contains($text, 'icbf') || str_contains($text, 'bienestar familiar') || str_contains($text, 'infancia') || str_contains($text, 'madres comunitarias') || str_contains($text, 'cero a siempre')) {
            return 'ICBF y Programas de Niñez / Primera Infancia';
        }
        if (str_contains($text, 'colegio') || str_contains($text, 'institucion') || str_contains($text, 'institución') || str_contains($text, 'escuela') || str_contains($text, 'juan rozo') || str_contains($text, 'dinamarca') || str_contains($text, 'inedi') || str_contains($text, 'normal superior') || str_contains($text, 'pablo vi') || str_contains($text, 'sanmiguel') || str_contains($text, 'esap') || str_contains($text, 'docente') || str_contains($text, 'profesor') || str_contains($text, 'alumnos') || str_contains($text, 'estudiante')) {
            return 'Instituciones Educativas y Colegios';
        }
        if (str_contains($text, 'jac') || str_contains($text, 'junta') || str_contains($text, 'comunal') || str_contains($text, 'asojuntas') || str_contains($text, 'asociacion') || str_contains($text, 'asociación')) {
            return 'Juntas de Acción Comunal (JAC) y Asambleas Barriales';
        }
        if (str_contains($text, 'arn') || str_contains($text, 'reintegr') || str_contains($text, 'cedavida') || str_contains($text, 'sedavida') || str_contains($text, 'fundacion') || str_contains($text, 'fundación') || str_contains($text, 'nuevo amanecer') || str_contains($text, 'victimas') || str_contains($text, 'víctimas') || str_contains($text, 'adulto mayor') || str_contains($text, 'discapacidad')) {
            return 'Programas Sociales, Paz y Fundaciones Comunitarias';
        }
        if (str_contains($text, 'cine') || str_contains($text, 'pelicula') || str_contains($text, 'película') || str_contains($text, 'audiovisual') || str_contains($text, 'video') || str_contains($text, 'proyeccion') || str_contains($text, 'proyección')) {
            return 'Cine Comunitario, Cineclub y Proyecciones Audiovisuales';
        }
        if (str_contains($text, 'danza') || str_contains($text, 'teatro') || str_contains($text, 'musica') || str_contains($text, 'música') || str_contains($text, 'arte') || str_contains($text, 'cultura') || str_contains($text, 'ensayo') || str_contains($text, 'ajedrez') || str_contains($text, 'deporte')) {
            return 'Expresiones Culturales, Arte, Deporte y Danza';
        }
        if (str_contains($text, 'salud') || str_contains($text, 'vacunac') || str_contains($text, 'hospital') || str_contains($text, 'eps') || str_contains($text, 'brigada')) {
            return 'Jornadas de Salud, Vacunación y Brigadas';
        }
        if (str_contains($text, 'comerci') || str_contains($text, 'emprend') || str_contains($text, 'negocio') || str_contains($text, 'empresa') || str_contains($text, 'yo compro') || str_contains($text, 'dollarcity') || str_contains($text, 'impulsa')) {
            return 'Emprendimiento, Comercio Local y Empleo';
        }
        if (str_contains($text, 'secretar') || str_contains($text, 'biblioteca') || str_contains($text, 'tic') || str_contains($text, 'fomento') || str_contains($text, 'gobierno') || str_contains($text, 'alcalde') || str_contains($text, 'planeacion') || str_contains($text, 'gobernacion') || str_contains($text, 'cormacarena') || str_contains($text, 'colpensiones')) {
            return 'Reuniones y Eventos Institucionales de la Alcaldía';
        }

        return 'Otras Actividades Comunitarias';
    }

    private function seedCategories(): void
    {
        $categories = [
            [
                'id_categoria' => 1,
                'nombre' => 'Trámites en Línea y Estado',
                'descripcion' => 'Consultas ciudadanas de SISBEN, DIAN/RUT, Registraduría, Antecedentes y Certificados',
                'color' => '#1B6B35',
                'icono' => 'Globe',
                'orden' => 1,
            ],
            [
                'id_categoria' => 2,
                'nombre' => 'Conectividad y Navegación',
                'descripcion' => 'Acceso a internet, uso libre de computadores y consulta web general',
                'color' => '#1A4A7A',
                'icono' => 'Wifi',
                'orden' => 2,
            ],
            [
                'id_categoria' => 3,
                'nombre' => 'Impresión y Digitalización',
                'descripcion' => 'Impresión de documentos, escaneo y digitalización de soportes',
                'color' => '#F5A623',
                'icono' => 'Printer',
                'orden' => 3,
            ],
            [
                'id_categoria' => 4,
                'nombre' => 'Capacitación y Formación Digital',
                'descripcion' => 'Cursos de alfabetización digital, ofimática, programación y convenios SENA',
                'color' => '#7C3AED',
                'icono' => 'BookOpen',
                'orden' => 4,
            ],
            [
                'id_categoria' => 5,
                'nombre' => 'Préstamo de Salas y Espacios',
                'descripcion' => 'Uso de salones comunitarios para JAC, capacitaciones y eventos colectivos',
                'color' => '#059669',
                'icono' => 'DoorOpen',
                'orden' => 5,
            ],
        ];

        foreach ($categories as $cat) {
            DB::table('categorias')->updateOrInsert(['id_categoria' => $cat['id_categoria']], $cat);
        }
    }
}
