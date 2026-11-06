import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Settings, ShieldCheck, Save, CheckCircle2, Sliders, History, ArrowRight } from 'lucide-react';

interface Props {
    settings: Array<any>;
}

export default function SettingsIndex({ settings }: Props) {
    const settingsMap: Record<string, any> = {};
    settings.forEach((s) => {
        settingsMap[s.clave] = s.valor;
    });

    const { data, setData, post, processing } = useForm({
        settings: settingsMap,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('configuracion.update'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">
                            Configuración del Sistema
                        </h1>
                        <p className="text-xs text-slate-500 font-medium">
                            Parámetros institucionales, umbrales y motor de predicción IA
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Configuración del Sistema" />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Formulario de Configuración */}
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                        <Settings className="w-5 h-5 text-emerald-600" />
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Parámetros Globales</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                            <div>
                                <div className="text-xs font-bold text-slate-900">Autorregistro Ciudadano Externo</div>
                                <div className="text-[11px] text-slate-500">
                                    Permite a los ciudadanos autoregistrarse desde el portal público de la Alcaldía
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={data.settings.allow_public_registration === 'true'}
                                onChange={(e) =>
                                    setData('settings', {
                                        ...data.settings,
                                        allow_public_registration: e.target.checked ? 'true' : 'false',
                                    })
                                }
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 w-4 h-4 cursor-pointer"
                            />
                        </div>

                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                            <div>
                                <div className="text-xs font-bold text-slate-900">Motor de Sugerencias IA Predictivo</div>
                                <div className="text-[11px] text-slate-500">
                                    Calcula probabilidades de trámites por ciudadano y perfil demográfico
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={data.settings.ml_prediction_enabled === 'true'}
                                onChange={(e) =>
                                    setData('settings', {
                                        ...data.settings,
                                        ml_prediction_enabled: e.target.checked ? 'true' : 'false',
                                    })
                                }
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 w-4 h-4 cursor-pointer"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Umbral de Días para Alerta de Inactividad / Abandono (IA Churn)
                            </label>
                            <input
                                type="number"
                                min={15}
                                max={365}
                                value={data.settings.dias_alerta_inactividad || '60'}
                                onChange={(e) =>
                                    setData('settings', {
                                        ...data.settings,
                                        dias_alerta_inactividad: e.target.value,
                                    })
                                }
                                className="w-full sm:w-48 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">
                                Genera alerta en el Dashboard cuando un ciudadano frecuente supera este período sin acudir.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-3 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                        >
                            <Save className="w-4 h-4" />
                            <span>{processing ? 'Guardando...' : 'Guardar Parámetros'}</span>
                        </button>
                    </div>
                </form>

                {/* Banner de Acceso al Registro de Actividad y Auditoría */}
                <div className="bg-slate-900 text-slate-200 p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center shrink-0 border border-slate-700">
                            <History className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-white uppercase tracking-wider">
                                Trazabilidad y Registro de Auditoría
                            </div>
                            <div className="text-[11px] text-slate-400">
                                Consulta el historial de eventos, gestores responsables y payloads técnicos en el nuevo centro dedicado
                            </div>
                        </div>
                    </div>
                    <Link
                        href={route('auditoria.index')}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all shrink-0"
                    >
                        <span>Ver Registro de Actividad</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
