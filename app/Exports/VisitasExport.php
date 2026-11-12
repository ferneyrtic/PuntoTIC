<?php

namespace App\Exports;

use App\Models\DynamicField;
use App\Models\Visit;
use Illuminate\Support\Enumerable;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class VisitasExport implements FromCollection, WithColumnWidths, WithEvents, WithHeadings, WithMapping, WithStyles
{
    public const DEFAULT_COLUMNS = [
        'documento', 'nombres', 'apellidos', 'edad', 'genero',
        'telefono', 'correo', 'barrio', 'zona', 'estrato',
        'nivel_educativo', 'grupo_etnico', 't_aseguramiento',
        'punto', 'categoria', 'subcategoria', 'descripcion',
        'duracion', 'gestor', 'fecha_visita',
    ];

    public const HEADER_MAP = [
        'documento' => 'N° Documento',
        'tipo_doc' => 'Tipo Documento',
        'nombres' => 'Nombres',
        'apellidos' => 'Apellidos',
        'nombre_completo' => 'Nombre Completo',
        'edad' => 'Edad',
        'genero' => 'Género',
        'telefono' => 'Teléfono',
        'correo' => 'Correo Electrónico',
        'direccion' => 'Dirección',
        'barrio' => 'Barrio / Vereda',
        'zona' => 'Zona',
        'estrato' => 'Estrato',
        'nivel_educativo' => 'Nivel Educativo',
        'ocupacion' => 'Ocupación',
        'grupo_etnico' => 'Grupo Étnico',
        'g_poblacional' => 'Grupo Poblacional',
        't_aseguramiento' => 'Tipo Aseguramiento',
        'punto' => 'Punto Vive Digital',
        'categoria' => 'Categoría Servicio',
        'subcategoria' => 'Subcategoría',
        'descripcion' => 'Descripción Visita',
        'duracion' => 'Duración (Minutos)',
        'gestor' => 'Gestor Responsable',
        'fecha_visita' => 'Fecha y Hora Visita',
    ];

    public const COLUMN_WIDTHS = [
        'documento' => 18,
        'tipo_doc' => 16,
        'nombres' => 24,
        'apellidos' => 24,
        'nombre_completo' => 32,
        'edad' => 10,
        'genero' => 14,
        'telefono' => 16,
        'correo' => 28,
        'direccion' => 30,
        'barrio' => 26,
        'zona' => 14,
        'estrato' => 10,
        'nivel_educativo' => 22,
        'ocupacion' => 22,
        'grupo_etnico' => 20,
        'g_poblacional' => 24,
        't_aseguramiento' => 22,
        'punto' => 28,
        'categoria' => 30,
        'subcategoria' => 28,
        'descripcion' => 42,
        'duracion' => 18,
        'gestor' => 26,
        'fecha_visita' => 22,
    ];

    public const NUMERIC_COLUMNS = ['edad', 'estrato', 'duracion'];

    protected array $selectedColumns;

    protected $dynamicFields;

    public function __construct(
        protected array $filters = [],
        ?array $selectedColumns = null
    ) {
        @ini_set('memory_limit', '1024M');
        @set_time_limit(300);

        $this->selectedColumns = ! empty($selectedColumns)
            ? array_values($selectedColumns)
            : self::DEFAULT_COLUMNS;

        $this->dynamicFields = DynamicField::where('modulo', 'visitas')->where('activo', true)->get();
    }

    public function collection(): Enumerable
    {
        return Visit::with([
            'ciudadano.tipoDocumento',
            'punto',
            'categoria',
            'subcategoria',
            'gestor',
            'valoresCamposDinamicos.campo',
        ])
            ->dateBetween($this->filters['fecha_desde'] ?? null, $this->filters['fecha_hasta'] ?? null)
            ->filterByPoint($this->filters['id_punto'] ?? null)
            ->filterByCategory($this->filters['id_categoria'] ?? null)
            ->latest('created_at')
            ->when(isset($this->filters['limit']), fn ($q) => $q->limit((int) $this->filters['limit']))
            ->get();
    }

    public function headings(): array
    {
        $headers = [];
        foreach ($this->selectedColumns as $col) {
            $headers[] = self::HEADER_MAP[$col] ?? ucfirst($col);
        }

        foreach ($this->dynamicFields as $df) {
            $headers[] = '[Extra] '.$df->nombre_campo;
        }

        return $headers;
    }

    public function columnWidths(): array
    {
        $widths = [];
        $index = 1;
        foreach ($this->selectedColumns as $col) {
            $widths[$this->columnLetter($index)] = self::COLUMN_WIDTHS[$col] ?? 20;
            $index++;
        }
        foreach ($this->dynamicFields as $df) {
            $widths[$this->columnLetter($index)] = 24;
            $index++;
        }

        return $widths;
    }

    private function columnLetter(int $oneBasedIndex): string
    {
        $letter = '';
        while ($oneBasedIndex > 0) {
            $mod = ($oneBasedIndex - 1) % 26;
            $letter = chr(65 + $mod).$letter;
            $oneBasedIndex = intdiv($oneBasedIndex - $mod - 1, 26);
        }

        return $letter;
    }

    public function map($visit): array
    {
        $c = $visit->ciudadano;
        $row = [];

        $dataMap = [
            'documento' => $c?->documento,
            'tipo_doc' => $c?->tipoDocumento?->sigla ?? 'CC',
            'nombres' => $c?->nombres,
            'apellidos' => $c?->apellidos,
            'nombre_completo' => $c?->nombre_completo,
            'edad' => $c?->edad,
            'genero' => $c?->genero,
            'telefono' => $c?->telefono,
            'correo' => $c?->correo,
            'direccion' => $c?->direccion,
            'barrio' => $c?->barrio,
            'zona' => $c?->zona,
            'estrato' => $c?->estrato,
            'nivel_educativo' => $c?->nivel_educativo,
            'ocupacion' => $c?->ocupacion,
            'grupo_etnico' => $c?->grupo_etnico,
            'g_poblacional' => $c?->g_poblacional,
            't_aseguramiento' => $c?->t_aseguramiento,
            'punto' => $visit->punto?->nombre_punto,
            'categoria' => $visit->categoria?->nombre ?? $visit->servicio_texto,
            'subcategoria' => $visit->subcategoria?->nombre ?? 'N/A',
            'descripcion' => $visit->descripcion,
            'duracion' => $visit->duracion_minutos,
            'gestor' => $visit->gestor?->name,
            'fecha_visita' => $visit->created_at?->format('Y-m-d H:i:s'),
        ];

        foreach ($this->selectedColumns as $col) {
            $row[] = $dataMap[$col] ?? '';
        }

        // Mapear campos dinámicos
        $dynamicValues = $visit->valoresCamposDinamicos->keyBy('id_campo');
        foreach ($this->dynamicFields as $df) {
            $val = $dynamicValues->get($df->id_campo);
            $row[] = $val ? $val->valor : '';
        }

        return $row;
    }

    public function columnWidths(): array
    {
        return [
            'A' => 16,
            'B' => 20,
            'C' => 20,
            'D' => 10,
            'E' => 14,
            'F' => 16,
            'G' => 26,
            'H' => 20,
            'I' => 14,
            'J' => 10,
            'K' => 20,
            'L' => 16,
            'M' => 18,
            'N' => 24,
            'O' => 22,
            'P' => 22,
            'Q' => 30,
            'R' => 14,
            'S' => 24,
            'T' => 20,
            'U' => 20,
            'V' => 20,
            'W' => 20,
        ];
    }

    public function styles(Worksheet $sheet): ?array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF'], 'size' => 11],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF1B6B35']], // Verde Alcaldía
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            ],
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $sheet->freezePane('A2'); // Inmovilizar fila de encabezados
                $highestColumn = $sheet->getHighestColumn();

                // Aplicar bordes solo al encabezado (evita iterar millones de celdas en reportes masivos)
                $sheet->getStyle("A1:{$highestColumn}1")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB('FFE5E7EB');

                // Fila de encabezado con altura adecuada
                $sheet->getRowDimension(1)->setRowHeight(28);
            },
        ];
    }
}
