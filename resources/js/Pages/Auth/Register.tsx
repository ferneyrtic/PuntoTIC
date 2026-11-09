import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    User,
    Mail,
    Lock,
    Phone,
    MapPin,
    Home,
    GraduationCap,
    Briefcase,
    ShieldAlert,
    HeartPulse,
    Eye,
    EyeOff,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    Calendar,
    Building2,
    Users,
} from 'lucide-react';
import { asset } from '@/utils/asset';

interface Props {
    documentTypes: Array<{ id_tipo: number; nombre_tipo: string; sigla: string }>;
    points: Array<{ id_punto: number; nombre_punto: string; zona: string }>;
}

export default function Register({ documentTypes = [], points = [] }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        id_tipo: documentTypes[0]?.id_tipo || 2,
        documento: '',
        nombres: '',
        apellidos: '',
        fecha_nac: '',
        edad: '',
        genero: 'Femenino',
        email: '',
        telefono: '',
        password: '',
        password_confirmation: '',
        direccion: '',
        barrio: '',
        zona: 'Urbana',
        estrato: 1,
        up: '',
        id_punto: points[0]?.id_punto || 1,
        nivel_educativo: 'Bachillerato completo',
        ocupacion: 'Empleado',
        g_poblacional: 'Ninguno',
        grupo_etnico: 'Ninguno',
        t_aseguramiento: 'Subsidiado',
    });

    const handleBirthDateChange = (val: string) => {
        setData('fecha_nac', val);
        if (val) {
            const birth = new Date(val);
            const now = new Date();
            let age = now.getFullYear() - birth.getFullYear();
            const m = now.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
                age--;
            }
            if (!isNaN(age) && age >= 0) {
                setData('edad', age.toString());
            }
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('register'));
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-emerald-500 selection:text-white">
            <Head title="Registro Ciudadano · PuntoTIC Acacías" />

            <div className="max-w-4xl mx-auto">
                {/* Header Institucional */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="bg-white/95 p-3 px-6 rounded-2xl shadow-lg border border-white/40 inline-flex items-center justify-center">
                            <img
                                src={asset('images/logo_alcaldia.png')}
                                alt="Alcaldía de Acacías"
                                className="h-14 sm:h-16 w-auto object-contain"
                            />
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Registro Ciudadano</h1>
                    <p className="mt-1 text-sm text-emerald-400 font-bold tracking-wide">
                        Red de Puntos y Aulas Digitales de Acacías
                    </p>
                    <p className="text-xs text-slate-400 max-w-lg mx-auto mt-1">
                        Crea tu cuenta oficial para solicitar préstamos de salas tecnológicas, acceder a cursos y consultar tus radicados en tiempo real.
                    </p>
                </div>

                <div className="bg-white text-slate-800 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 sm:px-8 py-5 text-white flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-black tracking-tight">Formulario de Caracterización y Registro</h2>
                            <p className="text-xs text-emerald-100 font-medium">Todos los campos con (*) son obligatorios</p>
                        </div>
                        <Link
                            href={route('login')}
                            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Ya tengo cuenta</span>
                        </Link>
                    </div>

                    <form onSubmit={submit} className="p-6 sm:p-8 space-y-8">
                        {/* SECCIÓN 1: IDENTIFICACIÓN PERSONAL */}
                        <div>
                            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-4">
                                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                                    1
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                    Identificación Personal
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Tipo de Documento *
                                    </label>
                                    <select
                                        value={data.id_tipo}
                                        onChange={(e) => setData('id_tipo', Number(e.target.value))}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                                        required
                                    >
                                        {documentTypes.map((dt) => (
                                            <option key={dt.id_tipo} value={dt.id_tipo}>
                                                {dt.sigla ? `${dt.sigla} - ` : ''}{dt.nombre_tipo}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.id_tipo && <p className="text-[11px] text-rose-500 mt-1">{errors.id_tipo}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Número de Documento *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.documento}
                                        onChange={(e) => setData('documento', e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                                        placeholder="Ej. 1121876543"
                                        required
                                    />
                                    {errors.documento && <p className="text-[11px] text-rose-500 mt-1">{errors.documento}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Nombres *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.nombres}
                                        onChange={(e) => setData('nombres', e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                                        placeholder="Nombres completos"
                                        required
                                    />
                                    {errors.nombres && <p className="text-[11px] text-rose-500 mt-1">{errors.nombres}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Apellidos *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.apellidos}
                                        onChange={(e) => setData('apellidos', e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                                        placeholder="Apellidos completos"
                                        required
                                    />
                                    {errors.apellidos && <p className="text-[11px] text-rose-500 mt-1">{errors.apellidos}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Fecha de Nacimiento
                                    </label>
                                    <input
                                        type="date"
                                        value={data.fecha_nac}
                                        onChange={(e) => handleBirthDateChange(e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                                    />
                                    {errors.fecha_nac && <p className="text-[11px] text-rose-500 mt-1">{errors.fecha_nac}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Edad Calculada
                                    </label>
                                    <input
                                        type="number"
                                        value={data.edad}
                                        readOnly
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed outline-none"
                                        placeholder="Autocalculada"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Género
                                    </label>
                                    <select
                                        value={data.genero}
                                        onChange={(e) => setData('genero', e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                                    >
                                        <option value="Femenino">Femenino</option>
                                        <option value="Masculino">Masculino</option>
                                        <option value="Transgénero">Transgénero</option>
                                        <option value="No binario">No binario</option>
                                        <option value="Prefiero no decir">Prefiero no decir</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 2: CONTACTO Y SEGURIDAD */}
                        <div>
                            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-4">
                                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                                    2
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                        Contacto y Seguridad de la Cuenta
                                    </h3>
                                    <p className="text-[11px] text-slate-400">
                                        El correo y teléfono se utilizarán para enviarte el estado de tus solicitudes de sala.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Correo Electrónico (Notificaciones de Salas) *
                                    </label>
                                    <div className="relative">
                                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                                            placeholder="tunombre@correo.com"
                                            required
                                        />
                                    </div>
                                    {errors.email && <p className="text-[11px] text-rose-500 mt-1">{errors.email}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Teléfono / Celular de Contacto *
                                    </label>
                                    <div className="relative">
                                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            value={data.telefono}
                                            onChange={(e) => setData('telefono', e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                                            placeholder="Ej. 3213618632"
                                            required
                                        />
                                    </div>
                                    {errors.telefono && <p className="text-[11px] text-rose-500 mt-1">{errors.telefono}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Contraseña de Acceso *
                                    </label>
                                    <div className="relative">
                                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            className="w-full pl-9 pr-10 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                                            placeholder="Mínimo 8 caracteres"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-[11px] text-rose-500 mt-1">{errors.password}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Confirmar Contraseña *
                                    </label>
                                    <div className="relative">
                                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            className="w-full pl-9 pr-10 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                                            placeholder="Repite la contraseña"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 3: UBICACIÓN Y RESIDENCIA */}
                        <div>
                            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-4">
                                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-xs">
                                    3
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                    Ubicación y Residencia
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Dirección de Residencia *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.direccion}
                                        onChange={(e) => setData('direccion', e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                                        placeholder="Ej. Calle 14 # 20-30"
                                        required
                                    />
                                    {errors.direccion && <p className="text-[11px] text-rose-500 mt-1">{errors.direccion}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Barrio o Vereda *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.barrio}
                                        onChange={(e) => setData('barrio', e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                                        placeholder="Ej. Centro, Dinamarca"
                                        required
                                    />
                                    {errors.barrio && <p className="text-[11px] text-rose-500 mt-1">{errors.barrio}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Zona *
                                    </label>
                                    <select
                                        value={data.zona}
                                        onChange={(e) => setData('zona', e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                                        required
                                    >
                                        <option value="Urbana">Urbana</option>
                                        <option value="Rural">Rural</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Estrato Socioeconómico *
                                    </label>
                                    <select
                                        value={data.estrato}
                                        onChange={(e) => setData('estrato', Number(e.target.value))}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                                        required
                                    >
                                        <option value="1">Estrato 1</option>
                                        <option value="2">Estrato 2</option>
                                        <option value="3">Estrato 3</option>
                                        <option value="4">Estrato 4</option>
                                        <option value="5">Estrato 5</option>
                                        <option value="6">Estrato 6</option>
                                    </select>
                                </div>

                                <div className="md:col-span-3">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Punto TIC / Sede Más Cercana o de Interés
                                    </label>
                                    <select
                                        value={data.id_punto}
                                        onChange={(e) => setData('id_punto', Number(e.target.value))}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                                    >
                                        {points.map((p) => (
                                            <option key={p.id_punto} value={p.id_punto}>
                                                {p.nombre_punto} {p.zona ? `(${p.zona})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 4: CARACTERIZACIÓN SOCIAL Y ENFOQUE DIFERENCIAL */}
                        <div>
                            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-4">
                                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                                    4
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                    Caracterización Social y Enfoque Diferencial
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Nivel Educativo
                                    </label>
                                    <select
                                        value={data.nivel_educativo}
                                        onChange={(e) => setData('nivel_educativo', e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                                    >
                                        <option value="Primaria incompleta">Primaria incompleta</option>
                                        <option value="Primaria completa">Primaria completa</option>
                                        <option value="Secundaria incompleta">Secundaria incompleta</option>
                                        <option value="Bachillerato completo">Bachillerato completo</option>
                                        <option value="Técnico / Tecnólogo">Técnico / Tecnólogo</option>
                                        <option value="Universitario incompleto">Universitario incompleto</option>
                                        <option value="Universitario completo">Universitario completo</option>
                                        <option value="Posgrado">Posgrado</option>
                                        <option value="Ninguno">Ninguno</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Ocupación Actual
                                    </label>
                                    <select
                                        value={data.ocupacion}
                                        onChange={(e) => setData('ocupacion', e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                                    >
                                        <option value="Estudiante">Estudiante</option>
                                        <option value="Empleado">Empleado</option>
                                        <option value="Independiente">Independiente</option>
                                        <option value="Hogar">Hogar</option>
                                        <option value="Desempleado">Desempleado</option>
                                        <option value="Jubilado / Pensionado">Jubilado / Pensionado</option>
                                        <option value="Docente">Docente / Educador</option>
                                        <option value="Líder Comunitario">Líder Comunitario / JAC</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Grupo Poblacional (Enfoque Diferencial)
                                    </label>
                                    <select
                                        value={data.g_poblacional}
                                        onChange={(e) => setData('g_poblacional', e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                                    >
                                        <option value="Ninguno">Ninguno</option>
                                        <option value="Víctima del conflicto armado">Víctima del conflicto armado</option>
                                        <option value="Discapacidad">Persona con Discapacidad</option>
                                        <option value="Adulto mayor">Adulto mayor</option>
                                        <option value="Joven / Juventud">Jóvenes (14-28 años)</option>
                                        <option value="Madre cabeza de familia">Madre cabeza de familia</option>
                                        <option value="Comunidad LGBTIQ+">Comunidad LGBTIQ+</option>
                                        <option value="Migrante">Población Migrante</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Grupo Étnico
                                    </label>
                                    <select
                                        value={data.grupo_etnico}
                                        onChange={(e) => setData('grupo_etnico', e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                                    >
                                        <option value="Ninguno">Ninguno / Sin pertenencia étnica</option>
                                        <option value="Mestizo">Mestizo</option>
                                        <option value="Indígena">Indígena</option>
                                        <option value="Afrodescendiente / Negro / Mulato">Afrodescendiente / Negro</option>
                                        <option value="Raizal">Raizal del Archipiélago</option>
                                        <option value="Palenquero">Palenquero</option>
                                        <option value="Rrom / Gitano">Rrom / Gitano</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Régimen de Aseguramiento en Salud
                                    </label>
                                    <select
                                        value={data.t_aseguramiento}
                                        onChange={(e) => setData('t_aseguramiento', e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                                    >
                                        <option value="Subsidiado">Subsidiado (SISBÉN)</option>
                                        <option value="Contributivo">Contributivo (Cotizante / Beneficiario)</option>
                                        <option value="Especial">Especial (Magisterio, FFMM, etc.)</option>
                                        <option value="No asegurado">No asegurado</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* BOTÓN DE ACCIÓN */}
                        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-xs text-slate-500 text-center sm:text-left">
                                Al registrarte aceptas la política de tratamiento de datos personales de la Alcaldía de Acacías.
                            </p>
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                <span>{processing ? 'Creando cuenta...' : 'Completar Registro y Acceder'}</span>
                            </button>
                        </div>
                    </form>
                </div>

                <div className="mt-8 text-center text-xs text-slate-400">
                    ¿Ya estás registrado o eres gestor/coordinador?{' '}
                    <Link href={route('login')} className="text-emerald-400 font-bold hover:underline">
                        Inicia sesión aquí
                    </Link>
                </div>
            </div>
        </div>
    );
}
