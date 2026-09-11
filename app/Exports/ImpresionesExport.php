<?php

namespace App\Exports;

use App\Models\PrintRecord;
use Illuminate\Support\Enumerable;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ImpresionesExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithEvents
{
    public function __construct(protected array $filters = []) {}

    public function collection(): Enumerable
    {
        return PrintRecord::with(['ciudadano', 'punto', 'gestor'])
            ->dateBetween($this->filters['fecha_desde'] ?? null, $this->filters['fecha_hasta'] ?? null)
            ->when($this->filters['id_punto'] ?? null, fn($q, $p) => $q->where('id_punto', $p))
            ->latest('created_at')
            ->get();
    }

    public function headings(): array
    {
        return [
            'ID Impresión',
            'Ciudadano',
            'N° Documento',
            'Punto Vive Digital',
            'N° Hojas Impresas',
            'Tipo de Impresión / Trámite',
            'Descripción Detallada',
            'Gestor Responsable',
            'Fecha y Hora',
        ];
    }

    public function map($imp): array
    {
        return [
            $imp->id_impresion,
            $imp->ciudadano?->nombre_completo ?? $imp->nombre_usuario_texto,
            $imp->ciudadano?->documento ?? 'N/A',
            $imp->punto?->nombre_punto,
            $imp->numero_hojas,
            $imp->tipo_impresion,
            $imp->descripcion,
            $imp->gestor?->name,
            $imp->created_at?->format('Y-m-d H:i:s'),
        ];
    }

    public function styles(Worksheet $sheet): ?array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF'], 'size' => 11],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFF5A623']], // Amarillo institucional
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
                $highestRow = $sheet->getHighestRow();
                $highestColumn = $sheet->getHighestColumn();
                $sheet->getStyle("A1:{$highestColumn}{$highestRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB('FFE5E7EB');
                $sheet->getRowDimension(1)->setRowHeight(28);
            },
        ];
    }
}
