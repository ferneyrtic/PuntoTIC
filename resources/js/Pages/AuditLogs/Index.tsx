import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    History,
    CheckCircle2,
    Search,
    Filter,
    Calendar,
    Code2,
    X,
    Copy,
    Check,
    User,
    Shield,
    Activity,
    Layers,
    Clock,
    FileText,
    Settings,
    DoorOpen,
    Printer,
    UserCheck,
    RefreshCw,
    BarChart3,
    TrendingUp,
    Download,
    Building2,
    MapPin,
    Award,
    Sparkles,
    ChevronRight,
    Sun,
    Sunset,
    Moon,
} from 'lucide-react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';
import InformeGestionModal from '@/Components/Audit/InformeGestionModal';

interface AuditLogItem {
    id_log: number;
    user_id: number | null;
    accion: string;
    modulo: string;
    registro_id: string | null;
    datos_anteriores: any;
    datos_nuevos: any;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    usuario?: {
        id: number;
        name: string;
        email: string;
        rol_principal?: string;
        roles?: Array<{ name: string }>;
        punto?: {
            nombre_punto: string;
        };
    };
}

interface Props {
    activeTab?: string;
    rendicion: {
        periodo: {
            key: string;
            label: string;
            desde: string;
            hasta: string;
            desde_humana: string;
            hasta_humana: string;
        };
        filtros: {
            gestor_id: number | null;
            id_punto: number | null;
            zona: string | null;
        };
        gestor_seleccionado: {
            id: number;
            name: string;
            documento: string;
            cargo: string;
            nombre_punto: string;
            zona: string;
        } | null;
        kpis: {
            total_visitas: number;
            total_nuevos_ciudadanos: number;
            total_prestamos: number;
            total_aforo_prestamos: number;
            total_impresiones: number;
            total_hojas_impresas: number;
            dias_activos: number;
            promedio_diario: number;
        };
        desglose_servicios: Array<{
            nombre: string;
            total: number;
            porcentaje: number;
            color: string;
        }>;
        serie_diaria: Array<{
            fecha: string;
            fecha_completa: string;
            atenciones: number;
        }>;
        franjas_horarias: {
            manana: number;
            tarde: number;
            noche: number;
        };
        acciones_recientes: Array<{
            tipo: string;
            titulo: string;
            descripcion: string;
            fecha: string;
            fecha_humana: string;
            gestor_nombre: string;
            gestor_cargo: string;
            punto_nombre: string;
            badge_color: string;
        }>;
        catalogo_gestores: Array<{
            id: number;
            name: string;
            documento: string;
            cargo: string;
            sede: string;
            zona: string;
        }>;
        catalogo_puntos: Array<{
            id_punto: number;
            nombre_punto: string;
            zona: string;
        }>;
    };
    logs: {
        data: AuditLogItem[];
        current_page: number;
        last_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: {
        tab?: string;
        periodo?: string;
        gestor_id?: string;
        id_punto?: string;
        zona?: string;
        modulo?: string;
        accion?: string;
        user_id?: string;
        fecha_desde?: string;
        fecha_hasta?: string;
        search?: string;
    };
    stats: {
        total_eventos: number;
        eventos_hoy: number;
        usuarios_activos: number;
    };
    modulos: string[];
    acciones: string[];
    usuarios: Array<{ id: number; name: string; email: string }>;
    points: Array<{ id_punto: number; nombre_punto: string }>;
}

export default function AuditLogsIndex({
    activeTab: initialTab = 'rendicion',
    rendicion,
    logs,
    filters,
    stats,
    modulos,
    acciones,
    usuarios,
    points,
}: Props) {
    const { auth } = usePage<any>().props;
    const [currentTab, setCurrentTab] = useState<string>(filters.tab || initialTab);
    const [isInformeModalOpen, setIsInformeModalOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
    const [copied, setCopied] = useState(false);

    // Filter states for technical log tab
    const [modulo, setModulo] = useState(filters.modulo || '');
    const [accion, setAccion] = useState(filters.accion || '');
    const [userId, setUserId] = useState(filters.user_id || '');
    const [fechaDesde, setFechaDesde] = useState(filters.fecha_desde || '');
    const [fechaHasta, setFechaHasta] = useState(filters.fecha_hasta || '');
    const [search, setSearch] = useState(filters.search || '');

    // Filter states for Rendición de Cuentas tab
    const [selectedPeriodo, setSelectedPeriodo] = useState(filters.periodo || rendicion?.periodo?.key || 'mes_actual');
    const [selectedGestor, setSelectedGestor] = useState(filters.gestor_id || '');
    const [selectedPunto, setSelectedPunto] = useState(filters.id_punto || '');
    const [selectedZona, setSelectedZona] = useState(filters.zona || '');

    const handleTabChange = (newTab: string) => {
        setCurrentTab(newTab);
        router.get(
            route('auditoria.index'),
            {
                tab: newTab,
                periodo: selectedPeriodo,
                gestor_id: selectedGestor || undefined,
                id_punto: selectedPunto || undefined,
                zona: selectedZona || undefined,
                modulo: modulo || undefined,
                accion: accion || undefined,
                user_id: userId || undefined,
                fecha_desde: fechaDesde || undefined,
                fecha_hasta: fechaHasta || undefined,
                search: search || undefined,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleApplyRendicionFilter = (overrides: {
        periodo?: string;
        gestor_id?: string;
        id_punto?: string;
        zona?: string;
    }) => {
        const nextPeriodo = overrides.periodo !== undefined ? overrides.periodo : selectedPeriodo;
        const nextGestor = overrides.gestor_id !== undefined ? overrides.gestor_id : selectedGestor;
        const nextPunto = overrides.id_punto !== undefined ? overrides.id_punto : selectedPunto;
        const nextZona = overrides.zona !== undefined ? overrides.zona : selectedZona;

        if (overrides.periodo !== undefined) setSelectedPeriodo(overrides.periodo);
        if (overrides.gestor_id !== undefined) setSelectedGestor(overrides.gestor_id);
        if (overrides.id_punto !== undefined) setSelectedPunto(overrides.id_punto);
        if (overrides.zona !== undefined) setSelectedZona(overrides.zona);

        router.get(
            route('auditoria.index'),
            {
                tab: 'rendicion',
                periodo: nextPeriodo,
                gestor_id: nextGestor || undefined,
                id_punto: nextPunto || undefined,
                zona: nextZona || undefined,
            },
            { preserveState: true }
        );
    };

    const handleApplyFilters = () => {
        router.get(
            route('auditoria.index'),
            {
                tab: 'sistema',
                modulo: modulo || undefined,
                accion: accion || undefined,
                user_id: userId || undefined,
                fecha_desde: fechaDesde || undefined,
                fecha_hasta: fechaHasta || undefined,
                search: search || undefined,
            },
            { preserveState: true }
        );
    };

    const handleResetFilters = () => {
        setModulo('');
        setAccion('');
        setUserId('');
        setFechaDesde('');
        setFechaHasta('');
        setSearch('');
        router.get(route('auditoria.index'), { tab: 'sistema' }, { preserveState: true });
    };

    const handleCopyPayload = (data: any) => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatActionTitle = (action: string, log: AuditLogItem) => {
        switch (action) {
            case 'REGISTRAR_VISITA':
                return {
                    title: `Visita de atención registrada ${log.registro_id ? `#${log.registro_id}` : ''}`,
                    desc: log.datos_nuevos?.servicio_texto || log.datos_nuevos?.descripcion || 'Atención en sala',
                    typeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    icon: CheckCircle2,
                    iconColor: 'text-emerald-400',
                };
            case 'CREAR_CIUDADANO':
                return {
                    title: `Nuevo ciudadano registrado en el padrón`,
                    desc: log.datos_nuevos?.nombre_completo || log.datos_nuevos?.documento || 'Ficha ciudadana creada',
                    typeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                    icon: UserCheck,
                    iconColor: 'text-blue-400',
                };
            case 'ACTUALIZAR_CIUDADANO':
                return {
                    title: `Ficha de ciudadano actualizada`,
                    desc: `Cédula: ${log.datos_nuevos?.documento || log.registro_id || 'Actualización'}`,
                    typeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    icon: RefreshCw,
                    iconColor: 'text-amber-400',
                };
            case 'PRESTAMO_SALA':
                return {
                    title: `Préstamo de sala reservado #${log.registro_id || ''}`,
                    desc: log.datos_nuevos?.tipo_actividad || 'Uso institucional de sala',
                    typeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                    icon: DoorOpen,
                    iconColor: 'text-indigo-400',
                };
            case 'ACTUALIZAR_PRESTAMO':
                return {
                    title: `Préstamo de sala actualizado #${log.registro_id || ''}`,
                    desc: `Nuevo estado: ${log.datos_nuevos?.estado || 'Actualizado'}`,
                    typeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                    icon: DoorOpen,
                    iconColor: 'text-indigo-400',
                };
            case 'REGISTRO_IMPRESION':
                return {
                    title: `Impresión o fotocopia registrada #${log.registro_id || ''}`,
                    desc: `${log.datos_nuevos?.numero_hojas || 1} hojas (${log.datos_nuevos?.tipo_impresion || 'Blanco y Negro'})`,
                    typeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                    icon: Printer,
                    iconColor: 'text-purple-400',
                };
            case 'ACTUALIZAR_METAS':
                return {
                    title: `Metas operativas mensuales reconfiguradas`,
                    desc: 'Ajuste de objetivos por sede por el Super Administrador',
                    typeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                    icon: Settings,
                    iconColor: 'text-rose-400',
                };
            case 'ACTUALIZAR_CONFIGURACION':
                return {
                    title: `Parámetros institucionales actualizados`,
                    desc: 'Modificación de parámetros globales del sistema',
                    typeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
                    icon: Settings,
                    iconColor: 'text-cyan-400',
                };
            default:
                return {
                    title: action.replace(/_/g, ' '),
                    desc: log.modulo,
                    typeColor: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
                    icon: Activity,
                    iconColor: 'text-slate-400',
                };
        }
    };

    const periodosRapidos = [
        { key: 'hoy', label: 'Hoy' },
        { key: '7_dias', label: 'Últimos 7 días' },
        { key: 'mes_actual', label: 'Mes Actual' },
        { key: 'mes_anterior', label: 'Mes Anterior' },
        { key: 'trimestre', label: 'Trimestre' },
        { key: 'anio', label: 'Año 2026' },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                                <Shield className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                                    Auditoría & Supervisión Operativa
                                </h1>
                                <p className="text-xs text-slate-500 font-medium">
                                    Control de gestión de gestores PVD, rendición de cuentas institucional y bitácora técnica
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Selector de Pestañas (Tabs Switcher) */}
                    <div className="inline-flex p-1 bg-slate-200/80 rounded-2xl border border-slate-300/80 shadow-xs">
                        <button
                            type="button"
                            onClick={() => handleTabChange('rendicion')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                currentTab === 'rendicion'
                                    ? 'bg-white text-emerald-700 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                            }`}
                        >
                            <BarChart3 className="w-4 h-4 text-emerald-600" />
                            <span>Rendición de Cuentas PVD</span>
                            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                                Oficial
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTabChange('sistema')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                currentTab === 'sistema'
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                            }`}
                        >
                            <History className="w-4 h-4 text-cyan-400" />
                            <span>Bitácora Técnica</span>
                            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-bold">
                                {stats.total_eventos.toLocaleString()}
                            </span>
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Auditoría & Rendición de Cuentas · PuntoTIC" />

            {/* TAB 1: RENDICIÓN DE CUENTAS PVD */}
            {currentTab === 'rendicion' && (
                <div className="space-y-6">
                    {/* Barra Superior de Filtros y Acción de Descarga */}
                    <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/80 space-y-4">
                        {/* Fila 1: Períodos Rápidos y Botón de Informe */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-wider mr-2 flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                    Período:
                                </span>
                                {periodosRapidos.map((p) => {
                                    const active = (selectedPeriodo || rendicion?.periodo?.key) === p.key;
                                    return (
                                        <button
                                            key={p.key}
                                            type="button"
                                            onClick={() => handleApplyRendicionFilter({ periodo: p.key })}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                                active
                                                    ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/25 ring-2 ring-emerald-600/20'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                                            }`}
                                        >
                                            {p.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsInformeModalOpen(true)}
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md shadow-emerald-600/25 hover:shadow-lg transition-all active:scale-[0.98]"
                            >
                                <FileText className="w-4 h-4" />
                                <span>Generar Informe Oficial (PDF / Imprimir)</span>
                            </button>
                        </div>

                        {/* Fila 2: Selectores de Gestor, Sede y Zona */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {/* Gestor */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                    Supervisar Gestor Específico:
                                </label>
                                <select
                                    value={selectedGestor}
                                    onChange={(e) => handleApplyRendicionFilter({ gestor_id: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                                >
                                    <option value="">👤 Todos los Gestores (Consolidado)</option>
                                    {rendicion?.catalogo_gestores?.map((g) => (
                                        <option key={g.id} value={g.id}>
                                            {g.name} — {g.cargo} ({g.sede})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Punto / Sede */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                    Filtrar por Sede / Punto:
                                </label>
                                <select
                                    value={selectedPunto}
                                    onChange={(e) => handleApplyRendicionFilter({ id_punto: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                                >
                                    <option value="">🏢 Todas las Sedes PVD & Aulas</option>
                                    {rendicion?.catalogo_puntos?.map((pt) => (
                                        <option key={pt.id_punto} value={pt.id_punto}>
                                            {pt.nombre_punto} ({pt.zona})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Zona */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                    Zona Geográfica:
                                </label>
                                <select
                                    value={selectedZona}
                                    onChange={(e) => handleApplyRendicionFilter({ zona: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                                >
                                    <option value="">🗺️ Ambas Zonas (Urbana & Rural)</option>
                                    <option value="URBANA">🏙️ Zona Urbana</option>
                                    <option value="RURAL">🌾 Zona Rural (Dinamarca, Chichimene)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Ficha Ejecutiva del Ámbito Supervisado */}
                    <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-5">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/20 shrink-0">
                                {rendicion?.gestor_seleccionado ? (
                                    rendicion.gestor_seleccionado.name.substring(0, 2).toUpperCase()
                                ) : (
                                    <Building2 className="w-7 h-7 text-slate-950" />
                                )}
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                        {rendicion?.gestor_seleccionado ? 'Gestor en Evaluación' : 'Supervisión de Red'}
                                    </span>
                                    <span className="text-[11px] font-bold text-slate-400">
                                        Período: {rendicion?.periodo?.desde_humana} al {rendicion?.periodo?.hasta_humana}
                                    </span>
                                </div>
                                <h2 className="text-xl font-black text-white tracking-tight">
                                    {rendicion?.gestor_seleccionado
                                        ? rendicion.gestor_seleccionado.name
                                        : 'Consolidado General de Operatividad Municipal'}
                                </h2>
                                <p className="text-xs text-slate-300 mt-0.5 flex flex-wrap items-center gap-3">
                                    <span className="flex items-center gap-1">
                                        <Award className="w-3.5 h-3.5 text-emerald-400" />
                                        {rendicion?.gestor_seleccionado?.cargo || 'Equipo de Gestores y Coordinadores'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5 text-teal-400" />
                                        {rendicion?.gestor_seleccionado?.nombre_punto || 'Todas las sedes activas'}
                                    </span>
                                    {rendicion?.gestor_seleccionado?.documento && (
                                        <span className="font-mono text-slate-400">
                                            Doc: {rendicion.gestor_seleccionado.documento}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 shrink-0">
                            <div className="text-left md:text-right">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Intensidad Operativa
                                </span>
                                <div className="text-2xl font-black text-emerald-400">
                                    {rendicion?.kpis?.promedio_diario ?? 0}
                                    <span className="text-xs text-slate-400 font-normal ml-1">atenc./día</span>
                                </div>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                    Registrado en {rendicion?.kpis?.dias_activos ?? 0} días de labor
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Tarjetas de Indicadores Clave de Gestión (KPIs) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* 1. Atenciones en Ventanilla */}
                        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                                        Atenciones en Ventanilla
                                    </span>
                                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="text-3xl font-black text-slate-900 tracking-tight">
                                    {(rendicion?.kpis?.total_visitas ?? 0).toLocaleString()}
                                </div>
                                <p className="text-xs text-slate-500 mt-1 font-medium">
                                    Visitas presenciales y trámites brindados a ciudadanos
                                </p>
                            </div>
                        </div>

                        {/* 2. Nuevos Ciudadanos */}
                        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                                        Nuevos Ciudadanos
                                    </span>
                                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                                        <UserCheck className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="text-3xl font-black text-slate-900 tracking-tight">
                                    {(rendicion?.kpis?.total_nuevos_ciudadanos ?? 0).toLocaleString()}
                                </div>
                                <p className="text-xs text-slate-500 mt-1 font-medium">
                                    Enrolados formalmente en el padrón municipal
                                </p>
                            </div>
                        </div>

                        {/* 3. Préstamos de Sala */}
                        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                                        Préstamos de Sala
                                    </span>
                                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                                        <DoorOpen className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="text-3xl font-black text-slate-900 tracking-tight">
                                    {(rendicion?.kpis?.total_prestamos ?? 0).toLocaleString()}
                                </div>
                                <p className="text-xs text-slate-500 mt-1 font-medium">
                                    {(rendicion?.kpis?.total_aforo_prestamos ?? 0).toLocaleString()} asistentes congregados en actividades
                                </p>
                            </div>
                        </div>

                        {/* 4. Impresiones Laborales */}
                        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                                        Impresiones & Hojas
                                    </span>
                                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                                        <Printer className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="text-3xl font-black text-slate-900 tracking-tight">
                                    {(rendicion?.kpis?.total_impresiones ?? 0).toLocaleString()}
                                </div>
                                <p className="text-xs text-slate-500 mt-1 font-medium">
                                    {(rendicion?.kpis?.total_hojas_impresas ?? 0).toLocaleString()} hojas impresas para empleo y trámites
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Gráficas y Distribución Analítica */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Curva de Rendimiento Diario (2 columnas en lg) */}
                        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                                        Curva de Actividad Temporal Diaria
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium">
                                        Volumen de atenciones registradas a lo largo del período seleccionado
                                    </p>
                                </div>
                                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                                    {rendicion?.periodo?.label}
                                </span>
                            </div>

                            <div className="h-64 w-full">
                                {rendicion?.serie_diaria && rendicion.serie_diaria.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={rendicion.serie_diaria}
                                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                        >
                                            <defs>
                                                <linearGradient id="colorAtenciones" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                            <XAxis
                                                dataKey="fecha"
                                                tick={{ fill: '#64748b', fontSize: 11 }}
                                                axisLine={{ stroke: '#e2e8f0' }}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                tick={{ fill: '#64748b', fontSize: 11 }}
                                                axisLine={false}
                                                tickLine={false}
                                                allowDecimals={false}
                                            />
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const d = payload[0].payload;
                                                        return (
                                                            <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-xl border border-slate-700">
                                                                <span className="font-bold text-slate-300 block">
                                                                    {d.fecha_completa || d.fecha}
                                                                </span>
                                                                <span className="text-sm font-black text-emerald-400">
                                                                    {d.atenciones} atenciones
                                                                </span>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="atenciones"
                                                stroke="#059669"
                                                strokeWidth={2.5}
                                                fillOpacity={1}
                                                fill="url(#colorAtenciones)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                                        <Activity className="w-8 h-8 mb-2 stroke-1 text-slate-300" />
                                        <span>No se registraron atenciones en las fechas seleccionadas</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Desglose de Líneas de Servicio (1 columna en lg) */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-emerald-600" />
                                    Líneas de Atención
                                </h3>
                                <p className="text-xs text-slate-500 font-medium">
                                    Distribución de trámites y solicitudes recibidas
                                </p>
                            </div>

                            <div className="space-y-3">
                                {rendicion?.desglose_servicios && rendicion.desglose_servicios.length > 0 ? (
                                    rendicion.desglose_servicios.map((s, idx) => (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-slate-700 truncate max-w-[180px]" title={s.nombre}>
                                                    {s.nombre}
                                                </span>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <span className="font-black text-slate-900">{s.total}</span>
                                                    <span className="text-[10px] font-bold text-slate-400">
                                                        ({s.porcentaje}%)
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${Math.min(100, Math.max(5, s.porcentaje))}%`,
                                                        backgroundColor: s.color || '#059669',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-slate-400 text-center py-8">
                                        Sin servicios registrados en el rango
                                    </p>
                                )}
                            </div>

                            {/* Franjas Horarias */}
                            <div className="pt-4 border-t border-slate-100 space-y-2">
                                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                                    Franjas de Mayor Actividad
                                </span>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                                        <Sun className="w-3.5 h-3.5 text-amber-500 mx-auto mb-1" />
                                        <span className="text-[10px] font-bold text-slate-500 block">Mañana</span>
                                        <span className="text-xs font-black text-slate-900">
                                            {rendicion?.franjas_horarias?.manana ?? 0}
                                        </span>
                                    </div>
                                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                                        <Sunset className="w-3.5 h-3.5 text-orange-500 mx-auto mb-1" />
                                        <span className="text-[10px] font-bold text-slate-500 block">Tarde</span>
                                        <span className="text-xs font-black text-slate-900">
                                            {rendicion?.franjas_horarias?.tarde ?? 0}
                                        </span>
                                    </div>
                                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                                        <Moon className="w-3.5 h-3.5 text-indigo-500 mx-auto mb-1" />
                                        <span className="text-[10px] font-bold text-slate-500 block">Noche</span>
                                        <span className="text-xs font-black text-slate-900">
                                            {rendicion?.franjas_horarias?.noche ?? 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feed de Acciones Operativas Significativas */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-emerald-600" />
                                    Evidencia Cronológica de Actividad Operativa
                                </h3>
                                <p className="text-xs text-slate-500 font-medium">
                                    Muestreo de las acciones clave ejecutadas por el personal en las salas del municipio
                                </p>
                            </div>
                            <span className="text-xs font-bold text-slate-400">
                                Mostrando las últimas {rendicion?.acciones_recientes?.length ?? 0} intervenciones
                            </span>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {rendicion?.acciones_recientes && rendicion.acciones_recientes.length > 0 ? (
                                rendicion.acciones_recientes.map((act, idx) => (
                                    <div key={idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 px-2 rounded-xl transition-colors">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5">
                                                <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${act.badge_color || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                                    {act.tipo.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-900">{act.titulo}</h4>
                                                <p className="text-xs text-slate-600 mt-0.5">{act.descripcion}</p>
                                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1">
                                                    <span className="font-semibold text-slate-700">
                                                        👤 {act.gestor_nombre}
                                                    </span>
                                                    <span>•</span>
                                                    <span>🏢 {act.punto_nombre}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-left sm:text-right shrink-0">
                                            <span className="text-xs font-mono font-bold text-slate-700 block">
                                                {act.fecha}
                                            </span>
                                            <span className="text-[10px] text-slate-400 block">
                                                {act.fecha_humana}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-slate-400 text-xs">
                                    No se encontraron acciones registradas para los filtros aplicados.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: BITÁCORA TÉCNICA DE SEGURIDAD (TABLA EXISTENTE MEJORADA) */}
            {currentTab === 'sistema' && (
                <div className="space-y-5">
                    {/* Panel de Filtros Superior */}
                    <div className="bg-[#0f172a] text-slate-200 p-5 rounded-2xl shadow-xl border border-slate-800 space-y-4">
                        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <History className="w-5 h-5 text-emerald-400" />
                                <span className="text-sm font-black text-white tracking-wide uppercase">
                                    Filtros de Registro de Actividad
                                </span>
                            </div>

                            {/* Search Input */}
                            <div className="relative flex-1 max-w-md">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                                    placeholder="Buscar por cédula, ID registro, IP, usuario..."
                                    className="w-full bg-[#1e293b] border-slate-700 text-xs rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20"
                                />
                            </div>
                        </div>

                        {/* Dropdowns Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-800/80">
                            {/* Módulo */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    Módulo
                                </label>
                                <select
                                    value={modulo}
                                    onChange={(e) => setModulo(e.target.value)}
                                    className="w-full bg-[#1e293b] border-slate-700 text-xs rounded-xl py-1.5 text-white focus:border-emerald-500 focus:ring-emerald-500/20"
                                >
                                    <option value="">Todos los módulos</option>
                                    {modulos.map((m) => (
                                        <option key={m} value={m}>
                                            {m}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Acción */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    Acción
                                </label>
                                <select
                                    value={accion}
                                    onChange={(e) => setAccion(e.target.value)}
                                    className="w-full bg-[#1e293b] border-slate-700 text-xs rounded-xl py-1.5 text-white focus:border-emerald-500 focus:ring-emerald-500/20"
                                >
                                    <option value="">Todas las acciones</option>
                                    {acciones.map((a) => (
                                        <option key={a} value={a}>
                                            {a.replace(/_/g, ' ')}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Usuario */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    Usuario Responsable
                                </label>
                                <select
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                    className="w-full bg-[#1e293b] border-slate-700 text-xs rounded-xl py-1.5 text-white focus:border-emerald-500 focus:ring-emerald-500/20"
                                >
                                    <option value="">Todos los usuarios</option>
                                    {usuarios.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Fecha Desde */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    Desde
                                </label>
                                <input
                                    type="date"
                                    value={fechaDesde}
                                    onChange={(e) => setFechaDesde(e.target.value)}
                                    className="w-full bg-[#1e293b] border-slate-700 text-xs rounded-xl py-1.5 text-white focus:border-emerald-500 focus:ring-emerald-500/20"
                                />
                            </div>

                            {/* Fecha Hasta */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    Hasta
                                </label>
                                <input
                                    type="date"
                                    value={fechaHasta}
                                    onChange={(e) => setFechaHasta(e.target.value)}
                                    className="w-full bg-[#1e293b] border-slate-700 text-xs rounded-xl py-1.5 text-white focus:border-emerald-500 focus:ring-emerald-500/20"
                                />
                            </div>
                        </div>

                        {/* Filter Actions */}
                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                                Limpiar Filtros
                            </button>
                            <button
                                type="button"
                                onClick={handleApplyFilters}
                                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30 transition-all flex items-center gap-1.5"
                            >
                                <Filter className="w-3.5 h-3.5" />
                                <span>Aplicar Filtros</span>
                            </button>
                        </div>
                    </div>

                    {/* Tabla de Eventos */}
                    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                                        <th className="py-3.5 px-4">Momento</th>
                                        <th className="py-3.5 px-4">Responsable / Sede</th>
                                        <th className="py-3.5 px-4">Módulo & Acción</th>
                                        <th className="py-3.5 px-4">Detalle Operativo</th>
                                        <th className="py-3.5 px-4 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                                    {logs.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-slate-400">
                                                <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                                <p className="font-bold">No se encontraron registros de auditoría</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                    Prueba ajustando los filtros de búsqueda o fechas.
                                                </p>
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.data.map((log) => {
                                            const actionInfo = formatActionTitle(log.accion, log);
                                            const ActionIcon = actionInfo.icon;
                                            return (
                                                <tr key={log.id_log} className="hover:bg-slate-50/70 transition-colors">
                                                    {/* Momento */}
                                                    <td className="py-3 px-4 whitespace-nowrap">
                                                        <div className="font-mono text-[11px] text-slate-900 font-bold">
                                                            {new Date(log.created_at).toLocaleDateString('es-CO', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric',
                                                            })}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                                            <Clock className="w-3 h-3 text-slate-400" />
                                                            {new Date(log.created_at).toLocaleTimeString('es-CO', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                second: '2-digit',
                                                            })}
                                                        </div>
                                                    </td>

                                                    {/* Responsable / Sede */}
                                                    <td className="py-3 px-4">
                                                        {log.usuario ? (
                                                            <div>
                                                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                                                    <span>{log.usuario.name}</span>
                                                                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 font-semibold">
                                                                        {log.usuario.rol_principal || log.usuario.roles?.[0]?.name || 'Gestor'}
                                                                    </span>
                                                                </div>
                                                                <div className="text-[11px] text-slate-500 font-medium">
                                                                    {log.usuario.punto?.nombre_punto || 'Sede sin asignar'}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 italic">Sistema / Automático</span>
                                                        )}
                                                    </td>

                                                    {/* Módulo & Acción */}
                                                    <td className="py-3 px-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                                                {log.modulo}
                                                            </span>
                                                        </div>
                                                        <span
                                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${actionInfo.typeColor}`}
                                                        >
                                                            <ActionIcon className={`w-3 h-3 ${actionInfo.iconColor}`} />
                                                            {log.accion.replace(/_/g, ' ')}
                                                        </span>
                                                    </td>

                                                    {/* Detalle Operativo */}
                                                    <td className="py-3 px-4 max-w-xs md:max-w-md">
                                                        <div className="font-bold text-slate-900 truncate">
                                                            {actionInfo.title}
                                                        </div>
                                                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                                            {actionInfo.desc}
                                                        </div>
                                                        {log.ip_address && (
                                                            <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                                                                IP: {log.ip_address}
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Botón Ver JSON / Payload */}
                                                    <td className="py-3 px-4 text-center whitespace-nowrap">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedLog(log)}
                                                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition-colors inline-flex items-center gap-1 text-[11px] font-bold"
                                                            title="Inspeccionar datos técnicos"
                                                        >
                                                            <Code2 className="w-3.5 h-3.5" />
                                                            <span>Datos</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación */}
                        {logs.links && logs.links.length > 3 && (
                            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
                                <div>
                                    Página <span className="font-bold text-slate-900">{logs.current_page}</span> de{' '}
                                    <span className="font-bold text-slate-900">{logs.last_page}</span> (
                                    {logs.total.toLocaleString()} registros)
                                </div>
                                <div className="flex gap-1">
                                    {logs.links.map((link, idx) => (
                                        <button
                                            key={idx}
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                                                link.active
                                                    ? 'bg-slate-900 text-white shadow-xs'
                                                    : link.url
                                                    ? 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                                                    : 'bg-transparent text-slate-300 cursor-not-allowed'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal de Inspección Técnica JSON */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
                    <div className="bg-[#0b1329] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                            <div className="flex items-center gap-2">
                                <Code2 className="w-4 h-4 text-emerald-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                                    Inspección de Registro #{selectedLog.id_log}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedLog(null)}
                                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-300">
                            {/* Metadatos */}
                            <div className="grid grid-cols-2 gap-2 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
                                <div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Módulo:</span>
                                    <span className="text-white font-bold">{selectedLog.modulo}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Acción:</span>
                                    <span className="text-emerald-400 font-bold">{selectedLog.accion}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Usuario:</span>
                                    <span className="text-white">
                                        {selectedLog.usuario?.name || 'Sistema'} (ID: {selectedLog.user_id || 'N/A'})
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Fecha y Hora:</span>
                                    <span className="text-white font-mono">{new Date(selectedLog.created_at).toLocaleString('es-CO')}</span>
                                </div>
                            </div>

                            {/* Datos Nuevos / Payload */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                                        Datos Nuevos (Payload):
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleCopyPayload(selectedLog.datos_nuevos)}
                                        className="text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                        <span>{copied ? 'Copiado' : 'Copiar JSON'}</span>
                                    </button>
                                </div>
                                <pre className="bg-[#050914] p-3.5 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-56">
                                    {JSON.stringify(selectedLog.datos_nuevos, null, 2) || '// Sin carga de datos'}
                                </pre>
                            </div>

                            {/* Datos Anteriores si existen */}
                            {selectedLog.datos_anteriores && (
                                <div>
                                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1.5">
                                        Datos Anteriores:
                                    </span>
                                    <pre className="bg-[#050914] p-3.5 rounded-xl border border-slate-800 text-[11px] font-mono text-amber-300/80 overflow-x-auto max-h-40">
                                        {JSON.stringify(selectedLog.datos_anteriores, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {/* User Agent */}
                            {selectedLog.user_agent && (
                                <div className="text-[10px] text-slate-500 font-mono truncate">
                                    Agente: {selectedLog.user_agent}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-800 bg-slate-950/80 rounded-b-2xl flex justify-end">
                            <button
                                type="button"
                                onClick={() => setSelectedLog(null)}
                                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Informe de Gestión Oficial A4 */}
            <InformeGestionModal
                isOpen={isInformeModalOpen}
                onClose={() => setIsInformeModalOpen(false)}
                rendicion={rendicion}
                currentUser={auth?.user}
            />
        </AuthenticatedLayout>
    );
}
