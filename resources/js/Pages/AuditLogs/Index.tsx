import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
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
    Laptop,
    FileText,
    Settings,
    DoorOpen,
    Printer,
    UserCheck,
    RefreshCw,
} from 'lucide-react';

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
    logs: {
        data: AuditLogItem[];
        current_page: number;
        last_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: {
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
    logs,
    filters,
    stats,
    modulos,
    acciones,
    usuarios,
}: Props) {
    const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
    const [copied, setCopied] = useState(false);

    // Filter states
    const [modulo, setModulo] = useState(filters.modulo || '');
    const [accion, setAccion] = useState(filters.accion || '');
    const [userId, setUserId] = useState(filters.user_id || '');
    const [fechaDesde, setFechaDesde] = useState(filters.fecha_desde || '');
    const [fechaHasta, setFechaHasta] = useState(filters.fecha_hasta || '');
    const [search, setSearch] = useState(filters.search || '');

    const handleApplyFilters = () => {
        router.get(
            route('auditoria.index'),
            {
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
        router.get(route('auditoria.index'), {}, { preserveState: true });
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

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-xl font-black text-slate-900 tracking-tight">
                                Trazabilidad y Registro de Auditoría
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-900 text-white shadow-xs">
                                {stats.total_eventos.toLocaleString()}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                            Historial detallado de todas las acciones operativas, gestores responsables e inspección de datos
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                Actividad de Hoy
                            </span>
                            <span className="text-sm font-black text-emerald-600">
                                {stats.eventos_hoy} eventos
                            </span>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Registro de Auditoría · PuntoTIC" />

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
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                                placeholder="Buscar por cédula, gestor, ID de registro o IP..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                        </div>
                    </div>

                    {/* Filter controls row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-800/80">
                        {/* Selector Acciones */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Acción
                            </label>
                            <select
                                value={accion}
                                onChange={(e) => setAccion(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="">Todas las acciones</option>
                                {acciones.map((acc) => (
                                    <option key={acc} value={acc}>
                                        {acc}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Selector Módulo */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Módulo
                            </label>
                            <select
                                value={modulo}
                                onChange={(e) => setModulo(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="">Todos los módulos</option>
                                {modulos.map((m) => (
                                    <option key={m} value={m}>
                                        {m}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Selector Gestor */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Usuario Gestor
                            </label>
                            <select
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="">Todos los usuarios</option>
                                {usuarios.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Rango de Fechas */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Fecha Desde
                            </label>
                            <input
                                type="date"
                                value={fechaDesde}
                                onChange={(e) => setFechaDesde(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Fecha Hasta
                            </label>
                            <input
                                type="date"
                                value={fechaHasta}
                                onChange={(e) => setFechaHasta(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Filter buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
                        >
                            Limpiar
                        </button>
                        <button
                            type="button"
                            onClick={handleApplyFilters}
                            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white shadow-md shadow-emerald-900/30 transition-all flex items-center gap-1.5"
                        >
                            <Filter className="w-3.5 h-3.5" />
                            <span>Filtrar Registros</span>
                        </button>
                    </div>
                </div>

                {/* Tabla de Auditoría inspirada en el screenshot de referencia */}
                <div className="bg-[#0b132b] text-slate-200 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800/80 bg-slate-950/60 text-[11px] font-black uppercase tracking-wider text-slate-400">
                                    <th className="py-3.5 px-4 w-12 text-center">Estado</th>
                                    <th className="py-3.5 px-4">Título y Acción</th>
                                    <th className="py-3.5 px-4">Tipo / Módulo</th>
                                    <th className="py-3.5 px-4">Registro</th>
                                    <th className="py-3.5 px-4">Gestor Responsable</th>
                                    <th className="py-3.5 px-4">Fecha y Hora</th>
                                    <th className="py-3.5 px-4 text-center">Datos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 text-xs font-medium">
                                {logs.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400">
                                            <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                            <p className="font-bold">No se encontraron eventos con los filtros aplicados</p>
                                        </td>
                                    </tr>
                                ) : (
                                    logs.data.map((log) => {
                                        const actionInfo = formatActionTitle(log.accion, log);
                                        const ActionIcon = actionInfo.icon;
                                        const createdDate = new Date(log.created_at);
                                        const dateStr = createdDate.toLocaleDateString('es-CO', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                        });
                                        const timeStr = createdDate.toLocaleTimeString('es-CO', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                        });

                                        return (
                                            <tr
                                                key={log.id_log}
                                                className="hover:bg-slate-900/60 transition-colors group"
                                            >
                                                {/* Estado / Icono */}
                                                <td className="py-3.5 px-4 text-center">
                                                    <div className="w-7 h-7 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                                        <ActionIcon className={`w-4 h-4 ${actionInfo.iconColor}`} />
                                                    </div>
                                                </td>

                                                {/* Título y Descripción */}
                                                <td className="py-3.5 px-4 max-w-xs">
                                                    <div className="font-bold text-white group-hover:text-emerald-300 transition-colors">
                                                        {actionInfo.title}
                                                    </div>
                                                    <div className="text-[11px] text-slate-400 truncate">
                                                        {actionInfo.desc}
                                                    </div>
                                                </td>

                                                {/* Tipo / Módulo */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border ${actionInfo.typeColor}`}
                                                    >
                                                        {log.modulo}
                                                    </span>
                                                </td>

                                                {/* Registro ID */}
                                                <td className="py-3.5 px-4 font-mono font-bold text-slate-300 whitespace-nowrap">
                                                    {log.registro_id ? `#${log.registro_id}` : '—'}
                                                </td>

                                                {/* Gestor */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <div className="font-bold text-white">
                                                        {log.usuario?.name || 'Sistema / Cron'}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">
                                                        {log.usuario?.punto?.nombre_punto || log.usuario?.email || 'Acacías'}
                                                    </div>
                                                </td>

                                                {/* Fecha */}
                                                <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-300 text-[11px]">
                                                    <div>{dateStr}</div>
                                                    <div className="text-slate-500 text-[10px]">{timeStr}</div>
                                                </td>

                                                {/* Botón Payload </> */}
                                                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedLog(log)}
                                                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all shadow-xs"
                                                        title="Ver detalles técnicos y payload"
                                                    >
                                                        <Code2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {logs.links && logs.links.length > 3 && (
                        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                            <div>
                                Mostrando página <span className="font-bold text-white">{logs.current_page}</span> de{' '}
                                <span className="font-bold text-white">{logs.last_page}</span> ({logs.total} registros en total)
                            </div>
                            <div className="flex items-center gap-1">
                                {logs.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        disabled={!link.url || link.active}
                                        onClick={() => link.url && router.get(link.url)}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                                            link.active
                                                ? 'bg-emerald-600 text-white shadow-xs'
                                                : link.url
                                                ? 'bg-slate-900 hover:bg-slate-800 text-slate-300'
                                                : 'text-slate-600 cursor-not-allowed'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Inspección Técnica </> */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#0b132b] text-slate-200 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 rounded-t-2xl">
                            <div className="flex items-center gap-2">
                                <Code2 className="w-5 h-5 text-emerald-400" />
                                <div>
                                    <h3 className="text-sm font-black text-white">
                                        Inspección de Registro #{selectedLog.id_log}
                                    </h3>
                                    <p className="text-[11px] text-slate-400">
                                        {selectedLog.accion} · {selectedLog.modulo}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedLog(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 overflow-y-auto space-y-4 text-xs">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-[11px]">
                                <div>
                                    <span className="text-slate-500 font-bold block">Gestor:</span>
                                    <span className="text-white font-medium">{selectedLog.usuario?.name || 'Sistema'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 font-bold block">IP Origen:</span>
                                    <span className="text-white font-mono">{selectedLog.ip_address || '127.0.0.1'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 font-bold block">Registro ID:</span>
                                    <span className="text-white font-mono">#{selectedLog.registro_id || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 font-bold block">Fecha:</span>
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
        </AuthenticatedLayout>
    );
}
