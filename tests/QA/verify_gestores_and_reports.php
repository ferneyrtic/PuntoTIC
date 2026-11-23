<?php

// Suprimir advertencias deprecadas de PHP 8.4+ para la ejecución de pruebas en CLI
error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED & ~E_NOTICE);
ini_set('display_errors', '0');

require_once __DIR__ . '/../../vendor/autoload.php';
$app = require_once __DIR__ . '/../../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Exports\CiudadanosExport;
use App\Exports\ImpresionesExport;
use App\Exports\ListadoAsistenciaExport;
use App\Exports\PrestamosExport;
use App\Exports\VisitasExport;
use App\Models\Citizen;
use App\Models\Point;
use App\Models\PrintRecord;
use App\Models\RoomLoan;
use App\Models\User;
use App\Models\Visit;
use App\Services\ExportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use PhpOffice\PhpSpreadsheet\IOFactory;

class GestoresAuditRunner
{
    private array $results = [];
    private int $passed = 0;
    private int $failed = 0;

    public function run(): void
    {
        $this->printHeader("INICIANDO SUITE DE AUDITORÍA Y VERIFICACIÓN DE GESTORES Y REPORTES");

        $gestores = [
            'Viviana (Tradicional)' => ['id' => 40434752, 'expected_punto' => 2, 'role' => 'Gestor'],
            'Ingrid (Dinamarca)'    => ['id' => 1001711849, 'expected_punto' => 3, 'role' => 'Gestor'],
            'Gestor PLUS (PLUS)'    => ['id' => 1122143887, 'expected_punto' => 1, 'role' => 'Gestor'],
            'Wilber (Chichimene)'   => ['id' => 40431620, 'expected_punto' => 4, 'role' => 'Gestor'],
            'David Mesa (Coord)'    => ['id' => 1122143888, 'expected_punto' => null, 'role' => 'Coordinador'],
            'Admin TIC (Admin)'     => ['id' => 1122126803, 'expected_punto' => null, 'role' => 'Administrador'],
        ];

        // 1. Verificación de Cuentas y Permisos
        $this->printSection("1. VERIFICACIÓN DE IDENTIDADES Y PERMISOS DE USUARIO");
        $loadedUsers = [];
        foreach ($gestores as $label => $info) {
            $user = User::find($info['id']);
            if (!$user) {
                // Fallback por email si el ID difiere
                $user = User::where('id', $info['id'])->first();
            }

            if ($user) {
                $loadedUsers[$label] = $user;
                $this->assert(
                    "Usuario {$label} existe y está activo",
                    $user->activo === true || $user->activo == 1,
                    "ID: {$user->id}, Nombre: {$user->name}, Punto: " . ($user->punto?->nombre_punto ?? 'Global')
                );
            } else {
                $this->recordFailure("Usuario {$label} existe", "No se encontró el usuario con ID {$info['id']}");
            }
        }

        // 2. Verificación de Vistas Clave por Gestor
        $this->printSection("2. PRUEBA DE RUTAS CLAVE PARA CADA GESTOR");
        $controllers = [
            'Dashboard' => fn($req) => app(\App\Http\Controllers\DashboardController::class)->index($req),
            'Visitas Index' => fn($req) => app(\App\Http\Controllers\VisitController::class)->index($req),
            'Visitas Create' => fn($req) => app(\App\Http\Controllers\VisitController::class)->create($req),
            'Ciudadanos Index' => fn($req) => app(\App\Http\Controllers\CitizenController::class)->index($req),
            'Préstamos Index' => fn($req) => app(\App\Http\Controllers\RoomLoanController::class)->index($req),
            'Impresiones Index' => fn($req) => app(\App\Http\Controllers\PrintController::class)->index($req),
            'Exportar Index' => fn($req) => app(\App\Http\Controllers\ExportController::class)->index(),
        ];

        foreach ($loadedUsers as $label => $user) {
            Auth::login($user);
            echo "\n--- Probando vistas como: {$user->name} ({$label}) ---\n";

            foreach ($controllers as $viewName => $invoker) {
                try {
                    $request = Request::create('/', 'GET');
                    $request->setUserResolver(fn() => $user);
                    $response = $invoker($request);

                    // Si es una respuesta Inertia, renderizar a HTTP Response
                    if (method_exists($response, 'toResponse')) {
                        $httpResponse = $response->toResponse($request);
                        $statusCode = $httpResponse->getStatusCode();
                    } elseif ($response instanceof \Symfony\Component\HttpFoundation\Response) {
                        $statusCode = $response->getStatusCode();
                    } else {
                        $statusCode = 200;
                    }

                    $this->assert(
                        "[{$label}] Controlador {$viewName}",
                        $statusCode === 200,
                        "Código: {$statusCode}"
                    );
                } catch (\Throwable $e) {
                    $this->recordFailure("[{$label}] Controlador {$viewName}", "Excepción: " . $e->getMessage());
                }
            }
        }

        // 3. Verificación de Scoping de Exportaciones por Sede
        $this->printSection("3. VERIFICACIÓN DE RESTRICCIÓN DE EXPORTACIONES POR SEDE");
        $exportController = app(\App\Http\Controllers\ExportController::class);

        foreach ($loadedUsers as $label => $user) {
            Auth::login($user);
            $req = Request::create('/exportar', 'GET');
            $req->setUserResolver(fn() => $user);
            
            try {
                $response = $exportController->index();
                $props = $response->toResponse($req)->getOriginalContent()->getData()['page']['props'];

                if ($user->tieneAlcanceGlobal() || $user->hasRole('Administrador')) {
                    $this->assert(
                        "[{$label}] Tiene alcance global en exportaciones",
                        $props['canExportAllPoints'] === true,
                        "Points count: " . count($props['points'])
                    );
                } else {
                    $this->assert(
                        "[{$label}] Scoped únicamente a su sede",
                        $props['canExportAllPoints'] === false && count($props['points']) === 1 && $props['points'][0]->id_punto == $user->id_punto,
                        "Punto permitido: " . ($props['points'][0]->nombre_punto ?? 'Ninguno')
                    );
                }
            } catch (\Throwable $e) {
                $this->recordFailure("[{$label}] Render ExportController::index", $e->getMessage());
            }
        }

        // 4. Verificación de Transparencia de Reportes
        $this->printSection("4. AUDITORÍA DE TRANSPARENCIA EN REPORTES (SIN FALLBACKS FALSOS)");

        // 4.1 Préstamos Export: Verificar que no haya 'Martha Viviana' ni 'Tradicional' forzados
        echo "\n[Test 4.1] Préstamos Export Transparency...\n";
        try {
            $prestamosExport = new PrestamosExport([]);
            $collection = $prestamosExport->collection();
            echo "   Total préstamos encontrados: " . $collection->count() . "\n";

            $hasFakeViviana = false;
            $hasFakeTradicional = false;
            $checkedLoans = 0;

            foreach ($collection as $loan) {
                $checkedLoans++;
                $mapped = $prestamosExport->map($loan);
                $puntoCol = $mapped[4];
                $gestorCol = $mapped[12];

                // Si el préstamo tiene id_gestor / id_gestores de otra persona, el gestorCol NO DEBE ser Martha Viviana
                $rawGestorId = $loan->id_gestor ?: $loan->id_gestores;
                if ($rawGestorId && $rawGestorId != 40434752) {
                    $realUser = User::find($rawGestorId);
                    if ($realUser && str_contains($gestorCol, 'Viviana') && !str_contains($realUser->name, 'Viviana')) {
                        $hasFakeViviana = true;
                        echo "   [ERROR] Préstamo #{$loan->id} con gestor {$realUser->name} fue mapeado falsamente a '{$gestorCol}'!\n";
                    }
                }

                // Si el préstamo no tiene gestor, debe decir 'Sin gestor asignado'
                if (!$rawGestorId && $gestorCol === 'Martha Viviana Medina Palacio') {
                    $hasFakeViviana = true;
                    echo "   [ERROR] Préstamo #{$loan->id} sin gestor fue mapeado falsamente a 'Martha Viviana Medina Palacio'!\n";
                }

                // Si el préstamo es de Dinamarca (Punto 3), NO DEBE decir Tradicional
                $rawPuntoId = $loan->id_punto ?: $loan->id_puntos;
                if ($rawPuntoId && $rawPuntoId == 3 && str_contains($puntoCol, 'Tradicional')) {
                    $hasFakeTradicional = true;
                    echo "   [ERROR] Préstamo #{$loan->id} de Dinamarca fue mapeado falsamente a '{$puntoCol}'!\n";
                }

                if ($checkedLoans >= 50) break; // Muestrear los primeros 50
            }

            $this->assert(
                "Préstamos Export: No asigna nombres falsos de gestor a préstamos ajenos o sin gestor",
                !$hasFakeViviana,
                "Muestreados: {$checkedLoans} préstamos"
            );

            $this->assert(
                "Préstamos Export: No asigna 'Vive Digital Tradicional' a otras sedes",
                !$hasFakeTradicional,
                "Muestreados: {$checkedLoans} préstamos"
            );
        } catch (\Throwable $e) {
            $this->recordFailure("Préstamos Export Transparency", $e->getMessage());
        }

        // 4.2 Reporte Listado Asistencia Oficial (GTIC-F-16 V9)
        echo "\n[Test 4.2] Listado de Asistencia GTIC-F-16 V9 Transparency...\n";
        foreach ($loadedUsers as $label => $user) {
            Auth::login($user);
            try {
                $export = new ListadoAsistenciaExport(
                    filters: ['id_punto' => $user->id_punto],
                    eventoTema: 'Capacitación en Alfabetización Digital',
                    responsable: mb_strtoupper("{$user->name} (" . ($user->cargo ?: $user->rol_principal) . ")", 'UTF-8'),
                    incluirFirma: true,
                    asistentesUnicos: true
                );

                // Ejecutar descarga y capturar output
                $response = $export->download();
                ob_start();
                $response->sendContent();
                $excelData = ob_get_clean();

                $tempFile = tempnam(sys_get_temp_dir(), 'gtic_test_') . '.xlsx';
                file_put_contents($tempFile, $excelData);

                $spreadsheet = IOFactory::load($tempFile);
                $sheet = $spreadsheet->getActiveSheet();

                $cellA7 = (string) $sheet->getCell('A7')->getValue();
                $cellA8 = (string) $sheet->getCell('A8')->getValue();
                $cellA9 = (string) $sheet->getCell('A9')->getValue();

                // Verificar ubicación
                if ($user->id_punto) {
                    $expectedPoint = Point::find($user->id_punto)?->nombre_punto;
                    $this->assert(
                        "[{$label}] GTIC-F-16 Ubicación A7 contiene {$expectedPoint}",
                        str_contains($cellA7, $expectedPoint),
                        "A7: {$cellA7}"
                    );
                } else {
                    $this->assert(
                        "[{$label}] GTIC-F-16 Ubicación A7 para global",
                        str_contains($cellA7, 'Todos los puntos PVD'),
                        "A7: {$cellA7}"
                    );
                }

                // Verificar responsable
                $this->assert(
                    "[{$label}] GTIC-F-16 Responsable A9 contiene su nombre real",
                    str_contains($cellA9, mb_strtoupper($user->name, 'UTF-8')),
                    "A9: {$cellA9}"
                );

                // Verificar que no contenga 'notienecorreo@gmail.com' en las filas generadas
                $highestRow = min(35, $sheet->getHighestRow());
                $hasFakeEmail = false;
                for ($r = 13; $r <= $highestRow; $r++) {
                    $emailVal = (string) $sheet->getCell("H{$r}")->getValue();
                    if ($emailVal === 'notienecorreo@gmail.com') {
                        $hasFakeEmail = true;
                        break;
                    }
                }
                $this->assert(
                    "[{$label}] GTIC-F-16 no contiene correos falsos 'notienecorreo@gmail.com'",
                    !$hasFakeEmail,
                    "Revisadas filas 13 a {$highestRow}"
                );

                $spreadsheet->disconnectWorksheets();
                @unlink($tempFile);
            } catch (\Throwable $e) {
                $this->recordFailure("[{$label}] GTIC-F-16 Asistencia", $e->getMessage());
            }
        }

        // 4.3 Reporte Visitas Export Streaming
        echo "\n[Test 4.3] Visitas Export Integrity...\n";
        try {
            $exportService = app(ExportService::class);
            $visitasFile = $exportService->exportVisitas(['limit' => 20], null, 'xlsx');
            $this->assert(
                "Exportación Visitas XLSX se genera correctamente",
                $visitasFile->getStatusCode() === 200 && file_exists($visitasFile->getFile()->getPathname()),
                "Archivo: " . $visitasFile->getFile()->getFilename()
            );

            // Verificar lectura de encabezados
            $spreadsheet = IOFactory::load($visitasFile->getFile()->getPathname());
            $sheet = $spreadsheet->getActiveSheet();
            $h1 = (string) $sheet->getCell('A1')->getValue();
            $h2 = (string) $sheet->getCell('B1')->getValue();
            $spreadsheet->disconnectWorksheets();
            @unlink($visitasFile->getFile()->getPathname());

            $this->assert(
                "Visitas XLSX tiene encabezados institucionales válidos",
                $h1 === 'N° Documento' && $h2 === 'Nombres',
                "H1: {$h1}, H2: {$h2}"
            );
        } catch (\Throwable $e) {
            $this->recordFailure("Visitas Export Streaming", $e->getMessage());
        }

        // 4.4 Reporte Ciudadanos Export Streaming
        echo "\n[Test 4.4] Ciudadanos Export Integrity...\n";
        try {
            $exportService = app(ExportService::class);
            $ciudadanosFile = $exportService->exportCiudadanos(['limit' => 20], 'xlsx');
            $this->assert(
                "Exportación Ciudadanos XLSX se genera correctamente",
                $ciudadanosFile->getStatusCode() === 200 && file_exists($ciudadanosFile->getFile()->getPathname()),
                "Archivo: " . $ciudadanosFile->getFile()->getFilename()
            );
            @unlink($ciudadanosFile->getFile()->getPathname());
        } catch (\Throwable $e) {
            $this->recordFailure("Ciudadanos Export Streaming", $e->getMessage());
        }

        // 4.5 Reporte Impresiones Export
        echo "\n[Test 4.5] Impresiones Export Integrity...\n";
        try {
            $exportService = app(ExportService::class);
            $impresionesFile = $exportService->exportImpresiones([], 'xlsx');
            $this->assert(
                "Exportación Impresiones XLSX se genera correctamente",
                $impresionesFile->getStatusCode() === 200 && file_exists($impresionesFile->getFile()->getPathname()),
                "Archivo: " . $impresionesFile->getFile()->getFilename()
            );
            @unlink($impresionesFile->getFile()->getPathname());
        } catch (\Throwable $e) {
            $this->recordFailure("Impresiones Export Integrity", $e->getMessage());
        }

        // Resumen Final
        $this->printSummary();
    }

