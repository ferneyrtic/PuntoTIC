<?php

namespace App\Services;

use App\Exports\CiudadanosExport;
use App\Exports\ImpresionesExport;
use App\Exports\PrestamosExport;
use App\Exports\VisitasExport;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ExportService
{
    /**
     * Exporta visitas a archivo Excel o CSV.
     */
    public function exportVisitas(array $filters = [], ?array $columns = null, string $format = 'xlsx'): BinaryFileResponse
    {
        @ini_set('memory_limit', '512M');
        @set_time_limit(300);

        $fecha = date('Ymd_His');
        $fileName = "Reporte_Visitas_PVD_Acacias_{$fecha}.{$format}";
        $writerType = $format === 'csv' ? \Maatwebsite\Excel\Excel::CSV : \Maatwebsite\Excel\Excel::XLSX;

        return Excel::download(new VisitasExport($filters, $columns), $fileName, $writerType);
    }

    /**
     * Exporta el maestro de ciudadanos a Excel.
     */
    public function exportCiudadanos(array $filters = [], string $format = 'xlsx'): BinaryFileResponse
    {
        $fecha = date('Ymd_His');
        $fileName = "Directorio_Ciudadanos_PVD_Acacias_{$fecha}.{$format}";
        $writerType = $format === 'csv' ? \Maatwebsite\Excel\Excel::CSV : \Maatwebsite\Excel\Excel::XLSX;

        return Excel::download(new CiudadanosExport($filters), $fileName, $writerType);
    }

    /**
     * Exporta préstamos de salas a Excel.
     */
    public function exportPrestamos(array $filters = [], string $format = 'xlsx'): BinaryFileResponse
    {
        $fecha = date('Ymd_His');
        $fileName = "Reporte_Prestamos_Salas_PVD_{$fecha}.{$format}";
        $writerType = $format === 'csv' ? \Maatwebsite\Excel\Excel::CSV : \Maatwebsite\Excel\Excel::XLSX;

        return Excel::download(new PrestamosExport($filters), $fileName, $writerType);
    }

    /**
     * Exporta registro de impresiones a Excel.
     */
    public function exportImpresiones(array $filters = [], string $format = 'xlsx'): BinaryFileResponse
    {
        $fecha = date('Ymd_His');
        $fileName = "Reporte_Impresiones_PVD_{$fecha}.{$format}";
        $writerType = $format === 'csv' ? \Maatwebsite\Excel\Excel::CSV : \Maatwebsite\Excel\Excel::XLSX;

        return Excel::download(new ImpresionesExport($filters), $fileName, $writerType);
    }
}
