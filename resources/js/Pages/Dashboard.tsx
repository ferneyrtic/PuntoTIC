import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Users,
    Printer,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    ArrowRight,
    Activity,
    Building2,
    Clock,
    MapPin,
    DoorOpen,
    Globe,
    FileText,
    GraduationCap,
    BarChart3,
    Layers,
    FileSpreadsheet,
    Calendar,
    Phone,
    CheckCircle2,
    Sparkles,
    UserCheck,
    PieChart as PieChartIcon,
    ChevronRight,
    RotateCcw,
    SlidersHorizontal,
    Share2,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

interface Props {
    stats: {
        scope: {
            id_punto: number | null;
            zona: string | null;
            tipo: 'consolidado' | 'zona' | 'individual';
            nombre: string;
            es_rural: boolean;
        };
        periodo: {
            key: string;
            label: string;
            fecha_desde: string;
            fecha_hasta: string;
        };
        kpis: {
            visitas_periodo: number;
            visitas_hoy: number;
            delta_visitas_hoy: number;
            ciudadanos_unicos: number;
            total_ciudadanos: number;
            impresiones_hojas: number;
            impresiones_hoy_hojas: number;
            prestamos_salas: number;
            asistentes_salas: number;
            prestamos_hoy: number;
        };
        chart_serie: Array<{ dia: string; fecha: string; visitas: number; es_hoy: boolean }>;
        comparativa_sedes: Array<{
            id_punto: number;
            nombre_punto: string;
            codigo: string;
            zona: string;
            es_aula_digital: boolean;
            total_visitas: number;
            total_hojas: number;
            total_prestamos: number;
            total_asistentes: number;
            porcentaje: number;
        }>;
        distribucion_categorias: Array<{
            id_categoria: number;
            nombre: string;
            color: string;
            icono: string;
            total_visitas: number;
            porcentaje: number;
        }>;
        dependencia_tramites: {
            total_atenciones: number;
            top_tramites: Array<{
                id_subcategoria: number;
                nombre: string;
                total: number;
                porcentaje: number;
            }>;
        };
        dependencia_formacion: {
            total_formacion_visitas: number;
            total_ciudadanos_analizados: number;
            genero: {
                femenino: number;
                masculino: number;
                otro: number;
            };
            grupos_edad: {
                jovenes: number;
                adultos: number;
                adulto_mayor: number;
                ninos: number;
            };
            nivel_educativo: Record<string, number>;
            zona_residencia: {
                urbana: number;
                rural: number;
            };
        };
        dependencia_salas: {
            total_eventos: number;
            total_asistentes: number;
            promedio_asistentes: number;
            actividades: Array<{
                tipo: string;
                eventos: number;
                asistentes: number;
                porcentaje: number;
            }>;
        };
        dependencia_impresiones: {
            total_hojas: number;
            total_solicitudes: number;
            ciudadanos_atendidos: number;
            promedio_hojas: number;
            tipos: Array<{
                tipo: string;
                solicitudes: number;
                hojas: number;
                porcentaje: number;
            }>;
        };
    };
    churnAlerts: Array<{
        id_form_pvd: number;
        documento: string;
        nombre_completo: string;
        telefono: string;
        punto_nombre: string;
        total_visitas: number;
        ultima_visita_fecha: string;
        dias_inactivo: number;
        nivel_riesgo: string;
    }>;
    recentVisits: Array<any>;
    points: Array<{
        id_punto: number;
        nombre_punto: string;
        codigo: string;
        zona: string;
    }>;
    filters: {
        id_punto: number | null;
        zona: string | null;
        periodo: string;
        fecha_desde?: string;
        fecha_hasta?: string;
    };
}

