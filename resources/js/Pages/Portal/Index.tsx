import React, { useState, useEffect } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    DoorOpen,
    Calendar,
    Clock,
    Phone,
    Mail,
    MapPin,
    CheckCircle2,
    AlertCircle,
    User,
    Sparkles,
    CalendarCheck,
    Send,
    Plus,
    X,
    Building2,
    Users,
    FileText,
    History,
    ShieldCheck,
    ArrowRight,
    HelpCircle,
    ExternalLink,
} from 'lucide-react';
import axios from 'axios';

interface Point {
    id_punto: number;
    nombre_punto: string;
    direccion: string;
    barrio_vereda: string;
    zona: string;
    telefono: string;
}

interface RoomLoanItem {
    id_prestamo: number;
    tipo_actividad: string;
    num_asistentes: number;
    fecha_prestamo: string;
    hora_inicio: string;
    hora_fin: string;
    observaciones: string;
    estado: 'Pendiente' | 'Reservado' | 'En curso' | 'Completado' | 'Cancelado';
    punto?: {
        nombre_punto: string;
    };
    created_at: string;
}

interface VisitItem {
    id_visita: number;
    servicio_texto: string;
    descripcion: string;
    created_at: string;
    punto?: {
        nombre_punto: string;
    };
    categoria?: {
        nombre_categoria: string;
    };
}

