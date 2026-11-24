import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    Monitor,
    Calendar,
    Users,
    CheckCircle2,
    ArrowRight,
    MapPin,
    Shield,
    FileText,
    Sparkles,
    Phone,
    Mail,
    Clock,
    ChevronRight,
    LogIn,
    UserPlus,
    Building2,
    Award,
    Wifi,
    GraduationCap,
    BookOpen,
    Send,
    HelpCircle,
    Check,
    Navigation,
    ExternalLink,
    X,
    Filter,
} from 'lucide-react';
import { asset } from '@/utils/asset';

interface Point {
    id_punto: number;
    nombre_punto: string;
    alias?: string;
    barrio?: string;
    zona?: string;
    direccion?: string;
    equipos?: string;
    horario?: string;
    map_query?: string;
    badge?: string;
    tipo_sede?: string;
    telefono?: string;
}

interface Training {
    id_capacitacion: number;
    id_punto: number | null;
    titulo: string;
    slug: string;
    descripcion: string;
    categoria: string;
    tipo: string;
    instructor: string | null;
    fecha_inicio: string | null;
    fecha_fin: string | null;
    horario: string | null;
    duracion_horas: number;
    cupos_totales: number;
    cupos_disponibles: number;
    requisitos: string | null;
    dirigido_a: string | null;
    color_tema: string;
    destacado: boolean;
    punto?: {
        id_punto: number;
        nombre_punto: string;
        zona: string;
    } | null;
}

interface Props {
    points: Point[];
    capacitaciones: Training[];
    statsSummary: {
        ciudadanos: number;
        atenciones: number;
        sedes_activas: number;
        costo: string;
    };
}

