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

export default function RoomLoansIndex({
    loans,
    calendarLoans = [],
    selectedMonth,
    filters,
    points,
    tiposActividad,
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

    // Filtros de búsqueda
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedPoint, setSelectedPoint] = useState(filters.id_punto || '');
    const [selectedTipo, setSelectedTipo] = useState(filters.tipo_actividad || '');
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
                                                    <span className="font-bold">{event.num_asistentes}p</span>
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
                                    <th className="px-5 py-3.5 text-right">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loans.data.map((loan) => (
                                    <tr key={loan.id_prestamo} className="hover:bg-slate-50/80 transition-colors">
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
                                        <td className="px-4 py-3.5 text-xs text-slate-600 max-w-[260px] truncate" title={loan.observaciones || '-'}>
                                            {loan.observaciones || '-'}
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-slate-600 font-medium whitespace-nowrap">
                                            {loan.punto?.nombre_punto}
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-slate-700 font-semibold whitespace-nowrap">{loan.num_asistentes} pers.</td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                                {loan.estado}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right text-xs font-bold text-slate-800 whitespace-nowrap">
                                            {loan.fecha_prestamo ? loan.fecha_prestamo.split('T')[0] : '-'}
                                        </td>
                                    </tr>
                                ))}
                                {loans.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-xs">
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
                            <div key={loan.id_prestamo} className="p-4 space-y-2.5 hover:bg-slate-50/80 transition-colors">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="font-bold text-slate-900 text-sm">
                                            {loan.ciudadano?.nombre_completo || loan.nombre_responsable_texto || 'Responsable'}
                                        </div>
                                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                                            {loan.ciudadano ? `CC ${loan.ciudadano.documento}` : 'Entidad / Particular'}
                                        </div>
                                    </div>
                                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                                        {loan.estado}
                                    </span>
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
                                </div>

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
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                            {selectedLoanDetail.estado}
                                        </span>
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
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Observaciones</span>
                                    <p className="text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-0.5">
                                        "{selectedLoanDetail.observaciones}"
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
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
        </AuthenticatedLayout>
    );
}
