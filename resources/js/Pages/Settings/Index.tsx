import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Settings, ShieldCheck, Save, CheckCircle2, History, User } from 'lucide-react';

interface Props {
    settings: Array<any>;
    auditLogs: Array<any>;
}

export default function SettingsIndex({ settings, auditLogs }: Props) {
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
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Configuración del Sistema y Auditoría</h1>
                        <p className="text-xs text-slate-500 font-medium">
                            Parámetros institucionales, motor de IA y registro de trazabilidad de cambios
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Configuración y Auditoría" />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Formulario de Configuración */}
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                        <Settings className="w-5 h-5 text-alcaldia-green" />
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
                                className="rounded border-slate-300 text-alcaldia-green focus:ring-alcaldia-green w-4 h-4 cursor-pointer"
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
                                className="rounded border-slate-300 text-alcaldia-green focus:ring-alcaldia-green w-4 h-4 cursor-pointer"
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
                                className="w-full sm:w-48 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none"
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
                            className="px-5 py-2 rounded-xl bg-alcaldia-green hover:bg-alcaldia-green-dark text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
                        >
                            <Save className="w-4 h-4" />
                            <span>{processing ? 'Guardando...' : 'Guardar Parámetros'}</span>
                        </button>
                    </div>
                </form>

                {/* Audit Logs Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <History className="w-4 h-4 text-slate-500" />
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                Trazabilidad y Registro de Auditoría
                            </h3>
                        </div>
                        <span className="text-xs font-semibold text-slate-400">Últimos 30 eventos</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                                <tr>
                                    <th className="px-5 py-3">Acción</th>
                                    <th className="px-4 py-3">Módulo</th>
                                    <th className="px-4 py-3">Usuario Gestor</th>
                                    <th className="px-4 py-3">IP Origen</th>
                                    <th className="px-5 py-3 text-right">Fecha y Hora</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {auditLogs.map((log) => (
                                    <tr key={log.id_log} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-5 py-3">
                                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                                                {log.accion}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-700">{log.modulo}</td>
                                        <td className="px-4 py-3 text-xs text-slate-600 font-medium">
                                            {log.usuario?.name || 'Sistema / Coordinación'}
                                        </td>
                                        <td className="px-4 py-3 text-xs font-mono text-slate-400">{log.ip_address || '127.0.0.1'}</td>
                                        <td className="px-5 py-3 text-right text-xs font-medium text-slate-500">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {auditLogs.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-xs">
                                            No hay registros de auditoría aún.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
