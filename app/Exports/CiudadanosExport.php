<?php

namespace App\Exports;

use App\Models\Citizen;
use Illuminate\Support\Enumerable;
use Illuminate\Support\Facades\DB;
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

class CiudadanosExport implements FromCollection, WithColumnWidths, WithEvents, WithHeadings, WithMapping, WithStyles
{
    protected array $visitCounts = [];

    public function __construct(protected array $filters = [])
    {
        @ini_set('memory_limit', '1024M');
        @set_time_limit(300);

        // Agregación de visitas optimizada en 1 sola consulta agrupada (30ms en vez de subqueries de 25s)
        try {
            $this->visitCounts = DB::table('visitas')
                ->select('id_form_pvd', DB::raw('count(*) as total'))
                ->whereNotNull('id_form_pvd')
                ->groupBy('id_form_pvd')
                ->pluck('total', 'id_form_pvd')
                ->all();
        } catch (\Throwable $e) {
            $this->visitCounts = [];
        }
    }

    public function collection(): Enumerable
    {
        return Citizen::with(['tipoDocumento', 'punto'])
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
            $this->visitCounts[$c->id_form_pvd] ?? 0,
            $c->created_at?->format('Y-m-d H:i:s'),
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 10,  // ID
            'B' => 15,  // Tipo Documento
            'C' => 18,  // N° Documento
            'D' => 22,  // Nombres
            'E' => 22,  // Apellidos
            'F' => 16,  // Fecha Nacimiento
            'G' => 10,  // Edad
            'H' => 14,  // Género
            'I' => 28,  // Correo
            'J' => 16,  // Teléfono
            'K' => 28,  // Dirección
            'L' => 22,  // Barrio
            'M' => 14,  // Zona
            'N' => 22,  // Unidad Poblacional
            'O' => 10,  // Estrato
            'P' => 22,  // Nivel Educativo
            'Q' => 22,  // Ocupación
            'R' => 18,  // Grupo Étnico
            'S' => 22,  // Grupo Poblacional
            'T' => 18,  // Tipo Aseguramiento
            'U' => 25,  // Punto Registro
            'V' => 14,  // Total Visitas
            'W' => 20,  // Fecha Registro
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
