import React, { useState, useMemo } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    DoorOpen,
    Plus,
    Search,
    Calendar as CalendarIcon,
    Clock,
    UserCheck,
    X,
    Save,
    CheckCircle2,
    Filter,
    ChevronLeft,
    ChevronRight,
    List,
    Building2,
    MapPin,
    Users,
    Info,
    CalendarDays,
    AlertCircle,
    MessageSquare,
} from 'lucide-react';
import axios from 'axios';

interface Props {
    loans: {
        data: Array<any>;
        links: Array<any>;
        current_page: number;
        last_page: number;
        total: number;
        from: number;
        to: number;
    };
    calendarLoans?: Array<any>;
    selectedMonth?: string;
    filters: any;
    points: Array<any>;
    tiposActividad: Array<string>;
    pendingCount?: number;
}

const CATEGORIAS_PRESTAMO = [
    'Convenios Formativos y Cursos SENA / Alcaldía',
    'Instituciones Educativas y Colegios',
    'ICBF y Programas de Niñez / Primera Infancia',
    'Juntas de Acción Comunal (JAC) y Asambleas Barriales',
    'Cine Comunitario, Cineclub y Proyecciones Audiovisuales',
    'Programas Sociales, Paz y Fundaciones Comunitarias',
    'Expresiones Culturales, Arte, Deporte y Danza',
    'Jornadas de Salud, Vacunación y Brigadas',
    'Emprendimiento, Comercio Local y Empleo',
    'Reuniones y Eventos Institucionales de la Alcaldía',
    'Otras Actividades Comunitarias',
];

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const QUICK_REASONS: Record<'Reservado' | 'Cancelado', string[]> = {
    Cancelado: [
        'La sala se encuentra ocupada por otra actividad institucional en ese horario',
        'El horario solicitado no coincide con los horarios de atención del PVD',
        'Mantenimiento técnico programado en los equipos de cómputo / sala',
        'Aforo máximo excedido para las instalaciones de esta aula',
        'Falta información de contacto o coordinador responsable de la actividad',
    ],
    Reservado: [
        'Aprobado. Por favor presentarse 15 minutos antes con documento de identidad.',
        'Aprobado. Capacidad máxima autorizada: cuidar los equipos y el mobiliario.',
        'Aprobado. La sala cuenta con proyector y conexión a Internet listos.',
    ],
};

