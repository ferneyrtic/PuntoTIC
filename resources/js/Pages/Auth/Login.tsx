import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Building2, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Login({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: 'admin@acacias.gov.co',
        password: 'Acacias2026*',
        remember: true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <Head title="PuntoTIC - Plataforma de Aulas y Puntos Digitales" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="flex justify-center mb-4">
                    <div className="bg-white/95 backdrop-blur-md p-3.5 px-6 rounded-2xl shadow-2xl shadow-black/30 border border-white/20 inline-block">
                        <img
                            src="/images/logo_alcaldia.png"
                            alt="Alcaldía de Acacías"
                            className="h-16 md:h-18 w-auto object-contain"
                        />
                    </div>
                </div>
                <div className="flex items-center justify-center gap-2">
                    <h1 className="text-3xl font-black text-white tracking-wider">PuntoTIC</h1>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-alcaldia-green text-white tracking-widest border border-alcaldia-green-light">v2.0</span>
                </div>
                <p className="mt-1 text-sm text-alcaldia-yellow font-bold tracking-wide">
                    Plataforma de Puntos y Aulas Digitales
                </p>
                <p className="text-xs text-slate-400 font-medium">
                    Alcaldía de Acacías — Secretaría de las TIC
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-slate-100">
                    {status && (
                        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Correo Institucional
                            </label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green focus:ring-1 focus:ring-alcaldia-green outline-none"
                                    placeholder="usuario@acacias.gov.co"
                                    required
                                />
                            </div>
                            {errors.email && <p className="text-[11px] text-rose-500 mt-1">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Contraseña
                            </label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green focus:ring-1 focus:ring-alcaldia-green outline-none"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            {errors.password && <p className="text-[11px] text-rose-500 mt-1">{errors.password}</p>}
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="rounded border-slate-300 text-alcaldia-green focus:ring-alcaldia-green"
                                />
                                <span className="text-slate-600 font-medium">Recordar sesión</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3 px-4 rounded-xl bg-alcaldia-green hover:bg-alcaldia-green-dark text-white text-xs font-black shadow-lg shadow-alcaldia-green/20 transition-all flex items-center justify-center gap-2 mt-2"
                        >
                            <span>{processing ? 'Iniciando sesión...' : 'Ingresar a la Plataforma'}</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    {/* Quick Demo Credentials Info */}
                    <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-alcaldia-green" />
                            <span>Acceso de Coordinación</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-left text-[11px] font-mono text-slate-600 space-y-1">
                            <div><strong>Admin:</strong> admin@acacias.gov.co / Acacias2026*</div>
                            <div><strong>Coord:</strong> coordinador.plus@acacias.gov.co / PvdPlus2026*</div>
                        </div>
                    </div>
                </div>

                <p className="mt-6 text-center text-xs text-slate-500">
                    © {new Date().getFullYear()} Alcaldía Municipal de Acacías · Oficina TIC
                </p>
            </div>
        </div>
    );
}
