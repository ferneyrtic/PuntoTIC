import React, { useRef, useState } from 'react';
import {
    X,
    Download,
    Printer,
    Sparkles,
    Calendar,
    MapPin,
    Users,
    DoorOpen,
    FileText,
    BarChart3,
    CheckCircle2,
    Building2,
    ShieldCheck,
} from 'lucide-react';
import { asset } from '@/utils/asset';
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
    Legend,
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

export default function ReporteGraficoModal({ isOpen, onClose, stats, user }: Props) {
    const reportRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [downloadSuccess, setDownloadSuccess] = useState(false);

    if (!isOpen) return null;

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

    const dataCategorias = (distribucion_categorias || []).slice(0, 6).map((c: any) => ({
        name: c.nombre.length > 22 ? c.nombre.substring(0, 20) + '...' : c.nombre,
        fullName: c.nombre,
        visitas: c.total_visitas,
        color: c.color || '#059669',
    }));

    const dataTramites = (dependencia_tramites?.top_tramites || []).slice(0, 5).map((t: any) => ({
        name: t.nombre.length > 22 ? t.nombre.substring(0, 20) + '...' : t.nombre,
        fullName: t.nombre,
        total: t.total,
    }));

    const dataSalas = (dependencia_salas?.actividades || []).slice(0, 5).map((a: any) => ({
        name: a.tipo.length > 22 ? a.tipo.substring(0, 20) + '...' : a.tipo,
        fullName: a.tipo,
        eventos: a.eventos,
        asistentes: a.asistentes,
    }));

    const dataImpresiones = (dependencia_impresiones?.tipos || []).slice(0, 5).map((t: any) => ({
        name: t.tipo.length > 22 ? t.tipo.substring(0, 20) + '...' : t.tipo,
        fullName: t.tipo,
        hojas: t.hojas,
    }));

    const handleDownloadPdf = async () => {
        if (!reportRef.current) return;
        setIsGenerating(true);
        setDownloadSuccess(false);

        try {
            // Renderizado de canvas de alta resolución (scale 2 para calidad de impresión 300 DPI)
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 900,
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const imgHeight = (canvas.height * pdfWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            // Página 1
            pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pdfHeight;

            // Páginas subsecuentes si el reporte se extiende
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
                heightLeft -= pdfHeight;
            }

            const cleanScopeName = (scope?.nombre || 'General').replace(/[^a-zA-Z0-9]/g, '_');
            const cleanPeriodName = (periodo?.key || 'mes').replace(/[^a-zA-Z0-9]/g, '_');
            const fileName = `Informe_Grafico_PuntoTIC_${cleanScopeName}_${cleanPeriodName}.pdf`;

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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-5xl bg-slate-100 rounded-3xl shadow-2xl border border-slate-300 flex flex-col my-auto max-h-[94vh]">
                {/* BARRA SUPERIOR DE ACCIONES */}
                <div className="p-4 sm:p-5 bg-white rounded-t-3xl border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                    <div>
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-emerald-600" />
                            <h2 className="text-base font-black text-slate-900">
                                Reporte Gráfico Oficial de Gestión
                            </h2>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                PDF Alta Resolución
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Visualización consolidada de gráficas para informes mensuales de gestión
                        </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                            type="button"
                            onClick={handleDownloadPdf}
                            disabled={isGenerating}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-60"
                        >
                            <Download className="w-4 h-4" />
                            <span>
                                {isGenerating ? 'Generando PDF...' : 'Descargar Archivo PDF'}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={handlePrintDirect}
                            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition-all flex items-center gap-1.5"
                            title="Imprimir o guardar con el diálogo del sistema"
                        >
                            <Printer className="w-4 h-4 text-slate-600" />
                            <span className="hidden sm:inline">Imprimir</span>
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all ml-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {downloadSuccess && (
                    <div className="bg-emerald-600 text-white text-xs font-bold py-2 px-4 flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>¡Reporte descargado exitosamente! Archivo PDF guardado en tu equipo.</span>
                    </div>
                )}

                {/* VISTA PREVIA DEL DOCUMENTO OFICIAL IMPRIMIBLE */}
                <div className="p-4 sm:p-6 overflow-y-auto flex justify-center bg-slate-200/80">
                    <div
                        ref={reportRef}
                        id="reporte-grafico-content"
                        className="bg-white w-[820px] p-8 rounded-2xl shadow-lg border border-slate-300 text-slate-900 font-sans"
                        style={{ minHeight: '1100px' }}
                    >
                        {/* ENCABEZADO INSTITUCIONAL DE ALCALDÍA */}
                        <div className="border-b-2 border-emerald-700 pb-4 mb-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={asset('images/logo_alcaldia.png')}
                                        alt="Alcaldía de Acacías"
                                        className="h-14 w-auto object-contain"
                                    />
                                    <div className="border-l-2 border-slate-300 pl-3">
                                        <h1 className="text-sm font-black tracking-tight text-slate-900 uppercase">
                                            Alcaldía Municipal de Acacías
                                        </h1>
                                        <p className="text-[11px] font-bold text-emerald-800">
                                            Secretaría de las Tecnologías de la Información y las Comunicaciones
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-medium">
                                            Red de Puntos Vive Digital y Aulas Digitales Rurales
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <span className="inline-block px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                                        Informe Gráfico Oficial
                                    </span>
                                    <div className="text-[10px] text-slate-500 mt-1">
                                        Fecha: {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </div>
                                </div>
                            </div>

                            {/* BARRA DE METADATOS DEL REPORTE */}
                            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Ámbito / Sede:</span>
                                    <span className="font-black text-slate-800 text-[11px] block truncate">
                                        {scope?.nombre} ({scope?.zona || 'Urbana'})
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Período Analizado:</span>
                                    <span className="font-bold text-slate-800 text-[11px] block">
                                        {periodo?.label} ({periodo?.fecha_desde} a {periodo?.fecha_hasta})
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Generado por:</span>
                                    <span className="font-bold text-slate-800 text-[11px] block truncate">
                                        {user?.name || 'Gestor TIC'} ({user?.rol_principal || 'Operativo'})
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* RESUMEN EJECUTIVO (KPIS CLAVE) */}
                        <div className="grid grid-cols-4 gap-2.5 mb-6 text-center">
                            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Total Atenciones</span>
                                <span className="text-xl font-black text-emerald-700">
                                    {kpis?.visitas_periodo?.toLocaleString() || 0}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200">
                                <span className="text-[10px] font-bold text-blue-800 uppercase block">Ciudadanos Únicos</span>
                                <span className="text-xl font-black text-blue-700">
                                    {kpis?.ciudadanos_unicos?.toLocaleString() || 0}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200">
                                <span className="text-[10px] font-bold text-purple-800 uppercase block">Préstamos de Salas</span>
                                <span className="text-xl font-black text-purple-700">
                                    {kpis?.prestamos_salas || 0}{' '}
                                    <span className="text-[11px] font-bold">({kpis?.asistentes_salas || 0} pers.)</span>
                                </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                                <span className="text-[10px] font-bold text-amber-800 uppercase block">Hojas Impresas</span>
                                <span className="text-xl font-black text-amber-700">
                                    {kpis?.impresiones_hojas?.toLocaleString() || 0}
                                </span>
                            </div>
                        </div>

                        {/* SECCIÓN 1: AFLUENCIA TEMPORAL Y SEDES */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {/* Gráfico 1: Afluencia Temporal */}
                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                        1. Afluencia y Demanda Temporal
                                    </h3>
                                    <span className="text-[9px] font-bold text-slate-500">
                                        {chart_serie?.length || 0} registros
                                    </span>
                                </div>
                                <div className="h-44 w-full flex items-center justify-center">
                                    <BarChart width={340} height={170} data={chart_serie} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis dataKey="dia" stroke="#64748B" fontSize={9} tickLine={false} />
                                        <YAxis stroke="#64748B" fontSize={9} tickLine={false} allowDecimals={false} />
                                        <Bar dataKey="visitas" fill="#059669" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </div>
                            </div>

                            {/* Gráfico 2: Demanda por Sedes (Multi-sede) o Género (Sede única) */}
                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                        {dataSedesPie.length > 1 ? '2. Participación por Sede' : '2. Distribución por Género'}
                                    </h3>
                                    <span className="text-[9px] font-bold text-slate-500">
                                        {dataSedesPie.length > 1
                                            ? `${dataSedesPie.length} Sedes`
                                            : `${dependencia_formacion?.total_ciudadanos_analizados || 0} ciudadanos`}
                                    </span>
                                </div>
                                <div className="h-44 w-full flex items-center justify-center">
                                    {dataSedesPie.length > 1 ? (
                                        <PieChart width={340} height={170}>
                                            <Pie
                                                data={dataSedesPie}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={35}
                                                outerRadius={65}
                                                paddingAngle={3}
                                            >
                                                {dataSedesPie.map((entry: any, index: number) => (
                                                    <Cell key={`cell-sede-${index}`} fill={SEDE_COLORS[index % SEDE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: any, name: any) => [`${value} visitas`, name]} />
                                            <Legend wrapperStyle={{ fontSize: '9px' }} />
                                        </PieChart>
                                    ) : dataGenero.length > 0 ? (
                                        <PieChart width={340} height={170}>
                                            <Pie
                                                data={dataGenero}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={35}
                                                outerRadius={65}
                                                paddingAngle={3}
                                            >
                                                {dataGenero.map((_: any, index: number) => (
                                                    <Cell key={`cell-gen-${index}`} fill={GENERO_COLORS[index % GENERO_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: any, name: any) => [`${value} ciudadanos`, name]} />
                                            <Legend wrapperStyle={{ fontSize: '9px' }} />
                                        </PieChart>
                                    ) : (
                                        <div className="text-xs text-slate-400">Sin datos en el período</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 2: CATEGORÍAS Y TRÁMITES MÁS SOLICITADOS */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {/* Gráfico 3: Categorías */}
                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40">
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight mb-2">
                                    3. Categorías de Atención
                                </h3>
                                <div className="h-44 w-full flex items-center justify-center">
                                    {dataCategorias.length > 0 ? (
                                        <BarChart
                                            width={340}
                                            height={170}
                                            data={dataCategorias}
                                            layout="vertical"
                                            margin={{ top: 5, right: 15, left: 5, bottom: 0 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                            <XAxis type="number" fontSize={9} stroke="#64748B" allowDecimals={false} />
                                            <YAxis dataKey="name" type="category" fontSize={8} stroke="#64748B" width={110} tickLine={false} />
                                            <Bar dataKey="visitas" radius={[0, 4, 4, 0]}>
                                                {dataCategorias.map((entry: any, idx: number) => (
                                                    <Cell key={`cell-cat-${idx}`} fill={entry.color || '#0d9488'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    ) : (
                                        <div className="text-xs text-slate-400">Sin datos de categorías en el período</div>
                                    )}
                                </div>
                            </div>

                            {/* Gráfico 4: Trámites y Servicios más Demandados */}
                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40">
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight mb-2">
                                    4. Ranking de Servicios y Trámites
                                </h3>
                                <div className="h-44 w-full flex items-center justify-center">
                                    {dataTramites.length > 0 ? (
                                        <BarChart
                                            width={340}
                                            height={170}
                                            data={dataTramites}
                                            layout="vertical"
                                            margin={{ top: 5, right: 15, left: 5, bottom: 0 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                            <XAxis type="number" fontSize={9} stroke="#64748B" allowDecimals={false} />
                                            <YAxis dataKey="name" type="category" fontSize={8} stroke="#64748B" width={115} tickLine={false} />
                                            <Bar dataKey="total" fill="#2563eb" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    ) : (
                                        <div className="text-xs text-slate-400">Sin datos de trámites</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 3: SALAS E INFRAESTRUCTURA + DEMOGRAFÍA */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {/* Gráfico 5: Salas e Infraestructura */}
                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40">
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight mb-2">
                                    5. Préstamo de Salas (Aforo por Actividad)
                                </h3>
                                <div className="h-44 w-full flex items-center justify-center">
                                    {dataSalas.length > 0 ? (
                                        <BarChart
                                            width={340}
                                            height={170}
                                            data={dataSalas}
                                            margin={{ top: 8, right: 15, left: -16, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis dataKey="name" interval={0} fontSize={8.5} stroke="#64748B" tickLine={false} />
                                            <YAxis fontSize={9} stroke="#64748B" allowDecimals={false} />
                                            <Bar dataKey="asistentes" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    ) : (
                                        <div className="text-xs text-slate-400">Sin registros de salas en el período</div>
                                    )}
                                </div>
                            </div>

                            {/* Gráfico 6: Demografía por Edad */}
                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40">
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight mb-2">
                                    6. Perfil Demográfico (Grupos de Edad)
                                </h3>
                                <div className="h-44 w-full flex items-center justify-center">
                                    <BarChart
                                        width={340}
                                        height={170}
                                        data={dataEdades}
                                        margin={{ top: 8, right: 18, left: -16, bottom: 6 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis dataKey="name" interval={0} fontSize={8} stroke="#64748B" tickLine={false} dy={4} />
                                        <YAxis fontSize={9} stroke="#64748B" allowDecimals={false} />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                            {dataEdades.map((_, idx) => (
                                                <Cell key={`cell-edad-${idx}`} fill={EDAD_COLORS[idx % EDAD_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </div>
                            </div>
                        </div>

                        {/* PIE DE PÁGINA INSTITUCIONAL DE VALIDACIÓN */}
                        <div className="mt-8 pt-4 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                                <span>
                                    Certificado de autenticidad · Plataforma PuntoTIC · Alcaldía Municipal de Acacías
                                </span>
                            </div>
                            <span className="font-mono text-slate-400">
                                GTIC-INF-GRAFICO · {new Date().getFullYear()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