    private function assert(string $title, bool $condition, string $detail = ''): void
    {
        if ($condition) {
            $this->passed++;
            echo "  [PASS] {$title}" . ($detail ? " ({$detail})" : "") . "\n";
            $this->results[] = ['status' => 'PASS', 'title' => $title, 'detail' => $detail];
        } else {
            $this->failed++;
            echo "  [FAIL] {$title}" . ($detail ? " - Detalle: {$detail}" : "") . "\n";
            $this->results[] = ['status' => 'FAIL', 'title' => $title, 'detail' => $detail];
        }
    }

    private function recordFailure(string $title, string $error): void
    {
        $this->failed++;
        echo "  [ERROR] {$title}: {$error}\n";
        $this->results[] = ['status' => 'FAIL', 'title' => $title, 'detail' => $error];
    }

    private function printHeader(string $text): void
    {
        echo "\n" . str_repeat('=', 80) . "\n";
        echo " " . $text . "\n";
        echo str_repeat('=', 80) . "\n";
    }

    private function printSection(string $text): void
    {
        echo "\n" . str_repeat('-', 80) . "\n";
        echo " >>> " . $text . "\n";
        echo str_repeat('-', 80) . "\n";
    }

    private function printSummary(): void
    {
        $total = $this->passed + $this->failed;
        echo "\n" . str_repeat('=', 80) . "\n";
        echo " RESUMEN DE LA AUDITORÍA DE GESTORES Y REPORTES\n";
        echo str_repeat('=', 80) . "\n";
        echo " Total de pruebas ejecutadas: {$total}\n";
        echo " Pruebas exitosas (PASS):     {$this->passed}\n";
        echo " Pruebas fallidas (FAIL):     {$this->failed}\n";
        echo str_repeat('=', 80) . "\n";

        if ($this->failed === 0) {
            echo " STATUS FINAL: TODAS LAS PRUEBAS PASARON EXITOSAMENTE. SISTEMA 100% TRANSPARENTE.\n";
        } else {
            echo " STATUS FINAL: SE DETECTARON {$this->failed} FALLAS QUE REQUIEREN ATENCIÓN.\n";
        }
        echo str_repeat('=', 80) . "\n\n";
    }
}

$runner = new GestoresAuditRunner();
$runner->run();
