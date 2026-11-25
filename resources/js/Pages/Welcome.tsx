import React, { useState } from 'react';
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
    const { flash } = usePage<any>().props;

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

                    {/* Botón Ingresar */}
                    <div>
                        <Link
                            href={route('login')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-300 transition-colors"
                        >
                            <LogIn className="w-4 h-4 text-slate-500" />
                            <span>Ingresar</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* =========================================================================
                2. INICIO & PRÉSTAMO DE SALAS
               ========================================================================= */}
            <section id="inicio" className="bg-white border-b border-slate-200 py-12 sm:py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                        Puntos Vive Digital Acacías
                    </h1>
                    <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        Salas de cómputo, internet y capacitaciones gratuitas de la Alcaldía de Acacías para toda la comunidad.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <a
                            href="#capacitaciones"
                            className="px-5 py-2.5 rounded-xl bg-[#1B6B35] hover:bg-[#145328] text-white text-sm font-semibold transition-colors shadow-2xs"
                        >
                            Ver Capacitaciones
                        </a>
                        <a
                            href="#prestamo-salas"
                            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold transition-colors"
                        >
                            Préstamo de Salas
                        </a>
                    </div>
                </div>

                {/* BLOQUE PRÉSTAMO DE SALAS (DENTRO DE INICIO) */}
                <div id="prestamo-salas" className="max-w-4xl mx-auto px-4 sm:px-6 mt-12">
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-[#1B6B35]" />
                                    <span>Préstamo de Salas</span>
                                </h2>
                                <p className="text-sm text-slate-600 mt-1">
                                    Espacios con computadores y proyector para reuniones comunitarias, juntas de acción comunal o talleres.
                                </p>
                            </div>
                            <Link
                                href={route('register')}
                                className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#1B6B35] hover:bg-[#145328] text-white text-sm font-semibold transition-colors shrink-0"
                            >
                                Apartar Sala
                            </Link>
                        </div>

                        {/* 3 Pasos Simples */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-sm">
                            <div className="flex items-start gap-3">
                                <span className="w-7 h-7 rounded-full bg-[#1B6B35] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                                    1
                                </span>
                                <div>
                                    <strong className="block text-slate-900">Elige la sede</strong>
                                    <span className="text-slate-600 text-xs">Juan Rozo, Las Colinas, Chichimene o Dinamarca.</span>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <span className="w-7 h-7 rounded-full bg-[#1B6B35] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                                    2
                                </span>
                                <div>
                                    <strong className="block text-slate-900">Fecha y horario</strong>
                                    <span className="text-slate-600 text-xs">Indícanos el día y cuántas personas asistirán.</span>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <span className="w-7 h-7 rounded-full bg-[#1B6B35] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                                    3
                                </span>
                                <div>
                                    <strong className="block text-slate-900">Usa el espacio</strong>
                                    <span className="text-slate-600 text-xs">El gestor te espera con los equipos listos.</span>
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
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                            p.map_query || `${p.nombre_punto}, Acacias, Meta`
                                        )}`}
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
