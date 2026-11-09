import React, { useState, useEffect, useMemo } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
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
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Filter,
    Info,
    Check,
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

const CATEGORIAS_PRESTAMO = [
    'Convenios Formativos y Cursos SENA / Alcaldía',
    'Instituciones Educativas y Colegios',
    'ICBF y Programas de Niñez / Primera Infancia',
    'Juntas de Acción Comunal (JAC) y Asambleas Barriales',
    'Cine Comunitario, Cineclub y Proyecciones Audiovisuales',
    'Talleres de Emprendimiento y Desarrollo Económico',
    'Ensayos Artísticos, Danza y Expresiones Culturales',
    'Asambleas y Reuniones de Organizaciones Sociales',
    'Capacitaciones de Entidades Gubernamentales',
    'Acceso Comunitario TIC y Práctica Libre',
    'Otro Tipo de Actividad',
];

interface RoomLoanItem {
    id_prestamo: number;
    tipo_actividad: string;
    num_asistentes: number;
    fecha_prestamo: string;
    hora_inicio: string;
    hora_fin: string;
    observaciones: string;
    respuesta_gestor?: string | null;
    estado: 'Pendiente' | 'Reservado' | 'En curso' | 'Completado' | 'Cancelado';
    punto?: {
        nombre_punto: string;
    };
    created_at: string;
}

interface CalendarLoanItem {
    id_prestamo: number;
    id_punto: number;
    id_form_pvd: number | null;
    tipo_actividad: string;
    fecha_prestamo: string;
    hora_inicio: string | null;
    hora_fin: string | null;
    estado: 'Pendiente' | 'Reservado' | 'En curso' | 'Completado' | 'Cancelado';
    num_asistentes: number;
    punto?: {
        id_punto: number;
        nombre_punto: string;
    };
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
    calendarLoans?: CalendarLoanItem[];
    selectedMonth?: string;
    selectedPunto?: number | null;
    soporte: {
        telefono: string;
        whatsapp: string;
        correo: string;
        horario: string;
        direccion: string;
    };
}

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const HORAS_PREDEFINIDAS = [
    { inicio: '08:00', fin: '10:00', label: '08:00 - 10:00 AM', turno: 'Mañana' },
    { inicio: '10:00', fin: '12:00', label: '10:00 - 12:00 M', turno: 'Mañana' },
    { inicio: '14:00', fin: '16:00', label: '02:00 - 04:00 PM', turno: 'Tarde' },
    { inicio: '16:00', fin: '18:00', label: '04:00 - 06:00 PM', turno: 'Tarde' },
];

