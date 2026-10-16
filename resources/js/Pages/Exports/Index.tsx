import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    FileSpreadsheet,
    Download,
    CheckSquare,
    Square,
    SlidersHorizontal,
    Layers,
    Users,
    DoorOpen,
    Printer,
    CalendarCheck,
    CheckCircle2,
    FileCheck,
    ShieldCheck,
    Sparkles,
    Info,
} from 'lucide-react';

interface Props {
    points: Array<any>;
    categories: Array<any>;
    dynamicFields: Array<any>;
    currentUserName?: string;
}

export default function ExportsIndex({ points, categories, dynamicFields, currentUserName = 'ADMIN' }: Props) {
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const initialTipo = (searchParams?.get('tipo') as any) || 'visitas';

    const [reportType, setReportType] = useState<'visitas' | 'ciudadanos' | 'prestamos' | 'impresiones' | 'asistencia'>(
        ['visitas', 'ciudadanos', 'prestamos', 'impresiones', 'asistencia'].includes(initialTipo) ? initialTipo : 'visitas'
    );
    const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
    const [selectedPoint, setSelectedPoint] = useState(searchParams?.get('id_punto') || '');
    const [selectedCategory, setSelectedCategory] = useState(searchParams?.get('id_categoria') || '');
    const [dateFrom, setDateFrom] = useState(searchParams?.get('fecha_desde') || '');
    const [dateTo, setDateTo] = useState(searchParams?.get('fecha_hasta') || '');

    // Parámetros específicos para Listado Oficial de Asistencia GTIC-F-16 V9
    const [eventoTema, setEventoTema] = useState('Usuarios registrados en la plataforma REGISTROS PVD');
    const [responsable, setResponsable] = useState(currentUserName || 'ADMIN');
    const [asistentesUnicos, setAsistentesUnicos] = useState(true);
    const [incluirFirma, setIncluirFirma] = useState(true);

    // Columnas disponibles para Reporte General de Visitas
    const defaultVisitsColumns = [
        { id: 'documento', label: 'N° Documento Cédula', group: 'Identificación' },
        { id: 'tipo_doc', label: 'Tipo de Documento', group: 'Identificación' },
        { id: 'nombres', label: 'Nombres', group: 'Identificación' },
        { id: 'apellidos', label: 'Apellidos', group: 'Identificación' },
        { id: 'edad', label: 'Edad', group: 'Demografía' },
        { id: 'genero', label: 'Género', group: 'Demografía' },
        { id: 'telefono', label: 'Teléfono / Celular', group: 'Contacto' },
        { id: 'correo', label: 'Correo Electrónico', group: 'Contacto' },
        { id: 'direccion', label: 'Dirección Residencia', group: 'Ubicación' },
        { id: 'barrio', label: 'Barrio / Vereda', group: 'Ubicación' },
        { id: 'zona', label: 'Zona (Urbana/Rural)', group: 'Ubicación' },
        { id: 'estrato', label: 'Estrato Socioeconómico', group: 'Demografía' },
        { id: 'nivel_educativo', label: 'Nivel Educativo', group: 'Demografía' },
        { id: 'ocupacion', label: 'Ocupación', group: 'Demografía' },
        { id: 'grupo_etnico', label: 'Grupo Étnico', group: 'Demografía' },
        { id: 'g_poblacional', label: 'Grupo Poblacional / Enfoque', group: 'Demografía' },
        { id: 't_aseguramiento', label: 'Tipo de Aseguramiento Salud', group: 'Demografía' },
        { id: 'punto', label: 'Sede Punto Vive Digital', group: 'Servicio' },
        { id: 'categoria', label: 'Categoría de Servicio', group: 'Servicio' },
        { id: 'subcategoria', label: 'Subcategoría / Trámite', group: 'Servicio' },
        { id: 'descripcion', label: 'Descripción Detallada', group: 'Servicio' },
        { id: 'duracion', label: 'Duración en Minutos', group: 'Servicio' },
        { id: 'gestor', label: 'Gestor Responsable', group: 'Atención' },
        { id: 'fecha_visita', label: 'Fecha y Hora de Atención', group: 'Atención' },
    ];

    const [selectedColumns, setSelectedColumns] = useState<string[]>(
        defaultVisitsColumns.map((c) => c.id)
    );

    const toggleColumn = (id: string) => {
        if (selectedColumns.includes(id)) {
            setSelectedColumns(selectedColumns.filter((c) => c !== id));
        } else {
            setSelectedColumns([...selectedColumns, id]);
        }
    };

    const handleSelectAll = () => {
        setSelectedColumns(defaultVisitsColumns.map((c) => c.id));
    };

    const handleDeselectAll = () => {
        setSelectedColumns([]);
    };

    const handleDownload = () => {
        const params = new URLSearchParams();

        if (reportType === 'asistencia') {
            params.append('tipo', 'asistencia');
            if (selectedPoint) params.append('id_punto', selectedPoint);
            if (selectedCategory) params.append('id_categoria', selectedCategory);
            if (dateFrom) params.append('fecha_desde', dateFrom);
            if (dateTo) params.append('fecha_hasta', dateTo);
            if (eventoTema) params.append('evento_tema', eventoTema);
            if (responsable) params.append('responsable', responsable);
            params.append('asistentes_unicos', asistentesUnicos ? '1' : '0');
            params.append('incluir_firma', incluirFirma ? '1' : '0');

            window.location.href = `${route('exportar.listado-asistencia')}?${params.toString()}`;
            return;
        }

        params.append('tipo', reportType);
        params.append('formato', format);

        if (selectedPoint) params.append('id_punto', selectedPoint);
        if (selectedCategory) params.append('id_categoria', selectedCategory);
        if (dateFrom) params.append('fecha_desde', dateFrom);
        if (dateTo) params.append('fecha_hasta', dateTo);

        if (reportType === 'visitas') {
            selectedColumns.forEach((col) => params.append('columnas[]', col));
        }

        window.location.href = `${route('exportar.download')}?${params.toString()}`;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Centro de Exportación y Reportes</h1>
                        <p className="text-xs text-slate-500 font-medium">
                            Generación de informes ejecutivos en Excel y CSV, y listados oficiales de asistencia GTIC-F-16 V9
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Exportar Reportes · PuntoTIC" />

            <div className="max-w-5xl mx-auto space-y-6">
                {/* Step 1: Selector de Módulo / Tipo de Reporte */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                        <div className="w-7 h-7 rounded-lg bg-alcaldia-green text-white flex items-center justify-center font-black text-xs">
                            1
                        </div>
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Seleccionar Tipo de Reporte</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {/* 1. Visitas */}
                        <button
                            type="button"
                            onClick={() => setReportType('visitas')}
                            className={`p-4 rounded-2xl border text-left transition-all ${
                                reportType === 'visitas'
                                    ? 'bg-emerald-50/70 border-alcaldia-green shadow-sm ring-1 ring-alcaldia-green'
                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            <CalendarCheck className={`w-6 h-6 mb-2 ${reportType === 'visitas' ? 'text-alcaldia-green' : 'text-slate-500'}`} />
                            <div className="text-xs font-bold text-slate-900">Reporte de Visitas</div>
                            <div className="text-[11px] text-slate-500 mt-1">Atenciones, servicios y perfil sociodemográfico</div>
                        </button>

                        {/* 2. Listado Oficial GTIC-F-16 V9 */}
                        <button
                            type="button"
                            onClick={() => {
                                setReportType('asistencia');
                                setFormat('xlsx');
                            }}
                            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                                reportType === 'asistencia'
                                    ? 'bg-amber-50/80 border-amber-500 shadow-sm ring-2 ring-amber-500/80'
                                    : 'border-amber-200/80 bg-amber-50/30 hover:border-amber-300 hover:bg-amber-50/50'
                            }`}
                        >
                            <div className="absolute top-2 right-2">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-200 text-amber-900 border border-amber-300">
                                    OFICIAL
                                </span>
                            </div>
                            <FileCheck className={`w-6 h-6 mb-2 ${reportType === 'asistencia' ? 'text-amber-700' : 'text-amber-600'}`} />
                            <div className="text-xs font-black text-slate-900">Listado GTIC-F-16</div>
                            <div className="text-[11px] text-slate-600 mt-1">Plantilla de asistencia Alcaldía, membrete y marcas de agua</div>
                        </button>

                        {/* 3. Directorio Ciudadanos */}
                        <button
                            type="button"
                            onClick={() => setReportType('ciudadanos')}
                            className={`p-4 rounded-2xl border text-left transition-all ${
                                reportType === 'ciudadanos'
                                    ? 'bg-blue-50/70 border-alcaldia-blue shadow-sm ring-1 ring-alcaldia-blue'
                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            <Users className={`w-6 h-6 mb-2 ${reportType === 'ciudadanos' ? 'text-alcaldia-blue' : 'text-slate-500'}`} />
                            <div className="text-xs font-bold text-slate-900">Directorio Ciudadanos</div>
                            <div className="text-[11px] text-slate-500 mt-1">Padrón de ciudadanos y contador histórico</div>
                        </button>

                        {/* 4. Préstamos */}
                        <button
                            type="button"
                            onClick={() => setReportType('prestamos')}
                            className={`p-4 rounded-2xl border text-left transition-all ${
                                reportType === 'prestamos'
                                    ? 'bg-emerald-50/70 border-emerald-600 shadow-sm ring-1 ring-emerald-600'
                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            <DoorOpen className={`w-6 h-6 mb-2 ${reportType === 'prestamos' ? 'text-emerald-600' : 'text-slate-500'}`} />
                            <div className="text-xs font-bold text-slate-900">Préstamo de Salas</div>
                            <div className="text-[11px] text-slate-500 mt-1">Uso de instalaciones, eventos y talleres</div>
                        </button>

                        {/* 5. Impresiones */}
                        <button
                            type="button"
                            onClick={() => setReportType('impresiones')}
                            className={`p-4 rounded-2xl border text-left transition-all ${
                                reportType === 'impresiones'
                                    ? 'bg-purple-50/70 border-purple-600 shadow-sm ring-1 ring-purple-600'
                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            <Printer className={`w-6 h-6 mb-2 ${reportType === 'impresiones' ? 'text-purple-600' : 'text-slate-500'}`} />
                            <div className="text-xs font-bold text-slate-900">Impresiones / Copias</div>
                            <div className="text-[11px] text-slate-500 mt-1">Conteo de hojas, tipo de trámite y usuarios</div>
                        </button>
                    </div>
                </div>

                {/* Step 2: Filtros del Reporte */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                        <div className="w-7 h-7 rounded-lg bg-alcaldia-yellow text-slate-900 flex items-center justify-center font-black text-xs">
                            2
                        </div>
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                            {reportType === 'asistencia' ? 'Parámetros del Listado Institucional' : 'Parámetros y Filtros de Fecha'}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Fecha Inicial</label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Fecha Final</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Sede PVD</label>
                            <select
                                value={selectedPoint}
                                onChange={(e) => setSelectedPoint(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:border-alcaldia-green outline-none"
                            >
                                <option value="">Todas las Sedes PVD</option>
                                {points.map((p) => (
                                    <option key={p.id_punto} value={p.id_punto}>
                                        {p.nombre_punto}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Formato de Salida</label>
                            {reportType === 'asistencia' ? (
                                <div className="py-2 px-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs font-black flex items-center justify-center gap-1.5">
                                    <FileSpreadsheet className="w-4 h-4 text-amber-700" />
                                    <span>Plantilla Excel GTIC-F-16</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormat('xlsx')}
                                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                                            format === 'xlsx'
                                                ? 'bg-alcaldia-green text-white border-alcaldia-green shadow-xs'
                                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        Excel (.xlsx)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormat('csv')}
                                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                                            format === 'csv'
                                                ? 'bg-alcaldia-green text-white border-alcaldia-green shadow-xs'
                                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        CSV (BigQuery)
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Subsección exclusiva para Listado GTIC-F-16 */}
                    {reportType === 'asistencia' && (
                        <div className="mt-5 pt-5 border-t border-slate-100 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-4">
                            <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                <span>Metadatos Oficiales para el Encabezado Institucional</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        EVENTO - TEMA (Celda A8)
                                    </label>
                                    <input
                                        type="text"
                                        value={eventoTema}
                                        onChange={(e) => setEventoTema(e.target.value)}
                                        placeholder="Ej: Usuarios registrados en la plataforma REGISTROS PVD"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green outline-none bg-white"
                                    />
                                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                                        Texto que figurará en el encabezado oficial bajo la ubicación y fecha.
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        RESPONSABLE (Celda A9)
                                    </label>
                                    <input
                                        type="text"
                                        value={responsable}
                                        onChange={(e) => setResponsable(e.target.value)}
                                        placeholder="Ej: ADMIN / Nombre del Gestor"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green outline-none bg-white"
                                    />
                                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                                        Nombre del funcionario o gestor responsable que firma el listado.
                                    </span>
                                </div>
                            </div>

                            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4">
                                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={asistentesUnicos}
                                        onChange={(e) => setAsistentesUnicos(e.target.checked)}
                                        className="w-4 h-4 rounded text-alcaldia-green focus:ring-alcaldia-green border-slate-300"
                                    />
                                    <span>Consolidar ciudadanos únicos (Sin duplicar asistentes en el listado)</span>
                                </label>

                                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={incluirFirma}
                                        onChange={(e) => setIncluirFirma(e.target.checked)}
                                        className="w-4 h-4 rounded text-alcaldia-green focus:ring-alcaldia-green border-slate-300"
                                    />
                                    <span>Precargar nombres en la columna FIRMA (Desmarcar para firma física en bolígrafo)</span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Step 3: Selector Dinámico de Columnas (para Visitas) o Info para Asistencia */}
                {reportType === 'visitas' && (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-black text-xs">
                                    3
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                        Personalización de Columnas del Reporte
                                    </h2>
                                    <p className="text-[11px] text-slate-500 font-medium">
                                        Seleccione exactamente qué campos demográficos e institucionales desea incluir
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <button
                                    type="button"
                                    onClick={handleSelectAll}
                                    className="text-alcaldia-green font-bold hover:underline"
                                >
                                    Seleccionar Todos
                                </button>
                                <span className="text-slate-300">|</span>
                                <button
                                    type="button"
                                    onClick={handleDeselectAll}
                                    className="text-slate-500 font-bold hover:underline"
                                >
                                    Deseleccionar
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                            {defaultVisitsColumns.map((col) => {
                                const isChecked = selectedColumns.includes(col.id);
                                return (
                                    <label
                                        key={col.id}
                                        onClick={() => toggleColumn(col.id)}
                                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs font-semibold transition-all ${
                                            isChecked
                                                ? 'bg-slate-50 border-slate-300 text-slate-900'
                                                : 'border-slate-100 text-slate-400 bg-white hover:bg-slate-50/50'
                                        }`}
                                    >
                                        {isChecked ? (
                                            <CheckSquare className="w-4 h-4 text-alcaldia-green shrink-0" />
                                        ) : (
                                            <Square className="w-4 h-4 text-slate-300 shrink-0" />
                                        )}
                                        <span className="truncate">{col.label}</span>
                                    </label>
                                );
                            })}
                        </div>

                        {/* Dynamic Custom Fields extra section */}
                        {dynamicFields.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Campos Dinámicos Configurados (Se incluirán automáticamente):</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {dynamicFields.map((df) => (
                                        <span
                                            key={df.id_campo}
                                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-alcaldia-green text-xs font-bold border border-emerald-200"
                                        >
                                            + {df.nombre_campo}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Panel informativo para Asistencia GTIC-F-16 */}
                {reportType === 'asistencia' && (
                    <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200/80 shadow-xs flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Info className="w-5 h-5" />
                        </div>
                        <div className="text-xs text-emerald-950 space-y-1">
                            <div className="font-black uppercase tracking-wider text-emerald-900">
                                Formato Oficial Reglamentado: GTIC – F – 16 Versión 9 (Código 1002.26.10)
                            </div>
                            <p className="text-slate-600 leading-relaxed font-medium">
                                Esta plantilla institucional preserva el diseño oficial de la Alcaldía de Acacías con el escudo en marca de agua vectorial, logo superior, casillas de tipo de documento (TI / CC / PPT), recuadro de observaciones y compromisos, y bloque legal de sede principal. Orientación horizontal (Carta) lista para impresión o conversión a PDF en un clic.
                            </p>
                        </div>
                    </div>
                )}

                {/* Step 4: Barra de Descarga */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-slate-500 font-medium">
                        {reportType === 'asistencia'
                            ? 'El archivo descargado será un .xlsx idéntico a Registro_Usuarios (2).xlsx con datos en vivo filtrados.'
                            : 'El archivo generado incluirá encabezados institucionales verdes/oro, autoajuste de celdas y formato enriquecido.'}
                    </div>
                    <button
                        type="button"
                        onClick={handleDownload}
                        className={`w-full sm:w-auto px-8 py-3 rounded-xl text-white text-xs font-black shadow-lg transition-all flex items-center justify-center gap-2 ${
                            reportType === 'asistencia'
                                ? 'bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-700/25 ring-2 ring-emerald-500/30'
                                : 'bg-alcaldia-green hover:bg-alcaldia-green-dark shadow-alcaldia-green/20'
                        }`}
                    >
                        <Download className="w-4 h-4" />
                        <span>
                            {reportType === 'asistencia'
                                ? 'Descargar Listado Oficial GTIC-F-16 (.xlsx)'
                                : 'Generar y Descargar Reporte'}
                        </span>
                    </button>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
