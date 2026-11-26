import React, { useState, useEffect, useCallback } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    Calendar,
    Users,
    CheckCircle2,
    MapPin,
    Clock,
    LogIn,
    Building2,
    GraduationCap,
    ExternalLink,
    X,
    Mail,
    ChevronLeft,
    ChevronRight,
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
    map_url?: string;
    badge?: string;
    tipo_sede?: string;
    telefono?: string;
    imagen?: string;
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
    destacado: boolean;
    imagen_url?: string | null;
    punto?: {
        id_punto: number;
        nombre_punto: string;
        zona: string;
    } | null;
}

interface Props {
    points: Point[];
    capacitaciones: Training[];
    statsSummary?: {
        ciudadanos: number;
        atenciones: number;
        sedes_activas: number;
        costo: string;
    };
}

export default function Welcome({ points = [], capacitaciones = [] }: Props) {
    const { flash, auth } = usePage<any>().props;

    // Slider Hero Institucional con las 4 sedes de Acacías
    const heroSlides = [
        {
            id: 1,
            title: 'Punto Vive Digital Plus Acacías',
            sede: 'Sede I.E. Juan Rozo · Centro',
            imagen: 'images/slider/slide_juan_rozo.jpg',
        },
        {
            id: 2,
            title: 'Punto Vive Digital Tradicional',
            sede: 'Sede Barrio Las Colinas',
            imagen: 'images/slider/slide_las_colinas.jpg',
        },
        {
            id: 3,
            title: 'Aula Digital Dinamarca',
            sede: 'Sede Corregimiento Dinamarca',
            imagen: 'images/slider/slide_dinamarca.jpg',
        },
        {
            id: 4,
            title: 'Aula Digital Chichimene',
            sede: 'Sede Vereda Chichimene',
            imagen: 'images/slider/slide_chichimene.jpg',
        },
    ];

    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [touchStartX, setTouchStartX] = useState<number | null>(null);

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, [heroSlides.length]);

    const prevSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
    }, [heroSlides.length]);

    useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(() => {
            nextSlide();
        }, 5000);
        return () => clearInterval(interval);
    }, [isPaused, nextSlide]);

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStartX(e.targetTouches[0].clientX);
        setIsPaused(true);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX === null) return;
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX - touchEndX;
        if (diff > 45) {
            nextSlide();
        } else if (diff < -45) {
            prevSlide();
        }
        setTouchStartX(null);
        setIsPaused(false);
    };

    // Filtro de categorías simple
    const [categoriaFilter, setCategoriaFilter] = useState('todas');
    const [selectedCourseForModal, setSelectedCourseForModal] = useState<Training | null>(null);

    // Formulario de inscripción sencillo
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

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
            <Head title="Puntos Vive Digital · Alcaldía de Acacías" />

            {/* ALERTA DE MENSAJES */}
            {flash?.success && (
                <div className="bg-[#1B6B35] text-white text-sm font-semibold px-4 py-3 text-center sticky top-0 z-50 flex items-center justify-center gap-2 shadow-xs">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>{flash.success}</span>
                </div>
            )}
            {flash?.info && (
                <div className="bg-slate-700 text-white text-sm font-semibold px-4 py-3 text-center sticky top-0 z-50 flex items-center justify-center gap-2 shadow-xs">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>{flash.info}</span>
                </div>
            )}

            {/* =========================================================================
                1. HEADER: LIMPIO, EXACTO Y SIN TEXTO DE MÁS
               ========================================================================= */}
            <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    {/* Logos */}
                    <Link href="#inicio" className="flex items-center gap-3">
                        <img
                            src={asset('images/logo_alcaldia.png')}
                            alt="Alcaldía de Acacías"
                            className="h-9 sm:h-10 w-auto object-contain"
                        />
                        <div className="h-6 w-px bg-slate-200"></div>
                        <img
                            src={asset('images/logo_pvd.png')}
                            alt="Puntos Vive Digital"
                            className="h-8 sm:h-9 w-auto object-contain"
                        />
                    </Link>

                    {/* Menú Superior: SOLO Inicio, Capacitaciones, Sedes, Contacto */}
                    <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
                        <a href="#inicio" className="hover:text-[#1B6B35] transition-colors">
                            Inicio
                        </a>
                        <a href="#capacitaciones" className="hover:text-[#1B6B35] transition-colors">
                            Capacitaciones
                        </a>
                        <a href="#sedes" className="hover:text-[#1B6B35] transition-colors">
                            Sedes
                        </a>
                        <a href="#contacto" className="hover:text-[#1B6B35] transition-colors">
                            Contacto
                        </a>
                    </nav>

                    {/* Botón Ingresar / Mi Portal */}
                    <div>
                        {auth?.user ? (
                            <Link
                                href={route('portal.index')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold text-[#1B6B35] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                            >
                                <span>Mi Portal</span>
                            </Link>
                        ) : (
                            <Link
                                href={route('login')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-300 transition-colors"
                            >
                                <LogIn className="w-4 h-4 text-slate-500" />
                                <span>Ingresar</span>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* =========================================================================
                2. INICIO, SLIDER DE SEDES & PRÉSTAMO DE SALAS
               ========================================================================= */}
            <section id="inicio" className="bg-gradient-to-b from-slate-50 via-white to-slate-50/70 border-b border-slate-200 py-8 sm:py-12">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    {/* Encabezado Hero Alineado */}
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8">
                        <div className="space-y-2.5 max-w-2xl">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1B6B35] bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 rounded-md">
                                Alcaldía de Acacías · Red TIC Municipal
                            </span>
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                                Puntos Vive Digital Acacías
                            </h1>
                            <p className="text-base text-slate-600 leading-relaxed">
                                Salas de cómputo, internet gratuito y capacitaciones certificadas para toda la comunidad urbana y rural.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                            <a
                                href="#capacitaciones"
                                className="px-5 py-2.5 rounded-xl bg-[#1B6B35] hover:bg-[#145328] text-white text-sm font-semibold transition-all shadow-sm hover:shadow"
                            >
                                Ver Capacitaciones
                            </a>
                            <Link
                                href={auth?.user ? route('portal.index') : route('login')}
                                className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-sm font-semibold border border-slate-300 transition-all shadow-2xs"
                            >
                                Préstamo de Salas
                            </Link>
                        </div>
                    </div>

                    {/* SLIDER DE SEDES CON SELECTOR INTERACTIVO */}
                    <div
                        className="rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/90 shadow-lg shadow-slate-900/5 bg-white select-none"
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div className="relative overflow-hidden bg-slate-900 group">
                            {/* Pista de Diapositivas */}
                            <div
                                className="flex transition-transform duration-700 ease-out"
                                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                            >
                                {heroSlides.map((slide, idx) => (
                                    <div
                                        key={slide.id}
                                        className="w-full flex-shrink-0 relative aspect-[1024/384] bg-slate-900"
                                    >
                                        <img
                                            src={asset(slide.imagen)}
                                            alt={slide.title}
                                            className="w-full h-full object-cover select-none"
                                            loading={idx === 0 ? 'eager' : 'lazy'}
                                            draggable={false}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Flechas Sutiles en los Bordes */}
                            <button
                                type="button"
                                onClick={prevSlide}
                                aria-label="Diapositiva anterior"
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-900/45 hover:bg-slate-900/75 text-white backdrop-blur-xs flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 z-20 opacity-0 group-hover:opacity-100 focus:opacity-100"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <button
                                type="button"
                                onClick={nextSlide}
                                aria-label="Diapositiva siguiente"
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-900/45 hover:bg-slate-900/75 text-white backdrop-blur-xs flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 z-20 opacity-0 group-hover:opacity-100 focus:opacity-100"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>

                            {/* Contador Discreto */}
                            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/50 backdrop-blur-xs text-[11px] font-semibold text-white tracking-wider z-20">
                                {currentSlide + 1} / {heroSlides.length}
                            </div>
                        </div>

                        {/* Barra de Pestañas Interactivas de las 4 Sedes */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 border-t border-slate-200 bg-white">
                            {heroSlides.map((slide, idx) => {
                                const isActive = currentSlide === idx;
                                return (
                                    <button
                                        key={slide.id}
                                        type="button"
                                        onClick={() => setCurrentSlide(idx)}
                                        className={`relative text-left px-4 py-3 transition-colors duration-200 ${
                                            isActive
                                                ? 'bg-emerald-50/60'
                                                : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        {/* Línea superior indicadora activa */}
                                        <span
                                            className={`absolute top-0 left-0 right-0 h-0.5 transition-all duration-300 ${
                                                isActive ? 'bg-[#1B6B35]' : 'bg-transparent'
                                            }`}
                                        />
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                                    isActive
                                                        ? 'bg-[#1B6B35] text-white'
                                                        : 'bg-slate-100 text-slate-500'
                                                }`}
                                            >
                                                0{idx + 1}
                                            </span>
                                            <span
                                                className={`text-xs font-bold truncate ${
                                                    isActive ? 'text-slate-900' : 'text-slate-600'
                                                }`}
                                            >
                                                {slide.title}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 truncate mt-0.5 pl-7">
                                            {slide.sede}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* BLOQUE PRÉSTAMO DE SALAS (ALINEADO A LA MISMA RETÍCULA) */}
                    <div id="prestamo-salas" className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                            <div className="flex items-start gap-3.5">
                                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 text-[#1B6B35] flex items-center justify-center shrink-0">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                                        Préstamo de Salas
                                    </h2>
                                    <p className="text-sm text-slate-600 mt-0.5">
                                        Espacios con computadores y proyector para reuniones comunitarias, juntas de acción comunal o talleres.
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                                <Link
                                    href={auth?.user ? route('portal.index') : `${route('login')}?mode=ciudadanos`}
                                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#1B6B35] hover:bg-[#145328] text-white text-sm font-semibold transition-all shadow-2xs"
                                >
                                    Ingresar y Apartar
                                </Link>
                                {!auth?.user && (
                                    <Link
                                        href={route('register')}
                                        className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-sm font-semibold transition-colors"
                                    >
                                        Registrarme
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* 3 Pasos en Tarjetas Estructuradas */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
                            <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-4 flex items-start gap-3">
                                <span className="w-7 h-7 rounded-lg bg-[#1B6B35] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                                    1
                                </span>
                                <div>
                                    <strong className="block text-sm text-slate-900">Elige la sede</strong>
                                    <span className="text-slate-600 text-xs leading-relaxed">Juan Rozo, Las Colinas, Chichimene o Dinamarca.</span>
                                </div>
                            </div>

                            <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-4 flex items-start gap-3">
                                <span className="w-7 h-7 rounded-lg bg-[#1B6B35] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                                    2
                                </span>
                                <div>
                                    <strong className="block text-sm text-slate-900">Fecha y horario</strong>
                                    <span className="text-slate-600 text-xs leading-relaxed">Lun - Vie (8am-12m / 2pm-6pm) y Sáb (9am-12m).</span>
                                </div>
                            </div>

                            <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-4 flex items-start gap-3">
                                <span className="w-7 h-7 rounded-lg bg-[#1B6B35] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                                    3
                                </span>
                                <div>
                                    <strong className="block text-sm text-slate-900">Usa el espacio</strong>
                                    <span className="text-slate-600 text-xs leading-relaxed">El gestor te espera con los equipos listos.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* =========================================================================
                3. SECCIÓN CAPACITACIONES
               ========================================================================= */}
            <section id="capacitaciones" className="py-12 sm:py-16 max-w-6xl mx-auto px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <GraduationCap className="w-6 h-6 text-[#1B6B35]" />
                            <span>Capacitaciones</span>
                        </h2>
                        <p className="text-sm text-slate-600 mt-1">
                            Cursos y talleres gratuitos dictados en las sedes de Acacías.
                        </p>
                    </div>

                    {/* Filtros simples */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        {categoriasList.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setCategoriaFilter(cat)}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                                    categoriaFilter === cat
                                        ? 'bg-[#1B6B35] text-white'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                {cat === 'todas' ? 'Todos' : cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Listado de Cursos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredCourses.map((c) => (
                        <div
                            key={c.id_capacitacion}
                            className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-colors shadow-2xs group"
                        >
                            {/* Portada temática del curso */}
                            {c.imagen_url ? (
                                <div className="h-40 w-full overflow-hidden bg-slate-100 relative">
                                    <img
                                        src={asset(c.imagen_url)}
                                        alt={c.titulo}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        onError={(e) => {
                                            const target = e.target as HTMLElement;
                                            if (target && target.parentElement) {
                                                target.parentElement.style.display = 'none';
                                            }
                                        }}
                                    />
                                    <div className="absolute top-2.5 left-2.5">
                                        <span className="text-[11px] font-semibold text-slate-800 bg-white/95 px-2 py-0.5 rounded shadow-2xs">
                                            {c.categoria}
                                        </span>
                                    </div>
                                    <div className="absolute top-2.5 right-2.5">
                                        <span className="text-[11px] font-semibold text-[#1B6B35] bg-white/95 px-2 py-0.5 rounded shadow-2xs">
                                            Gratis
                                        </span>
                                    </div>
                                </div>
                            ) : null}

                            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                <div className="space-y-2.5">
                                    {!c.imagen_url && (
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-semibold text-[#1B6B35] bg-emerald-50 px-2 py-0.5 rounded">
                                                {c.categoria}
                                            </span>
                                            <span className="text-slate-500 font-medium">Gratis</span>
                                        </div>
                                    )}

                                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                                        {c.titulo}
                                    </h3>

                                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                                        {c.descripcion}
                                    </p>

                                    <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                                        <div className="flex items-center gap-1.5">
                                            <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                            <span className="font-medium text-slate-800">
                                                {c.punto ? c.punto.nombre_punto : 'Todas las sedes'}
                                            </span>
                                        </div>
                                        {c.horario && (
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                                <span>{c.horario}</span>
                                            </div>
                                        )}
                                        {c.dirigido_a && (
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <Users className="w-3.5 h-3.5 shrink-0" />
                                                <span>{c.dirigido_a}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-xs text-slate-500">
                                        <strong>{c.cupos_disponibles}</strong> cupos libres
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => openInscriptionModal(c)}
                                        className="px-3.5 py-1.5 rounded-lg bg-[#1B6B35] hover:bg-[#145328] text-white text-xs font-semibold transition-colors"
                                    >
                                        Inscribirme
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredCourses.length === 0 && (
                        <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
                            No hay capacitaciones disponibles en esta categoría actualmente.
                        </div>
                    )}
                </div>
            </section>

            {/* =========================================================================
                4. SECCIÓN SEDES (LAS 4 DE ACACÍAS CON UBICACIÓN)
               ========================================================================= */}
            <section id="sedes" className="bg-white border-t border-b border-slate-200 py-12 sm:py-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <MapPin className="w-6 h-6 text-[#1B6B35]" />
                            <span>Sedes</span>
                        </h2>
                        <p className="text-sm text-slate-600 mt-1">
                            Las 4 sedes de Puntos Vive Digital en el municipio de Acacías.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {points.map((p, idx) => (
                            <div
                                key={p.id_punto}
                                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3 overflow-hidden group hover:border-slate-300 transition-colors"
                            >
                                <div className="space-y-2.5">
                                    {/* Foto de la Fachada Exterior */}
                                    <div className="h-36 sm:h-40 w-full overflow-hidden rounded-xl bg-slate-200 relative">
                                        <img
                                            src={asset(p.imagen || `images/sedes/sede_${p.id_punto}.jpg`)}
                                            alt={`Fachada de ${p.alias || p.nombre_punto}`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                        <div className="absolute top-2 left-2">
                                            <span className="text-[11px] font-bold text-slate-800 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded shadow-2xs">
                                                {p.zona === 'Rural' ? 'Rural' : 'Urbana'}
                                            </span>
                                        </div>
                                        <div className="absolute top-2 right-2">
                                            <span className="text-[11px] font-bold text-slate-700 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded shadow-2xs">
                                                Sede {idx + 1}
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                                        {p.alias || p.nombre_punto}
                                    </h3>

                                    <div className="space-y-1 text-xs text-slate-600">
                                        <p className="flex items-start gap-1">
                                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                            <span>{p.direccion}</span>
                                        </p>
                                        <p className="flex items-start gap-1 text-slate-500">
                                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                            <span>{p.horario || 'Lunes a Viernes 8:00 AM - 5:00 PM'}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-200">
                                    <a
                                        href={
                                            p.map_url ||
                                            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                                p.map_query || `${p.nombre_punto}, Acacias, Meta`
                                            )}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
                                    >
                                        <ExternalLink className="w-3 h-3 text-[#1B6B35]" />
                                        <span>Ver en Google Maps</span>
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* =========================================================================
                5. SECCIÓN CONTACTO
               ========================================================================= */}
            <section id="contacto" className="py-12 max-w-4xl mx-auto px-4 sm:px-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
                    <h2 className="text-xl font-bold text-slate-900">Contacto</h2>
                    <p className="text-sm text-slate-600 mt-1">
                        Para mayor información sobre cursos, horarios o salas, comunícate con nosotros:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-sm text-slate-700">
                        <div className="flex items-start gap-3">
                            <Mail className="w-5 h-5 text-[#1B6B35] shrink-0 mt-0.5" />
                            <div>
                                <strong className="block text-slate-900">Correo Electrónico</strong>
                                <a href="mailto:tic@acacias.gov.co" className="text-[#1B6B35] hover:underline">
                                    tic@acacias.gov.co
                                </a>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Building2 className="w-5 h-5 text-[#1B6B35] shrink-0 mt-0.5" />
                            <div>
                                <strong className="block text-slate-900">Secretaría TIC</strong>
                                <span>Alcaldía Municipal de Acacías · Meta</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* =========================================================================
                6. PIE DE PÁGINA
               ========================================================================= */}
            <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500 text-center">
                <div className="max-w-6xl mx-auto px-4">
                    Alcaldía Municipal de Acacías · Red de Puntos Vive Digital
                </div>
            </footer>

            {/* =========================================================================
                7. MODAL DE INSCRIPCIÓN SIMPLE
               ========================================================================= */}
            {selectedCourseForModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-lg border border-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-3 min-w-0">
                                {selectedCourseForModal.imagen_url && (
                                    <img
                                        src={asset(selectedCourseForModal.imagen_url)}
                                        alt={selectedCourseForModal.titulo}
                                        className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
                                        onError={(e) => {
                                            const target = e.target as HTMLElement;
                                            if (target) target.style.display = 'none';
                                        }}
                                    />
                                )}
                                <div className="min-w-0">
                                    <h3 className="text-base font-bold text-slate-900">Inscripción</h3>
                                    <p className="text-xs text-slate-500 truncate">{selectedCourseForModal.titulo}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedCourseForModal(null)}
                                className="text-slate-400 hover:text-slate-700 p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleInscriptionSubmit} className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Documento de Identidad *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Cédula o tarjeta de identidad"
                                    value={inscriptionForm.data.documento}
                                    onChange={(e) => inscriptionForm.setData('documento', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white focus:border-[#1B6B35] focus:outline-none"
                                />
                                {inscriptionForm.errors.documento && (
                                    <div className="text-xs text-rose-600 mt-1">{inscriptionForm.errors.documento}</div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nombres *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Tus nombres"
                                        value={inscriptionForm.data.nombres}
                                        onChange={(e) => inscriptionForm.setData('nombres', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white focus:border-[#1B6B35] focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Apellidos *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Tus apellidos"
                                        value={inscriptionForm.data.apellidos}
                                        onChange={(e) => inscriptionForm.setData('apellidos', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white focus:border-[#1B6B35] focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Celular / WhatsApp *</label>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="Ej: 3101234567"
                                        value={inscriptionForm.data.telefono}
                                        onChange={(e) => inscriptionForm.setData('telefono', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white focus:border-[#1B6B35] focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        placeholder="Opcional"
                                        value={inscriptionForm.data.correo}
                                        onChange={(e) => inscriptionForm.setData('correo', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white focus:border-[#1B6B35] focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setSelectedCourseForModal(null)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={inscriptionForm.processing}
                                    className="px-4 py-2 rounded-lg bg-[#1B6B35] hover:bg-[#145328] text-white text-xs font-semibold transition-colors disabled:opacity-50"
                                >
                                    Inscribirme
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
