<?php

namespace App\Exports;

use App\Models\Citizen;
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

class CiudadanosExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithEvents
{
    public function __construct(protected array $filters = []) {}

    public function collection(): Enumerable
    {
        return Citizen::with(['tipoDocumento', 'punto'])
            ->withCount('visitas')
            ->search($this->filters['search'] ?? null)
            ->filterByPoint($this->filters['id_punto'] ?? null)
            ->filterByZone($this->filters['zona'] ?? null)
            ->latest('created_at')
            ->get();
    }

    public function headings(): array
    {
        return [
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
                $highestRow = $sheet->getHighestRow();
                $highestColumn = $sheet->getHighestColumn();
                $sheet->getStyle("A1:{$highestColumn}{$highestRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB('FFE5E7EB');
                $sheet->getRowDimension(1)->setRowHeight(28);
            },
        ];
    }
}
