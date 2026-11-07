import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { asset } from '@/utils/asset';

export default function Login({ status }: { status?: string }) {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        email: 'admin@acacias.gov.co',
        password: 'Acacias2026*',
        remember: true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('login'));
    };

    const handleQuickSelect = (email: string, pass: string) => {
        setData((prev) => ({
            ...prev,
            email,
            password: pass,
        }));
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-emerald-500 selection:text-white">
            <Head title="Ingreso a PuntoTIC · Alcaldía de Acacías" />

            {/* Ambient Background Decorative Glows */}
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none animate-float-slow"></div>
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-float-slow" style={{ animationDelay: '2s' }}></div>

            <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center">
                {/* Brand Logo Presentation */}
                <div className="flex justify-center mb-5 animate-fade-in-down">
                    <div className="glass-card bg-white/95 p-3 px-6 rounded-2xl shadow-soft-xl border border-white/40 inline-flex items-center justify-center transition-transform hover:scale-105 duration-300">
                        <img
                            src={asset('images/logo_alcaldia.png')}
                            alt="Alcaldía de Acacías"
                            className="h-14 sm:h-16 w-auto object-contain"
                        />
                    </div>
                </div>

                <div className="animate-fade-in">
                    <div className="flex items-center justify-center gap-2">
                        <h1 className="text-3xl font-black text-white tracking-tight">PuntoTIC</h1>
                    </div>
                    <p className="mt-1 text-sm text-alcaldia-yellow font-bold tracking-wide">
                        Red de Puntos y Aulas Digitales
                    </p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                        Alcaldía Municipal de Acacías · Secretaría de las TIC
                    </p>
                </div>
            </div>

            <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-scale-in">
                <div className="bg-white/95 backdrop-blur-xl py-8 px-6 shadow-soft-xl rounded-3xl sm:px-10 border border-white/60">
                    {status && (
                        <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{status}</span>
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-4">
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
                                    placeholder="usuario@acacias.gov.co"
                                    required
                                />
                            </div>
                            {errors.email && <p className="text-[11px] text-rose-500 font-medium mt-1.5">{errors.email}</p>}
                        </div>

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

                        <div className="flex items-center justify-between text-xs pt-1">
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
                            className="btn-tactile w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-soft hover:shadow-soft-lg hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
                        >
                            <span>{processing ? 'Iniciando sesión...' : 'Ingresar a la Plataforma'}</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    {/* Quick Access Credential Pills for local testing */}
                    <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center justify-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Perfiles Oficiales Unificados (Clic para autocompletar)</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                            {/* Gestor Global Unificado */}
                            <button
                                type="button"
                                onClick={() => handleQuickSelect('gestor.global@acacias.gov.co', 'GestorGlobal2026*')}
                                className="btn-tactile p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300 transition-all text-[11px] text-emerald-950 font-medium"
                                title="Gestor único operativo con acceso a todos los Puntos PVD y Aulas Digitales"
                            >
                                <div className="font-bold flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                                        <span>Gestor Global (Puntos y Aulas)</span>
                                    </div>
                                    <span className="text-[9px] bg-emerald-200 text-emerald-900 font-black px-1.5 py-0.5 rounded uppercase">Unificado</span>
                                </div>
                                <div className="text-[10px] text-emerald-700 truncate font-mono mt-0.5">gestor.global@acacias.gov.co</div>
                            </button>

                            {/* Coordinador PVD PLUS */}
                            <button
                                type="button"
                                onClick={() => handleQuickSelect('coordinador.plus@acacias.gov.co', 'PvdPlus2026*')}
                                className="btn-tactile p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-300 transition-all text-[11px] text-slate-700 font-medium"
                                title="Coordinador de Sedes PVD"
                            >
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                                    <span>Coordinador PVD</span>
                                </div>
                                <div className="text-[10px] text-slate-400 truncate font-mono mt-0.5">coordinador.plus@acacias.gov.co</div>
                            </button>

                            {/* Coordinador General */}
                            <button
                                type="button"
                                onClick={() => handleQuickSelect('coordinador.general@acacias.gov.co', 'CoordGeneral2026*')}
                                className="btn-tactile p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-300 transition-all text-[11px] text-slate-700 font-medium"
                                title="Supervisión global municipal y reportes consolidados"
                            >
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                                    <span>Coordinador General TIC</span>
                                </div>
                                <div className="text-[10px] text-slate-400 truncate font-mono mt-0.5">coordinador.general@acacias.gov.co</div>
                            </button>

                            {/* Gestor Dinamarca (Pruebas) */}
                            <button
                                type="button"
                                onClick={() => handleQuickSelect('gestor.dinamarca@acacias.gov.co', 'Dinamarca2026*')}
                                className="btn-tactile p-2.5 rounded-xl bg-amber-50/90 hover:bg-amber-100 border border-amber-300/80 transition-all text-[11px] text-amber-950 font-medium"
                                title="Gestor asignado al Aula Digital Dinamarca para confirmar solicitudes de sala"
                            >
                                <div className="font-bold flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                        <span>Gestor Aula Dinamarca</span>
                                    </div>
                                    <span className="text-[9px] bg-amber-200 text-amber-900 font-black px-1.5 py-0.5 rounded uppercase">Dinamarca</span>
                                </div>
                                <div className="text-[10px] text-amber-800 truncate font-mono mt-0.5">gestor.dinamarca@acacias.gov.co</div>
                            </button>

                            {/* Ciudadano / Portal */}
                            <button
                                type="button"
                                onClick={() => handleQuickSelect('usuario.prueba@acacias.gov.co', 'Acacias2026*')}
                                className="btn-tactile p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all text-[11px] text-indigo-950 font-medium"
                                title="Portal ciudadano para autogestión y reserva de salas"
                            >
                                <div className="font-bold flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                                        <span>Portal Ciudadano (Reservas)</span>
                                    </div>
                                    <span className="text-[9px] bg-indigo-200 text-indigo-900 font-black px-1.5 py-0.5 rounded uppercase">Ciudadano</span>
                                </div>
                                <div className="text-[10px] text-indigo-700 truncate font-mono mt-0.5">usuario.prueba@acacias.gov.co</div>
                            </button>
                        </div>

                        <div className="mt-2.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/60 text-[10px] text-slate-500 flex items-center justify-between text-left">
                            <div>
                                <span className="font-bold text-slate-700">Cuenta Admin TIC:</span> Ingrese con <code className="font-mono text-slate-800">admin@acacias.gov.co</code> y su contraseña original de producción (restaurada).
                            </div>
                        </div>
                    </div>
                </div>

                <p className="mt-6 text-center text-xs text-slate-400">
                    © {new Date().getFullYear()} Alcaldía Municipal de Acacías · Plataforma PuntoTIC
                </p>
            </div>
        </div>
    );
}
