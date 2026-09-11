<?php

namespace App\Exports;

use App\Models\RoomLoan;
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

class PrestamosExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithEvents
{
    public function __construct(protected array $filters = []) {}

    public function collection(): Enumerable
    {
        return RoomLoan::with(['ciudadano', 'punto', 'gestor'])
            ->dateBetween($this->filters['fecha_desde'] ?? null, $this->filters['fecha_hasta'] ?? null)
            ->when($this->filters['id_punto'] ?? null, fn($q, $p) => $q->where('id_punto', $p))
            ->latest('fecha_prestamo')
            ->get();
    }

    public function headings(): array
    {
        return [
            'ID Préstamo',
            'Ciudadano Responsable',
            'N° Documento',
            'Teléfono Contacto',
            'Punto Vive Digital',
            'Tipo de Actividad',
            'N° Asistentes',
            'Fecha Préstamo',
            'Hora Inicio',
            'Hora Fin',
            'Estado',
            'Observaciones',
            'Gestor Responsable',
            'Fecha Registro',
        ];
    }

    public function map($p): array
    {
        return [
            $p->id_prestamo,
            $p->ciudadano?->nombre_completo ?? $p->nombre_responsable_texto,
            $p->ciudadano?->documento ?? 'N/A',
            $p->ciudadano?->telefono ?? 'N/A',
            $p->punto?->nombre_punto,
            $p->tipo_actividad,
            $p->num_asistentes,
            $p->fecha_prestamo?->toDateString(),
            $p->hora_inicio,
            $p->hora_fin,
            $p->estado,
            $p->observaciones,
            $p->gestor?->name,
            $p->created_at?->format('Y-m-d H:i:s'),
        ];
    }

    public function styles(Worksheet $sheet): ?array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF'], 'size' => 11],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF059669']], // Esmeralda
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
