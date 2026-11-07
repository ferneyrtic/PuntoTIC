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
use Symfony\Component\HttpFoundation\Response as HttpResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    public function __construct(protected ExportService $exportService) {}

    public function index(): Response
    {
        $user = auth()->user();
        $isGlobal = $user ? $user->tieneAlcanceGlobal() : false;
        $isAdmin = $user ? $user->hasRole('Administrador') : false;
        $canExportAllPoints = $isGlobal;

        $pointsQuery = Point::where('activo', true);
        if (! $isGlobal && $user && $user->id_punto) {
            $pointsQuery->where('id_punto', $user->id_punto);
        }
        $points = $pointsQuery->get(['id_punto', 'nombre_punto']);

        $categories = Category::where('activo', true)->get(['id_categoria', 'nombre']);
        $dynamicFields = DynamicField::where('activo', true)->get(['id_campo', 'modulo', 'nombre_campo']);
        $currentUserRole = $user ? ($user->cargo ?: $user->rol_principal) : 'Gestor PVD';
        $currentUserName = $user ? $user->name : 'ADMIN';
        $responsableDefault = $user ? mb_strtoupper("{$user->name} ({$currentUserRole})", 'UTF-8') : 'ADMIN';

        return Inertia::render('Exports/Index', [
            'points' => $points,
            'categories' => $categories,
            'dynamicFields' => $dynamicFields,
            'currentUserName' => $currentUserName,
            'currentUserRole' => $currentUserRole,
            'responsableDefault' => $responsableDefault,
            'isAdmin' => $isAdmin,
            'canExportAllPoints' => $canExportAllPoints,
            'userPointId' => $user?->id_punto,
        ]);
    }

    public function download(Request $request): HttpResponse
    {
        $tipoReporte = $request->get('tipo', 'visitas');
        $formato = $request->get('formato', 'xlsx'); // xlsx o csv
        $columnas = $request->get('columnas'); // array de columnas seleccionadas
        $filtros = $request->only(['fecha_desde', 'fecha_hasta', 'id_punto', 'id_categoria']);

        $user = $request->user();
        $canExportAll = $user && ($user->hasRole('Administrador') || $user->puede_exportar_todas_sedes);
        if (! $canExportAll && $user?->id_punto) {
            $filtros['id_punto'] = $user->id_punto;
        }

        return match ($tipoReporte) {
            'asistencia', 'listado_asistencia', 'gtic_f_16' => $this->listadoAsistencia($request),
            'ciudadanos' => $this->exportService->exportCiudadanos($filtros, $formato),
            'prestamos' => $this->exportService->exportPrestamos($filtros, $formato),
            'impresiones' => $this->exportService->exportImpresiones($filtros, $formato),
            default => $this->exportService->exportVisitas($filtros, $columnas, $formato),
        };
    }

    public function listadoAsistencia(Request $request): StreamedResponse
    {
        $filtros = $request->only(['fecha_desde', 'fecha_hasta', 'id_punto', 'id_categoria']);
        $eventoTema = $request->get('evento_tema');

        $user = $request->user();
        $canExportAll = $user && ($user->hasRole('Administrador') || $user->puede_exportar_todas_sedes);
        if (! $canExportAll && $user?->id_punto) {
            $filtros['id_punto'] = $user->id_punto;
        }

        // Responsable institucional fijado automáticamente con nombre y tipo de usuario / rol
        $userRole = $user ? ($user->cargo ?: $user->rol_principal) : 'Gestor PVD';
        $responsable = $user ? mb_strtoupper("{$user->name} ({$userRole})", 'UTF-8') : 'ADMIN';

        $incluirFirma = filter_var($request->get('incluir_firma', true), FILTER_VALIDATE_BOOLEAN);
        $asistentesUnicos = filter_var($request->get('asistentes_unicos', true), FILTER_VALIDATE_BOOLEAN);

        return $this->exportService->exportListadoAsistencia(
            $filtros,
            $eventoTema,
            $responsable,
            $incluirFirma,
            $asistentesUnicos
        );
    }
}
