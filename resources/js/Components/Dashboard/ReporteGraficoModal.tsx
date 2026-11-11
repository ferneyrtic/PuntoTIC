import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    X,
    Download,
    Printer,
    BarChart3,
    CheckCircle2,
    Layers,
    Users,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
    PieChart,
    Pie,
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    stats: any;
    user: any;
}

const SEDE_COLORS = ['#059669', '#2563eb', '#d97706', '#0d9488', '#6366f1'];
const GENERO_COLORS = ['#ec4899', '#3b82f6', '#8b5cf6'];
const EDAD_COLORS = ['#10b981', '#06b6d4', '#3b82f6', '#f59e0b'];

const renderAgeCustomTick = ({ x, y, payload }: any) => (
    <text x={x} y={y + 14} textAnchor="middle" fill="#334155" fontSize={10} fontWeight={600}>
        {payload.value}
    </text>
);

export default function ReporteGraficoModal({ isOpen, onClose, stats, user }: Props) {
    const reportRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [downloadSuccess, setDownloadSuccess] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen || !mounted || typeof document === 'undefined') return null;

    const {
        scope,
        periodo,
        kpis,
        chart_serie,
        comparativa_sedes,
        distribucion_categorias,
        dependencia_tramites,
        dependencia_formacion,
        dependencia_salas,
        dependencia_impresiones,
    } = stats;

    // Preparación de datos para gráficos del reporte
    const dataGenero = [
        { name: 'Mujeres', value: dependencia_formacion?.genero?.femenino || 0 },
        { name: 'Hombres', value: dependencia_formacion?.genero?.masculino || 0 },
        { name: 'Otro / No esp.', value: dependencia_formacion?.genero?.otro || 0 },
    ].filter((g) => g.value > 0);

    const totalGenero = dataGenero.reduce((acc: number, g: any) => acc + g.value, 0) || dependencia_formacion?.total_ciudadanos_analizados || 1;

    const dataEdades = [
        { name: 'Niños (0-13)', value: dependencia_formacion?.grupos_edad?.ninos || 0 },
        { name: 'Jóvenes (14-28)', value: dependencia_formacion?.grupos_edad?.jovenes || 0 },
        { name: 'Adultos (29-59)', value: dependencia_formacion?.grupos_edad?.adultos || 0 },
        { name: 'Mayores (60+)', value: dependencia_formacion?.grupos_edad?.adulto_mayor || 0 },
    ];

    const dataSedesPie = (comparativa_sedes || []).map((s: any) => ({
        name: s.nombre_punto,
        value: s.total_visitas,
        porcentaje: s.porcentaje,
    }));

    const totalVisitasSedes = dataSedesPie.reduce((acc: number, s: any) => acc + s.value, 0) || 1;

    const dataCategorias = (distribucion_categorias || []).slice(0, 6).map((c: any) => ({
        name: c.nombre && c.nombre.length > 34 ? c.nombre.substring(0, 32) + '...' : c.nombre,
        fullName: c.nombre,
        visitas: c.total_visitas,
        color: c.color || '#059669',
    }));

    const dataTramites = (dependencia_tramites?.top_tramites || []).slice(0, 6).map((t: any) => ({
        name: t.nombre && t.nombre.length > 34 ? t.nombre.substring(0, 32) + '...' : t.nombre,
        fullName: t.nombre,
        total: t.total,
    }));

    const dataSalas = (dependencia_salas?.actividades || []).slice(0, 5).map((a: any) => ({
        name: a.tipo && a.tipo.length > 30 ? a.tipo.substring(0, 28) + '...' : a.tipo,
        fullName: a.tipo,
        eventos: a.eventos,
        asistentes: a.asistentes,
    }));

    const handleDownloadPdf = async () => {
        if (!reportRef.current) return;
        setIsGenerating(true);
        setDownloadSuccess(false);

        try {
            const pageElements = reportRef.current.querySelectorAll('.a4-page');
            if (!pageElements.length) return;

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            for (let i = 0; i < pageElements.length; i++) {
                if (i > 0) {
                    pdf.addPage();
                }

                const pageEl = pageElements[i] as HTMLElement;
                const canvas = await html2canvas(pageEl, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    windowWidth: 900,
                });

                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            }

            const cleanScopeName = (scope?.nombre || 'General').replace(/[^a-zA-Z0-9]/g, '_');
            const cleanPeriodName = (periodo?.key || 'periodo').replace(/[^a-zA-Z0-9]/g, '_');
            const fileName = `Reporte_Grafico_${cleanScopeName}_${cleanPeriodName}.pdf`;

            pdf.save(fileName);
            setDownloadSuccess(true);
            setTimeout(() => setDownloadSuccess(false), 4000);
        } catch (err) {
            console.error('Error generando PDF de gráficas:', err);
            alert('Ocurrió un error al generar el PDF. Por favor intenta imprimir directamente.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePrintDirect = () => {
        window.print();
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-sm animate-fade-in overflow-hidden">
            <div className="relative w-full max-w-5xl bg-slate-100 rounded-3xl shadow-2xl border border-slate-300 flex flex-col h-[92vh] max-h-[92vh] overflow-hidden">
                {/* BARRA SUPERIOR DE ACCIONES */}
                <div className="p-4 sm:p-5 bg-white rounded-t-3xl border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                    <div>
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-emerald-600" />
                            <h2 className="text-base font-black text-slate-900">
                                Reporte Gráfico de Estadísticas
                            </h2>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Formato Completo (A4)
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Visualización de gráficas paginadas con espacio extendido para lectura clara de datos
                        </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                            type="button"
                            onClick={handleDownloadPdf}
                            disabled={isGenerating}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                        >
                            <Download className="w-4 h-4" />
                            <span>
                                {isGenerating ? 'Generando PDF...' : 'Descargar Archivo PDF'}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={handlePrintDirect}
                            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
                            title="Imprimir o guardar con el diálogo del sistema"
                        >
                            <Printer className="w-4 h-4 text-slate-600" />
                            <span className="hidden sm:inline">Imprimir</span>
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all ml-1 cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {downloadSuccess && (
                    <div className="bg-emerald-600 text-white text-xs font-bold py-2 px-4 flex items-center justify-center gap-2 shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>¡Reporte descargado exitosamente! Archivo PDF guardado en tu equipo.</span>
                    </div>
                )}

                {/* VISTA PREVIA DEL DOCUMENTO IMPRIMIBLE (PAGINADA Y CENTRADA) */}
                <div
                    ref={reportRef}
                    className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-200/90 flex flex-col items-center gap-6"
                >
                    {/* ========================================================= */}
                    {/* PÁGINA 1: ENCABEZADO + KPIS + GRÁFICAS 1 Y 2             */}
                    {/* ========================================================= */}
                    <div className="a4-page bg-white w-[800px] p-8 rounded-2xl shadow-lg border border-slate-300 text-slate-900 font-sans shrink-0">
                        {/* ENCABEZADO SIMPLE Y DIRECTO */}
                        <div className="border-b border-slate-200 pb-3 mb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-lg font-black tracking-tight text-slate-900">
                                        Reporte de Estadísticas y Gráficas
                                    </h1>
                                    <p className="text-xs text-slate-500 font-medium">
                                        Monitoreo de afluencia, atenciones y demografía
                                    </p>
                                </div>
                                <div className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                                    Página 1 de 3
                                </div>
                            </div>

                            {/* METADATOS */}
                            <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-100 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Ámbito / Sede:</span>
                                    <span className="font-black text-slate-800 text-[11px] block truncate">
                                        {scope?.nombre} {scope?.zona ? `(${scope.zona})` : ''}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Período Analizado:</span>
                                    <span className="font-bold text-slate-800 text-[11px] block truncate">
                                        {periodo?.label} ({periodo?.fecha_desde} a {periodo?.fecha_hasta})
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Generado el:</span>
                                    <span className="font-bold text-slate-800 text-[11px] block">
                                        {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* RESUMEN EJECUTIVO (KPIS CLAVE) */}
                        <div className="grid grid-cols-4 gap-2 mb-5 text-center">
                            <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200">
                                <span className="text-[9px] font-bold text-emerald-800 uppercase block">Total Atenciones</span>
                                <span className="text-lg font-black text-emerald-700">
                                    {kpis?.visitas_periodo?.toLocaleString() || 0}
                                </span>
                            </div>
                            <div className="p-2 rounded-xl bg-blue-50/70 border border-blue-200">
                                <span className="text-[9px] font-bold text-blue-800 uppercase block">Ciudadanos Únicos</span>
                                <span className="text-lg font-black text-blue-700">
                                    {kpis?.ciudadanos_unicos?.toLocaleString() || 0}
                                </span>
                            </div>
                            <div className="p-2 rounded-xl bg-purple-50/70 border border-purple-200">
                                <span className="text-[9px] font-bold text-purple-800 uppercase block">Préstamos de Salas</span>
                                <span className="text-lg font-black text-purple-700">
                                    {kpis?.prestamos_salas || 0}{' '}
                                    <span className="text-[10px] font-bold">({kpis?.asistentes_salas || 0} p.)</span>
                                </span>
                            </div>
                            <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200">
                                <span className="text-[9px] font-bold text-amber-800 uppercase block">Hojas Impresas</span>
                                <span className="text-lg font-black text-amber-700">
                                    {kpis?.impresiones_hojas?.toLocaleString() || 0}
                                </span>
                            </div>
                        </div>

                        {/* GRÁFICA 1: AFLUENCIA TEMPORAL */}
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 mb-5">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                    1. Afluencia y Demanda Temporal
                                </h3>
                                <span className="text-[10px] font-bold text-slate-500">
                                    {chart_serie?.length || 0} puntos en el período
                                </span>
                            </div>
                            <div className="h-48 w-full flex items-center justify-center">
                                <BarChart width={736} height={190} data={chart_serie} margin={{ top: 8, right: 15, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="dia" stroke="#64748B" fontSize={9.5} tickLine={false} />
                                    <YAxis stroke="#64748B" fontSize={9.5} tickLine={false} allowDecimals={false} />
                                    <Tooltip formatter={(value: any) => [`${value} atenciones`, 'Visitas']} />
                                    <Bar dataKey="visitas" fill="#059669" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </div>
                        </div>

                        {/* GRÁFICA 2: DISTRIBUCIÓN POR GÉNERO O PARTICIPACIÓN POR SEDE */}
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                    {dataSedesPie.length > 1 ? '2. Participación por Sede' : '2. Distribución por Género'}
                                </h3>
                                <span className="text-[10px] font-bold text-slate-500">
                                    {dataSedesPie.length > 1
                                        ? `${dataSedesPie.length} Sedes`
                                        : `${dependencia_formacion?.total_ciudadanos_analizados || 0} ciudadanos`}
                                </span>
                            </div>

                            {dataSedesPie.length > 1 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                    <div className="flex items-center justify-center h-48">
                                        <PieChart width={320} height={190}>
                                            <Pie
                                                data={dataSedesPie}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={75}
                                                paddingAngle={3}
                                            >
                                                {dataSedesPie.map((_: any, index: number) => (
                                                    <Cell key={`cell-sede-${index}`} fill={SEDE_COLORS[index % SEDE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: any, name: any) => [`${value} visitas`, name]} />
                                        </PieChart>
                                    </div>
                                    <div className="space-y-2 pr-2">
                                        {dataSedesPie.map((s: any, idx: number) => {
                                            const pct = Math.round((s.value / totalVisitasSedes) * 100);
                                            const color = SEDE_COLORS[idx % SEDE_COLORS.length];
                                            return (
                                                <div key={s.name} className="p-2 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
                                                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                                                        <span className="flex items-center gap-1.5 text-slate-700 truncate max-w-[190px]">
                                                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                                            {s.name}
                                                        </span>
                                                        <span className="text-slate-900 font-black">
                                                            {s.value} ({pct}%)
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : dataGenero.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                    <div className="flex items-center justify-center h-48">
                                        <PieChart width={320} height={190}>
                                            <Pie
                                                data={dataGenero}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={75}
                                                paddingAngle={4}
                                            >
                                                {dataGenero.map((_: any, index: number) => (
                                                    <Cell key={`cell-gen-${index}`} fill={GENERO_COLORS[index % GENERO_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: any, name: any) => [`${value} ciudadanos`, name]} />
                                        </PieChart>
                                    </div>
                                    <div className="space-y-3 pr-2">
                                        {dataGenero.map((g: any, idx: number) => {
                                            const pct = Math.round((g.value / totalGenero) * 100);
                                            const color = GENERO_COLORS[idx % GENERO_COLORS.length];
                                            return (
                                                <div key={g.name} className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                                                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                                                        <span className="flex items-center gap-1.5 text-slate-700">
                                                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                                                            {g.name}
                                                        </span>
                                                        <span className="text-slate-900 font-black">
                                                            {g.value} ({pct}%)
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div className="text-[11px] text-slate-500 font-medium text-right pt-0.5">
                                            Total analizados: <strong>{dependencia_formacion?.total_ciudadanos_analizados || 0} ciudadanos</strong>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xs text-slate-400 py-8 text-center">Sin datos registrados en el período</div>
                            )}
                        </div>
                    </div>

                    {/* ========================================================= */}
                    {/* PÁGINA 2: CATEGORÍAS + TRÁMITES                           */}
                    {/* ========================================================= */}
                    <div className="a4-page bg-white w-[800px] p-8 rounded-2xl shadow-lg border border-slate-300 text-slate-900 font-sans shrink-0">
                        <div className="border-b border-slate-200 pb-2.5 mb-5 flex items-center justify-between">
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                Categorías de Atención & Servicios
                            </h2>
                            <div className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                                Página 2 de 3
                            </div>
                        </div>

                        {/* GRÁFICA 3: CATEGORÍAS */}
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 mb-5">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                    3. Categorías de Atención
                                </h3>
                                <span className="text-[10px] font-bold text-slate-500">
                                    {dataCategorias.reduce((acc: number, c: any) => acc + (c.visitas || 0), 0)} atenciones
                                </span>
                            </div>
                            <div className="h-60 w-full flex items-center justify-center">
                                {dataCategorias.length > 0 ? (
                                    <BarChart
                                        width={736}
                                        height={230}
                                        data={dataCategorias}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 10, bottom: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                        <XAxis type="number" fontSize={9.5} stroke="#64748B" allowDecimals={false} />
                                        <YAxis dataKey="name" type="category" fontSize={9.5} stroke="#475569" width={220} tickLine={false} />
                                        <Tooltip formatter={(val: any) => [`${val} visitas`, 'Total']} />
                                        <Bar dataKey="visitas" radius={[0, 4, 4, 0]}>
                                            {dataCategorias.map((entry: any, idx: number) => (
                                                <Cell key={`cell-cat-${idx}`} fill={entry.color || '#0d9488'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                ) : (
                                    <div className="text-xs text-slate-400 py-8">Sin datos de categorías en el período</div>
                                )}
                            </div>
                        </div>

                        {/* GRÁFICA 4: RANKING DE TRÁMITES */}
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                    4. Ranking de Servicios y Trámites
                                </h3>
                                <span className="text-[10px] font-bold text-slate-500">
                                    Top trámites solicitados
                                </span>
                            </div>
                            <div className="h-60 w-full flex items-center justify-center">
                                {dataTramites.length > 0 ? (
                                    <BarChart
                                        width={736}
                                        height={230}
                                        data={dataTramites}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 10, bottom: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                        <XAxis type="number" fontSize={9.5} stroke="#64748B" allowDecimals={false} />
                                        <YAxis dataKey="name" type="category" fontSize={9.5} stroke="#475569" width={220} tickLine={false} />
                                        <Tooltip formatter={(val: any) => [`${val} atenciones`, 'Total']} />
                                        <Bar dataKey="total" fill="#2563eb" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                ) : (
                                    <div className="text-xs text-slate-400 py-8">Sin trámites registrados en el período</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ========================================================= */}
                    {/* PÁGINA 3: SALAS + PERFIL DEMOGRÁFICO POR EDAD             */}
                    {/* ========================================================= */}
                    <div className="a4-page bg-white w-[800px] p-8 rounded-2xl shadow-lg border border-slate-300 text-slate-900 font-sans shrink-0">
                        <div className="border-b border-slate-200 pb-2.5 mb-5 flex items-center justify-between">
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                Salas & Perfil Demográfico Etario
                            </h2>
                            <div className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                                Página 3 de 3
                            </div>
                        </div>

                        {/* GRÁFICA 5: SALAS */}
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 mb-5">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                    5. Préstamo de Salas (Aforo por Actividad)
                                </h3>
                                <span className="text-[10px] font-bold text-slate-500">
                                    {dependencia_salas?.total_eventos || 0} eventos
                                </span>
                            </div>
                            <div className="h-56 w-full flex items-center justify-center">
                                {dataSalas.length > 0 ? (
                                    <BarChart
                                        width={736}
                                        height={210}
                                        data={dataSalas}
                                        margin={{ top: 8, right: 15, left: -15, bottom: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis dataKey="name" interval={0} fontSize={9.5} stroke="#475569" tickLine={false} />
                                        <YAxis fontSize={9.5} stroke="#64748B" allowDecimals={false} />
                                        <Tooltip formatter={(val: any) => [`${val} asistentes`, 'Asistencia']} />
                                        <Bar dataKey="asistentes" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                ) : (
                                    <div className="text-xs text-slate-400 py-8">Sin registros de salas en el período</div>
                                )}
                            </div>
                        </div>

                        {/* GRÁFICA 6: DEMOGRAFÍA POR EDAD */}
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                    6. Perfil Demográfico (Grupos de Edad)
                                </h3>
                                <span className="text-[10px] font-bold text-slate-500">
                                    {dependencia_formacion?.total_ciudadanos_analizados || 0} ciudadanos
                                </span>
                            </div>
                            <div className="h-56 w-full flex items-center justify-center">
                                <BarChart
                                    width={736}
                                    height={210}
                                    data={dataEdades}
                                    margin={{ top: 8, right: 15, left: -15, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="name" interval={0} tick={renderAgeCustomTick} tickLine={false} />
                                    <YAxis fontSize={9.5} stroke="#64748B" allowDecimals={false} />
                                    <Tooltip formatter={(val: any) => [`${val} ciudadanos`, 'Población']} />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {dataEdades.map((_, idx) => (
                                            <Cell key={`cell-edad-${idx}`} fill={EDAD_COLORS[idx % EDAD_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </div>
                        </div>

                        {/* PIE DE PÁGINA SIMPLE */}
                        <div className="mt-5 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400">
                            PuntoTIC · Reporte Gráfico de Estadísticas
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
