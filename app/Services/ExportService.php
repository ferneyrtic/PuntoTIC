<?php

namespace App\Services;

use App\Exports\CiudadanosExport;
use App\Exports\ImpresionesExport;
use App\Exports\ListadoAsistenciaExport;
use App\Exports\PrestamosExport;
use App\Exports\VisitasExport;
use App\Models\Citizen;
use App\Models\DynamicField;
use App\Models\User;
use App\Models\Visit;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportService
{
    private FastSpreadsheetWriter $fastWriter;

    public function __construct(?FastSpreadsheetWriter $fastWriter = null)
    {
        $this->fastWriter = $fastWriter ?? new FastSpreadsheetWriter();
    }

    /**
     * Exporta el Listado Oficial de Asistencia en formato institucional GTIC-F-16 V9.
     */
    public function exportListadoAsistencia(
        array $filters = [],
        ?string $eventoTema = null,
        ?string $responsable = null,
        bool $incluirFirma = true,
        bool $asistentesUnicos = true
    ): StreamedResponse {
        $export = new ListadoAsistenciaExport(
            $filters,
            $eventoTema,
            $responsable,
            $incluirFirma,
            $asistentesUnicos
        );

        return $export->download();
    }

    /**
     * Exporta visitas a archivo Excel o CSV mediante escritura XML/Zip en streaming.
     */
    public function exportVisitas(array $filters = [], ?array $columns = null, string $format = 'xlsx'): BinaryFileResponse
    {
        @ini_set('memory_limit', '512M');
        @set_time_limit(300);

        $format = strtolower($format) === 'csv' ? 'csv' : 'xlsx';
        $fecha = date('Ymd_His');
        $fileName = "Reporte_Visitas_PVD_Acacias_{$fecha}.{$format}";

        if (! $this->canUseFastStreaming($format)) {
            $writerType = $format === 'csv' ? \Maatwebsite\Excel\Excel::CSV : \Maatwebsite\Excel\Excel::XLSX;

            return Excel::download(new VisitasExport($filters, $columns), $fileName, $writerType);
        }

        $selectedColumns = ! empty($columns)
            ? array_values($columns)
            : VisitasExport::DEFAULT_COLUMNS;

        $dynamicFields = DynamicField::where('modulo', 'visitas')
            ->where('activo', true)
            ->get(['id_campo', 'nombre_campo']);

        $headers = [];
        $columnWidths = [];
        $numericColumns = [];

        foreach ($selectedColumns as $idx => $col) {
            $headers[] = VisitasExport::HEADER_MAP[$col] ?? ucfirst($col);
            $columnWidths[$idx] = VisitasExport::COLUMN_WIDTHS[$col] ?? 20;
            if (in_array($col, VisitasExport::NUMERIC_COLUMNS, true)) {
                $numericColumns[] = $idx;
            }
        }

        foreach ($dynamicFields as $df) {
            $columnWidths[count($headers)] = 24;
            $headers[] = '[Extra] ' . $df->nombre_campo;
        }

        $rows = $this->streamVisitasRows($filters, $selectedColumns, $dynamicFields);

        return $this->downloadStreamedFile($headers, $rows, $fileName, $format, [
            'headerColor' => '1B6B35',
            'sheetTitle' => 'Visitas PVD',
            'numericColumns' => $numericColumns,
            'columnWidths' => $columnWidths,
        ]);
    }

    /**
     * Exporta el maestro de ciudadanos a Excel o CSV en streaming.
     */
    public function exportCiudadanos(array $filters = [], string $format = 'xlsx'): BinaryFileResponse
    {
        @ini_set('memory_limit', '512M');
        @set_time_limit(300);

        $format = strtolower($format) === 'csv' ? 'csv' : 'xlsx';
        $fecha = date('Ymd_His');
        $fileName = "Directorio_Ciudadanos_PVD_Acacias_{$fecha}.{$format}";

        if (! $this->canUseFastStreaming($format)) {
            $writerType = $format === 'csv' ? \Maatwebsite\Excel\Excel::CSV : \Maatwebsite\Excel\Excel::XLSX;

            return Excel::download(new CiudadanosExport($filters), $fileName, $writerType);
        }

        $rows = $this->streamCiudadanosRows($filters);

        return $this->downloadStreamedFile(CiudadanosExport::HEADINGS, $rows, $fileName, $format, [
            'headerColor' => '1A4A7A',
            'sheetTitle' => 'Directorio Ciudadanos',
            'numericColumns' => [0, 6, 14, 21],
            'columnWidths' => CiudadanosExport::COLUMN_WIDTHS,
        ]);
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

    private function canUseFastStreaming(string $format): bool
    {
        if ($format === 'csv') {
            return true;
        }

        return class_exists(\ZipArchive::class) && class_exists(\XMLWriter::class);
    }

    private function downloadStreamedFile(
        array $headers,
        iterable $rows,
        string $fileName,
        string $format,
        array $xlsxOptions = []
    ): BinaryFileResponse {
        if ($format === 'csv') {
            $tmpPath = $this->fastWriter->writeCsv($headers, $rows);
            $contentType = 'text/csv; charset=UTF-8';
        } else {
            $tmpPath = $this->fastWriter->writeXlsx($headers, $rows, $xlsxOptions);
            $contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        }

        return response()
            ->download($tmpPath, $fileName, ['Content-Type' => $contentType])
            ->deleteFileAfterSend(true);
    }

    private function streamVisitasRows(array $filters, array $selectedColumns, $dynamicFields): \Generator
    {
        $visitCols = Visit::getTableColumns();
        $citizenCols = Citizen::getTableColumns();

        $visitPkCol = empty($visitCols) || in_array('id_visitas', $visitCols, true) ? 'id_visitas' : 'id_visita';
        $hasVisitIdVisita = empty($visitCols) || in_array('id_visita', $visitCols, true);
        $hasVisitServicio = empty($visitCols) || in_array('servicio', $visitCols, true);
        $hasVisitServicioTexto = empty($visitCols) || in_array('servicio_texto', $visitCols, true);

        $citizenJoinCol = empty($citizenCols) || in_array('id', $citizenCols, true) ? 'id' : 'id_form_pvd';
        $hasCitizenDocumento = empty($citizenCols) || in_array('documento', $citizenCols, true);
        $hasCitizenIdTipo = empty($citizenCols) || in_array('id_tipo', $citizenCols, true);
        $hasCitizenLegacyTipoId = in_array('tipo_id', $citizenCols, true);

        // Preload small dimension tables before streaming to avoid extra SQL queries or N+1 hydrations
        $docTypeMap = in_array('tipo_doc', $selectedColumns, true) ? $this->buildDocTypeMap() : [];
        $pointMap = in_array('punto', $selectedColumns, true) ? $this->buildPointMap() : [];
        $categoryMap = in_array('categoria', $selectedColumns, true) ? $this->buildCategoryMap() : [];
        $subCategoryMap = in_array('subcategoria', $selectedColumns, true) ? $this->buildSubCategoryMap() : [];
        $userMap = in_array('gestor', $selectedColumns, true) ? $this->buildUserMap() : [];

        $hasDynamicValues = $dynamicFields->isNotEmpty()
            && DB::table('valores_campos_dinamicos')->where('entidad_tipo', 'visitas')->exists();

        $select = ["v.{$visitPkCol} as pk_visita", 'v.created_at'];
        if ($hasVisitIdVisita && $hasDynamicValues) {
            $select[] = 'v.id_visita';
        }
        if (in_array('punto', $selectedColumns, true)) {
            $select[] = 'v.id_punto';
        }
        if (in_array('categoria', $selectedColumns, true)) {
            $select[] = 'v.id_categoria';
            if ($hasVisitServicioTexto) {
                $select[] = 'v.servicio_texto';
            }
            if ($hasVisitServicio) {
                $select[] = 'v.servicio';
            }
        }
        if (in_array('subcategoria', $selectedColumns, true)) {
            $select[] = 'v.id_subcategoria';
        }
        if (in_array('descripcion', $selectedColumns, true)) {
            $select[] = 'v.descripcion';
        }
        if (in_array('duracion', $selectedColumns, true)) {
            $select[] = 'v.duracion_minutos';
        }
        if (in_array('gestor', $selectedColumns, true)) {
            $select[] = 'v.id_gestor';
        }

        if (in_array('documento', $selectedColumns, true)) {
            $select[] = "c.{$citizenJoinCol} as c_pk";
            if ($hasCitizenDocumento) {
                $select[] = 'c.documento';
            }
        }
        if (in_array('tipo_doc', $selectedColumns, true)) {
            if ($hasCitizenIdTipo) {
                $select[] = 'c.id_tipo';
            }
            if ($hasCitizenLegacyTipoId) {
                $select[] = 'c.tipo_id';
            }
        }
        if (in_array('nombres', $selectedColumns, true) || in_array('nombre_completo', $selectedColumns, true)) {
            $select[] = 'c.nombres';
        }
        if (in_array('apellidos', $selectedColumns, true) || in_array('nombre_completo', $selectedColumns, true)) {
            $select[] = 'c.apellidos';
        }

        foreach (['edad', 'genero', 'telefono', 'correo', 'direccion', 'barrio', 'zona', 'estrato', 'nivel_educativo', 'ocupacion', 'grupo_etnico', 'g_poblacional', 't_aseguramiento'] as $citizenField) {
            if (in_array($citizenField, $selectedColumns, true)) {
                $select[] = "c.{$citizenField}";
            }
        }

        $query = DB::table('visitas as v')
            ->leftJoin('form_pvd as c', 'v.id_form_pvd', '=', "c.{$citizenJoinCol}")
            ->select(array_values(array_unique($select)));

        if (! empty($filters['fecha_desde'])) {
            $query->where('v.created_at', '>=', $this->normalizeDateBoundary((string) $filters['fecha_desde'], '00:00:00'));
        }
        if (! empty($filters['fecha_hasta'])) {
            $query->where('v.created_at', '<=', $this->normalizeDateBoundary((string) $filters['fecha_hasta'], '23:59:59'));
        }
        if (! empty($filters['id_punto'])) {
            $query->where('v.id_punto', $filters['id_punto']);
        }
        if (! empty($filters['id_categoria'])) {
            $query->where('v.id_categoria', $filters['id_categoria']);
        }

        $query->orderByDesc('v.created_at');

        $maxRows = isset($filters['limit']) ? (int) $filters['limit'] : null;

        if (! $hasDynamicValues) {
            if ($maxRows !== null) {
                $query->limit($maxRows);
            }

            foreach ($query->cursor() as $row) {
                yield $this->mapVisitaRow(
                    $row,
                    $selectedColumns,
                    $dynamicFields,
                    [],
                    $docTypeMap,
                    $pointMap,
                    $categoryMap,
                    $subCategoryMap,
                    $userMap,
                    $hasVisitServicio,
                    $hasCitizenLegacyTipoId
                );
            }

            return;
        }

        // Batched fetching when dynamic field values exist
        $offset = 0;
        $chunkSize = 2000;
        while (true) {
            $take = $maxRows !== null ? min($chunkSize, max(0, $maxRows - $offset)) : $chunkSize;
            if ($take <= 0) {
                break;
            }

            $batch = (clone $query)->offset($offset)->limit($take)->get();
            if ($batch->isEmpty()) {
                break;
            }

            $entityIds = [];
            foreach ($batch as $row) {
                $entityIds[] = $row->id_visita ?? $row->pk_visita;
            }

            $dynamicMap = [];
            $dynRows = DB::table('valores_campos_dinamicos')
                ->where('entidad_tipo', 'visitas')
                ->whereIn('entidad_id', $entityIds)
                ->get(['entidad_id', 'id_campo', 'valor']);

            foreach ($dynRows as $dr) {
                $dynamicMap[$dr->entidad_id][$dr->id_campo] = $dr->valor;
            }

            foreach ($batch as $row) {
                $eid = $row->id_visita ?? $row->pk_visita;
                yield $this->mapVisitaRow(
                    $row,
                    $selectedColumns,
                    $dynamicFields,
                    $dynamicMap[$eid] ?? [],
                    $docTypeMap,
                    $pointMap,
                    $categoryMap,
                    $subCategoryMap,
                    $userMap,
                    $hasVisitServicio,
                    $hasCitizenLegacyTipoId
                );
            }

            if ($batch->count() < $take) {
                break;
            }
            $offset += $take;
        }
    }

    private function mapVisitaRow(
        object $row,
        array $selectedColumns,
        $dynamicFields,
        array $dynamicValues,
        array $docTypeMap,
        array $pointMap,
        array $categoryMap,
        array $subCategoryMap,
        array $userMap,
        bool $hasVisitServicio,
        bool $hasCitizenLegacyTipoId
    ): array {
        $tipoKey = null;
        if (in_array('tipo_doc', $selectedColumns, true)) {
            $tipoKey = $row->id_tipo ?? ($hasCitizenLegacyTipoId ? ($row->tipo_id ?? null) : null);
        }

        $out = [];
        foreach ($selectedColumns as $col) {
            $out[] = match ($col) {
                'documento' => ($row->documento ?? '') !== '' ? $row->documento : (string) ($row->c_pk ?? ''),
                'tipo_doc' => $this->lookupMap($docTypeMap, $tipoKey, 'CC'),
                'nombres' => $row->nombres ?? '',
                'apellidos' => $row->apellidos ?? '',
                'nombre_completo' => trim(($row->nombres ?? '') . ' ' . ($row->apellidos ?? '')),
                'edad' => $row->edad ?? null,
                'genero' => $row->genero ?? '',
                'telefono' => $row->telefono ?? '',
                'correo' => $row->correo ?? '',
                'direccion' => $row->direccion ?? '',
                'barrio' => $row->barrio ?? '',
                'zona' => $row->zona ?? '',
                'estrato' => $row->estrato ?? null,
                'nivel_educativo' => $row->nivel_educativo ?? '',
                'ocupacion' => $row->ocupacion ?? '',
                'grupo_etnico' => $row->grupo_etnico ?? '',
                'g_poblacional' => $row->g_poblacional ?? '',
                't_aseguramiento' => $row->t_aseguramiento ?? '',
                'punto' => $this->lookupMap($pointMap, $row->id_punto ?? null, ''),
                'categoria' => $this->lookupMap($categoryMap, $row->id_categoria ?? null)
                    ?? (($row->servicio_texto ?? '') !== '' ? $row->servicio_texto : ($hasVisitServicio ? ($row->servicio ?? '') : '')),
                'subcategoria' => $this->lookupMap($subCategoryMap, $row->id_subcategoria ?? null, 'N/A'),
                'descripcion' => $row->descripcion ?? '',
                'duracion' => $row->duracion_minutos ?? null,
                'gestor' => $this->lookupMap($userMap, $row->id_gestor ?? null, ''),
                'fecha_visita' => ! empty($row->created_at) ? substr((string) $row->created_at, 0, 19) : '',
                default => '',
            };
        }

        foreach ($dynamicFields as $df) {
            $out[] = $dynamicValues[$df->id_campo] ?? '';
        }

        return $out;
    }

    private function streamCiudadanosRows(array $filters): \Generator
    {
        $citizenCols = Citizen::getTableColumns();
        $citizenPkCol = empty($citizenCols) || in_array('id', $citizenCols, true) ? 'id' : 'id_form_pvd';
        $hasCitizenDocumento = empty($citizenCols) || in_array('documento', $citizenCols, true);
        $hasCitizenIdFormPvd = empty($citizenCols) || in_array('id_form_pvd', $citizenCols, true);
        $hasCitizenIdTipo = empty($citizenCols) || in_array('id_tipo', $citizenCols, true);
        $hasCitizenLegacyTipoId = in_array('tipo_id', $citizenCols, true);

        $docTypeMap = $this->buildDocTypeMap();
        $pointMap = $this->buildPointMap();

        $visitCountsSub = DB::table('visitas')
            ->selectRaw('id_form_pvd, COUNT(*) as visitas_count')
            ->groupBy('id_form_pvd');

        $select = [
            "c.{$citizenPkCol} as c_pk",
            'c.nombres',
            'c.apellidos',
            'c.fecha_nac',
            'c.edad',
            'c.genero',
            'c.correo',
            'c.telefono',
            'c.direccion',
            'c.barrio',
            'c.zona',
            'c.up',
            'c.estrato',
            'c.nivel_educativo',
            'c.ocupacion',
            'c.grupo_etnico',
            'c.g_poblacional',
            'c.t_aseguramiento',
            'c.id_punto',
            'c.created_at',
        ];

        if ($hasCitizenIdFormPvd) {
            $select[] = 'c.id_form_pvd';
        }
        if ($hasCitizenDocumento) {
            $select[] = 'c.documento';
        }
        if ($hasCitizenIdTipo) {
            $select[] = 'c.id_tipo';
        }
        if ($hasCitizenLegacyTipoId) {
            $select[] = 'c.tipo_id';
        }

        $selectFields = array_values(array_unique($select));
        $selectFields[] = DB::raw('COALESCE(vc.visitas_count, 0) as visitas_count');

        $query = DB::table('form_pvd as c')
            ->leftJoinSub($visitCountsSub, 'vc', 'vc.id_form_pvd', '=', "c.{$citizenPkCol}")
            ->select($selectFields);

        if (! empty($filters['search'])) {
            $term = (string) $filters['search'];
            $query->where(function ($q) use ($term, $hasCitizenDocumento, $citizenPkCol) {
                $q->where('c.nombres', 'like', "%{$term}%")
                    ->orWhere('c.apellidos', 'like', "%{$term}%")
                    ->orWhere('c.correo', 'like', "%{$term}%")
                    ->orWhere('c.telefono', 'like', "%{$term}%");
                if ($hasCitizenDocumento) {
                    $q->orWhere('c.documento', 'like', "%{$term}%");
                }
                if ($citizenPkCol === 'id') {
                    $q->orWhere('c.id', 'like', "%{$term}%");
                }
            });
        }
        if (! empty($filters['id_punto'])) {
            $query->where('c.id_punto', $filters['id_punto']);
        }
        if (! empty($filters['zona'])) {
            $query->where('c.zona', $filters['zona']);
        }

        $query->orderByDesc('c.created_at');

        foreach ($query->cursor() as $r) {
            $tipoKey = $r->id_tipo ?? ($hasCitizenLegacyTipoId ? ($r->tipo_id ?? null) : null);

            yield [
                $r->id_form_pvd ?? $r->c_pk,
                $this->lookupMap($docTypeMap, $tipoKey, 'CC'),
                ($r->documento ?? '') !== '' ? $r->documento : (string) ($r->c_pk ?? ''),
                $r->nombres ?? '',
                $r->apellidos ?? '',
                ! empty($r->fecha_nac) ? substr((string) $r->fecha_nac, 0, 10) : '',
                $r->edad ?? null,
                $r->genero ?? '',
                $r->correo ?? '',
                $r->telefono ?? '',
                $r->direccion ?? '',
                $r->barrio ?? '',
                $r->zona ?? '',
                $r->up ?? '',
                $r->estrato ?? null,
                $r->nivel_educativo ?? '',
                $r->ocupacion ?? '',
                $r->grupo_etnico ?? '',
                $r->g_poblacional ?? '',
                $r->t_aseguramiento ?? '',
                $this->lookupMap($pointMap, $r->id_punto ?? null, ''),
                (int) ($r->visitas_count ?? 0),
                ! empty($r->created_at) ? substr((string) $r->created_at, 0, 19) : '',
            ];
        }
    }

    private function lookupMap(array $map, mixed $key, mixed $default = null): mixed
    {
        if ($key === null || $key === '') {
            return $default;
        }

        return $map[$key] ?? $default;
    }

    private function normalizeDateBoundary(string $value, string $timeSuffix): string
    {
        $trimmed = trim($value);
        if (strlen($trimmed) === 10) {
            return "{$trimmed} {$timeSuffix}";
        }

        return $trimmed;
    }

    private function buildDocTypeMap(): array
    {
        $map = [];
        foreach (DB::table('tipo_id')->get() as $row) {
            $sigla = ! empty($row->sigla) ? $row->sigla : $this->deriveSigla($row->nombre_tipo ?? $row->tipo_id ?? '');
            if (isset($row->id_tipo)) {
                $map[$row->id_tipo] = $sigla;
            }
            if (isset($row->id_identificacion)) {
                $map[$row->id_identificacion] = $sigla;
            }
        }

        return $map;
    }

    private function deriveSigla(string $name): string
    {
        if (stripos($name, 'Ciudadan') !== false) {
            return 'CC';
        }
        if (stripos($name, 'Tarjeta') !== false) {
            return 'TI';
        }
        if (stripos($name, 'Extranjer') !== false) {
            return 'CE';
        }
        if (stripos($name, 'Registro') !== false) {
            return 'RC';
        }
        if (stripos($name, 'Pasaporte') !== false) {
            return 'PA';
        }
        if (stripos($name, 'Permanencia') !== false || stripos($name, 'PPT') !== false) {
            return 'PPT';
        }

        return 'DOC';
    }

    private function buildPointMap(): array
    {
        $map = [];
        foreach (DB::table('puntos_vd')->get(['id_punto', 'nombre_punto']) as $row) {
            $map[$row->id_punto] = $row->nombre_punto;
        }

        return $map;
    }

    private function buildCategoryMap(): array
    {
        $map = [];
        foreach (DB::table('categorias')->get() as $row) {
            if (isset($row->id_categoria)) {
                $map[$row->id_categoria] = $row->nombre;
            }
            if (isset($row->id)) {
                $map[$row->id] = $row->nombre;
            }
        }

        return $map;
    }

    private function buildSubCategoryMap(): array
    {
        $map = [];
        foreach (DB::table('sub_categorias')->get() as $row) {
            if (isset($row->id_subcategoria)) {
                $map[$row->id_subcategoria] = $row->nombre;
            }
            if (isset($row->id)) {
                $map[$row->id] = $row->nombre;
            }
        }

        return $map;
    }

    private function buildUserMap(): array
    {
        $userCols = User::getTableColumns();
        $cols = ['id', 'name'];
        if (in_array('names', $userCols, true)) {
            $cols[] = 'names';
        }

        $map = [];
        foreach (DB::table('users')->get($cols) as $row) {
            $map[$row->id] = ! empty($row->name) ? $row->name : ($row->names ?? '');
        }

        return $map;
    }
}
