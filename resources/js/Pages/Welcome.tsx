import React from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    Monitor,
    Calendar,
    Users,
    CheckCircle2,
    ArrowRight,
    MapPin,
    Shield,
    FileText,
    Printer,
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
} from 'lucide-react';
import { asset } from '@/utils/asset';

interface Point {
    id_punto: number;
    nombre_punto: string;
    zona?: string;
    direccion?: string;
}

interface Props {
    points: Point[];
}

export default function Welcome({ points = [] }: Props) {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
            <Head title="PuntoTIC · Red de Puntos y Aulas Digitales · Alcaldía de Acacías" />

            {/* BARRA SUPERIOR INSTITUCIONAL */}
            <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-1.5 px-3 rounded-xl shadow-sm border border-slate-200 flex items-center justify-center">
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
                    </div>

                    <nav className="flex items-center gap-3">
                        <Link
                            href={route('login')}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all border border-slate-800"
                        >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Ingreso Gestores / Admin</span>
                        </Link>
                        <Link
                            href={route('register')}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20 transition-all"
                        >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Reservar Sala / Registro</span>
                        </Link>
                    </nav>
                </div>
            </header>

            {/* HERO SECTION */}
            <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
                {/* Glow ambiental de fondo */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-emerald-600/20 via-teal-500/10 to-transparent blur-3xl pointer-events-none rounded-full"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-6 animate-fade-in-down">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Alcaldía Municipal de Acacías · Secretaría de las TIC</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-tight">
                        Tecnología y Conectividad al Servicio de Nuestra Comunidad
                    </h1>

                    <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        Accede a salas de cómputo modernas, internet de alta velocidad y reserva espacios para capacitaciones, reuniones comunitarias o talleres educativos en el municipio de Acacías.
                    </p>

                    {/* Botones de Acción Primaria */}
                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
                        <Link
                            href={route('register')}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all"
                        >
                            <span>Solicitar Préstamo de Sala</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            href={route('login')}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-sm border border-slate-700/80 transition-all"
                        >
                            <LogIn className="w-4 h-4 text-emerald-400" />
                            <span>Iniciar Sesión (Cédula o Email)</span>
                        </Link>
                    </div>

                    {/* Ventajas Rápidas */}
                    <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
                        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                                <Award className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-white">100% Gratuito</h4>
                                <p className="text-[11px] text-slate-400">Espacios públicos del municipio</p>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center flex-shrink-0">
                                <Wifi className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-white">Alta Conectividad</h4>
                                <p className="text-[11px] text-slate-400">Fibra óptica y equipos actualizados</p>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center flex-shrink-0">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-white">Gestores en Sede</h4>
                                <p className="text-[11px] text-slate-400">Acompañamiento y soporte técnico</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECCIÓN: CÓMO FUNCIONA EL PRÉSTAMO DE SALAS */}
            <section className="py-16 bg-slate-900/70 border-y border-slate-800/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">
                            Proceso Simple y Transparente
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                            ¿Cómo Solicitar una Sala Tecnológica?
                        </h2>
                        <p className="mt-2 text-xs sm:text-sm text-slate-400">
                            Diseñado para líderes de JAC, rectores, docentes, fundaciones y comunidad acacireña.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Paso 1 */}
                        <div className="relative p-6 rounded-3xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black text-lg mb-5 border border-emerald-500/20">
                                1
                            </div>
                            <h3 className="text-base font-bold text-white mb-2">
                                Regístrate con tu Cédula
                            </h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Crea tu cuenta ciudadana con tus datos básicos y correo electrónico. Tu cédula será tu llave de acceso para todas las gestiones.
                            </p>
                        </div>

                        {/* Paso 2 */}
                        <div className="relative p-6 rounded-3xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-black text-lg mb-5 border border-teal-500/20">
                                2
                            </div>
                            <h3 className="text-base font-bold text-white mb-2">
                                Elige Sede, Sala y Horario
                            </h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Selecciona el Punto TIC deseado (Dinamarca, Las Colinas, Malecón, etc.), la fecha, hora y el propósito comunitario o educativo del evento.
                            </p>
                        </div>

                        {/* Paso 3 */}
                        <div className="relative p-6 rounded-3xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-black text-lg mb-5 border border-sky-500/20">
                                3
                            </div>
                            <h3 className="text-base font-bold text-white mb-2">
                                Confirmación por el Gestor
                            </h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                El gestor de la sede valida la disponibilidad, confirma tu reserva y recibes la respuesta oficial con sus observaciones en tu correo.
                            </p>
                        </div>
                    </div>

                    <div className="mt-10 text-center">
                        <Link
                            href={route('register')}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all"
                        >
                            <span>Comenzar mi Solicitud Ahora</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* SECCIÓN: SEDES Y PUNTOS DIGITALES */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                        <div>
                            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">
                                Cobertura Municipal
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                                Red de Puntos y Aulas Digitales
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-400 mt-1">
                                Sedes urbanas y rurales al servicio de los acacireños.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                            <Building2 className="w-4 h-4 text-emerald-400" />
                            <span>{points.length > 0 ? `${points.length} Sedes Activas` : 'Sedes Disponibles'}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {points.map((p) => (
                            <div
                                key={p.id_punto}
                                className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                            p.zona === 'Rural'
                                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                        }`}>
                                            Zona {p.zona || 'Urbana'}
                                        </span>
                                        <span className="text-[11px] text-slate-500 font-mono">Sede #{p.id_punto}</span>
                                    </div>
                                    <h3 className="text-base font-bold text-white mb-1.5">{p.nombre_punto}</h3>
                                    <p className="text-xs text-slate-400 flex items-start gap-1.5 mb-4">
                                        <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                                        <span>{p.direccion || 'Municipio de Acacías, Meta'}</span>
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                                    <span className="text-slate-400 text-[11px]">Salas de Cómputo & Aulas</span>
                                    <Link
                                        href={route('register')}
                                        className="font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                                    >
                                        <span>Solicitar</span>
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SECCIÓN: SERVICIOS PRESENCIALES GRATUITOS */}
            <section className="py-16 bg-slate-900/50 border-t border-slate-800/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">
                            Atención en Ventanilla
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                            Servicios Presenciales en las Sedes
                        </h2>
                        <p className="mt-2 text-xs sm:text-sm text-slate-400">
                            Cualquier ciudadano puede acercarse a nuestras sedes sin necesidad de cita previa.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="p-6 rounded-3xl bg-slate-950/60 border border-slate-800 text-center">
                            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                                <Monitor className="w-6 h-6" />
                            </div>
                            <h3 className="text-sm font-bold text-white mb-1.5">Navegación e Internet</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Acceso libre a computadores para tareas escolares, consultas y proyectos.
                            </p>
                        </div>

                        <div className="p-6 rounded-3xl bg-slate-950/60 border border-slate-800 text-center">
                            <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4">
                                <FileText className="w-6 h-6" />
                            </div>
                            <h3 className="text-sm font-bold text-white mb-1.5">Gobierno Digital</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Asistencia para trámites en línea: SISBÉN, Fosyga, certificados y citas médicas.
                            </p>
                        </div>

                        <div className="p-6 rounded-3xl bg-slate-950/60 border border-slate-800 text-center">
                            <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4">
                                <Printer className="w-6 h-6" />
                            </div>
                            <h3 className="text-sm font-bold text-white mb-1.5">Impresiones Comunitarias</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Servicio de impresión para documentos escolares y trámites institucionales.
                            </p>
                        </div>

                        <div className="p-6 rounded-3xl bg-slate-950/60 border border-slate-800 text-center">
                            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                                <Award className="w-6 h-6" />
                            </div>
                            <h3 className="text-sm font-bold text-white mb-1.5">Capacitaciones TIC</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Cursos de alfabetización digital para niños, jóvenes y adultos mayores.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER INSTITUCIONAL */}
            <footer className="bg-slate-950 border-t border-slate-800/80 py-12 text-slate-400 text-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="bg-white p-1 rounded-lg">
                                    <img
                                        src={asset('images/logo_alcaldia.png')}
                                        alt="Alcaldía de Acacías"
                                        className="h-9 w-auto object-contain"
                                    />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">Alcaldía Municipal de Acacías</h4>
                                    <p className="text-[11px] text-slate-400">Secretaría de las TIC · Red PuntoTIC</p>
                                </div>
                            </div>
                            <p className="text-slate-400 max-w-md text-xs leading-relaxed">
                                Comprometidos con el cierre de la brecha digital y el empoderamiento tecnológico de todas las comunidades urbanas y rurales de Acacías.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Canales de Contacto</h4>
                            <ul className="space-y-2 text-xs">
                                <li className="flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Línea PVD: 321 361 8632</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>contactenos@acacias.gov.co</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Lun a Vie: 8am-12m / 2pm-6pm</span>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Accesos del Sistema</h4>
                            <ul className="space-y-2 text-xs">
                                <li>
                                    <Link href={route('login')} className="hover:text-emerald-400 transition-colors">
                                        Acceso Gestores y Coordinadores
                                    </Link>
                                </li>
                                <li>
                                    <Link href={route('register')} className="hover:text-emerald-400 transition-colors">
                                        Registro de Ciudadanos para Salas
                                    </Link>
                                </li>
                                <li>
                                    <Link href={route('login')} className="hover:text-emerald-400 transition-colors">
                                        Portal Ciudadano (Mis Solicitudes)
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
                        <p>© {new Date().getFullYear()} Alcaldía de Acacías · Todos los derechos reservados.</p>
                        <p className="text-slate-500">Plataforma Oficial PuntoTIC v2.0</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
