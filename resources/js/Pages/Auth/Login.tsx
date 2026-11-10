import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Lock,
    Mail,
    User,
    ArrowRight,
    ShieldCheck,
    CheckCircle2,
    Eye,
    EyeOff,
    Building2,
    UserCheck,
    UserPlus,
} from 'lucide-react';
import { asset } from '@/utils/asset';

const TEST_ROLES_GESTORES = [
    {
        id: 'admin',
        name: 'Administrador TIC',
        tag: 'Control Total',
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
        dotClass: 'bg-purple-600',
        email: 'admin@acacias.gov.co',
        pass: 'Acacias2026*',
        desc: 'Auditoría, config y control total',
    },
    {
        id: 'coord_general',
        name: 'Coordinador General',
        tag: 'Descarga General',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
        dotClass: 'bg-blue-600',
        email: 'coordinador.general@acacias.gov.co',
        pass: 'CoordGeneral2026*',
        desc: 'Reportes y datos de todos los puntos',
    },
    {
        id: 'pvd_tradicional',
        name: 'Gestor PVD Tradicional',
        tag: 'Solo Visita',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        dotClass: 'bg-amber-600',
        email: 'gestor.tradicional@acacias.gov.co',
        pass: 'Tradicional2026*',
        desc: 'Sede Tradicional · Solo Visita',
    },
    {
        id: 'pvd_plus',
        name: 'Gestor PVD PLUS',
        tag: 'Solo Visita',
        badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
        dotClass: 'bg-orange-600',
        email: 'gestor_plus@acacias.gov.co',
        pass: 'Jd1122129218*',
        desc: 'Sede PLUS · Solo Visita',
    },
    {
        id: 'aula_chichimene',
        name: 'Gestor Aula Chichimene',
        tag: 'Niños + Visitas',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        dotClass: 'bg-emerald-600',
        email: 'gestor.chichimene@acacias.gov.co',
        pass: 'Chichimene2026*',
        desc: 'Aula Chichimene · Ambos menús',
    },
    {
        id: 'aula_dinamarca',
        name: 'Gestor Aula Dinamarca',
        tag: 'Niños + Visitas',
        badgeClass: 'bg-teal-100 text-teal-800 border-teal-200',
        dotClass: 'bg-teal-600',
        email: 'gestor.dinamarca@acacias.gov.co',
        pass: 'Dinamarca2026*',
        desc: 'Aula Dinamarca · Ambos menús',
    },
];