interface Props {
    ciudadano?: any;
    stats: {
        total_solicitudes: number;
        solicitudes_pendientes: number;
        solicitudes_aprobadas: number;
        total_visitas: number;
    };
    solicitudes: {
        data: RoomLoanItem[];
        current_page: number;
        last_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    visitas: VisitItem[];
    puntos: Point[];
    soporte: {
        telefono: string;
        whatsapp: string;
        correo: string;
        horario: string;
        direccion: string;
    };
}

export default function PortalIndex({
    ciudadano,
    stats,
    solicitudes,
    visitas,
    puntos,
    soporte,
}: Props) {
    const { auth, flash } = usePage<any>().props;
    const user = auth?.user;

    const [modalOpen, setModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'solicitudes' | 'visitas'>('solicitudes');

    // Estado para verificar disponibilidad en tiempo real
    const [consultandoDisponibilidad, setConsultandoDisponibilidad] = useState(false);
    const [prestamosOcupados, setPrestamosOcupados] = useState<Array<any>>([]);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDate = tomorrow.toISOString().split('T')[0];

    const { data, setData, post, processing, errors, reset } = useForm({
        id_punto: puntos[0]?.id_punto || 1,
        tipo_actividad: 'Capacitación o Taller Comunitario',
        num_asistentes: 10,
        fecha_prestamo: defaultDate,
        hora_inicio: '09:00',
        hora_fin: '11:00',
        motivo: '',
    });

    // Consultar horarios ocupados cuando cambie la sede o la fecha
    useEffect(() => {
        if (!data.id_punto || !data.fecha_prestamo) return;

        let isMounted = true;
        setConsultandoDisponibilidad(true);

        axios
            .get(route('portal.disponibilidad'), {
                params: {
                    id_punto: data.id_punto,
                    fecha: data.fecha_prestamo,
                },
            })
            .then((res) => {
                if (isMounted) {
                    setPrestamosOcupados(res.data?.ocupados || []);
                }
            })
            .catch((err) => {
                console.error('Error consultando disponibilidad', err);
            })
            .finally(() => {
                if (isMounted) setConsultandoDisponibilidad(false);
            });

        return () => {
            isMounted = false;
        };
    }, [data.id_punto, data.fecha_prestamo]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('portal.solicitar-sala'), {
            onSuccess: () => {
                reset();
                setModalOpen(false);
            },
        });
    };

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'Pendiente':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        Pendiente de Aprobación
                    </span>
                );
            case 'Reservado':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Aprobada / Reservada
                    </span>
                );
            case 'En curso':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-300">
                        En curso en sala
                    </span>
                );
            case 'Completado':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                        Completada
                    </span>
                );
            case 'Cancelado':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
                        Cancelada / No Aprobada
                    </span>
                );
            default:
                return (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                        {estado}
                    </span>
                );
        }
    };

    const selectedPointInfo = puntos.find((p) => Number(p.id_punto) === Number(data.id_punto));

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-black text-slate-900 tracking-tight">
                                Portal Ciudadano · Red PuntoTIC Acacías
                            </h1>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wider">
                                Autoservicio
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Bienvenido al centro de servicios digitales, reserva de espacios en salas y trazabilidad ciudadana
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className="btn-tactile inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-700/20 transition-all self-start sm:self-auto"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Solicitar Espacio en Sala</span>
                    </button>
                </div>
            }
        >
            <Head title="Portal Ciudadano · PuntoTIC Acacías" />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Hero Card de Bienvenida y Vinculación */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#0b132b] via-[#1c2541] to-[#0f172a] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-800">
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-2 max-w-xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Alcaldía Municipal de Acacías · Secretaría TIC</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                                ¡Hola, {user?.name || 'Ciudadano'}!
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                                Desde este portal puedes solicitar espacios en los Puntos Vive Digital y Aulas de la red, consultar la disponibilidad de fechas y horarios, y revisar todo tu historial de visitas y trámites.
                            </p>
                        </div>

                        {/* Ficha Ciudadana Vinculada Card */}
                        <div className="w-full md:w-auto bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700/80 shadow-lg text-xs space-y-2 shrink-0">
                            <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                <span>Ficha Ciudadana Vinculada</span>
                            </div>
                            <div className="font-black text-white text-sm">
                                {user?.documento ? `CC ${user.documento}` : 'Sin cédula asignada'}
                            </div>
                            <div className="text-[11px] text-slate-300 font-medium">
                                {ciudadano ? (
                                    <span>
                                        Registrado en: <strong className="text-emerald-300">{ciudadano.barrio || 'Acacías'}</strong> ({ciudadano.zona || 'Urbana'})
                                    </span>
                                ) : (
                                    <span className="text-amber-400">Vinculación automática activa</span>
                                )}
                            </div>
                            <div className="pt-1 flex items-center gap-2 text-[10px] text-slate-400 border-t border-slate-800">
                                <span>Total visitas registradas:</span>
                                <span className="font-bold text-emerald-400">{stats.total_visitas}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grid: Tarjetas de Métricas Rápidas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Total Solicitudes
                        </div>
                        <div className="text-2xl font-black text-slate-900 mt-1">
                            {stats.total_solicitudes}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">Espacios solicitados</div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                        <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                            Pendientes
                        </div>
                        <div className="text-2xl font-black text-amber-600 mt-1">
                            {stats.solicitudes_pendientes}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">Por confirmar por gestor</div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                        <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                            Aprobadas
                        </div>
                        <div className="text-2xl font-black text-emerald-600 mt-1">
                            {stats.solicitudes_aprobadas}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">Reservas confirmadas</div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                        <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                            Visitas Realizadas
                        </div>
                        <div className="text-2xl font-black text-blue-600 mt-1">
                            {stats.total_visitas}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">En sedes de la red</div>
                    </div>
                </div>

                {/* Banner de Soporte, Horarios y Canales de Atención */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                        <Phone className="w-5 h-5 text-emerald-600" />
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                Canales de Soporte y Atención Ciudadana TIC
                            </h3>
                            <p className="text-[11px] text-slate-500 font-medium">
                                Comunícate directamente con la coordinación para dudas, asesorías y confirmación de eventos
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Línea Telefónica</span>
                            <div className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{soporte.telefono}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 block">Atención en conmutador</span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-emerald-800 block">WhatsApp Ciudadano</span>
                            <div className="font-black text-emerald-950 text-sm flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span>{soporte.whatsapp}</span>
                            </div>
                            <span className="text-[10px] text-emerald-700 block">Línea rápida de mensajes</span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Correo Institucional</span>
                            <div className="font-black text-slate-900 text-sm flex items-center gap-1.5 truncate">
                                <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span className="truncate">{soporte.correo}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 block">Solicitudes formales</span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Horario de Salas</span>
                            <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span>8:00 AM - 12:00 M y 2:00 PM - 6:00 PM</span>
                            </div>
                            <span className="text-[10px] text-slate-500 block">Lunes a Viernes</span>
                        </div>
                    </div>
                </div>

                {/* Pestañas de Historial: Solicitudes de Sala vs Visitas Presenciales */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveTab('solicitudes')}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                                    activeTab === 'solicitudes'
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                                <DoorOpen className="w-3.5 h-3.5" />
                                <span>Mis Solicitudes de Sala ({solicitudes.total})</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('visitas')}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                                    activeTab === 'visitas'
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                                <History className="w-3.5 h-3.5" />
                                <span>Mi Historial de Atenciones ({stats.total_visitas})</span>
                            </button>
                        </div>

                        {activeTab === 'solicitudes' && (
                            <button
                                type="button"
                                onClick={() => setModalOpen(true)}
                                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Nueva Solicitud</span>
                            </button>
                        )}
                    </div>

                    {/* Tabla de Solicitudes de Sala */}
                    {activeTab === 'solicitudes' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                        <th className="py-3.5 px-5">Sede Solicitada</th>
                                        <th className="py-3.5 px-4">Fecha y Horario</th>
                                        <th className="py-3.5 px-4">Actividad y Motivo</th>
                                        <th className="py-3.5 px-4 text-center">Aforo</th>
                                        <th className="py-3.5 px-5 text-right">Estado de la Solicitud</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                    {solicitudes.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-slate-400">
                                                <DoorOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                                <p className="font-bold">Aún no has radicado solicitudes de espacio en sala</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setModalOpen(true)}
                                                    className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-700"
                                                >
                                                    Solicitar un espacio ahora
                                                </button>
                                            </td>
                                        </tr>
                                    ) : (
                                        solicitudes.data.map((sol) => (
                                            <tr key={sol.id_prestamo} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="py-3.5 px-5 font-bold text-slate-900 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                        <span>{sol.punto?.nombre_punto || 'Punto Vive Digital'}</span>
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <div className="font-bold text-slate-800">
                                                        {new Date(sol.fecha_prestamo).toLocaleDateString('es-CO', {
                                                            weekday: 'short',
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 font-mono">
                                                        {sol.hora_inicio || '08:00'} a {sol.hora_fin || '12:00'}
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-4 max-w-xs">
                                                    <div className="font-bold text-slate-900">{sol.tipo_actividad}</div>
                                                    <div className="text-[11px] text-slate-500 truncate">
                                                        {sol.observaciones || 'Sin observaciones adicionales'}
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-4 text-center font-bold text-slate-800 whitespace-nowrap">
                                                    {sol.num_asistentes} pers.
                                                </td>

                                                <td className="py-3.5 px-5 text-right whitespace-nowrap">
                                                    {getEstadoBadge(sol.estado)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Tabla de Visitas Históricas */}
                    {activeTab === 'visitas' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                        <th className="py-3.5 px-5">Sede</th>
                                        <th className="py-3.5 px-4">Servicio Recibido</th>
                                        <th className="py-3.5 px-4">Categoría</th>
                                        <th className="py-3.5 px-5 text-right">Fecha de Atención</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                    {visitas.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-12 text-center text-slate-400">
                                                <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                                <p className="font-bold">No hay registros de atenciones presenciales previas</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        visitas.map((v) => (
                                            <tr key={v.id_visita} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="py-3.5 px-5 font-bold text-slate-900 whitespace-nowrap">
                                                    {v.punto?.nombre_punto || 'Punto Vive Digital'}
                                                </td>
                                                <td className="py-3.5 px-4 max-w-sm">
                                                    <div className="font-bold text-slate-900">{v.servicio_texto || 'Atención en sala'}</div>
                                                    {v.descripcion && (
                                                        <div className="text-[11px] text-slate-500 truncate">{v.descripcion}</div>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700">
                                                        {v.categoria?.nombre_categoria || 'Servicios TIC'}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-5 text-right font-mono text-slate-600 whitespace-nowrap">
                                                    {new Date(v.created_at).toLocaleDateString('es-CO')}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Interactivo de Solicitud de Espacio con Calendario de Disponibilidad */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                                    <DoorOpen className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                                        Solicitar Espacio en Sala
                                    </h3>
                                    <p className="text-[11px] text-slate-500">
                                        Puntos Vive Digital y Aulas de Acacías
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleSubmit} className="overflow-y-auto p-1 space-y-4 my-2 text-xs">
                            {/* Selector de Sede */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                                    Sede o Punto Digital
                                </label>
                                <select
                                    value={data.id_punto}
                                    onChange={(e) => setData('id_punto', Number(e.target.value))}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    {puntos.map((p) => (
                                        <option key={p.id_punto} value={p.id_punto}>
                                            {p.nombre_punto} ({p.zona}) · {p.barrio_vereda}
                                        </option>
                                    ))}
                                </select>
                                {selectedPointInfo && (
                                    <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-slate-400" />
                                        <span>{selectedPointInfo.direccion}</span>
                                    </div>
                                )}
                            </div>

                            {/* Fecha y Disponibilidad en Vivo */}
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                                    Fecha Requerida
                                </label>
                                <input
                                    type="date"
                                    min={new Date().toISOString().split('T')[0]}
                                    value={data.fecha_prestamo}
                                    onChange={(e) => setData('fecha_prestamo', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />

                                {/* Estado de Disponibilidad */}
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>Disponibilidad en esta fecha:</span>
                                        </span>
                                        {consultandoDisponibilidad && (
                                            <span className="text-slate-400 font-normal">Consultando...</span>
                                        )}
                                    </div>

                                    {prestamosOcupados.length === 0 ? (
                                        <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>¡Excelente! No hay reservas programadas para este día. Disponibilidad total.</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <div className="text-[11px] text-amber-800 font-bold">
                                                Horarios ya reservados u ocupados:
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                                {prestamosOcupados.map((occ) => (
                                                    <span
                                                        key={occ.id_prestamo}
                                                        className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-mono font-bold border border-amber-300"
                                                    >
                                                        {occ.hora_inicio || '08:00'} - {occ.hora_fin || '12:00'} ({occ.tipo_actividad})
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Horario: Inicio y Fin */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                                        Hora Inicio
                                    </label>
                                    <input
                                        type="time"
                                        value={data.hora_inicio}
                                        onChange={(e) => setData('hora_inicio', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                    {errors.hora_inicio && (
                                        <span className="text-[10px] text-rose-600 font-bold block mt-1">
                                            {errors.hora_inicio}
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                                        Hora Fin
                                    </label>
                                    <input
                                        type="time"
                                        value={data.hora_fin}
                                        onChange={(e) => setData('hora_fin', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                    {errors.hora_fin && (
                                        <span className="text-[10px] text-rose-600 font-bold block mt-1">
                                            {errors.hora_fin}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Tipo de Actividad y Aforo */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-2">
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                                        Tipo de Actividad
                                    </label>
                                    <input
                                        type="text"
                                        value={data.tipo_actividad}
                                        onChange={(e) => setData('tipo_actividad', e.target.value)}
                                        placeholder="Ej: Taller de capacitación, reunión JAL, estudio"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                                        Asistentes Est.
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={300}
                                        value={data.num_asistentes}
                                        onChange={(e) => setData('num_asistentes', Number(e.target.value))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            {/* Motivo Detallado */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                                    Motivo y Descripción (Para qué requiere el espacio)
                                </label>
                                <textarea
                                    rows={3}
                                    value={data.motivo}
                                    onChange={(e) => setData('motivo', e.target.value)}
                                    placeholder="Detalla el objetivo del evento, requerimiento de computadores o proyector, público objetivo..."
                                    className="w-full p-3 rounded-xl border border-slate-300 text-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                {errors.motivo && (
                                    <span className="text-[10px] text-rose-600 font-bold block mt-1">
                                        {errors.motivo}
                                    </span>
                                )}
                            </div>

                            {/* Aviso de confirmación */}
                            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <strong>Importante:</strong> Al enviar tu solicitud, esta quedará en estado <em>Pendiente de Aprobación</em>. El administrador del punto validará los recursos y confirmará oficialmente tu préstamo.
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-700/20 transition-all flex items-center gap-1.5"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>{processing ? 'Enviando Solicitud...' : 'Radicar Solicitud'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
