import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, Building2, Eye, EyeOff } from 'lucide-react';

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
                            src="/images/logo_alcaldia.png"
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

                    {/* Interactive Quick Access Credential Pills */}
                    <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center justify-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Perfiles Oficiales de Acceso</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-left">
                            <button
                                type="button"
                                onClick={() => handleQuickSelect('admin@acacias.gov.co', 'Acacias2026*')}
                                className="btn-tactile p-2 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-300 transition-all text-[11px] text-slate-700 font-medium"
                            >
                                <div className="font-bold text-slate-900 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    <span>Admin TIC</span>
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">admin@acacias...</div>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleQuickSelect('coordinador.plus@acacias.gov.co', 'PvdPlus2026*')}
                                className="btn-tactile p-2 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-300 transition-all text-[11px] text-slate-700 font-medium"
                            >
                                <div className="font-bold text-slate-900 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    <span>Coord. PLUS</span>
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">coordinador.plus...</div>
                            </button>
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
