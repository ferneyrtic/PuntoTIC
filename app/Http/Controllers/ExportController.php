<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\DynamicField;
use App\Models\Point;
use App\Services\ExportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ExportController extends Controller
{
    public function __construct(protected ExportService $exportService) {}

    public function index(): Response
    {
        $points = Point::where('activo', true)->get(['id_punto', 'nombre_punto']);
        $categories = Category::where('activo', true)->get(['id_categoria', 'nombre']);
        $dynamicFields = DynamicField::where('activo', true)->get(['id_campo', 'modulo', 'nombre_campo']);

        return Inertia::render('Exports/Index', [
            'points' => $points,
            'categories' => $categories,
            'dynamicFields' => $dynamicFields,
        ]);
    }

    public function download(Request $request): BinaryFileResponse
    {
        $tipoReporte = $request->get('tipo', 'visitas');
        $formato = $request->get('formato', 'xlsx'); // xlsx o csv
        $columnas = $request->get('columnas'); // array de columnas seleccionadas
        $filtros = $request->only(['fecha_desde', 'fecha_hasta', 'id_punto', 'id_categoria']);

        return match ($tipoReporte) {
            'ciudadanos' => $this->exportService->exportCiudadanos($filtros, $formato),
            'prestamos' => $this->exportService->exportPrestamos($filtros, $formato),
            'impresiones' => $this->exportService->exportImpresiones($filtros, $formato),
            default => $this->exportService->exportVisitas($filtros, $columnas, $formato),
        };
    }
}