export default function Welcome({ points = [], capacitaciones = [], statsSummary }: Props) {
    const { flash } = usePage<any>().props;

    // Estado para filtro de capacitaciones
    const [categoriaFilter, setCategoriaFilter] = useState('todas');
    const [selectedCourseForModal, setSelectedCourseForModal] = useState<Training | null>(null);

    // Formulario de preinscripción rápida
    const inscriptionForm = useForm({
        id_capacitacion: '',
        documento: '',
        nombres: '',
        apellidos: '',
        telefono: '',
        correo: '',
    });

    const openInscriptionModal = (course: Training) => {
        setSelectedCourseForModal(course);
        inscriptionForm.setData({
            id_capacitacion: String(course.id_capacitacion),
            documento: '',
            nombres: '',
            apellidos: '',
            telefono: '',
            correo: '',
        });
        inscriptionForm.clearErrors();
    };

    const handleInscriptionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        inscriptionForm.post(route('capacitaciones.inscribirse'), {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedCourseForModal(null);
                inscriptionForm.reset();
            },
        });
    };

    const categoriasList = [
        'todas',
        ...Array.from(new Set(capacitaciones.map((c) => c.categoria))),
    ];

    const filteredCourses = categoriaFilter === 'todas'
        ? capacitaciones
        : capacitaciones.filter((c) => c.categoria === categoriaFilter);

    // Sede preseleccionada para visualización de mapa
    const [selectedPointIndex, setSelectedPointIndex] = useState(0);
    const activePoint = points[selectedPointIndex] || points[0];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
            <Head title="PuntoTIC · Red de Puntos y Aulas Digitales · Alcaldía de Acacías" />

            {/* MENSAJES FLASH DE CONFIRMACIÓN */}
            {flash?.success && (
                <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-3 text-center sticky top-0 z-50 shadow-md flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{flash.success}</span>
                </div>
            )}
            {flash?.info && (
                <div className="bg-blue-600 text-white text-xs font-bold px-4 py-3 text-center sticky top-0 z-50 shadow-md flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{flash.info}</span>
                </div>
            )}

            {/* =========================================================================
                1. HEADER / BARRA DE NAVEGACIÓN SUPERIOR
               ========================================================================= */}
            <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    {/* Logotipo y Título Oficial */}
                    <Link href="#inicio" className="flex items-center gap-3 group">
                        <div className="bg-white p-1.5 px-3 rounded-xl shadow-xs border border-slate-200 flex items-center justify-center transition-transform group-hover:scale-105">
                            <img
                                src={asset('images/logo_alcaldia.png')}
                                alt="Alcaldía de Acacías"
                                className="h-10 sm:h-11 w-auto object-contain"
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black text-white tracking-tight">PuntoTIC</span>
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                                    Acacías
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                                Red de Puntos Vive Digital y Aulas Digitales
                            </p>
                        </div>
                    </Link>

                    {/* Menús de Navegación Exclusivos: Inicio, Capacitaciones, Sedes, Contacto */}
                    <nav className="hidden md:flex items-center gap-1.5">
                        <a
                            href="#inicio"
                            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
                        >
                            Inicio (Préstamos)
                        </a>
                        <a
                            href="#capacitaciones"
                            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition-colors flex items-center gap-1.5"
                        >
                            <span>Capacitaciones</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        </a>
                        <a
                            href="#sedes"
                            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
                        >
                            Sedes (4)
                        </a>
                        <a
                            href="#contacto"
                            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
                        >
                            Contacto
                        </a>
                    </nav>

                    {/* Botones de Acción (Ingreso y Solicitud de Sala) */}
                    <div className="flex items-center gap-2.5">
                        <Link
                            href={route('login')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition-all border border-slate-800"
                        >
                            <LogIn className="w-3.5 h-3.5 text-slate-400" />
                            <span>Ingreso</span>
                        </Link>

                        <Link
                            href={route('register')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20 transition-all shrink-0"
                        >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Solicitar Sala</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* =========================================================================
                2. SECCIÓN INICIO: HERO PRINCIPAL & SOLICITUD DE PRÉSTAMO DE SALAS
               ========================================================================= */}
            <section id="inicio" className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
                {/* Iluminación ambiental de fondo */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-gradient-to-tr from-emerald-600/20 via-teal-500/10 to-transparent blur-3xl pointer-events-none rounded-full"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Badge y Titular Hero */}
                    <div className="text-center max-w-4xl mx-auto space-y-4">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Alcaldía Municipal de Acacías · Secretaría de las TIC</span>
                        </div>

                        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                            Espacios Tecnológicos y Conectividad para la Comunidad
                        </h1>

                        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                            Reserva salas de cómputo con internet de alta velocidad para capacitaciones, talleres comunitarios, reuniones de JAC y formación digital 100% gratuita en Acacías.
                        </p>
                    </div>

                    {/* Módulo Interactivo Destacado: Solicitud de Préstamo de Sala */}
                    <div className="mt-12 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md max-w-4xl mx-auto">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                            <div>
                                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                                    <Monitor className="w-4 h-4" />
                                    <span>Servicio Oficial Ciudadano</span>
                                </span>
                                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                                    Solicitar Préstamo de Sala Tecnológica
                                </h2>
                                <p className="text-xs text-slate-400 mt-1">
                                    Para líderes comunales, docentes, fundaciones, estudiantes y ciudadanía en general.
                                </p>
                            </div>

                            <Link
                                href={route('register')}
                                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all shrink-0"
                            >
                                <span>Iniciar Solicitud Online</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {/* Pasos de Reserva */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
                            <div className="flex gap-3.5">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black text-sm shrink-0 border border-emerald-500/20">
                                    1
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xs font-bold text-white">Elige la Sede</h3>
                                    <p className="text-[11px] text-slate-400 leading-relaxed">
                                        Selecciona Juan Rozo (PLUS), Las Colinas, Chichimene o Dinamarca.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3.5">
                                <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-black text-sm shrink-0 border border-teal-500/20">
                                    2
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xs font-bold text-white">Define Fecha y Motivo</h3>
                                    <p className="text-[11px] text-slate-400 leading-relaxed">
                                        Indica la franja horaria, número de asistentes y propósito del evento.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3.5">
                                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-black text-sm shrink-0 border border-blue-500/20">
                                    3
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xs font-bold text-white">Aprobación por el Gestor</h3>
                                    <p className="text-[11px] text-slate-400 leading-relaxed">
                                        El gestor valida la disponibilidad y te confirma la reserva oficial.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Beneficios Institucionales */}
                        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                            <div>
                                <div className="text-lg font-black text-emerald-400">100% Gratuito</div>
                                <div className="text-[10px] text-slate-400 uppercase font-bold">Sin costo alguno</div>
                            </div>
                            <div>
                                <div className="text-lg font-black text-white">300 Mbps</div>
                                <div className="text-[10px] text-slate-400 uppercase font-bold">Fibra Óptica</div>
                            </div>
                            <div>
                                <div className="text-lg font-black text-white">28 Portátiles</div>
                                <div className="text-[10px] text-slate-400 uppercase font-bold">Por Sala Sede</div>
                            </div>
                            <div>
                                <div className="text-lg font-black text-emerald-400">4 Sedes</div>
                                <div className="text-[10px] text-slate-400 uppercase font-bold">Urbana & Rural</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* =========================================================================
                3. SECCIÓN CAPACITACIONES: CATÁLOGO DE CURSOS Y TALLERES PÚBLICOS
               ========================================================================= */}
            <section id="capacitaciones" className="py-20 bg-slate-900/60 border-y border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Encabezado de la Sección */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                        <div>
                            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                                <GraduationCap className="w-4 h-4" />
                                <span>Formación y Alfabetización Digital</span>
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                                Capacitaciones y Cursos Abiertos
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                                Desarrolla habilidades digitales con cursos certificados y talleres prácticos en tu sede PVD más cercana.
                            </p>
                        </div>

                        {/* Filtros por Categoría */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            {categoriasList.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategoriaFilter(cat)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${
                                        categoriaFilter === cat
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
                                    }`}
                                >
                                    {cat === 'todas' ? 'Todos los Cursos' : cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grilla Dinámica de Cursos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCourses.map((c) => (
                            <div
                                key={c.id_capacitacion}
                                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-950/20 transition-all group"
                            >
                                <div className="space-y-3.5">
                                    {/* Insignias de Cabecera */}
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            {c.tipo}
                                        </span>
                                        <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                                            100% Gratuito
                                        </span>
                                    </div>

                                    {/* Título y Categoría */}
                                    <div>
                                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                            {c.categoria}
                                        </div>
                                        <h3 className="text-base font-black text-white mt-1 group-hover:text-emerald-400 transition-colors leading-snug">
                                            {c.titulo}
                                        </h3>
                                    </div>

                                    {/* Descripción */}
                                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                                        {c.descripcion}
                                    </p>

                                    {/* Ficha Técnica / Metadatos */}
                                    <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                            <span className="truncate font-medium">
                                                {c.punto ? c.punto.nombre_punto : 'Toda la Red / Virtual'}
                                            </span>
                                        </div>

                                        {c.horario && (
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                <span className="truncate">{c.horario}</span>
                                            </div>
                                        )}

                                        {c.instructor && (
                                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                                <span className="text-slate-500">Instructor:</span>
                                                <span className="truncate font-semibold text-slate-300">{c.instructor}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Barra de Cupos Disponibles */}
                                    <div className="pt-2">
                                        <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                                            <span className="text-slate-400">Cupos restantes:</span>
                                            <span className="text-emerald-400">
                                                {c.cupos_disponibles} de {c.cupos_totales} disponibles
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                                                style={{
                                                    width: `${Math.min(
                                                        100,
                                                        Math.max(10, ((c.cupos_totales - c.cupos_disponibles) / c.cupos_totales) * 100)
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Botón de Preinscripción */}
                                <div className="pt-5 mt-4 border-t border-slate-800/80">
                                    <button
                                        type="button"
                                        onClick={() => openInscriptionModal(c)}
                                        className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm group-hover:bg-emerald-600"
                                    >
                                        <BookOpen className="w-3.5 h-3.5" />
                                        <span>Preinscribirme Gratis</span>
                                    </button>
                                </div>
                            </div>
                        ))}

                        {filteredCourses.length === 0 && (
                            <div className="col-span-full p-12 text-center text-slate-400 bg-slate-900 rounded-3xl border border-slate-800">
                                <GraduationCap className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                                <div className="text-sm font-bold text-white">No hay cursos disponibles en esta categoría</div>
                                <p className="text-xs text-slate-500 mt-1">Pronto publicaremos nuevas capacitaciones para la comunidad.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* =========================================================================
                4. SECCIÓN SEDES: LAS 4 SEDES PVD Y AULAS DIGITALES CON UBICACIÓN
               ========================================================================= */}
            <section id="sedes" className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <span className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            <span>Presencia en el Territorio</span>
                        </span>
                        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-1">
                            Nuestras 4 Sedes en Acacías
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-400 mt-2">
                            Puntos Vive Digital urbanos y Aulas Digitales rurales equipadas para el acceso a la tecnología.
                        </p>
                    </div>

                    {/* Tarjetas de las 4 Sedes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {points.map((p, idx) => (
                            <div
                                key={p.id_punto}
                                className={`rounded-3xl p-6 border transition-all flex flex-col justify-between cursor-pointer ${
                                    selectedPointIndex === idx
                                        ? 'bg-slate-900 border-emerald-500 shadow-xl shadow-emerald-950/30 ring-2 ring-emerald-500/20'
                                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                                }`}
                                onClick={() => setSelectedPointIndex(idx)}
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span
                                            className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                                                p.zona === 'Rural'
                                                    ? 'bg-amber-400/10 text-amber-400 border-amber-400/20'
                                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            }`}
                                        >
                                            {p.badge || (p.zona === 'Rural' ? 'Aula Rural' : 'Sede Urbana')}
                                        </span>
                                        <span className="text-[11px] font-bold text-slate-500">Sede #{idx + 1}</span>
                                    </div>

                                    <h3 className="text-base font-black text-white leading-snug">
                                        {p.alias || p.nombre_punto}
                                    </h3>

                                    <div className="space-y-2 text-xs text-slate-400 pt-1">
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                            <span>{p.direccion}</span>
                                        </div>

                                        <div className="flex items-start gap-2">
                                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                            <span className="text-[11px]">{p.horario || 'Lunes a Viernes 8:00 AM - 5:00 PM'}</span>
                                        </div>

                                        <div className="flex items-start gap-2">
                                            <Wifi className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                                            <span className="text-[11px] text-slate-300">
                                                {p.equipos || 'Equipos de cómputo y conectividad de alta velocidad'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-5 mt-4 border-t border-slate-800">
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                            p.map_query || `${p.nombre_punto}, Acacias, Meta`
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-colors"
                                    >
                                        <ExternalLink className="w-3 h-3 text-emerald-400" />
                                        <span>Ver Ubicación en Maps</span>
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Ficha Detallada de la Sede Seleccionada */}
                    {activePoint && (
                        <div className="mt-8 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-2 flex-1">
                                <div className="text-xs font-black text-emerald-400 uppercase tracking-widest">
                                    Detalle de la Sede Seleccionada
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black text-white">
                                    {activePoint.alias || activePoint.nombre_punto}
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                                    Ubicada en <strong className="text-white">{activePoint.direccion}</strong> ({activePoint.barrio}). Equipada con {activePoint.equipos}. Ideal para cursos certificados, trámites en línea y préstamo de sala a juntas comunales.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                                <Link
                                    href={route('register')}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
                                >
                                    <UserPlus className="w-3.5 h-3.5" />
                                    <span>Solicitar Sala en esta Sede</span>
                                </Link>

                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                        activePoint.map_query || `${activePoint.nombre_punto}, Acacias, Meta`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all"
                                >
                                    <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Cómo Llegar</span>
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* =========================================================================
                5. SECCIÓN CONTACTO & CANALES DE ATENCIÓN CIUDADANA
               ========================================================================= */}
            <section id="contacto" className="py-20 bg-slate-900/60 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                        <div className="space-y-4">
                            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Phone className="w-4 h-4" />
                                <span>Atención y Soporte al Ciudadano</span>
                            </span>
                            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                                ¿Tienes Dudas sobre los Cursos o el Préstamo de Salas?
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                Nuestro equipo de facilitadores de la Secretaría de las TIC está disponible para orientarte en la inscripción de talleres, trámites gubernamentales o en la reserva de salas para tu comunidad.
                            </p>

                            <div className="space-y-3 pt-3">
                                <div className="flex items-center gap-3 text-xs text-slate-300">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Correo Electrónico</span>
                                        <span className="font-bold text-white">tic@acacias.gov.co</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-xs text-slate-300">
                                    <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                                        <Building2 className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Secretaría TIC</span>
                                        <span className="font-bold text-white">Alcaldía Municipal de Acacías · Meta</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Caja Informativa de Trámites */}
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
                            <h3 className="text-base font-black text-white flex items-center gap-2">
                                <Shield className="w-4 h-4 text-emerald-400" />
                                <span>Trámites Gratuitos en tu PuntoTIC</span>
                            </h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                En cualquier sede PVD puedes solicitar el acompañamiento de nuestros facilitadores para:
                            </p>

                            <ul className="space-y-2 text-xs text-slate-300">
                                <li className="flex items-center gap-2">
                                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span>Consulta y certificado del SISBÉN IV</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span>Certificados de antecedentes (Policía, Procuraduría, Contraloría)</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span>Consulta de RUNT, comparendos y estado tributario municipal</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span>Impresión y copiado de documentos educativos o de salud</span>
                                </li>
                            </ul>

                            <div className="pt-4 border-t border-slate-800">
                                <Link
                                    href={route('login')}
                                    className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
                                >
                                    <span>Acceder como Gestor o Funcionario</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* =========================================================================
                6. FOOTER INSTITUCIONAL
               ========================================================================= */}
            <footer className="border-t border-slate-800 bg-slate-950 py-10 text-xs text-slate-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-400">PuntoTIC Acacías</span>
                        <span>·</span>
                        <span>Red de Puntos Vive Digital y Aulas Digitales</span>
                    </div>

                    <div className="text-[11px] text-slate-500">
                        Alcaldía Municipal de Acacías · Secretaría de las Tecnologías de la Información y las Comunicaciones (TIC)
                    </div>
                </div>
            </footer>

            {/* =========================================================================
                7. MODAL DE PREINSCRIPCIÓN RÁPIDA A CAPACITACIONES
               ========================================================================= */}
            {selectedCourseForModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-4 shadow-2xl animate-scale-in">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                                    <GraduationCap className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white">Preinscripción Gratuita</h3>
                                    <p className="text-[11px] text-slate-400 truncate max-w-xs">{selectedCourseForModal.titulo}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedCourseForModal(null)}
                                className="text-slate-400 hover:text-white p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleInscriptionSubmit} className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-300 mb-1">
                                    Número de Documento (Cédula o T.I.) *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: 1121890123"
                                    value={inscriptionForm.data.documento}
                                    onChange={(e) => inscriptionForm.setData('documento', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-bold"
                                />
                                {inscriptionForm.errors.documento && (
                                    <div className="text-[11px] text-rose-400 mt-1">{inscriptionForm.errors.documento}</div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">Nombres *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Tus nombres"
                                        value={inscriptionForm.data.nombres}
                                        onChange={(e) => inscriptionForm.setData('nombres', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">Apellidos *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Tus apellidos"
                                        value={inscriptionForm.data.apellidos}
                                        onChange={(e) => inscriptionForm.setData('apellidos', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">Teléfono / WhatsApp *</label>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="Ej: 3101234567"
                                        value={inscriptionForm.data.telefono}
                                        onChange={(e) => inscriptionForm.setData('telefono', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        placeholder="tu@correo.com"
                                        value={inscriptionForm.data.correo}
                                        onChange={(e) => inscriptionForm.setData('correo', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                                    />
                                </div>
                            </div>

                            <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                                Al preinscribirte, autorizas el tratamiento de datos personales conforme a la política municipal para fines educativos y confirmación de cupo.
                            </p>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setSelectedCourseForModal(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={inscriptionForm.processing}
                                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
                                >
                                    Confirmar Preinscripción
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