export default function Dashboard({
    stats,
    churnAlerts,
    recentVisits,
    points,
    filters,
}: Props) {
    const { scope, periodo, kpis, chart_serie, comparativa_sedes, distribucion_categorias } = stats;

    // Pestaña activa del dashboard
    const [activeTab, setActiveTab] = useState<'general' | 'tramites' | 'formacion' | 'salas' | 'impresiones'>('general');

    // Manejador del cambio de ámbito (Sede individual o Consolidado)
    const handleScopeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        const nextParams: any = { periodo: filters.periodo || 'mes' };

        if (val === 'all') {
            // Consolidado total
        } else if (val === 'zona_rural') {
            nextParams.zona = 'Rural';
        } else if (val === 'zona_urbana') {
            nextParams.zona = 'Urbana';
        } else {
            nextParams.id_punto = val;
        }

        router.get(route('dashboard'), nextParams, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Manejador del cambio de período temporal
    const handlePeriodChange = (newPeriod: string) => {
        const nextParams: any = { ...filters, periodo: newPeriod };
        if (filters.id_punto) nextParams.id_punto = filters.id_punto;
        if (filters.zona) nextParams.zona = filters.zona;

        router.get(route('dashboard'), nextParams, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Resetear filtros al consolidado municipal
    const handleResetToAll = () => {
        router.get(route('dashboard'), { periodo: 'mes' }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Valor seleccionado para el select de ámbito
    const currentScopeValue = filters.id_punto
        ? String(filters.id_punto)
        : filters.zona === 'Rural'
        ? 'zona_rural'
        : filters.zona === 'Urbana'
        ? 'zona_urbana'
        : 'all';

    // Tooltip personalizado para Recharts
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-2xl shadow-xl border border-slate-700/80 text-xs">
                    <p className="font-semibold text-slate-300">{label}</p>
                    <p className="text-emerald-400 font-bold text-sm mt-0.5">
                        {payload[0].value.toLocaleString()} <span className="text-[11px] font-normal text-slate-300">atenciones</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    const totalMunicipalVisitas = comparativa_sedes.reduce((acc, p) => acc + (p.total_visitas || 0), 0) || 1;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2">
                    <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                Centro de Mando & Analítica
                            </h1>
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                                Alcaldía de Acacías
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                            Panel integral de monitoreo operativo, estadísticas por dependencia y gestión territorial
                        </p>
                    </div>

                    {/* Controles de Ámbito y Período */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Selector de Ámbito / Sede */}
                        <div className="relative flex-1 sm:flex-initial min-w-[240px]">
                            <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <select
                                value={currentScopeValue}
                                onChange={handleScopeChange}
                                className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800 shadow-xs hover:border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all cursor-pointer"
                            >
                                <option value="all">Consolidado Municipal (Toda la Red)</option>
                                <optgroup label="Agrupaciones por Zona">
                                    <option value="zona_urbana">PVD Urbanos (PLUS + Tradicional)</option>
                                    <option value="zona_rural">Aulas Rurales (Dinamarca + Chichimene)</option>
                                </optgroup>
                                <optgroup label="Puntos y Aulas Individuales">
                                    {points.map((p) => (
                                        <option key={p.id_punto} value={p.id_punto}>
                                            {p.nombre_punto} ({p.zona})
                                        </option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>

                        {/* Botón de Exportar Reporte Ejecutivo */}
                        <Link
                            href={route('exportar.index')}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
                            title="Exportar informe ejecutivo con filtros"
                        >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Exportar Informe</span>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Centro de Mando & Analítica · PuntoTIC" />

            {/* Barra de Ámbito y Período Activo */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        Ámbito actual:
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {scope.nombre}
                    </span>
                    {scope.tipo !== 'consolidado' && (
                        <button
                            onClick={handleResetToAll}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition-colors"
                            title="Restablecer a toda la red"
                        >
                            <RotateCcw className="w-3 h-3" />
                            <span>Ver todo</span>
                        </button>
                    )}
                </div>

                {/* Filtro de Período Temporal */}
                <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl self-start md:self-auto overflow-x-auto max-w-full">
                    {[
                        { key: 'hoy', label: 'Hoy' },
                        { key: 'semana', label: '7 Días' },
                        { key: 'mes', label: 'Mes Actual' },
                        { key: 'trimestre', label: 'Trimestre' },
                        { key: 'ano', label: 'Año' },
                    ].map((p) => (
                        <button
                            key={p.key}
                            onClick={() => handlePeriodChange(p.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                periodo.key === p.key
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tarjetas Principales de KPIs (Grid Bento) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* KPI 1: Atenciones del Período */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-[#0F1E36] text-white p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-md flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                Atenciones en el Período
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">{periodo.label}</span>
                        </div>
                        <div className="text-4xl sm:text-5xl font-black tracking-tight tabular-nums mt-1 text-white">
                            {kpis.visitas_periodo.toLocaleString()}
                        </div>
                        <p className="text-xs text-slate-300 font-medium mt-1">
                            Atenciones y servicios ciudadanos registrados
                        </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 mt-4 flex items-center justify-between text-xs">
                        <span className="text-slate-400">
                            Hoy: <strong className="text-white">{kpis.visitas_hoy}</strong>
                        </span>
                        <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold text-[11px] ${
                                kpis.delta_visitas_hoy >= 0
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-slate-800 text-slate-400'
                            }`}
                        >
                            {kpis.delta_visitas_hoy >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {kpis.delta_visitas_hoy >= 0 ? `+${kpis.delta_visitas_hoy}%` : `${kpis.delta_visitas_hoy}%`}
                        </span>
                    </div>
                </div>

                {/* KPI 2: Ciudadanos Únicos */}
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                Ciudadanos Beneficiados
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                                <Users className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight tabular-nums mt-1">
                            {kpis.ciudadanos_unicos.toLocaleString()}
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                            Usuarios únicos atendidos en este período
                        </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
                        <span className="text-slate-400">
                            Padrón total: <strong className="text-slate-800">{kpis.total_ciudadanos.toLocaleString()}</strong>
                        </span>
                        <Link
                            href={route('ciudadanos.index')}
                            className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5"
                        >
                            <span>Ver</span>
                            <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>

                {/* KPI 3: Impresiones y Digitalización */}
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                Hojas de Impresión / Copias
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                                <Printer className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight tabular-nums mt-1">
                            {kpis.impresiones_hojas.toLocaleString()}
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                            Hojas procesadas y consumibles controlados
                        </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
                        <span className="text-slate-400">
                            Hoy: <strong className="text-slate-800">{kpis.impresiones_hoy_hojas} hojas</strong>
                        </span>
                        <Link
                            href={route('impresiones.index')}
                            className="font-bold text-amber-700 hover:text-amber-800 flex items-center gap-0.5"
                        >
                            <span>Detalle</span>
                            <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>

                {/* KPI 4: Préstamos de Salas y Asistentes */}
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                Salas & Espacios Comunitarios
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                <DoorOpen className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight tabular-nums">
                                {kpis.prestamos_salas}
                            </span>
                            <span className="text-xs font-bold text-slate-500">eventos</span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                            <strong className="text-emerald-700 font-bold">{kpis.asistentes_salas.toLocaleString()}</strong> asistentes congregados
                        </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
                        <span className="text-slate-400">
                            Hoy: <strong className="text-slate-800">{kpis.prestamos_hoy} en curso</strong>
                        </span>
                        <Link
                            href={route('prestamos.index')}
                            className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5"
                        >
                            <span>Agenda</span>
                            <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Pestañas de Especialización por Dependencia / Área */}
            <div className="flex items-center gap-2 border-b border-slate-200 mb-6 overflow-x-auto pb-px">
                {[
                    { id: 'general', label: 'Vista General & Sedes', icon: BarChart3 },
                    { id: 'tramites', label: 'Trámites en Línea', icon: FileText },
                    { id: 'formacion', label: 'Formación & Demografía', icon: GraduationCap },
                    { id: 'salas', label: 'Salas & Infraestructura', icon: DoorOpen },
                    { id: 'impresiones', label: 'Impresiones & Recursos', icon: Printer },
                ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                                isActive
                                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-xl'
                                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                            }`}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* CONTENIDO DE LAS PESTAÑAS */}

            {/* PESTAÑA 1: VISTA GENERAL & SEDES */}
            {activeTab === 'general' && (
                <div className="space-y-6">
                    {/* Gráfico de Afluencia Temporal + Red de Sedes */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Gráfico Temporal (2 Columnas) */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
                            <div>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900">
                                            Afluencia y Demanda Temporal
                                        </h2>
                                        <p className="text-xs text-slate-500 font-medium">
                                            Comportamiento de la demanda en {periodo.label} ({scope.nombre})
                                        </p>
                                    </div>
                                    <span className="self-start sm:self-auto text-xs font-bold px-3 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                                        {chart_serie.length} puntos de registro
                                    </span>
                                </div>

                                <div className="h-64 sm:h-72 w-full pt-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chart_serie} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                            <XAxis dataKey="dia" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="visitas" radius={[6, 6, 0, 0]}>
                                                {chart_serie.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.es_hoy ? '#059669' : '#94A3B8'}
                                                        className="transition-all hover:opacity-85"
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 mt-3 flex items-center justify-between text-xs text-slate-500">
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1.5 font-medium">
                                        <span className="w-2.5 h-2.5 rounded bg-emerald-600 inline-block"></span>
                                        Actual
                                    </span>
                                    <span className="flex items-center gap-1.5 font-medium">
                                        <span className="w-2.5 h-2.5 rounded bg-slate-400 inline-block"></span>
                                        Histórico
                                    </span>
                                </div>
                                <Link
                                    href={route('visitas.index')}
                                    className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                                >
                                    <span>Ver registro de visitas</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>

                        {/* Comparativa de Sedes (1 Columna) */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-base font-bold text-slate-900">
                                        Demanda por Sede
                                    </h2>
                                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600">
                                        {comparativa_sedes.length} Sedes
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium mb-4">
                                    Participación de demanda en {periodo.label}
                                </p>

                                <div className="space-y-4">
                                    {comparativa_sedes.map((punto) => (
                                        <div key={punto.id_punto} className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                                                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                    <span className="truncate max-w-[140px]">{punto.nombre_punto}</span>
                                                    <span
                                                        className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                                            punto.zona === 'Rural'
                                                                ? 'bg-amber-100 text-amber-800'
                                                                : 'bg-slate-100 text-slate-600'
                                                        }`}
                                                    >
                                                        {punto.zona}
                                                    </span>
                                                </div>
                                                <span className="font-bold text-slate-700 tabular-nums">
                                                    {punto.total_visitas.toLocaleString()} ({punto.porcentaje}%)
                                                </span>
                                            </div>
                                            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                                                    style={{ width: `${Math.max(4, punto.porcentaje)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 mt-4 text-xs text-slate-500 flex items-center justify-between">
                                <span>PVD Urbanos y Aulas Digitales</span>
                                <Link href={route('configuracion.index')} className="font-bold text-emerald-700 hover:underline">
                                    Configurar
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Tabla de Comparativa Multidimensional de Sedes */}
                    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
                        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">
                                    Balance Operativo por Punto Digital y Aula Rural
                                </h2>
                                <p className="text-xs text-slate-500 font-medium">
                                    Desglose de atenciones, impresiones y salas congregadas por punto
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4">Sede / Aula Digital</th>
                                        <th className="px-4 py-4">Zona</th>
                                        <th className="px-4 py-4 text-center">Atenciones</th>
                                        <th className="px-4 py-4 text-center">% Cobertura</th>
                                        <th className="px-4 py-4 text-center">Hojas Impresas</th>
                                        <th className="px-4 py-4 text-center">Préstamos Sala</th>
                                        <th className="px-6 py-4 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {comparativa_sedes.map((p) => (
                                        <tr key={p.id_punto} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-900 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${p.zona === 'Rural' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                                                    <span>{p.nombre_punto}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.codigo}</div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span
                                                    className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                                        p.zona === 'Rural'
                                                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                    }`}
                                                >
                                                    {p.zona}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center font-bold text-slate-800 text-xs tabular-nums">
                                                {p.total_visitas.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-4 text-center text-xs">
                                                <span className="font-semibold text-slate-600">{p.porcentaje}%</span>
                                            </td>
                                            <td className="px-4 py-4 text-center text-xs text-amber-700 font-bold tabular-nums">
                                                {p.total_hojas.toLocaleString()} págs
                                            </td>
                                            <td className="px-4 py-4 text-center text-xs text-slate-700 font-medium tabular-nums">
                                                {p.total_prestamos} ({p.total_asistentes} pers.)
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => {
                                                        router.get(route('dashboard'), { ...filters, id_punto: p.id_punto }, { preserveState: true });
                                                    }}
                                                    className="btn-tactile text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors"
                                                >
                                                    Filtrar esta sede
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Flujo de Atenciones Recientes */}
                    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
                        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">
                                    Flujo de Atenciones Ciudadanas Recientes
                                </h2>
                                <p className="text-xs text-slate-500 font-medium">
                                    Últimos registros procesados en la red
                                </p>
                            </div>
                            <Link
                                href={route('visitas.index')}
                                className="btn-tactile text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/70 px-3.5 py-1.5 rounded-xl border border-emerald-200 transition-colors flex items-center gap-1"
                            >
                                <span>Ver Historial</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {recentVisits.map((v) => (
                                <div
                                    key={v.id_visita}
                                    className="p-4 sm:px-6 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 font-black text-xs flex items-center justify-center shrink-0">
                                            {v.ciudadano?.nombres ? v.ciudadano.nombres.charAt(0) : 'C'}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={route('ciudadanos.show', v.ciudadano?.id_form_pvd || 1)}
                                                    className="font-bold text-slate-900 text-xs hover:text-emerald-700 truncate"
                                                >
                                                    {v.ciudadano?.nombre_completo || 'Ciudadano'}
                                                </Link>
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                    CC {v.ciudadano?.documento}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                                                <span className="font-semibold text-slate-700">
                                                    {v.subcategoria?.nombre || v.categoria?.nombre || v.servicio_texto || 'Servicio General'}
                                                </span>
                                                <span>•</span>
                                                <span className="text-slate-400">{v.punto?.nombre_punto}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                        <div className="text-right">
                                            <div className="text-xs font-semibold text-slate-700">
                                                {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                                Gestor: {v.gestor?.name || 'Ventanilla'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {recentVisits.length === 0 && (
                                <div className="p-8 text-center text-xs text-slate-400">
                                    No hay registros recientes para este filtro.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* PESTAÑA 2: TRÁMITES EN LÍNEA & GOBIERNO DIGITAL */}
            {activeTab === 'tramites' && (
                <div className="space-y-6">
                    {/* Tarjetas Informativas de Trámites */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Atenciones Trámites</div>
                            <div className="text-3xl font-black text-slate-900">{stats.dependencia_tramites.total_atenciones.toLocaleString()}</div>
                            <div className="text-[11px] text-slate-400">solicitudes institucionales gestionadas</div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Trámite con Mayor Demanda</div>
                            <div className="text-xl font-black text-emerald-700 truncate">
                                {stats.dependencia_tramites.top_tramites[0]?.nombre || 'Sin datos'}
                            </div>
                            <div className="text-[11px] text-slate-400">
                                {stats.dependencia_tramites.top_tramites[0]?.total || 0} ciudadanos atendidos
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Dependencias de la Alcaldía</div>
                            <div className="text-3xl font-black text-slate-900">Gobierno Digital</div>
                            <div className="text-[11px] text-slate-400">SISBEN, Hacienda, Salud, Tránsito</div>
                        </div>
                    </div>

                    {/* Top Trámites Solicitados */}
                    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">
                                    Ranking de Trámites y Servicios más Demandados
                                </h2>
                                <p className="text-xs text-slate-500 font-medium">
                                    Frecuencia y volumen de trámites realizados en {periodo.label} ({scope.nombre})
                                </p>
                            </div>
                            <span className="text-xs font-bold px-3 py-1 rounded-xl bg-slate-100 text-slate-700">
                                Top {stats.dependencia_tramites.top_tramites.length}
                            </span>
                        </div>

                        <div className="space-y-4 pt-2">
                            {stats.dependencia_tramites.top_tramites.map((t, idx) => (
                                <div key={t.id_subcategoria} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black flex items-center justify-center">
                                                {idx + 1}
                                            </span>
                                            <span className="text-slate-800">{t.nombre}</span>
                                        </div>
                                        <div className="text-slate-700 tabular-nums">
                                            <span>{t.total.toLocaleString()} trámites</span>
                                            <span className="text-slate-400 font-normal ml-1">({t.porcentaje}%)</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 transition-all duration-500"
                                            style={{ width: `${Math.max(5, t.porcentaje)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}

                            {stats.dependencia_tramites.top_tramites.length === 0 && (
                                <div className="py-8 text-center text-xs text-slate-400">
                                    No hay registros de trámites en el período seleccionado.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* PESTAÑA 3: FORMACIÓN DIGITAL & DEMOGRAFÍA */}
            {activeTab === 'formacion' && (
                <div className="space-y-6">
                    {/* Tarjetas KPI de Formación */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Asistencias a Formación</div>
                            <div className="text-3xl font-black text-purple-700">{stats.dependencia_formacion.total_formacion_visitas}</div>
                            <div className="text-[11px] text-slate-400">talleres y capacitaciones en {periodo.label}</div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Muestra Demográfica</div>
                            <div className="text-3xl font-black text-slate-900">{stats.dependencia_formacion.total_ciudadanos_analizados.toLocaleString()}</div>
                            <div className="text-[11px] text-slate-400">ciudadanos con perfil sociodemográfico</div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Equidad Territorial</div>
                            <div className="text-xl font-black text-slate-800">
                                {stats.dependencia_formacion.zona_residencia.rural} Rurales · {stats.dependencia_formacion.zona_residencia.urbana} Urbanos
                            </div>
                            <div className="text-[11px] text-slate-400">inclusión digital veredal y municipal</div>
                        </div>
                    </div>

                    {/* Gráficos Demográficos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Género */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
                            <h3 className="text-sm font-bold text-slate-900 mb-1">Distribución por Género</h3>
                            <p className="text-xs text-slate-500 font-medium mb-4">Participación ciudadana en la oferta TIC</p>
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="p-4 rounded-2xl bg-pink-50 border border-pink-200/60">
                                    <div className="text-2xl font-black text-pink-700">{stats.dependencia_formacion.genero.femenino}</div>
                                    <div className="text-xs font-bold text-pink-800 mt-1">Mujeres</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200/60">
                                    <div className="text-2xl font-black text-blue-700">{stats.dependencia_formacion.genero.masculino}</div>
                                    <div className="text-xs font-bold text-blue-800 mt-1">Hombres</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
                                    <div className="text-2xl font-black text-slate-700">{stats.dependencia_formacion.genero.otro}</div>
                                    <div className="text-xs font-bold text-slate-800 mt-1">Otro / No esp.</div>
                                </div>
                            </div>
                        </div>

                        {/* Grupos de Edad */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
                            <h3 className="text-sm font-bold text-slate-900 mb-1">Grupos Etarios</h3>
                            <p className="text-xs text-slate-500 font-medium mb-4">Distribución de edades de los beneficiarios</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="text-xl font-black text-slate-900">{stats.dependencia_formacion.grupos_edad.ninos}</div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Niños (0-13)</div>
                                </div>
                                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                                    <div className="text-xl font-black text-emerald-700">{stats.dependencia_formacion.grupos_edad.jovenes}</div>
                                    <div className="text-[10px] font-bold text-emerald-800 uppercase mt-0.5">Jóvenes (14-28)</div>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="text-xl font-black text-slate-900">{stats.dependencia_formacion.grupos_edad.adultos}</div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Adultos (29-59)</div>
                                </div>
                                <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                                    <div className="text-xl font-black text-amber-700">{stats.dependencia_formacion.grupos_edad.adulto_mayor}</div>
                                    <div className="text-[10px] font-bold text-amber-800 uppercase mt-0.5">Mayores (60+)</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PESTAÑA 4: SALAS & INFRAESTRUCTURA */}
            {activeTab === 'salas' && (
                <div className="space-y-6">
                    {/* Tarjetas KPI de Salas */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Préstamos Realizados</div>
                            <div className="text-3xl font-black text-slate-900">{stats.dependencia_salas.total_eventos}</div>
                            <div className="text-[11px] text-slate-400">eventos en salas y auditorios</div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Asistentes Congregados</div>
                            <div className="text-3xl font-black text-emerald-700">{stats.dependencia_salas.total_asistentes.toLocaleString()}</div>
                            <div className="text-[11px] text-slate-400">personas que usaron la infraestructura</div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Aforo Promedio</div>
                            <div className="text-3xl font-black text-slate-900">{stats.dependencia_salas.promedio_asistentes} pers.</div>
                            <div className="text-[11px] text-slate-400">asistentes promedio por evento</div>
                        </div>
                    </div>

                    {/* Desglose por Tipo de Actividad */}
                    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">
                                    Motivos de Préstamo de Infraestructura
                                </h2>
                                <p className="text-xs text-slate-500 font-medium">
                                    Reuniones comunitarias, institucionales y eventos JAC
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {stats.dependencia_salas.actividades.map((act) => (
                                <div key={act.tipo} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <span className="text-slate-800">{act.tipo}</span>
                                        <div className="text-slate-700">
                                            <span>{act.eventos} eventos</span> · <strong className="text-emerald-700">{act.asistentes} asistentes</strong> ({act.porcentaje}%)
                                        </div>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                                            style={{ width: `${Math.max(4, act.porcentaje)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}

                            {stats.dependencia_salas.actividades.length === 0 && (
                                <div className="py-8 text-center text-xs text-slate-400">
                                    No hay préstamos registrados en el período seleccionado.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* PESTAÑA 5: IMPRESIONES & RECURSOS */}
            {activeTab === 'impresiones' && (
                <div className="space-y-6">
                    {/* Tarjetas KPI de Impresiones */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Hojas Totales</div>
                            <div className="text-3xl font-black text-amber-600">{stats.dependencia_impresiones.total_hojas.toLocaleString()}</div>
                            <div className="text-[11px] text-slate-400">impresas en {periodo.label}</div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ciudadanos Atendidos</div>
                            <div className="text-3xl font-black text-slate-900">{stats.dependencia_impresiones.ciudadanos_atendidos.toLocaleString()}</div>
                            <div className="text-[11px] text-slate-400">usuarios con servicio de impresión</div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Promedio de Hojas</div>
                            <div className="text-3xl font-black text-slate-900">{stats.dependencia_impresiones.promedio_hojas} págs</div>
                            <div className="text-[11px] text-slate-400">consumo promedio por ciudadano</div>
                        </div>
                    </div>

                    {/* Desglose por Tipo de Impresión */}
                    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6">
                        <h2 className="text-base font-bold text-slate-900 mb-1">
                            Distribución de Consumibles por Tipo de Documento
                        </h2>
                        <p className="text-xs text-slate-500 font-medium mb-4">
                            Control y auditoría de uso de papel y digitalización
                        </p>

                        <div className="space-y-4">
                            {stats.dependencia_impresiones.tipos.map((t) => (
                                <div key={t.tipo} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <span className="text-slate-800">{t.tipo}</span>
                                        <div className="text-slate-700">
                                            <strong className="text-amber-700">{t.hojas.toLocaleString()} hojas</strong> ({t.solicitudes} trámites) · {t.porcentaje}%
                                        </div>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-amber-500 transition-all duration-500"
                                            style={{ width: `${Math.max(4, t.porcentaje)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}

                            {stats.dependencia_impresiones.tipos.length === 0 && (
                                <div className="py-8 text-center text-xs text-slate-400">
                                    No hay registros de impresiones en el período seleccionado.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
