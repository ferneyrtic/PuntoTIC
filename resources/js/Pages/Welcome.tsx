import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    Monitor,
    Calendar,
    Users,
    CheckCircle2,
    ArrowRight,
    MapPin,
    Phone,
    Mail,
    Clock,
    ChevronRight,
    LogIn,
    UserPlus,
    Building2,
    Wifi,
    GraduationCap,
    BookOpen,
    Check,
    Navigation,
    ExternalLink,
    X,
    FileText,
    HelpCircle,
    Laptop,
    Sparkles,
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

    // Filtro de categorías amigable
    const [categoriaFilter, setCategoriaFilter] = useState('todas');
    const [selectedCourseForModal, setSelectedCourseForModal] = useState<Training | null>(null);

    // Formulario de inscripción simple y claro
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

    // Sede activa para la vista detallada
    const [selectedPointIndex, setSelectedPointIndex] = useState(0);
    const activePoint = points[selectedPointIndex] || points[0];

    return (
        <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-emerald-700 selection:text-white">
            <Head title="Puntos Vive Digital · Alcaldía de Acacías" />

            {/* MENSAJES DE CONFIRMACIÓN */}
            {flash?.success && (
                <div className="bg-emerald-700 text-white text-sm font-semibold px-4 py-3 text-center sticky top-0 z-50 shadow-md flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>{flash.success}</span>
                </div>
            )}
            {flash?.info && (
                <div className="bg-blue-700 text-white text-sm font-semibold px-4 py-3 text-center sticky top-0 z-50 shadow-md flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>{flash.info}</span>
                </div>
            )}

            {/* =========================================================================
                1. ENCABEZADO INSTITUCIONAL CLARO Y CERCANO
               ========================================================================= */}
            <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    {/* Logos Institucionales */}
                    <Link href="#inicio" className="flex items-center gap-3 sm:gap-4">
                        <img
                            src={asset('images/logo_alcaldia.png')}
                            alt="Alcaldía de Acacías"
                            className="h-10 sm:h-12 w-auto object-contain"
                        />
                        <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
                        <img
                            src={asset('images/logo_pvd.png')}
                            alt="Puntos Vive Digital"
                            className="h-8 sm:h-10 w-auto object-contain"
                        />
                        <div className="hidden md:block">
                            <span className="text-base font-extrabold text-slate-900 leading-tight block">
                                Puntos Vive Digital
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                                Alcaldía de Acacías · Secretaría TIC
                            </span>
                        </div>
                    </Link>

                    {/* Menús de Navegación: Inicio (Préstamo), Capacitaciones, Sedes, Contacto */}
                    <nav className="hidden lg:flex items-center gap-1 text-sm font-bold text-slate-700">
                        <a
                            href="#inicio"
                            className="px-3.5 py-2 rounded-xl hover:text-emerald-800 hover:bg-slate-100 transition-colors"
                        >
                            Inicio
                        </a>
                        <a
                            href="#prestamo-salas"
                            className="px-3.5 py-2 rounded-xl hover:text-emerald-800 hover:bg-slate-100 transition-colors"
                        >
                            Préstamo de Salas
                        </a>
                        <a
                            href="#capacitaciones"
                            className="px-3.5 py-2 rounded-xl hover:text-emerald-800 hover:bg-slate-100 transition-colors"
                        >
                            Cursos y Talleres
                        </a>
                        <a
                            href="#sedes"
                            className="px-3.5 py-2 rounded-xl hover:text-emerald-800 hover:bg-slate-100 transition-colors"
                        >
                            Nuestras 4 Sedes
                        </a>
                        <a
                            href="#contacto"
                            className="px-3.5 py-2 rounded-xl hover:text-emerald-800 hover:bg-slate-100 transition-colors"
                        >
                            Contacto y Trámites
                        </a>
                    </nav>

                    {/* Botones de Acción */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link
                            href={route('login')}
                            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-300 transition-all"
                        >
                            <LogIn className="w-4 h-4 text-slate-500" />
                            <span>Ingreso</span>
                        </Link>

                        <a
                            href="#prestamo-salas"
                            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#1B6B35] hover:bg-[#145328] text-white shadow-xs transition-all shrink-0"
                        >
                            <Building2 className="w-4 h-4" />
                            <span>Apartar Sala</span>
                        </a>
                    </div>
                </div>
            </header>

            {/* =========================================================================
                2. BIENVENIDA HUMANA A LA CIUDADANÍA
               ========================================================================= */}
            <section id="inicio" className="pt-10 pb-14 sm:pt-16 sm:pb-20 bg-[#F8FAFC] border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto space-y-4">
                        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs sm:text-sm font-bold">
                            <span>🌱</span>
                            <span>Servicios públicos 100% gratuitos para la comunidad</span>
                        </span>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                            Salas de computadores, internet gratis y cursos para todos en Acacías
                        </h1>

                        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                            Un espacio cálido de la Alcaldía de Acacías para que niños, jóvenes, estudiantes, adultos mayores y líderes de barrio aprendan, hagan sus tareas o se reúnan sin pagar un solo peso.
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                            <a
                                href="#capacitaciones"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#1B6B35] hover:bg-[#145328] text-white font-bold text-sm sm:text-base shadow-sm transition-all"
                            >
                                <GraduationCap className="w-5 h-5" />
                                <span>Ver Cursos Disponibles</span>
                            </a>

                            <a
                                href="#prestamo-salas"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm sm:text-base border border-slate-300 shadow-2xs transition-all"
                            >
                                <Building2 className="w-5 h-5 text-emerald-700" />
                                <span>Apartar una Sala</span>
                            </a>
                        </div>
                    </div>

                    {/* 4 BENEFICIOS DIRECTOS PARA EL CIUDADANO */}
                    <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                                <Laptop className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900">Uso Libre de Computadores</h3>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                Ven a hacer tus trabajos escolares, consultar internet o revisar trámites en nuestras salas.
                            </p>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                                <GraduationCap className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900">Cursos con Paciencia</h3>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                Aprende desde cómo usar el celular o Word y Excel, hasta robótica para niños y jóvenes.
                            </p>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900">Préstamo para Grupos</h3>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                Espacios con proyector y aire acondicionado para juntas de acción comunal, fundaciones y docentes.
                            </p>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                                <FileText className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900">Ayuda con Trámites</h3>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                Te orientamos con gusto para sacar el certificado del SISBÉN, antecedentes de policía y citas médicas.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* =========================================================================
                3. SECCIÓN PRÉSTAMO DE SALAS (EXPLICACIÓN CLARA Y COTIDIANA)
               ========================================================================= */}
            <section id="prestamo-salas" className="py-14 sm:py-20 bg-white border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-[#F8FAFC] rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
                            <div className="space-y-1.5">
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200 inline-block">
                                    Servicio de Préstamo de Instalaciones
                                </span>
                                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                                    ¿Necesitas una sala para tu taller, junta o reunión?
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
                                    Si eres presidente de Junta de Acción Comunal (JAC), docente, rector, líder de fundación, grupo de abuelos o asociación comunitaria, te prestamos nuestras salas totalmente gratis.
                                </p>
                            </div>

                            <Link
                                href={route('register')}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#1B6B35] hover:bg-[#145328] text-white font-bold text-sm sm:text-base shadow-sm transition-all shrink-0"
                            >
                                <span>Solicitar Préstamo de Sala</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {/* 3 Pasos Claros */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
                            <div className="flex gap-4 items-start">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-xs">
                                    1
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-base font-bold text-slate-900">Escoge tu sede</h3>
                                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                        Tenemos salas disponibles en Juan Rozo (Centro), Las Colinas, Dinamarca y Chichimene.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 items-start">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-xs">
                                    2
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-base font-bold text-slate-900">Indícanos la fecha</h3>
                                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                        Selecciona qué día, a qué hora y cuántas personas asistirán a la actividad comunitaria.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 items-start">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-xs">
                                    3
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-base font-bold text-slate-900">El gestor te espera</h3>
                                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                        Te confirmamos la disponibilidad y el facilitador deja listos los equipos y el proyector.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Recordatorio Comunitario */}
                        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                                <span>Salas equipadas con hasta 28 computadores portátiles, proyector y aire acondicionado.</span>
                            </div>
                            <div className="font-bold text-slate-800">
                                Sin costo alguno para la ciudadanía
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* =========================================================================
                4. CATÁLOGO DE CURSOS Y CAPACITACIONES
               ========================================================================= */}
            <section id="capacitaciones" className="py-14 sm:py-20 bg-[#F8FAFC] border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Encabezado */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200 inline-block mb-2">
                                Cursos y Talleres Gratuitos
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                                Aprende a tu propio ritmo este mes
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
                                Todos nuestros cursos son prácticos, dictados en sala por facilitadores pacientes y con entrega de constancia al culminar.
                            </p>
                        </div>

                        {/* Filtros de Categoría */}
                        <div className="flex flex-wrap items-center gap-2">
                            {categoriasList.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategoriaFilter(cat)}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all capitalize ${
                                        categoriaFilter === cat
                                            ? 'bg-[#1B6B35] text-white shadow-xs'
                                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                                    }`}
                                >
                                    {cat === 'todas' ? 'Todos los Cursos' : cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tarjetas de Cursos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCourses.map((c) => (
                            <div
                                key={c.id_capacitacion}
                                className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between hover:border-emerald-600 hover:shadow-md transition-all space-y-4"
                            >
                                <div className="space-y-3">
                                    {/* Insignia y Categoría */}
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                                            {c.categoria}
                                        </span>
                                        <span className="text-xs font-extrabold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                                            100% Gratuito
                                        </span>
                                    </div>

                                    {/* Título del Curso */}
                                    <h3 className="text-lg font-black text-slate-900 leading-snug">
                                        {c.titulo}
                                    </h3>

                                    {/* Descripción sencilla */}
                                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                        {c.descripcion}
                                    </p>

                                    {/* Datos Prácticos */}
                                    <div className="space-y-2 pt-3 border-t border-slate-100 text-xs sm:text-sm text-slate-700">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
                                            <span className="font-bold text-slate-900">
                                                {c.punto ? c.punto.nombre_punto : 'Todas las Sedes de Acacías'}
                                            </span>
                                        </div>

                                        {c.horario && (
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                                                <span>{c.horario}</span>
                                            </div>
                                        )}

                                        {c.dirigido_a && (
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Users className="w-4 h-4 text-slate-500 shrink-0" />
                                                <span>Para: {c.dirigido_a}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Cupos */}
                                    <div className="pt-1">
                                        <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
                                            <span>Cupos disponibles:</span>
                                            <span className="text-emerald-800 font-extrabold">
                                                {c.cupos_disponibles} libres
                                            </span>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-600 rounded-full"
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

                                {/* Botón de Inscripción Directa */}
                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={() => openInscriptionModal(c)}
                                        className="w-full py-2.5 rounded-xl bg-[#1B6B35] hover:bg-[#145328] text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                                    >
                                        <BookOpen className="w-4 h-4" />
                                        <span>Quiero Inscribirme Gratis</span>
                                    </button>
                                </div>
                            </div>
                        ))}

                        {filteredCourses.length === 0 && (
                            <div className="col-span-full p-10 text-center text-slate-500 bg-white rounded-3xl border border-slate-200">
                                <GraduationCap className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                                <div className="text-base font-bold text-slate-800">No hay cursos en esta categoría por ahora</div>
                                <p className="text-xs sm:text-sm text-slate-500 mt-1">Pronto estaremos publicando nuevas fechas y temáticas.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* =========================================================================
                5. NUESTRAS 4 SEDES EN ACACÍAS (CON DIRECCIÓN Y GOOGLE MAPS)
               ========================================================================= */}
            <section id="sedes" className="py-14 sm:py-20 bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-10">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200 inline-block mb-2">
                            Presencia en el Municipio
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                            Nuestras 4 Sedes en Acacías
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1">
                            Dos sedes en el casco urbano y dos aulas en el sector rural para que no tengas que desplazarte lejos de tu casa.
                        </p>
                    </div>

                    {/* Tarjetas de las 4 Sedes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {points.map((p, idx) => (
                            <div
                                key={p.id_punto}
                                className={`rounded-3xl p-5 border transition-all flex flex-col justify-between cursor-pointer ${
                                    selectedPointIndex === idx
                                        ? 'bg-[#F8FAFC] border-emerald-600 shadow-md ring-2 ring-emerald-600/20'
                                        : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                                onClick={() => setSelectedPointIndex(idx)}
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span
                                            className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                                                p.zona === 'Rural'
                                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                            }`}
                                        >
                                            {p.badge || (p.zona === 'Rural' ? 'Sector Rural' : 'Sector Urbano')}
                                        </span>
                                        <span className="text-xs font-bold text-slate-400">Sede {idx + 1}</span>
                                    </div>

                                    <h3 className="text-base font-black text-slate-900 leading-snug">
                                        {p.alias || p.nombre_punto}
                                    </h3>

                                    <div className="space-y-2 text-xs sm:text-sm text-slate-600 pt-1">
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                                            <span className="font-semibold text-slate-900">{p.direccion}</span>
                                        </div>

                                        <div className="flex items-start gap-2 text-slate-600">
                                            <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                            <span>{p.horario || 'Lunes a Viernes 8:00 AM - 5:00 PM'}</span>
                                        </div>

                                        <div className="flex items-start gap-2 text-slate-600">
                                            <Wifi className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-500">
                                                {p.equipos || 'Computadores portátiles e internet veloz'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 mt-4 border-t border-slate-100">
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                            p.map_query || `${p.nombre_punto}, Acacias, Meta`
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4 text-emerald-700" />
                                        <span>Cómo Llegar (Google Maps)</span>
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Ficha Resumida de la Sede Seleccionada */}
                    {activePoint && (
                        <div className="mt-8 bg-[#F8FAFC] border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
                            <div className="space-y-2 flex-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200 inline-block">
                                    Sede Seleccionada
                                </span>
                                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                                    {activePoint.alias || activePoint.nombre_punto}
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                                    Ubicada en <strong className="text-slate-900">{activePoint.direccion}</strong> ({activePoint.barrio}). Abierta para consulta libre de estudiantes y comunidad, o para préstamo a grupos comunitarios.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                                <Link
                                    href={route('register')}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#1B6B35] hover:bg-[#145328] text-white font-bold text-xs sm:text-sm shadow-xs transition-all"
                                >
                                    <Building2 className="w-4 h-4" />
                                    <span>Apartar Sala en esta Sede</span>
                                </Link>

                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                        activePoint.map_query || `${activePoint.nombre_punto}, Acacias, Meta`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm border border-slate-300 transition-all shadow-2xs"
                                >
                                    <Navigation className="w-4 h-4 text-emerald-700" />
                                    <span>Abrir en Google Maps</span>
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* =========================================================================
                6. APOYO EN TRÁMITES Y ATENCIÓN AL CIUDADANO
               ========================================================================= */}
            <section id="contacto" className="py-14 sm:py-20 bg-[#F8FAFC]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                        <div className="space-y-4">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200 inline-block">
                                Orientación Ciudadana
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                ¿Tienes que hacer un trámite y no tienes computador o internet en casa?
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                Acércate a tu Punto Vive Digital más cercano. Nuestros facilitadores te orientan con gusto y paciencia para que puedas realizar tus consultas sin intermediarios ni cobros.
                            </p>

                            <div className="space-y-3 pt-2">
                                <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-700">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-xs uppercase font-bold">Correo Institucional</span>
                                        <span className="font-bold text-slate-900">tic@acacias.gov.co</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-700">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-xs uppercase font-bold">Secretaría de las TIC</span>
                                        <span className="font-bold text-slate-900">Alcaldía Municipal de Acacías · Meta</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Caja de Trámites Frecuentes */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
                            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-emerald-700" />
                                <span>Trámites que puedes hacer con nuestra ayuda</span>
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                En cualquiera de las 4 sedes te facilitamos el acceso sin costo a:
                            </p>

                            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                                <li className="flex items-center gap-2.5">
                                    <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                                    <span>Descargar y consultar el certificado del <strong>SISBÉN IV</strong></span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                                    <span>Certificados de <strong>Policía, Contraloría y Procuraduría</strong></span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                                    <span>Consulta de afiliación en salud (<strong>ADRES / Fosyga</strong>)</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                                    <span>Consultas del <strong>RUNT</strong> y citas de tránsito</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                                    <span>Tareas escolares, consultas universitarias e impresión de trabajos</span>
                                </li>
                            </ul>

                            <div className="pt-4 border-t border-slate-100">
                                <Link
                                    href={route('login')}
                                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-colors"
                                >
                                    <span>Acceso para Gestores y Funcionarios</span>
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* =========================================================================
                7. PIE DE PÁGINA INSTITUCIONAL SOBRIO
               ========================================================================= */}
            <footer className="border-t border-slate-200 bg-white py-8 text-xs sm:text-sm text-slate-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-center sm:text-left">
                        <span className="font-bold text-slate-800">Alcaldía Municipal de Acacías</span>
                        <span>·</span>
                        <span>Red de Puntos Vive Digital y Aulas Digitales</span>
                    </div>

                    <div className="text-xs text-slate-500 text-center sm:text-right">
                        Secretaría de las Tecnologías de la Información y las Comunicaciones (TIC)
                    </div>
                </div>
            </footer>

            {/* =========================================================================
                8. MODAL DE INSCRIPCIÓN SIMPLE Y CLARO
               ========================================================================= */}
            {selectedCourseForModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-4 shadow-xl border border-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                                    <GraduationCap className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Inscripción al Curso</h3>
                                    <p className="text-xs text-slate-500 truncate max-w-xs">{selectedCourseForModal.titulo}</p>
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
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Número de Documento (Cédula o Tarjeta de Identidad) *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: 1121890123"
                                    value={inscriptionForm.data.documento}
                                    onChange={(e) => inscriptionForm.setData('documento', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 font-bold focus:bg-white focus:border-emerald-600 focus:outline-none"
                                />
                                {inscriptionForm.errors.documento && (
                                    <div className="text-xs text-rose-600 mt-1">{inscriptionForm.errors.documento}</div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Nombres *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Tus nombres"
                                        value={inscriptionForm.data.nombres}
                                        onChange={(e) => inscriptionForm.setData('nombres', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Apellidos *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Tus apellidos"
                                        value={inscriptionForm.data.apellidos}
                                        onChange={(e) => inscriptionForm.setData('apellidos', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Celular o WhatsApp *</label>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="Ej: 3101234567"
                                        value={inscriptionForm.data.telefono}
                                        onChange={(e) => inscriptionForm.setData('telefono', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        placeholder="tu@correo.com"
                                        value={inscriptionForm.data.correo}
                                        onChange={(e) => inscriptionForm.setData('correo', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <p className="text-xs text-slate-500 pt-1 leading-relaxed">
                                Este registro es 100% gratuito. El facilitador de la sede te escribirá por WhatsApp o te llamará para darte la bienvenida y confirmar el inicio del curso.
                            </p>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setSelectedCourseForModal(null)}
                                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={inscriptionForm.processing}
                                    className="px-5 py-2.5 rounded-xl bg-[#1B6B35] hover:bg-[#145328] text-white text-xs sm:text-sm font-bold shadow-xs transition-all disabled:opacity-50"
                                >
                                    Apartar mi Cupo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