export default function PortalIndex({
    ciudadano,
    stats,
    solicitudes,
    visitas,
    puntos,
    calendarLoans = [],
    selectedMonth,
    selectedPunto = null,
    soporte,
}: Props) {
    const { auth } = usePage<any>().props;
    const user = auth?.user;

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedOccupiedDetail, setSelectedOccupiedDetail] = useState<CalendarLoanItem | null>(null);
    const [activeTab, setActiveTab] = useState<'calendario' | 'solicitudes' | 'visitas'>('calendario');

    // Estado del mes y filtro de sede para el calendario
    const [currentMonthStr, setCurrentMonthStr] = useState<string>(
        selectedMonth || new Date().toISOString().substring(0, 7)
    );
    const [pointFilter, setPointFilter] = useState<number | null>(selectedPunto || null);

    // Estado para verificar disponibilidad en tiempo real en el modal
    const [consultandoDisponibilidad, setConsultandoDisponibilidad] = useState(false);
    const [prestamosOcupados, setPrestamosOcupados] = useState<Array<any>>([]);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDate = tomorrow.toISOString().split('T')[0];
    const todayDateStr = new Date().toISOString().substring(0, 10);

    const { data, setData, post, processing, errors, reset } = useForm({
        id_punto: puntos[0]?.id_punto || 1,
        tipo_actividad: CATEGORIAS_PRESTAMO[0],
        num_asistentes: 10,
        fecha_prestamo: defaultDate,
        hora_inicio: '09:00',
        hora_fin: '11:00',
        motivo: '',
    });

    // Consultar horarios ocupados cuando cambie la sede o la fecha en el modal
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

    // Navegación de meses en el calendario
    const [yearNum, monthNum] = currentMonthStr.split('-').map(Number);
    const monthDate = new Date(yearNum, monthNum - 1, 1);
    const monthTitle = monthDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

    const handlePrevMonth = () => {
        const d = new Date(yearNum, monthNum - 2, 1);
        const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        setCurrentMonthStr(str);
        router.get(
            route('portal.index'),
            { mes: str, id_punto: pointFilter || undefined },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleNextMonth = () => {
        const d = new Date(yearNum, monthNum, 1);
        const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        setCurrentMonthStr(str);
        router.get(
            route('portal.index'),
            { mes: str, id_punto: pointFilter || undefined },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleToday = () => {
        const now = new Date();
        const str = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        setCurrentMonthStr(str);
        router.get(
            route('portal.index'),
            { mes: str, id_punto: pointFilter || undefined },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handlePointFilterChange = (id: number | null) => {
        setPointFilter(id);
        router.get(
            route('portal.index'),
            { mes: currentMonthStr, id_punto: id || undefined },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Mapeo de préstamos por fecha para el calendario
    const loansByDate = useMemo(() => {
        const map: Record<string, Array<CalendarLoanItem>> = {};
        (calendarLoans || []).forEach((loan) => {
            const rawDate = loan.fecha_prestamo ? loan.fecha_prestamo.split('T')[0] : '';
            if (rawDate) {
                if (!map[rawDate]) map[rawDate] = [];
                map[rawDate].push(loan);
            }
        });
        return map;
    }, [calendarLoans]);

    // Cuadrícula mensual de días
    const calendarGridDays = useMemo(() => {
        const totalDaysInMonth = new Date(yearNum, monthNum, 0).getDate();
        const firstDayOfWeek = (new Date(yearNum, monthNum - 1, 1).getDay() + 6) % 7; // Lunes = 0
        const prevMonthDays = new Date(yearNum, monthNum - 1, 0).getDate();

        const days = [];

        // Días residuales del mes anterior
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const d = prevMonthDays - i;
            const prevMonth = monthNum - 1 === 0 ? 12 : monthNum - 1;
            const prevYear = monthNum - 1 === 0 ? yearNum - 1 : yearNum;
            const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            days.push({
                dayNumber: d,
                dateStr,
                isCurrentMonth: false,
            });
        }

        // Días del mes en curso
        for (let d = 1; d <= totalDaysInMonth; d++) {
            const dateStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            days.push({
                dayNumber: d,
                dateStr,
                isCurrentMonth: true,
            });
        }

        // Días para completar la última semana
        const remaining = (7 - (days.length % 7)) % 7;
        for (let d = 1; d <= remaining; d++) {
            const nextMonth = monthNum === 12 ? 1 : monthNum + 1;
            const nextYear = monthNum === 12 ? yearNum + 1 : yearNum;
            const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            days.push({
                dayNumber: d,
                dateStr,
                isCurrentMonth: false,
            });
        }

        return days;
    }, [yearNum, monthNum]);

    // Clic en un día para abrir modal de solicitud con fecha precargada
    const handleDayClick = (dateStr: string) => {
        if (dateStr < todayDateStr) return; // No permitir agendar en el pasado
        setData('fecha_prestamo', dateStr);
        if (pointFilter) {
            setData('id_punto', pointFilter);
        }
        setModalOpen(true);
    };

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
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                        En curso en sala
                    </span>
                );
            case 'Cancelado':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                        Rechazada / Cancelada
                    </span>
                );
            case 'Completado':
            default:
                return (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                        {estado}
                    </span>
                );
        }
    };

    // Función para comprobar si un tramo horario tiene conflicto
    const isSlotConflicted = (inicio: string, fin: string) => {
        return prestamosOcupados.some((occ) => {
            const occIni = occ.hora_inicio ? occ.hora_inicio.slice(0, 5) : '00:00';
            const occFin = occ.hora_fin ? occ.hora_fin.slice(0, 5) : '23:59';
            return occIni < fin && occFin > inicio;
        });
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
                            Consulta la disponibilidad de salas en el calendario y solicita tu espacio en línea
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setData('fecha_prestamo', defaultDate);
                            setModalOpen(true);
                        }}
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
                                En el calendario interactivo abajo puedes ver directamente qué días y horas están ocupados o libres en cada sede PVD, y con solo hacer clic en un día libre podrás radicar tu solicitud de espacio.
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

                {/* Navegación por Pestañas Principales */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveTab('calendario')}
                                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                                    activeTab === 'calendario'
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                                <CalendarDays className="w-4 h-4 text-emerald-400" />
                                <span>Calendario y Disponibilidad en Vivo</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white">
                                    Visual
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('solicitudes')}
                                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                                    activeTab === 'solicitudes'
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                                <DoorOpen className="w-4 h-4" />
                                <span>Mis Solicitudes ({solicitudes.total})</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('visitas')}
                                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                                    activeTab === 'visitas'
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                                <History className="w-4 h-4" />
                                <span>Historial de Visitas ({stats.total_visitas})</span>
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setData('fecha_prestamo', defaultDate);
                                setModalOpen(true);
                            }}
                            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 self-start sm:self-auto bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1.5 rounded-xl transition-all"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Nueva Solicitud</span>
                        </button>
                    </div>

                    {/* CONTENIDO PESTAÑA 1: GRAN CALENDARIO VISUAL DE DISPONIBILIDAD */}
                    {activeTab === 'calendario' && (
                        <div className="p-4 sm:p-6 space-y-5">
                            {/* Selector Visual de Sedes PVD */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span className="text-xs font-bold text-slate-700">Filtrar Sede:</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => handlePointFilterChange(null)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                            pointFilter === null
                                                ? 'bg-emerald-600 text-white shadow-xs'
                                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                        }`}
                                    >
                                        🏛️ Todas las Sedes
                                    </button>
                                    {puntos.map((p) => (
                                        <button
                                            key={p.id_punto}
                                            type="button"
                                            onClick={() => handlePointFilterChange(p.id_punto)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                                pointFilter === p.id_punto
                                                    ? 'bg-emerald-600 text-white shadow-xs'
                                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                            }`}
                                        >
                                            📍 {p.nombre_punto}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Controles de Mes: Anterior / Siguiente / Hoy */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black shadow-xs">
                                        <CalendarDays className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base sm:text-lg font-black text-slate-900 capitalize tracking-tight">
                                            {monthTitle}
                                        </h2>
                                        <p className="text-xs text-slate-400 font-medium">
                                            Haz clic en cualquier día libre para apartar tu horario de inmediato
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                    <button
                                        type="button"
                                        onClick={handleToday}
                                        className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                                    >
                                        Hoy
                                    </button>
                                    <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                                        <button
                                            type="button"
                                            onClick={handlePrevMonth}
                                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all"
                                            title="Mes anterior"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleNextMonth}
                                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all"
                                            title="Mes siguiente"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Leyenda Visual de Disponibilidad */}
                            <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-slate-600 bg-slate-50/60 p-3 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-md bg-emerald-100 border border-emerald-300"></span>
                                    <span><strong>Verde:</strong> Día disponible para apartar</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-md bg-amber-100 border border-amber-300"></span>
                                    <span><strong>Ámbar:</strong> Horarios ocupados (consulta horas libres)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-md bg-blue-100 border border-blue-300"></span>
                                    <span><strong>Azul:</strong> Tu solicitud radicada</span>
                                </div>
                            </div>

                            {/* Cuadrícula del Calendario (Desktop & Mobile) */}
                            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                                {/* Días de la Semana */}
                                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/80 text-center text-xs font-bold text-slate-500 py-2.5">
                                    {DIAS_SEMANA.map((dia) => (
                                        <div key={dia} className="uppercase tracking-wider text-[11px]">
                                            {dia}
                                        </div>
                                    ))}
                                </div>

                                {/* Cuadrícula de 7 columnas */}
                                <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
                                    {calendarGridDays.map((item, idx) => {
                                        const isToday = item.dateStr === todayDateStr;
                                        const isPast = item.dateStr < todayDateStr;
                                        const dayLoans = loansByDate[item.dateStr] || [];
                                        const hasLoans = dayLoans.length > 0;

                                        return (
                                            <div
                                                key={`${item.dateStr}-${idx}`}
                                                onClick={() => {
                                                    if (!isPast && item.isCurrentMonth) {
                                                        handleDayClick(item.dateStr);
                                                    }
                                                }}
                                                className={`min-h-[110px] sm:min-h-[125px] p-1.5 sm:p-2 transition-all relative group flex flex-col justify-between ${
                                                    !item.isCurrentMonth
                                                        ? 'bg-slate-50/40 text-slate-300 select-none'
                                                        : isPast
                                                        ? 'bg-slate-50/70 text-slate-400'
                                                        : hasLoans
                                                        ? 'bg-amber-50/20 hover:bg-amber-50/50 cursor-pointer'
                                                        : 'bg-white hover:bg-emerald-50/40 cursor-pointer'
                                                }`}
                                            >
                                                {/* Fila superior: Número de día y botón rápido (+) */}
                                                <div className="flex items-center justify-between mb-1">
                                                    <span
                                                        className={`text-xs font-bold inline-flex items-center justify-center ${
                                                            isToday
                                                                ? 'w-6 h-6 rounded-full bg-emerald-600 text-white shadow-xs font-black'
                                                                : item.isCurrentMonth
                                                                ? isPast
                                                                    ? 'text-slate-400'
                                                                    : 'text-slate-800'
                                                                : 'text-slate-300'
                                                        }`}
                                                    >
                                                        {item.dayNumber}
                                                    </span>

                                                    {item.isCurrentMonth && !isPast && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDayClick(item.dateStr);
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-emerald-700 hover:bg-emerald-100 transition-all"
                                                            title={`Apartar en ${item.dateStr}`}
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Contenido del Día: Píldoras de préstamos o indicador de libre */}
                                                <div className="space-y-1 flex-1 overflow-y-auto max-h-24">
                                                    {dayLoans.slice(0, 3).map((loan) => {
                                                        const isMyLoan =
                                                            loan.id_form_pvd &&
                                                            ciudadano?.id_form_pvd &&
                                                            Number(loan.id_form_pvd) === Number(ciudadano.id_form_pvd);

                                                        return (
                                                            <button
                                                                key={loan.id_prestamo}
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedOccupiedDetail(loan);
                                                                }}
                                                                className={`w-full text-left px-1.5 py-1 rounded-lg border text-[10px] sm:text-[11px] font-semibold transition-all truncate block ${
                                                                    isMyLoan
                                                                        ? 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
                                                                        : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                                                                }`}
                                                                title={`Horario ocupado: ${loan.hora_inicio?.slice(0, 5) || '08:00'} a ${loan.hora_fin?.slice(0, 5) || '12:00'} - ${loan.tipo_actividad}`}
                                                            >
                                                                <div className="truncate font-bold flex items-center gap-1">
                                                                    <Clock className="w-2.5 h-2.5 shrink-0" />
                                                                    <span>
                                                                        {loan.hora_inicio ? loan.hora_inicio.slice(0, 5) : '08:00'}-
                                                                        {loan.hora_fin ? loan.hora_fin.slice(0, 5) : '12:00'}
                                                                    </span>
                                                                </div>
                                                                <div className="truncate text-[9px] opacity-80">
                                                                    {isMyLoan ? '⭐ Tu Solicitud' : loan.tipo_actividad}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}

                                                    {dayLoans.length > 3 && (
                                                        <div className="text-[9px] font-bold text-amber-700 text-center">
                                                            +{dayLoans.length - 3} ocupaciones más
                                                        </div>
                                                    )}

                                                    {/* Si el día está libre y es futuro */}
                                                    {dayLoans.length === 0 && item.isCurrentMonth && !isPast && (
                                                        <div className="h-full flex flex-col items-center justify-center py-2 text-center text-slate-300 group-hover:text-emerald-700 transition-colors">
                                                            <span className="text-[10px] font-bold">Disponible</span>
                                                            <span className="text-[9px] opacity-80">Clic para apartar</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CONTENIDO PESTAÑA 2: LISTA DE MIS SOLICITUDES DE SALA */}
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
                                        solicitudes.data.map((s) => (
                                            <tr key={s.id_prestamo} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="py-3.5 px-5 font-bold text-slate-900 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="w-4 h-4 text-emerald-600" />
                                                        <span>{s.punto?.nombre_punto || 'Punto Vive Digital'}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <div className="font-bold text-slate-900">
                                                        {s.fecha_prestamo ? s.fecha_prestamo.split('T')[0] : '-'}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                                                        <Clock className="w-3 h-3 text-slate-400" />
                                                        <span>
                                                            {s.hora_inicio ? s.hora_inicio.slice(0, 5) : '08:00'} -{' '}
                                                            {s.hora_fin ? s.hora_fin.slice(0, 5) : '12:00'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 max-w-sm">
                                                    <div className="font-bold text-slate-900 truncate">{s.tipo_actividad}</div>
                                                    {s.observaciones && (
                                                        <div className="text-[11px] text-slate-500 truncate" title={s.observaciones}>
                                                            "{s.observaciones}"
                                                        </div>
                                                    )}
                                                    {s.respuesta_gestor && s.estado === 'Cancelado' && (
                                                        <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] shadow-xs">
                                                            <div className="flex items-center gap-1 font-bold text-rose-900 mb-0.5">
                                                                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                                                                <span>Motivo de rechazo del gestor:</span>
                                                            </div>
                                                            <p className="font-medium text-rose-700 whitespace-normal">
                                                                {s.respuesta_gestor}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {s.respuesta_gestor && s.estado === 'Reservado' && (
                                                        <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] shadow-xs">
                                                            <div className="flex items-center gap-1 font-bold text-emerald-900 mb-0.5">
                                                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                                                                <span>Indicaciones del gestor:</span>
                                                            </div>
                                                            <p className="font-medium text-emerald-700 whitespace-normal">
                                                                {s.respuesta_gestor}
                                                            </p>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                                                    {s.num_asistentes} pers.
                                                </td>
                                                <td className="py-3.5 px-5 text-right whitespace-nowrap">
                                                    {getEstadoBadge(s.estado)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* CONTENIDO PESTAÑA 3: HISTORIAL DE VISITAS PRESENCIALES */}
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

                        <a
                            href={`https://wa.me/573213618632?text=${encodeURIComponent('Hola, me gustaría solicitar información sobre los Puntos Vive Digital de Acacías.')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1 block hover:bg-emerald-100/80 transition-colors group cursor-pointer"
                        >
                            <span className="text-[10px] font-bold uppercase text-emerald-800 block">WhatsApp Ciudadano</span>
                            <div className="font-black text-emerald-950 text-sm flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="group-hover:underline">{soporte.whatsapp}</span>
                            </div>
                            <span className="text-[10px] text-emerald-700 block">Línea rápida de mensajes</span>
                        </a>

                        <a
                            href={`mailto:${soporte.correo}`}
                            className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 block hover:bg-slate-100 transition-colors group cursor-pointer"
                        >
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Correo Institucional</span>
                            <div className="font-black text-slate-900 text-sm flex items-center gap-1.5 truncate">
                                <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span className="truncate group-hover:underline">{soporte.correo}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 block">Solicitudes formales</span>
                        </a>

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
            </div>

            {/* Modal Detalle Informativo al Clicar un Evento Ocupado en el Calendario */}
            {selectedOccupiedDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                                    Horario Apartado en Sala
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedOccupiedDetail(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 font-bold">Sede:</span>
                                    <span className="font-black text-slate-900">
                                        {selectedOccupiedDetail.punto?.nombre_punto || 'Sede PVD'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 font-bold">Fecha:</span>
                                    <span className="font-black text-slate-900">
                                        {selectedOccupiedDetail.fecha_prestamo?.split('T')[0]}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 font-bold">Horario Ocupado:</span>
                                    <span className="font-mono font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-lg">
                                        {selectedOccupiedDetail.hora_inicio?.slice(0, 5) || '08:00'} -{' '}
                                        {selectedOccupiedDetail.hora_fin?.slice(0, 5) || '12:00'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 font-bold">Actividad:</span>
                                    <span className="font-medium text-slate-700">
                                        {selectedOccupiedDetail.tipo_actividad}
                                    </span>
                                </div>
                            </div>

                            <p className="text-[11px] text-slate-500 leading-relaxed">
                                Este bloque de tiempo ya se encuentra reservado. Puedes solicitar el espacio en otro horario del mismo día (por ejemplo en la mañana o la tarde) o elegir otra fecha disponible.
                            </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedOccupiedDetail(null)}
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
                            >
                                Cerrar
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setData('fecha_prestamo', selectedOccupiedDetail.fecha_prestamo.split('T')[0]);
                                    if (selectedOccupiedDetail.id_punto) {
                                        setData('id_punto', selectedOccupiedDetail.id_punto);
                                    }
                                    setSelectedOccupiedDetail(null);
                                    setModalOpen(true);
                                }}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Solicitar en esta fecha</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Interactivo de Solicitud de Espacio con Selección Visual de Horas */}
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

                            {/* Fecha Requerida */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                                    Fecha Requerida
                                </label>
                                <input
                                    type="date"
                                    min={todayDateStr}
                                    value={data.fecha_prestamo}
                                    onChange={(e) => setData('fecha_prestamo', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            {/* Selector Visual de Franjas Horarias del Día */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Franjas de Atención Disponibles:</span>
                                    </span>
                                    {consultandoDisponibilidad && (
                                        <span className="text-slate-400 font-normal">Consultando ocupación...</span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    {HORAS_PREDEFINIDAS.map((franja) => {
                                        const isConflict = isSlotConflicted(franja.inicio, franja.fin);
                                        const isSelected = data.hora_inicio === franja.inicio && data.hora_fin === franja.fin;

                                        return (
                                            <button
                                                key={franja.label}
                                                type="button"
                                                disabled={isConflict}
                                                onClick={() => {
                                                    setData('hora_inicio', franja.inicio);
                                                    setData('hora_fin', franja.fin);
                                                }}
                                                className={`p-2.5 rounded-xl border text-left transition-all ${
                                                    isConflict
                                                        ? 'bg-rose-50/80 border-rose-200 text-rose-800 opacity-70 cursor-not-allowed'
                                                        : isSelected
                                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                                        : 'bg-white hover:bg-emerald-50/50 border-slate-200 text-slate-800'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-black text-xs">{franja.label}</span>
                                                    {isConflict ? (
                                                        <span className="text-[9px] font-bold uppercase bg-rose-200 text-rose-900 px-1.5 py-0.5 rounded">
                                                            Ocupado
                                                        </span>
                                                    ) : isSelected ? (
                                                        <span className="text-[9px] font-bold uppercase bg-white/20 text-white px-1.5 py-0.5 rounded">
                                                            Elegido
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] font-bold uppercase text-emerald-600">
                                                            Libre
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] opacity-80 mt-0.5">
                                                    Turno {franja.turno}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Horario Personalizado: Inicio y Fin */}
                            <div className="grid grid-cols-2 gap-3 pt-1">
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
                                        Categoría de Actividad *
                                    </label>
                                    <select
                                        value={data.tipo_actividad}
                                        onChange={(e) => setData('tipo_actividad', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                                        required
                                    >
                                        {CATEGORIAS_PRESTAMO.map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat}
                                            </option>
                                        ))}
                                    </select>
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