export default function RoomLoansIndex({
    loans,
    calendarLoans = [],
    selectedMonth,
    filters,
    points,
    tiposActividad,
    pendingCount = 0,
}: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const [documentInput, setDocumentInput] = useState('');
    const [citizenFound, setCitizenFound] = useState<any>(null);

    // Modo de vista: Calendario o Lista/Tabla
    const [viewMode, setViewMode] = useState<'calendario' | 'lista'>('calendario');

    // Mes activo en el calendario (formato YYYY-MM)
    const [currentMonthStr, setCurrentMonthStr] = useState<string>(
        selectedMonth || new Date().toISOString().substring(0, 7)
    );

    // Modal para ver detalle de un evento al hacer clic en el calendario
    const [selectedLoanDetail, setSelectedLoanDetail] = useState<any>(null);

    // Modal de revisión (Aprobar / Rechazar) con comentario explicativo
    const [reviewModal, setReviewModal] = useState<{
        loan: any;
        action: 'Reservado' | 'Cancelado';
    } | null>(null);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewCategory, setReviewCategory] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    const openReviewModal = (loan: any, action: 'Reservado' | 'Cancelado') => {
        setReviewModal({ loan, action });
        setReviewComment(loan.respuesta_gestor || '');
        setReviewCategory(loan.tipo_actividad || CATEGORIAS_PRESTAMO[0]);
    };

    const submitReview = () => {
        if (!reviewModal) return;
        setSubmittingReview(true);
        router.post(
            route('prestamos.update', reviewModal.loan.id_prestamo),
            {
                _method: 'put',
                estado: reviewModal.action,
                tipo_actividad: reviewModal.action === 'Reservado' ? (reviewCategory || reviewModal.loan.tipo_actividad) : undefined,
                respuesta_gestor: reviewComment.trim() || undefined,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setReviewModal(null);
                    setSelectedLoanDetail(null);
                    setSubmittingReview(false);
                },
                onError: () => setSubmittingReview(false),
            }
        );
    };

    // Acciones de actualización de estado para préstamos directo
    const updateLoanStatus = (id: number, newEstado: string, comment?: string) => {
        router.post(
            route('prestamos.update', id),
            {
                _method: 'put',
                estado: newEstado,
                respuesta_gestor: comment || undefined,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedLoanDetail(null);
                },
            }
        );
    };

    const renderEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'Pendiente':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-xs">
                        <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                        <span>Pendiente</span>
                    </span>
                );
            case 'Reservado':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        <CheckCircle2 className="w-3 h-3 text-blue-600" />
                        <span>Reservado</span>
                    </span>
                );
            case 'En curso':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        <span>En curso</span>
                    </span>
                );
            case 'Cancelado':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        <X className="w-3 h-3 text-rose-600" />
                        <span>Cancelado</span>
                    </span>
                );
            case 'Completado':
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Completado</span>
                    </span>
                );
        }
    };

    // Filtros de búsqueda
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedPoint, setSelectedPoint] = useState(filters.id_punto || '');
    const [selectedTipo, setSelectedTipo] = useState(filters.tipo_actividad || '');
    const [selectedEstado, setSelectedEstado] = useState(filters.estado || '');
    const [dateFrom, setDateFrom] = useState(filters.fecha_desde || '');
    const [dateTo, setDateTo] = useState(filters.fecha_hasta || '');

    const { data, setData, post, processing, reset, errors } = useForm({
        id_form_pvd: null as number | null,
        nombre_responsable_texto: '',
        id_punto: points[0]?.id_punto || 1,
        tipo_actividad: CATEGORIAS_PRESTAMO[0],
        num_asistentes: 15,
        fecha_prestamo: new Date().toISOString().substring(0, 10),
        hora_inicio: '09:00',
        hora_fin: '11:00',
        observaciones: '',
        estado: 'Completado',
    });

    const verifyCitizen = async (doc: string) => {
        if (!doc) return;
        try {
            const res = await axios.post(route('ciudadanos.verify'), { documento: doc });
            if (res.data.exists && res.data.citizen) {
                setCitizenFound(res.data.citizen);
                setData('id_form_pvd', res.data.citizen.id_form_pvd);
                setData('nombre_responsable_texto', res.data.citizen.nombre_completo);
            } else {
                setCitizenFound(null);
                setData('id_form_pvd', null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('prestamos.index'),
            {
                search: searchTerm,
                id_punto: selectedPoint,
                tipo_actividad: selectedTipo,
                estado: selectedEstado,
                fecha_desde: dateFrom,
                fecha_hasta: dateTo,
                mes: currentMonthStr,
            },
            { preserveState: true }
        );
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedPoint('');
        setSelectedTipo('');
        setSelectedEstado('');
        setDateFrom('');
        setDateTo('');
        router.get(route('prestamos.index'), { mes: currentMonthStr });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('prestamos.store'), {
            onSuccess: () => {
                setModalOpen(false);
                reset();
                setCitizenFound(null);
                setDocumentInput('');
            },
        });
    };

    // Navegación del Calendario
    const [yearNum, monthNum] = currentMonthStr.split('-').map(Number);
    const monthDate = new Date(yearNum, monthNum - 1, 1);
    const monthTitle = monthDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

    const handlePrevMonth = () => {
        const d = new Date(yearNum, monthNum - 2, 1);
        const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        setCurrentMonthStr(str);
        router.get(
            route('prestamos.index'),
            { ...filters, mes: str },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleNextMonth = () => {
        const d = new Date(yearNum, monthNum, 1);
        const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        setCurrentMonthStr(str);
        router.get(
            route('prestamos.index'),
            { ...filters, mes: str },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleToday = () => {
        const now = new Date();
        const str = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        setCurrentMonthStr(str);
        router.get(
            route('prestamos.index'),
            { ...filters, mes: str },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Agrupación de eventos por fecha (YYYY-MM-DD)
    const eventsByDate = useMemo(() => {
        const map: Record<string, Array<any>> = {};
        const allLoans = calendarLoans.length > 0 ? calendarLoans : loans.data || [];
        allLoans.forEach((loan) => {
            const rawDate = loan.fecha_prestamo ? loan.fecha_prestamo.split('T')[0] : '';
            if (rawDate) {
                if (!map[rawDate]) map[rawDate] = [];
                map[rawDate].push(loan);
            }
        });
        return map;
    }, [calendarLoans, loans.data]);

    // Días de la cuadrícula del calendario
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

    const todayDateStr = new Date().toISOString().substring(0, 10);

    const handleQuickSchedule = (dateStr: string) => {
        setData('fecha_prestamo', dateStr);
        setModalOpen(true);
    };

    const getActivityBadgeClass = (tipo: string) => {
        if (tipo?.includes('SENA') || tipo?.includes('Institucionales')) {
            return 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100';
        }
        if (tipo?.includes('JAC') || tipo?.includes('Asambleas')) {
            return 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100';
        }
        if (tipo?.includes('Niñez') || tipo?.includes('ICBF') || tipo?.includes('Sociales')) {
            return 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100';
        }
        if (tipo?.includes('Cine') || tipo?.includes('Culturales')) {
            return 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100';
        }
        return 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100';
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Préstamo de Salas y Espacios</h1>
                        <p className="text-xs text-slate-500 font-medium">
                            {loans.total} préstamos registrados · Gestión de infraestructura comunitaria
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Selector de Modo: Calendario / Lista */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button
                                type="button"
                                onClick={() => setViewMode('calendario')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    viewMode === 'calendario'
                                        ? 'bg-white text-slate-900 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Calendario</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('lista')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    viewMode === 'lista'
                                        ? 'bg-white text-slate-900 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <List className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Lista</span>
                            </button>
                        </div>

                        {/* Botón Registrar */}
                        <button
                            onClick={() => setModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-alcaldia-green hover:bg-alcaldia-green-dark text-white text-xs font-bold shadow-xs transition-all"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Registrar Préstamo</span>
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Préstamo de Salas" />

            {/* Banner de Solicitudes Pendientes de Ciudadanos */}
            {pendingCount > 0 && (
                <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs mb-6">
                    <div className="flex items-center gap-3">
                        <span className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                            <Clock className="w-5 h-5 animate-pulse text-amber-600" />
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
                                    Solicitudes Ciudadanas Pendientes de Confirmación
                                </h4>
                                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black">
                                    {pendingCount}
                                </span>
                            </div>
                            <p className="text-xs text-amber-800/90 mt-0.5">
                                Hay {pendingCount === 1 ? '1 solicitud de préstamo realizada' : `${pendingCount} solicitudes de préstamo realizadas`} por ciudadanos en espera de tu confirmación o rechazo.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setViewMode('lista');
                                setSelectedEstado('Pendiente');
                                router.get(route('prestamos.index'), { estado: 'Pendiente' }, { preserveState: true });
                            }}
                            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 flex items-center gap-1.5"
                        >
                            <Filter className="w-3.5 h-3.5" />
                            <span>Ver Solicitudes Pendientes</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-6">
                <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[220px] relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar por responsable o detalle..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green outline-none"
                        />
                    </div>

                    <div className="w-full sm:w-auto min-w-[170px]">
                        <select
                            value={selectedTipo}
                            onChange={(e) => setSelectedTipo(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:border-alcaldia-green outline-none"
                        >
                            <option value="">Todas las Categorías</option>
                            {(tiposActividad || CATEGORIAS_PRESTAMO).map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full sm:w-auto min-w-[150px]">
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

                    <div className="w-full sm:w-auto min-w-[140px]">
                        <select
                            value={selectedEstado}
                            onChange={(e) => setSelectedEstado(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:border-alcaldia-green outline-none"
                        >
                            <option value="">Todos los Estados</option>
                            <option value="Pendiente">Pendiente (Por Aprobar)</option>
                            <option value="Reservado">Reservado</option>
                            <option value="En curso">En curso</option>
                            <option value="Completado">Completado</option>
                            <option value="Cancelado">Cancelado</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto bg-slate-50/80 px-3 py-1.5 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                            <span className="text-[11px] font-semibold text-slate-500 select-none">Desde:</span>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full sm:w-32 bg-transparent text-xs font-medium text-slate-700 outline-none"
                                title="Fecha inicial"
                            />
                        </div>
                        <span className="text-slate-300 font-bold select-none">|</span>
                        <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                            <span className="text-[11px] font-semibold text-slate-500 select-none">Hasta:</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full sm:w-32 bg-transparent text-xs font-medium text-slate-700 outline-none"
                                title="Fecha final"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            type="submit"
                            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-alcaldia-green text-white text-xs font-bold hover:bg-alcaldia-green-dark transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                        >
                            <Filter className="w-3.5 h-3.5" />
                            Filtrar
                        </button>
                        {(searchTerm || selectedPoint || selectedTipo || dateFrom || dateTo) && (
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 text-xs font-bold hover:bg-slate-50 shrink-0"
                                title="Limpiar filtros"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* VISTA 1: CALENDARIO MENSUAL INTERACTIVO */}
            {viewMode === 'calendario' && (
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
                    {/* Cabecera del Calendario: Mes, Navegación y Hoy */}
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
                                <CalendarDays className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-lg font-black text-slate-900 capitalize tracking-tight">
                                    {monthTitle}
                                </h2>
                                <p className="text-xs text-slate-400 font-medium">
                                    Haz clic en cualquier evento para ver el aforo o en (+) para agendar
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <button
                                onClick={handleToday}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                Hoy
                            </button>
                            <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                                <button
                                    onClick={handlePrevMonth}
                                    className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all"
                                    title="Mes anterior"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleNextMonth}
                                    className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all"
                                    title="Mes siguiente"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Días de la Semana */}
                    <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70 text-center text-xs font-bold text-slate-500 py-2.5">
                        {DIAS_SEMANA.map((dia) => (
                            <div key={dia} className="uppercase tracking-wider text-[11px]">
                                {dia}
                            </div>
                        ))}
                    </div>

                    {/* Cuadrícula de Días */}
                    <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
                        {calendarGridDays.map((item, idx) => {
                            const isToday = item.dateStr === todayDateStr;
                            const dayEvents = eventsByDate[item.dateStr] || [];

                            return (
                                <div
                                    key={`${item.dateStr}-${idx}`}
                                    className={`min-h-[105px] sm:min-h-[120px] p-1.5 sm:p-2 transition-colors relative group flex flex-col justify-between ${
                                        item.isCurrentMonth
                                            ? 'bg-white hover:bg-slate-50/50'
                                            : 'bg-slate-50/40 text-slate-300'
                                    }`}
                                >
                                    {/* Fila superior del día: Número de día y Botón (+) */}
                                    <div className="flex items-center justify-between mb-1">
                                        <span
                                            className={`text-xs font-bold inline-flex items-center justify-center ${
                                                isToday
                                                    ? 'w-6 h-6 rounded-full bg-emerald-600 text-white shadow-xs font-black'
                                                    : item.isCurrentMonth
                                                    ? 'text-slate-800'
                                                    : 'text-slate-400'
                                            }`}
                                        >
                                            {item.dayNumber}
                                        </span>

                                        {item.isCurrentMonth && (
                                            <button
                                                type="button"
                                                onClick={() => handleQuickSchedule(item.dateStr)}
                                                className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-all"
                                                title={`Agendar en ${item.dateStr}`}
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Eventos del día */}
                                    <div className="space-y-1 flex-1 overflow-y-auto max-h-24">
                                        {dayEvents.slice(0, 3).map((event) => (
                                            <button
                                                key={event.id_prestamo}
                                                type="button"
                                                onClick={() => setSelectedLoanDetail(event)}
                                                className={`w-full text-left px-1.5 py-1 rounded-lg border text-[10px] sm:text-[11px] font-semibold transition-all truncate block ${getActivityBadgeClass(
                                                    event.tipo_actividad
                                                )}`}
                                                title={`${event.tipo_actividad} - ${event.num_asistentes} pers.`}
                                            >
                                                <div className="truncate font-bold">
                                                    {event.tipo_actividad}
                                                </div>
                                                <div className="flex items-center justify-between text-[9px] text-slate-500 font-normal">
                                                    <span>{event.punto?.nombre_punto?.split(' ')[0] || 'Sede'}</span>
                                                    {event.estado === 'Pendiente' ? (
                                                        <span className="font-bold text-amber-600 flex items-center gap-0.5 bg-amber-100/80 px-1 rounded">
                                                            <Clock className="w-2.5 h-2.5 animate-pulse" />
                                                            Por aprobar
                                                        </span>
                                                    ) : (
                                                        <span className="font-bold">{event.num_asistentes}p</span>
                                                    )}
                                                </div>
                                            </button>
                                        ))}

                                        {dayEvents.length > 3 && (
                                            <button
                                                type="button"
                                                onClick={() => setSelectedLoanDetail(dayEvents[0])}
                                                className="w-full text-center text-[10px] font-bold text-slate-500 hover:text-slate-800 py-0.5"
                                            >
                                                +{dayEvents.length - 3} más
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* VISTA 2: LISTA / TABLA TRADICIONAL */}
            {viewMode === 'lista' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden mb-6">
                    {/* Desktop Table (>= md) */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                                <tr>
                                    <th className="px-5 py-3.5">Responsable / Solicitante</th>
                                    <th className="px-4 py-3.5">Categoría de Actividad</th>
                                    <th className="px-4 py-3.5">Detalle / Observaciones</th>
                                    <th className="px-4 py-3.5">Sede PVD</th>
                                    <th className="px-4 py-3.5">Asistentes</th>
                                    <th className="px-4 py-3.5">Estado</th>
                                    <th className="px-4 py-3.5 text-center">Acciones</th>
                                    <th className="px-5 py-3.5 text-right">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loans.data.map((loan) => (
                                    <tr
                                        key={loan.id_prestamo}
                                        onClick={() => setSelectedLoanDetail(loan)}
                                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                                    >
                                        <td className="px-5 py-3.5">
                                            <div className="font-bold text-slate-900 text-xs">
                                                {loan.ciudadano?.nombre_completo || loan.nombre_responsable_texto || 'Responsable'}
                                            </div>
                                            <div className="text-[11px] text-slate-400">
                                                {loan.ciudadano ? `CC ${loan.ciudadano.documento}` : 'Entidad / Particular'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-alcaldia-green border border-emerald-200">
                                                {loan.tipo_actividad}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-slate-600 max-w-[240px]">
                                            <div className="truncate" title={loan.observaciones || '-'}>{loan.observaciones || '-'}</div>
                                            {loan.respuesta_gestor && (
                                                <div className={`mt-1 text-[10px] font-medium p-1 rounded-md flex items-center gap-1 ${
                                                    loan.estado === 'Cancelado' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                                                }`} title={loan.respuesta_gestor}>
                                                    <MessageSquare className="w-3 h-3 shrink-0" />
                                                    <span className="truncate">{loan.respuesta_gestor}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-slate-600 font-medium whitespace-nowrap">
                                            {loan.punto?.nombre_punto}
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-slate-700 font-semibold whitespace-nowrap">{loan.num_asistentes} pers.</td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            {renderEstadoBadge(loan.estado)}
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap text-center">
                                            {loan.estado === 'Pendiente' ? (
                                                <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        type="button"
                                                        onClick={() => openReviewModal(loan, 'Reservado')}
                                                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-colors flex items-center gap-1"
                                                        title="Aprobar y Confirmar Reserva"
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        <span>Aprobar</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openReviewModal(loan, 'Cancelado')}
                                                        className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition-colors flex items-center gap-1"
                                                        title="Rechazar Solicitud"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                        <span>Rechazar</span>
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedLoanDetail(loan);
                                                    }}
                                                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                                                    title="Ver Detalle"
                                                >
                                                    <Info className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 text-right text-xs font-bold text-slate-800 whitespace-nowrap">
                                            {loan.fecha_prestamo ? loan.fecha_prestamo.split('T')[0] : '-'}
                                        </td>
                                    </tr>
                                ))}
                                {loans.data.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-5 py-10 text-center text-slate-400 text-xs">
                                            No se encontraron préstamos que coincidan con los filtros seleccionados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards View (< md) */}
                    <div className="md:hidden divide-y divide-slate-100">
                        {loans.data.map((loan) => (
                            <div
                                key={loan.id_prestamo}
                                onClick={() => setSelectedLoanDetail(loan)}
                                className="p-4 space-y-2.5 hover:bg-slate-50/80 transition-colors cursor-pointer"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="font-bold text-slate-900 text-sm">
                                            {loan.ciudadano?.nombre_completo || loan.nombre_responsable_texto || 'Responsable'}
                                        </div>
                                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                                            {loan.ciudadano ? `CC ${loan.ciudadano.documento}` : 'Entidad / Particular'}
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        {renderEstadoBadge(loan.estado)}
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-alcaldia-green border border-emerald-200">
                                            {loan.tipo_actividad}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-700">
                                            {loan.num_asistentes} asistentes
                                        </span>
                                    </div>
                                    {loan.observaciones && (
                                        <div className="text-[11px] text-slate-500 italic pt-0.5">
                                            "{loan.observaciones}"
                                        </div>
                                    )}
                                    {loan.respuesta_gestor && (
                                        <div className={`mt-1 text-[10px] font-medium p-1.5 rounded-lg flex items-center gap-1.5 ${
                                            loan.estado === 'Cancelado' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                                        }`}>
                                            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                                            <span><strong>Gestor:</strong> {loan.respuesta_gestor}</span>
                                        </div>
                                    )}
                                </div>

                                {loan.estado === 'Pendiente' && (
                                    <div className="pt-2 flex items-center gap-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            type="button"
                                            onClick={() => openReviewModal(loan, 'Reservado')}
                                            className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>Aprobar Reserva</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openReviewModal(loan, 'Cancelado')}
                                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                            <span>Rechazar</span>
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                                        <span className="w-1.5 h-1.5 rounded-full bg-alcaldia-green"></span>
                                        <span>{loan.punto?.nombre_punto}</span>
                                    </div>
                                    <span className="font-medium text-slate-600">
                                        {loan.fecha_prestamo ? loan.fecha_prestamo.split('T')[0] : '-'}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {loans.data.length === 0 && (
                            <div className="p-8 text-center text-slate-400 text-xs">
                                No se encontraron préstamos que coincidan con los filtros seleccionados.
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                        <div>
                            Mostrando <span className="font-bold text-slate-800">{loans.from || 0}</span> a{' '}
                            <span className="font-bold text-slate-800">{loans.to || 0}</span> de{' '}
                            <span className="font-bold text-slate-800">{loans.total}</span> préstamos
                        </div>
                        <div className="flex items-center gap-1">
                            {loans.links?.map((link: any, i: number) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                        link.active
                                            ? 'bg-alcaldia-green text-white'
                                            : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Detalle de Evento del Calendario */}
            {selectedLoanDetail && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <DoorOpen className="w-5 h-5 text-emerald-600" />
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                    Detalle del Préstamo de Sala
                                </h3>
                            </div>
                            <button
                                onClick={() => setSelectedLoanDetail(null)}
                                className="text-slate-400 hover:text-slate-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3.5 text-xs">
                            <div>
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Categoría de Actividad</span>
                                <div className="font-bold text-slate-900 text-sm mt-0.5">
                                    {selectedLoanDetail.tipo_actividad}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Fecha</span>
                                    <div className="font-bold text-slate-800 text-xs mt-0.5 flex items-center gap-1">
                                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{selectedLoanDetail.fecha_prestamo ? selectedLoanDetail.fecha_prestamo.split('T')[0] : '-'}</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Asistentes</span>
                                    <div className="font-bold text-slate-800 text-xs mt-0.5 flex items-center gap-1">
                                        <Users className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{selectedLoanDetail.num_asistentes} personas</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Sede PVD</span>
                                    <div className="font-medium text-slate-700 mt-0.5 flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>{selectedLoanDetail.punto?.nombre_punto}</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Estado</span>
                                    <div className="mt-0.5">
                                        {renderEstadoBadge(selectedLoanDetail.estado)}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Responsable / Solicitante</span>
                                <div className="font-bold text-slate-800 mt-0.5">
                                    {selectedLoanDetail.ciudadano?.nombre_completo || selectedLoanDetail.nombre_responsable_texto || 'Particular'}
                                </div>
                                {selectedLoanDetail.ciudadano && (
                                    <div className="text-[11px] text-slate-400 font-mono">
                                        CC {selectedLoanDetail.ciudadano.documento}
                                    </div>
                                )}
                            </div>

                            {selectedLoanDetail.observaciones && (
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Observaciones del Ciudadano</span>
                                    <p className="text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-0.5">
                                        "{selectedLoanDetail.observaciones}"
                                    </p>
                                </div>
                            )}

                            {selectedLoanDetail.respuesta_gestor && (
                                <div className={`p-3 rounded-2xl border text-xs ${
                                    selectedLoanDetail.estado === 'Cancelado'
                                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                }`}>
                                    <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] mb-1">
                                        {selectedLoanDetail.estado === 'Cancelado' ? (
                                            <>
                                                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                                <span>Motivo de Rechazo (Gestor):</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>Indicaciones del Gestor:</span>
                                            </>
                                        )}
                                    </div>
                                    <p className="font-medium whitespace-pre-wrap leading-relaxed">
                                        {selectedLoanDetail.respuesta_gestor}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                            {selectedLoanDetail.estado === 'Pendiente' ? (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => openReviewModal(selectedLoanDetail, 'Reservado')}
                                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Aprobar Reserva</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => openReviewModal(selectedLoanDetail, 'Cancelado')}
                                        className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors flex items-center gap-1"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        <span>Rechazar</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="text-[11px] text-slate-400">
                                    {selectedLoanDetail.gestor?.name ? `Gestor responsable: ${selectedLoanDetail.gestor.name}` : ''}
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => setSelectedLoanDetail(null)}
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Registro de Préstamo */}
            {modalOpen && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <DoorOpen className="w-5 h-5 text-emerald-600" />
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Registrar Préstamo de Sala</h3>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Cédula del Responsable</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Ingrese número de cédula..."
                                        value={documentInput}
                                        onChange={(e) => setDocumentInput(e.target.value)}
                                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-alcaldia-green"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => verifyCitizen(documentInput)}
                                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
                                    >
                                        Buscar
                                    </button>
                                </div>
                                {citizenFound ? (
                                    <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>{citizenFound.nombre_completo}</span>
                                    </p>
                                ) : (
                                    <input
                                        type="text"
                                        placeholder="O ingrese nombre de entidad o persona si no está registrado..."
                                        value={data.nombre_responsable_texto}
                                        onChange={(e) => setData('nombre_responsable_texto', e.target.value)}
                                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium mt-2 outline-none focus:border-alcaldia-green"
                                    />
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Categoría de Actividad *</label>
                                <select
                                    value={data.tipo_actividad}
                                    onChange={(e) => setData('tipo_actividad', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-alcaldia-green"
                                    required
                                >
                                    {CATEGORIAS_PRESTAMO.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Sede PVD *</label>
                                    <select
                                        value={data.id_punto}
                                        onChange={(e) => setData('id_punto', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-alcaldia-green"
                                        required
                                    >
                                        {points.map((p) => (
                                            <option key={p.id_punto} value={p.id_punto}>
                                                {p.nombre_punto}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">N° Asistentes *</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={data.num_asistentes}
                                        onChange={(e) => setData('num_asistentes', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-alcaldia-green"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Fecha del Préstamo *</label>
                                <input
                                    type="date"
                                    value={data.fecha_prestamo}
                                    onChange={(e) => setData('fecha_prestamo', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-alcaldia-green"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Detalle / Observaciones</label>
                                <textarea
                                    rows={2}
                                    placeholder="Motivo de la reunión, entidad solicitante, equipos requeridos..."
                                    value={data.observaciones}
                                    onChange={(e) => setData('observaciones', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-alcaldia-green"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2 rounded-xl bg-alcaldia-green hover:bg-alcaldia-green-dark text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>{processing ? 'Guardando...' : 'Guardar Préstamo'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Revisión y Comentarios del Gestor */}
            {reviewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                        {/* Header del Modal */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                                    reviewModal.action === 'Cancelado'
                                        ? 'bg-rose-100 text-rose-600'
                                        : 'bg-emerald-100 text-emerald-600'
                                }`}>
                                    {reviewModal.action === 'Cancelado' ? (
                                        <X className="w-5 h-5" />
                                    ) : (
                                        <CheckCircle2 className="w-5 h-5" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">
                                        {reviewModal.action === 'Cancelado'
                                            ? 'Rechazar Solicitud de Sala'
                                            : 'Aprobar Solicitud de Sala'}
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        {reviewModal.action === 'Cancelado'
                                            ? 'Explica al ciudadano la razón del rechazo para no dejar vacíos.'
                                            : 'Confirma la reserva e ingresa recomendaciones si es necesario.'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setReviewModal(null)}
                                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Resumen de la Solicitud */}
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                            <div className="flex justify-between font-bold text-slate-800">
                                <span>{reviewModal.loan.nombre || reviewModal.loan.nombre_responsable_texto || reviewModal.loan.ciudadano?.nombre_completo || 'Ciudadano'}</span>
                                <span className="text-emerald-700">{reviewModal.loan.punto?.nombre_punto}</span>
                            </div>
                            <div className="text-slate-500 text-[11px] flex items-center gap-2">
                                <span>{reviewModal.loan.fecha_prestamo ? String(reviewModal.loan.fecha_prestamo).split('T')[0] : ''}</span>
                                <span>•</span>
                                <span>{reviewModal.loan.tipo_actividad}</span>
                                <span>•</span>
                                <span>{reviewModal.loan.num_asistentes} personas</span>
                            </div>
                            {reviewModal.loan.observaciones && (
                                <div className="text-[11px] text-slate-600 italic pt-1 border-t border-slate-200/60">
                                    Motivo del ciudadano: "{reviewModal.loan.observaciones}"
                                </div>
                            )}
                        </div>

                        {/* Selector de Categoría Oficial al Aprobar */}
                        {reviewModal.action === 'Reservado' && (
                            <div className="space-y-1.5 p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
                                <label className="block text-xs font-bold text-emerald-950">
                                    Clasificación / Categoría Oficial de la Actividad *
                                </label>
                                <select
                                    value={reviewCategory}
                                    onChange={(e) => setReviewCategory(e.target.value)}
                                    className="w-full text-xs rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 p-2.5 font-semibold text-slate-800 bg-white outline-none"
                                >
                                    {CATEGORIAS_PRESTAMO.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-emerald-800 font-medium">
                                    Confirme o reclasifique la categoría estándar con la que se consolidarán las estadísticas.
                                </p>
                            </div>
                        )}

                        {/* Campo de Comentario / Motivo */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700">
                                {reviewModal.action === 'Cancelado'
                                    ? 'Motivo del Rechazo (Visible para el ciudadano en su portal) *'
                                    : 'Indicaciones o Recomendaciones (Opcional)'}
                            </label>
                            <textarea
                                rows={3}
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                placeholder={
                                    reviewModal.action === 'Cancelado'
                                        ? 'Escribe claramente por qué se rechaza la solicitud (ej: sala ocupada, mantenimiento técnico, etc.)...'
                                        : 'Indicaciones sobre hora de llegada, cuidado de equipos, etc...'
                                }
                                className="w-full text-xs rounded-2xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 p-3 leading-relaxed shadow-xs"
                                autoFocus
                            />

                            {/* Chips con motivos rápidos */}
                            <div className="space-y-1 pt-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Sugerencias rápidas (clic para insertar):
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {QUICK_REASONS[reviewModal.action].map((reason, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setReviewComment(reason)}
                                            className="text-[10px] font-medium px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-left"
                                        >
                                            {reason}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Botones de Acción */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                disabled={submittingReview}
                                onClick={() => setReviewModal(null)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={submittingReview || (reviewModal.action === 'Cancelado' && !reviewComment.trim())}
                                onClick={submitReview}
                                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all flex items-center gap-1.5 ${
                                    reviewModal.action === 'Cancelado'
                                        ? 'bg-rose-600 hover:bg-rose-700 disabled:opacity-50'
                                        : 'bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50'
                                }`}
                            >
                                {submittingReview ? (
                                    <span>Guardando...</span>
                                ) : reviewModal.action === 'Cancelado' ? (
                                    <>
                                        <X className="w-4 h-4" />
                                        <span>Confirmar Rechazo</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Confirmar Aprobación</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
