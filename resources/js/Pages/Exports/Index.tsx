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
} from 'lucide-react';

interface Props {
    points: Array<any>;
    categories: Array<any>;
    dynamicFields: Array<any>;
}

export default function ExportsIndex({ points, categories, dynamicFields }: Props) {
    const [reportType, setReportType] = useState<'visitas' | 'ciudadanos' | 'prestamos' | 'impresiones'>('visitas');
    const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
    const [selectedPoint, setSelectedPoint] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Available Columns for Visits Report
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
                            Generación de informes ejecutivos en Excel y CSV con personalización de columnas y metadatos
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Exportar Reportes" />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Step 1: Selector de Módulo / Tipo de Reporte */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                        <div className="w-7 h-7 rounded-lg bg-alcaldia-green text-white flex items-center justify-center font-black text-xs">
                            1
                        </div>
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Seleccionar Tipo de Reporte</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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
                            <div className="text-[11px] text-slate-500 mt-1">Atenciones, servicios, duraciones y perfil sociodemográfico</div>
                        </button>

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
                            <div className="text-[11px] text-slate-500 mt-1">Padrón de ciudadanos registrados y contador histórico</div>
                        </button>

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
                            <div className="text-[11px] text-slate-500 mt-1">Uso de instalaciones, eventos JAC y talleres</div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setReportType('impresiones')}
                            className={`p-4 rounded-2xl border text-left transition-all ${
                                reportType === 'impresiones'
                                    ? 'bg-amber-50/70 border-alcaldia-yellow shadow-sm ring-1 ring-alcaldia-yellow'
                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            <Printer className={`w-6 h-6 mb-2 ${reportType === 'impresiones' ? 'text-alcaldia-yellow' : 'text-slate-500'}`} />
                            <div className="text-xs font-bold text-slate-900">Impresiones / Copias</div>
                            <div className="text-[11px] text-slate-500 mt-1">Conteo de hojas, tipo de documento y ciudadanos</div>
                        </button>
                    </div>
                </div>

                {/* Step 2: Filtros del Reporte */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                        <div className="w-7 h-7 rounded-lg bg-alcaldia-yellow text-slate-900 flex items-center justify-center font-black text-xs">
                            2
                        </div>
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Parámetros y Filtros de Fecha</h2>
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
                                <option value="">Todas las Sedes</option>
                                {points.map((p) => (
                                    <option key={p.id_punto} value={p.id_punto}>
                                        {p.nombre_punto}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Formato de Salida</label>
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
                        </div>
                    </div>
                </div>

                {/* Step 3: Selector Dinámico de Columnas (para Visitas) */}
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

                {/* Step 4: Barra de Descarga */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-slate-500 font-medium">
                        El archivo generado incluirá encabezados institucionales verdes/oro, autoajuste de celdas y formato enriquecido.
                    </div>
                    <button
                        type="button"
                        onClick={handleDownload}
                        className="w-full sm:w-auto px-8 py-3 rounded-xl bg-alcaldia-green hover:bg-alcaldia-green-dark text-white text-xs font-black shadow-lg shadow-alcaldia-green/20 transition-all flex items-center justify-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        <span>Generar y Descargar Reporte</span>
                    </button>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