export default function Login({ status }: { status?: string }) {
    const [mode, setMode] = useState<'gestores' | 'ciudadanos'>('gestores');
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: 'admin@acacias.gov.co',
        password: 'Acacias2026*',
        remember: true,
    });

    const handleSwitchMode = (newMode: 'gestores' | 'ciudadanos') => {
        setMode(newMode);
        if (newMode === 'gestores') {
            setData({
                email: 'admin@acacias.gov.co',
                password: 'Acacias2026*',
                remember: true,
            });
        } else {
            setData({
                email: '1121000999',
                password: 'Acacias2026*',
                remember: true,
            });
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('login'));
    };

    const handleQuickSelect = (identifier: string, pass: string, targetMode: 'gestores' | 'ciudadanos' = 'gestores') => {
        if (mode !== targetMode) {
            setMode(targetMode);
        }
        setData((prev) => ({
            ...prev,
            email: identifier,
            password: pass,
        }));
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row font-sans selection:bg-emerald-500 selection:text-white">
            <Head title="Ingreso a PuntoTIC · Alcaldía de Acacías" />

            {/* COLUMNA IZQUIERDA: FORMULARIO DE ACCESO INSTITUCIONAL */}
            <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-8 lg:p-10 xl:p-12 bg-white shadow-xl z-10 overflow-y-auto max-h-screen">
                {/* Header Superior */}
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <img
                            src={asset('images/logo_alcaldia.png')}
                            alt="Alcaldía de Acacías"
                            className="h-10 sm:h-12 w-auto object-contain"
                        />
                        <div className="border-l border-slate-200 pl-3">
                            <span className="text-lg font-black text-slate-900 tracking-tight block">
                                PuntoTIC
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium block">
                                Red de Puntos y Aulas Digitales
                            </span>
                        </div>
                    </div>
                </div>

                {/* Contenido Central: Selector e Inputs */}
                <div className="max-w-lg w-full mx-auto my-auto py-2">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                            {mode === 'gestores' ? 'Ingreso Gestores' : 'Ingreso Ciudadanos'}
                        </h1>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                            {mode === 'gestores'
                                ? 'Plataforma administrativa para coordinadores y gestores de sede'
                                : 'Portal ciudadano para solicitud y seguimiento de préstamos de salas'}
                        </p>
                    </div>

                    {/* SELECTOR DE MODALIDAD (ESTILO BOTONES INSTITUCIONALES) */}
                    <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-6 border border-slate-200/80">
                        <button
                            type="button"
                            onClick={() => handleSwitchMode('gestores')}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                mode === 'gestores'
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                            }`}
                        >
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Ingreso Gestores</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleSwitchMode('ciudadanos')}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                mode === 'ciudadanos'
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                            }`}
                        >
                            <User className="w-3.5 h-3.5" />
                            <span>Ingreso Ciudadanos</span>
                        </button>
                    </div>

                    {status && (
                        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span>{status}</span>
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-4">
                        {mode === 'gestores' ? (
                            /* MODO GESTORES: CORREO INSTITUCIONAL */
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Correo Institucional
                                </label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                                        placeholder="gestor@acacias.gov.co"
                                        required
                                        autoComplete="username"
                                    />
                                </div>
                                {errors.email && <p className="text-[11px] text-rose-500 font-medium mt-1.5">{errors.email}</p>}
                            </div>
                        ) : (
                            /* MODO CIUDADANOS: CÉDULA / DOCUMENTO */
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Número de Cédula o Documento
                                    </label>
                                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200/60">
                                        Cédula o TI
                                    </span>
                                </div>
                                <div className="relative">
                                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                                        placeholder="Ej. 1121000999"
                                        required
                                        autoComplete="username"
                                    />
                                </div>
                                {errors.email && <p className="text-[11px] text-rose-500 font-medium mt-1.5">{errors.email}</p>}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                Contraseña
                            </label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-[11px] text-rose-500 font-medium mt-1.5">{errors.password}</p>}
                        </div>

                        <div className="flex items-center justify-between text-xs pt-0.5">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                />
                                <span className="text-slate-600 font-medium">Recordar sesión</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
                        >
                            <span>
                                {processing
                                    ? 'Iniciando sesión...'
                                    : mode === 'gestores'
                                    ? 'Ingresar como Gestor'
                                    : 'Ingresar como Ciudadano'}
                            </span>
                            <ArrowRight className="w-4 h-4" />
                        </button>

                        {/* LLAMADO A REGISTRO PARA CIUDADANOS */}
                        {mode === 'ciudadanos' && (
                            <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs">
                                <span className="text-slate-500 block mb-1.5">¿Primera vez solicitando una sala?</span>
                                <Link
                                    href={route('register')}
                                    className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-700 hover:text-emerald-800 hover:underline"
                                >
                                    <UserPlus className="w-3.5 h-3.5" />
                                    <span>Realiza tu registro ciudadano aquí →</span>
                                </Link>
                            </div>
                        )}
                    </form>

                    {/* PILLS DE ACCESO RÁPIDO PARA PRUEBAS */}
                    <div className="mt-5 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-2.5">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Accesos Rápidos por Rol (Pruebas)</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                                Clic para cargar credenciales
                            </span>
                        </div>

                        {mode === 'gestores' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {TEST_ROLES_GESTORES.map((role) => {
                                    const isSelected = data.email === role.email;
                                    return (
                                        <button
                                            key={role.id}
                                            type="button"
                                            onClick={() => handleQuickSelect(role.email, role.pass, 'gestores')}
                                            className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1 group relative ${
                                                isSelected
                                                    ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-600/30'
                                                    : 'border-slate-200/90 bg-slate-50/60 hover:bg-slate-100/90 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-1.5 w-full">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <span className={`w-2 h-2 rounded-full shrink-0 ${role.dotClass}`}></span>
                                                    <span className="font-bold text-[11px] text-slate-900 truncate">
                                                        {role.name}
                                                    </span>
                                                </div>
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${role.badgeClass}`}>
                                                    {role.tag}
                                                </span>
                                            </div>

                                            <p className="text-[10px] text-slate-500 font-medium leading-tight line-clamp-1">
                                                {role.desc}
                                            </p>

                                            <div className="flex items-center justify-between gap-1 w-full pt-1 border-t border-slate-200/50 text-[9.5px]">
                                                <span className="font-mono text-slate-400 group-hover:text-slate-600 truncate">
                                                    {role.email}
                                                </span>
                                                {isSelected && (
                                                    <span className="inline-flex items-center gap-0.5 text-emerald-700 font-black shrink-0">
                                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                        <span>Listo</span>
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <button
                                    type="button"
                                    onClick={() => handleQuickSelect('1121000999', 'Acacias2026*', 'ciudadanos')}
                                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${
                                        data.email === '1121000999'
                                            ? 'border-indigo-600 bg-indigo-50/80 shadow-xs ring-1 ring-indigo-600/30'
                                            : 'border-indigo-200/80 bg-indigo-50/40 hover:bg-indigo-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xs">
                                            CC
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-xs text-indigo-950">Ciudadano de Prueba</span>
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-indigo-100 text-indigo-800 border-indigo-200">
                                                    Préstamos de Salas
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-slate-500">Documento: 1121000999 · Clave: Acacias2026*</span>
                                        </div>
                                    </div>
                                    {data.email === '1121000999' && (
                                        <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Legal (Exacto como en la referencia municipal) */}
                <div className="pt-6 border-t border-slate-100 text-center text-[11px] text-slate-400">
                    <p>
                        Cuando inicias sesión en la plataforma aceptas las políticas de acceso a la información de la entidad.{' '}
                        <a
                            href="https://www.acacias.gov.co"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 font-semibold hover:underline"
                        >
                            www.acacias.gov.co
                        </a>
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                        © {new Date().getFullYear()} Alcaldía Municipal de Acacías · Secretaría de las TIC
                    </p>
                </div>
            </div>

            {/* COLUMNA DERECHA: FONDO VERDE INSTITUCIONAL CON ALCALDÍA DE ACACÍAS CENTRADO */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#01A300] items-center justify-center p-12 select-none">
                <div className="relative text-center flex flex-col items-center justify-center max-w-md">
                    {/* Escudo oficial de Acacías + Tipografía Institucional */}
                    <div className="flex items-center gap-5 justify-center mb-3">
                        <img
                            src={asset('images/escudo_acacias.png')}
                            alt="Escudo de Acacías"
                            className="h-24 sm:h-28 w-auto object-contain drop-shadow-md"
                        />
                        <div className="h-20 w-0.5 bg-yellow-400 rounded-full"></div>
                        <div className="text-left text-white">
                            <span className="text-sm font-black tracking-[0.2em] text-emerald-100 uppercase block">
                                Alcaldía de
                            </span>
                            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white block leading-none">
                                ACACÍAS
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 text-center">
                        <p className="text-emerald-100 text-sm font-bold tracking-wide">
                            Red de Puntos y Aulas Digitales
                        </p>
                        <p className="text-xs text-emerald-200/90 font-medium mt-0.5">
                            Secretaría de las TIC
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
