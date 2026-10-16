<?php

namespace App\Exports;

use App\Models\Citizen;
use App\Models\Point;
use App\Models\Visit;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\RichText\RichText;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ListadoAsistenciaExport
{
    protected array $filters;
    protected ?string $eventoTema;
    protected ?string $responsable;
    protected bool $incluirFirma;
    protected bool $asistentesUnicos;

    public function __construct(
        array $filters = [],
        ?string $eventoTema = null,
        ?string $responsable = null,
        bool $incluirFirma = true,
        bool $asistentesUnicos = true
    ) {
        $this->filters = $filters;
        $this->eventoTema = $eventoTema ?: 'Usuarios registrados en la plataforma REGISTROS PVD';
        $this->responsable = $responsable ?: (auth()->check() ? mb_strtoupper(auth()->user()->name, 'UTF-8') : 'ADMIN');
        $this->incluirFirma = $incluirFirma;
        $this->asistentesUnicos = $asistentesUnicos;
    }

    /**
     * Genera la descarga del archivo Excel a partir de la plantilla oficial GTIC-F-16 V9.
     */
    public function download(): StreamedResponse
    {
        @ini_set('memory_limit', '512M');
        @set_time_limit(300);

        $templatePath = resource_path('templates/Plantilla_Asistencia_GTIC_F_16_V9.xlsx');
        if (!file_exists($templatePath)) {
            // Fallback si no está en resources/templates
            $templatePath = base_path('resources/templates/Plantilla_Asistencia_GTIC_F_16_V9.xlsx');
        }

        $spreadsheet = IOFactory::load($templatePath);
        $sheet = $spreadsheet->getActiveSheet();

        // 1. Configurar Encabezado Institucional: EVENTO - TEMA
        $eventoRich = new RichText();
        $eventoRich->createTextRun("EVENTO - TEMA:   ")->getFont()->setBold(true);
        $eventoRich->createTextRun($this->eventoTema)->getFont()->setBold(true)->setUnderline(true);
        $sheet->setCellValue('A8', $eventoRich);

        // 2. Configurar UBICACIÓN
        $ubicacionRich = new RichText();
        $ubicacionRich->createTextRun("UBICACIÓN:   ")->getFont()->setBold(true);

        $puntoNombre = 'Todos los puntos PVD';
        if (!empty($this->filters['id_punto'])) {
            $punto = Point::find($this->filters['id_punto']);
            if ($punto) {
                $puntoNombre = $punto->nombre_punto;
            }
        }
        $ubicacionRich->createTextRun($puntoNombre)->getFont()->setBold(true)->setUnderline(true);
        $sheet->setCellValue('A7', $ubicacionRich);

        // 3. Configurar FECHA
        $fechaDesde = $this->filters['fecha_desde'] ?? null;
        $fechaHasta = $this->filters['fecha_hasta'] ?? null;

        $fechaRich = new RichText();
        $fechaRich->createTextRun("FECHA:   ")->getFont()->setBold(true);

        if ($fechaDesde && $fechaHasta) {
            $fInicio = date('d/m/Y', strtotime($fechaDesde));
            $fFin = date('d/m/Y', strtotime($fechaHasta));
            $fechaTexto = ($fInicio === $fFin) ? $fInicio : "{$fInicio} - {$fFin}";
        } elseif ($fechaDesde) {
            $fechaTexto = 'Desde ' . date('d/m/Y', strtotime($fechaDesde));
        } elseif ($fechaHasta) {
            $fechaTexto = 'Hasta ' . date('d/m/Y', strtotime($fechaHasta));
        } else {
            $fechaTexto = 'Histórico General (' . date('d/m/Y') . ')';
        }

        $fechaRich->createTextRun($fechaTexto);
        $sheet->mergeCells('G7:H7');
        $sheet->setCellValue('G7', $fechaRich);
        $sheet->getStyle('G7')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

        // 4. Configurar RESPONSABLE
        $respRich = new RichText();
        $respRich->createTextRun("RESPONSABLE:     ")->getFont()->setBold(true);
        $respRich->createTextRun($this->responsable)->getFont()->setBold(true)->setUnderline(true);
        $sheet->setCellValue('A9', $respRich);

        // 5. Consultar los datos de asistentes
        $asistentes = $this->obtenerAsistentes();

        // 6. Configurar la tabla de datos
        $startRow = 13;
        $defaultCapacity = 17; // Filas 13 a 29 predefinidas en la plantilla oficial
        $totalAsistentes = count($asistentes);

        $thinBorderStyle = [
            'borders' => [
                'top' => ['borderStyle' => Border::BORDER_THIN],
                'bottom' => ['borderStyle' => Border::BORDER_THIN],
                'left' => ['borderStyle' => Border::BORDER_THIN],
                'right' => ['borderStyle' => Border::BORDER_THIN],
            ],
            'font' => [
                'name' => 'Calibri',
                'size' => 11,
            ]
        ];

        // Si hay más asistentes que la capacidad por defecto, expandir filas dinámicamente
        if ($totalAsistentes > $defaultCapacity) {
            $extraRows = $totalAsistentes - $defaultCapacity;
            $sheet->insertNewRowBefore(30, $extraRows);

            // Dar formato a las nuevas filas insertadas
            for ($r = 30; $r < 30 + $extraRows; $r++) {
                $sheet->getRowDimension($r)->setRowHeight(20.25);
                $sheet->getStyle("A{$r}:J{$r}")->applyFromArray($thinBorderStyle);
                $sheet->mergeCells("I{$r}:J{$r}");
            }
        }

        // Llenar datos de cada asistente
        $currentRow = $startRow;
        foreach ($asistentes as $item) {
            $sheet->getRowDimension($currentRow)->setRowHeight(20.25);

            // Nombre completo
            $nombreCompleto = mb_strtoupper(trim("{$item->nombres} {$item->apellidos}"), 'UTF-8');
            $sheet->setCellValue("A{$currentRow}", $nombreCompleto);

            // Marcar Tipo de Documento: TI, CC, PPT
            $tipoDoc = strtoupper(trim($item->tipo_doc_codigo ?? ''));
            $tipoNombre = strtoupper(trim($item->tipo_doc_nombre ?? ''));

            if ($tipoDoc === 'TI' || str_contains($tipoNombre, 'TARJETA')) {
                $sheet->setCellValue("B{$currentRow}", 'X');
            } elseif ($tipoDoc === 'CC' || str_contains($tipoNombre, 'CIUDADAN') || empty($tipoDoc)) {
                $sheet->setCellValue("C{$currentRow}", 'X');
            } else {
                // PPT, CE, RC, Pasaporte o cualquier otro
                $sheet->setCellValue("D{$currentRow}", 'X');
            }

            // Documento de identidad
            $sheet->setCellValueExplicit(
                "E{$currentRow}",
                (string) $item->documento,
                \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING
            );

            // Ocupación
            $sheet->setCellValue("F{$currentRow}", mb_strtoupper($item->ocupacion ?: 'OTRO', 'UTF-8'));

            // Celular
            $sheet->setCellValueExplicit(
                "G{$currentRow}",
                (string) ($item->telefono ?: ''),
                \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING
            );

            // Correo electrónico
            $sheet->setCellValue("H{$currentRow}", $item->correo ?: 'notienecorreo@gmail.com');

            // Firma (nombre en mayúsculas o espacio vacío)
            if ($this->incluirFirma) {
                $firmaTexto = mb_strtoupper(trim($item->nombres ?: $nombreCompleto), 'UTF-8');
                $sheet->setCellValue("I{$currentRow}", $firmaTexto);
            }

            // Asegurar estilos y alineaciones
            $sheet->getStyle("A{$currentRow}:J{$currentRow}")->applyFromArray($thinBorderStyle);
            $sheet->getStyle("B{$currentRow}:D{$currentRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("E{$currentRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
            $sheet->getStyle("G{$currentRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("H{$currentRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("I{$currentRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            if (!$sheet->getCell("I{$currentRow}")->isInMergeRange()) {
                $sheet->mergeCells("I{$currentRow}:J{$currentRow}");
            }

            $currentRow++;
        }

        // Si los asistentes fueron menos de 17, asegurar que las filas restantes queden con bordes y celdas I:J unidas
        for ($r = $currentRow; $r <= 29; $r++) {
            $sheet->getRowDimension($r)->setRowHeight(20.25);
            $sheet->getStyle("A{$r}:J{$r}")->applyFromArray($thinBorderStyle);
            if (!$sheet->getCell("I{$r}")->isInMergeRange()) {
                $sheet->mergeCells("I{$r}:J{$r}");
            }
        }

        // Nombre del archivo de salida
        $sanitizedPunto = preg_replace('/[^A-Za-z0-9_\-]/', '_', $puntoNombre);
        $fechaArchivo = date('Ymd_His');
        $fileName = "Listado_Asistencia_GTIC_F_16_V9_{$sanitizedPunto}_{$fechaArchivo}.xlsx";

        return new StreamedResponse(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Cache-Control' => 'max-age=0',
        ]);
    }

    /**
     * Consulta los asistentes desde la base de datos aplicando los filtros de punto, fecha y unicidad.
     */
    protected function obtenerAsistentes(): array
    {
        $query = DB::table('visitas')
            ->join('form_pvd', 'visitas.id_form_pvd', '=', 'form_pvd.id_form_pvd')
            ->leftJoin('tipo_id', 'form_pvd.id_tipo', '=', 'tipo_id.id_tipo');

        // Filtro por punto
        if (!empty($this->filters['id_punto'])) {
            $query->where('visitas.id_punto', $this->filters['id_punto']);
        }

        // Filtro por categoría de servicio
        if (!empty($this->filters['id_categoria'])) {
            $query->where('visitas.id_categoria', $this->filters['id_categoria']);
        }

        // Filtro por rango de fechas
        if (!empty($this->filters['fecha_desde'])) {
            $query->where('visitas.created_at', '>=', $this->filters['fecha_desde'] . ' 00:00:00');
        }
        if (!empty($this->filters['fecha_hasta'])) {
            $query->where('visitas.created_at', '<=', $this->filters['fecha_hasta'] . ' 23:59:59');
        }

        if ($this->asistentesUnicos) {
            // Asistentes únicos por documento de identidad
            $query->select([
                'form_pvd.id_form_pvd',
                'form_pvd.documento',
                'form_pvd.nombres',
                'form_pvd.apellidos',
                'form_pvd.ocupacion',
                'form_pvd.telefono',
                'form_pvd.correo',
                'tipo_id.sigla as tipo_doc_codigo',
                'tipo_id.nombre_tipo as tipo_doc_nombre',
                DB::raw('MAX(visitas.created_at) as ultima_visita'),
            ])
            ->groupBy([
                'form_pvd.id_form_pvd',
                'form_pvd.documento',
                'form_pvd.nombres',
                'form_pvd.apellidos',
                'form_pvd.ocupacion',
                'form_pvd.telefono',
                'form_pvd.correo',
                'tipo_id.sigla',
                'tipo_id.nombre_tipo',
            ])
            ->orderBy('form_pvd.nombres', 'asc');
        } else {
            // Cada visita individual
            $query->select([
                'form_pvd.id_form_pvd',
                'form_pvd.documento',
                'form_pvd.nombres',
                'form_pvd.apellidos',
                'form_pvd.ocupacion',
                'form_pvd.telefono',
                'form_pvd.correo',
                'tipo_id.sigla as tipo_doc_codigo',
                'tipo_id.nombre_tipo as tipo_doc_nombre',
                'visitas.created_at as fecha_visita',
            ])
            ->orderBy('visitas.created_at', 'desc');
        }

        return $query->get()->all();
    }
}
