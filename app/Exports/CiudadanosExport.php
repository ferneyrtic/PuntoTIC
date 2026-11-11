<?php

namespace App\Exports;

use App\Models\Citizen;
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

class CiudadanosExport implements FromCollection, WithHeadings, WithMapping, WithColumnWidths, WithStyles, WithEvents
{
    public const HEADINGS = [
        'ID',
        'Tipo Documento',
        'N° Documento',
        'Nombres',
        'Apellidos',
        'Fecha Nacimiento',
        'Edad',
        'Género',
        'Correo Electrónico',
        'Teléfono',
        'Dirección',
        'Barrio / Vereda',
        'Zona',
        'Unidad Poblacional / Comuna',
        'Estrato',
        'Nivel Educativo',
        'Ocupación',
        'Grupo Étnico',
        'Grupo Poblacional',
        'Tipo Aseguramiento',
        'Punto Registro',
        'Total Visitas',
        'Fecha Registro',
    ];

    public const COLUMN_WIDTHS = [
        12, 16, 18, 24, 24, 18, 10, 14, 28, 16, 30, 26,
        14, 26, 10, 22, 22, 20, 24, 22, 28, 14, 22,
    ];

    public function __construct(protected array $filters = []) {}

    public function collection(): Enumerable
    {
        return Citizen::with(['tipoDocumento', 'punto'])
            ->withCount('visitas')
            ->when(! empty($this->filters['fecha_desde']), fn ($q) => $q->whereDate('created_at', '>=', $this->filters['fecha_desde']))
            ->when(! empty($this->filters['fecha_hasta']), fn ($q) => $q->whereDate('created_at', '<=', $this->filters['fecha_hasta']))
            ->search($this->filters['search'] ?? null)
            ->filterByPoint($this->filters['id_punto'] ?? null)
            ->filterByZone($this->filters['zona'] ?? null)
            ->latest('created_at')
            ->get();
    }

    public function headings(): array
    {
        return self::HEADINGS;
    }

    public function columnWidths(): array
    {
        return [
            'A' => 12, 'B' => 16, 'C' => 18, 'D' => 24, 'E' => 24, 'F' => 18,
            'G' => 10, 'H' => 14, 'I' => 28, 'J' => 16, 'K' => 30, 'L' => 26,
            'M' => 14, 'N' => 26, 'O' => 10, 'P' => 22, 'Q' => 22, 'R' => 20,
            'S' => 24, 'T' => 22, 'U' => 28, 'V' => 14, 'W' => 22,
        ];
    }

    public function map($c): array
    {
        return [
            $c->id_form_pvd,
            $c->tipoDocumento?->sigla ?? 'CC',
            $c->documento,
            $c->nombres,
            $c->apellidos,
            $c->fecha_nac?->toDateString(),
            $c->edad,
            $c->genero,
            $c->correo,
            $c->telefono,
            $c->direccion,
            $c->barrio,
            $c->zona,
            $c->up,
            $c->estrato,
            $c->nivel_educativo,
            $c->ocupacion,
            $c->grupo_etnico,
            $c->g_poblacional,
            $c->t_aseguramiento,
            $c->punto?->nombre_punto,
            $c->visitas_count,
            $c->created_at?->format('Y-m-d H:i:s'),
        ];
    }

    public function styles(Worksheet $sheet): ?array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF'], 'size' => 11],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF1A4A7A']], // Azul institucional
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            ],
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $sheet->freezePane('A2');
                $highestColumn = $sheet->getHighestColumn();
                $sheet->getStyle("A1:{$highestColumn}1")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB('FFE5E7EB');
                $sheet->getRowDimension(1)->setRowHeight(28);
            },
        ];
    }
}
