import React from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    Monitor,
    Users,
    ArrowRight,
    MapPin,
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
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-500 selection:text-white">
            <Head title="PuntoTIC · Red de Puntos y Aulas Digitales · Alcaldía de Acacías" />

            {/* Barra Superior Institucional */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src={asset('images/logo_alcaldia.png')}
                            alt="Alcaldía de Acacías"
                            className="h-10 sm:h-12 w-auto object-contain"
                        />
                        <div className="h-8 w-px bg-slate-200"></div>
                        <img
                            src={asset('images/logo_pvd.png')}
                            alt="Puntos Vive Digital"
                            className="h-9 sm:h-11 w-auto object-contain"
                        />
                        <div className="border-l border-slate-200 pl-3 hidden sm:block">
                            <span className="text-lg font-black text-slate-900 tracking-tight block">
                                PuntoTIC
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium block">
                                Red de Puntos y Aulas Digitales
                            </span>
                        </div>
                    </div>

                    <nav className="flex items-center gap-2 sm:gap-3">
                        <Link
                            href={route('login')}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 transition-all border border-slate-200"
                        >
                            <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Ingreso Gestores / Admin</span>
                        </Link>
                        <Link
                            href={route('register')}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#01A300] hover:bg-[#018e00] text-white shadow-md shadow-emerald-700/20 transition-all"
                        >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Reservar Sala / Registro</span>
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Sección Principal */}
            <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-24 bg-gradient-to-b from-emerald-50/70 via-slate-50/50 to-white">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-emerald-200/30 via-teal-100/20 to-transparent blur-3xl pointer-events-none rounded-full"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-300/60 text-emerald-800 text-xs font-bold mb-6 shadow-xs animate-fade-in-down">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Alcaldía Municipal de Acacías · Secretaría de las TIC</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
                        <span className="text-[#01A300]">Tecnología y Conectividad</span> al Servicio de Nuestra Comunidad
                    </h1>

                    <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        Accede a salas de cómputo modernas, internet de alta velocidad y reserva espacios para capacitaciones, reuniones comunitarias o talleres educativos en el municipio de Acacías.
                    </p>

                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
                        <Link
                            href={route('register')}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#01A300] hover:bg-[#018e00] text-white font-bold text-sm shadow-xl shadow-emerald-700/20 transition-all"
                        >
                            <span>Solicitar Préstamo de Sala</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            href={route('login')}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm border border-slate-200 shadow-sm hover:border-slate-300 transition-all"
                        >
                            <LogIn className="w-4 h-4 text-emerald-600" />
                            <span>Iniciar Sesión (Cédula o Email)</span>
                        </Link>
                    </div>

                    <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
                        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                                <Award className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-900">100% Gratuito</h4>
                                <p className="text-[11px] text-slate-500">Espacios públicos del municipio</p>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center flex-shrink-0">
                                <Wifi className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-900">Alta Conectividad</h4>
                                <p className="text-[11px] text-slate-500">Fibra óptica y equipos actualizados</p>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center flex-shrink-0">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-900">Gestores en Sede</h4>
                                <p className="text-[11px] text-slate-500">Acompañamiento y soporte técnico</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Franja Institucional Alcaldía de Acacías y Puntos Vive Digital */}
            <section className="bg-[#01A300] text-white py-10 px-4 sm:px-6 lg:px-8 shadow-sm">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                        <img
                            src={asset('images/escudo_acacias.png')}
                            alt="Escudo de Acacías"
                            className="h-20 sm:h-24 w-auto object-contain drop-shadow-md"
                        />
                        <div className="h-16 w-0.5 bg-yellow-400 rounded-full hidden sm:block"></div>
                        <div>
                            <span className="text-xs font-black tracking-[0.2em] text-emerald-100 uppercase block">
                                Alcaldía de
                            </span>
                            <span className="text-2xl sm:text-3xl font-black tracking-tight text-white block leading-none">
                                ACACÍAS
                            </span>
                            <p className="text-xs text-emerald-100 font-medium mt-1">
                                Red de Puntos y Aulas Digitales · Secretaría de las TIC
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl py-3 px-6 shadow-xl flex items-center justify-center border border-white/30">
                        <img
                            src={asset('images/logo_pvd.png')}
                            alt="Puntos Vive Digital para la gente"
                            className="h-12 sm:h-14 w-auto object-contain"
                        />
                    </div>
                </div>
            </section>

            {/* Cómo funciona el préstamo de salas */}
            <section className="py-16 bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">
                            Proceso Simple y Transparente
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                            ¿Cómo Solicitar una Sala Tecnológica?
                        </h2>
                        <p className="mt-2 text-xs sm:text-sm text-slate-500">
                            Diseñado para líderes de JAC, rectores, docentes, fundaciones y comunidad acacireña.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Paso 1 */}
                        <div className="relative p-6 rounded-3xl bg-slate-50 border border-slate-200 hover:border-emerald-500/50 hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-lg mb-5 border border-emerald-200">
                                1
                            </div>
                            <h3 className="text-base font-bold text-slate-900 mb-2">
                                Regístrate con tu Cédula
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Crea tu cuenta ciudadana con tus datos básicos y correo electrónico. Tu cédula será tu llave de acceso para todas las gestiones.
                            </p>
                        </div>

                        {/* Paso 2 */}
                        <div className="relative p-6 rounded-3xl bg-slate-50 border border-slate-200 hover:border-emerald-500/50 hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-black text-lg mb-5 border border-teal-200">
                                2
                            </div>
                            <h3 className="text-base font-bold text-slate-900 mb-2">
                                Elige Sede, Sala y Horario
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Selecciona el Punto TIC deseado (Dinamarca, Las Colinas, Malecón, etc.), la fecha, hora y el propósito comunitario o educativo del evento.
                            </p>
                        </div>

                        {/* Paso 3 */}
                        <div className="relative p-6 rounded-3xl bg-slate-50 border border-slate-200 hover:border-emerald-500/50 hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center font-black text-lg mb-5 border border-sky-200">
                                3
                            </div>
                            <h3 className="text-base font-bold text-slate-900 mb-2">
                                Confirmación por el Gestor
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                El gestor de la sede valida la disponibilidad, confirma tu reserva y recibes la respuesta oficial con sus observaciones en tu correo.
                            </p>
                        </div>
                    </div>

                    <div className="mt-10 text-center">
                        <Link
                            href={route('register')}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#01A300] hover:bg-[#018e00] text-white font-bold text-xs shadow-lg shadow-emerald-700/20 transition-all"
                        >
                            <span>Comenzar mi Solicitud Ahora</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Sedes y Puntos Digitales */}
            <section className="py-16 bg-slate-50/70">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                        <div>
                            <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">
                                Cobertura Municipal
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                                Red de Puntos y Aulas Digitales
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                Sedes urbanas y rurales al servicio de los acacireños.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
                            <Building2 className="w-4 h-4 text-emerald-600" />
                            <span>{points.length > 0 ? `${points.length} Sedes Activas` : 'Sedes Disponibles'}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {points.map((p) => (
                            <div
                                key={p.id_punto}
                                className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-emerald-400 transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                            p.zona === 'Rural'
                                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        }`}>
                                            Zona {p.zona || 'Urbana'}
                                        </span>
                                        <span className="text-[11px] text-slate-400 font-mono">Sede #{p.id_punto}</span>
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900 mb-1.5">{p.nombre_punto}</h3>
                                    <p className="text-xs text-slate-500 flex items-start gap-1.5 mb-4">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                                        <span>{p.direccion || 'Municipio de Acacías, Meta'}</span>
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                                    <span className="text-slate-500 text-[11px]">Salas de Cómputo & Aulas</span>
                                    <Link
                                        href={route('register')}
                                        className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
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

            {/* Servicios presenciales en las sedes */}
            <section className="py-16 bg-white border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">
                            Atención en Ventanilla
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                            Servicios Presenciales en las Sedes
                        </h2>
                        <p className="mt-2 text-xs sm:text-sm text-slate-500">
                            Cualquier ciudadano puede acercarse a nuestras sedes sin necesidad de cita previa.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 text-center hover:shadow-sm transition-all">
                            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4 border border-emerald-200">
                                <Monitor className="w-6 h-6" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 mb-1.5">Navegación e Internet</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Acceso libre a computadores para tareas escolares, consultas y proyectos.
                            </p>
                        </div>

                        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 text-center hover:shadow-sm transition-all">
                            <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mb-4 border border-teal-200">
                                <FileText className="w-6 h-6" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 mb-1.5">Gobierno Digital</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Asistencia para trámites en línea: SISBÉN, Fosyga, certificados y citas médicas.
                            </p>
                        </div>

                        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 text-center hover:shadow-sm transition-all">
                            <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center mb-4 border border-sky-200">
                                <Printer className="w-6 h-6" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 mb-1.5">Impresiones Comunitarias</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Servicio de impresión para documentos escolares y trámites institucionales.
                            </p>
                        </div>

                        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 text-center hover:shadow-sm transition-all">
                            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4 border border-amber-200">
                                <Award className="w-6 h-6" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 mb-1.5">Capacitaciones TIC</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Cursos de alfabetización digital para niños, jóvenes y adultos mayores.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pie de página institucional */}
            <footer className="bg-slate-900 text-slate-300 py-12 text-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-white p-1.5 px-3 rounded-xl flex items-center gap-3 shadow-xs">
                                    <img
                                        src={asset('images/logo_alcaldia.png')}
                                        alt="Alcaldía de Acacías"
                                        className="h-9 w-auto object-contain"
                                    />
                                    <div className="h-5 w-px bg-slate-200"></div>
                                    <img
                                        src={asset('images/logo_pvd.png')}
                                        alt="Puntos Vive Digital"
                                        className="h-8 w-auto object-contain"
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
                                    <span>WhatsApp Ciudadano: +57 321 361 8632</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>tic@acacias.gov.co</span>
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

                    <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
                        <p>© {new Date().getFullYear()} Alcaldía de Acacías · Todos los derechos reservados.</p>
                        <p className="text-slate-500">Plataforma Oficial PuntoTIC v2.0</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
