import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Users,
    Clock,
    Printer,
    Sparkles,
    TrendingUp,
    AlertTriangle,
    ArrowRight,
    Building2,
    CheckCircle2,
    CalendarCheck,
    FileSpreadsheet,
    UserPlus,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface Props {
    stats: {
        kpis: {
            visitas_hoy: number;
            delta_visitas_hoy: number;
            visitas_mes: number;
            impresiones_hoy_hojas: number;
            impresiones_mes_hojas: number;
            total_ciudadanos: number;
            ciudadanos_esta_semana: number;
            prestamos_hoy: number;
        };
        chart_7_dias: Array<{ dia: string; fecha: string; visitas: number; es_hoy: boolean }>;
        distribucion_categorias: Array<{
            id_categoria: number;
            nombre: string;
            color: string;
            icono: string;
            total_visitas: number;
            porcentaje: number;
        }>;
        distribucion_puntos: Array<{
            id_punto: number;
            nombre_punto: string;
            zona: string;
            total_visitas: number;
        }>;
    };
    churnAlerts: Array<{
        id_form_pvd: number;
        documento: string;
        nombre_completo: string;
        telefono: string;
        punto_nombre: string;
        total_visitas: number;
        ultima_visita_fecha: string;
        dias_inactivo: number;
        nivel_riesgo: string;
    }>;
    tomorrowLoad: {
        visitas_estimadas: number;
        hora_pico: string;
        dia_semana: string;
        recomendacion: string;
    };
    recentVisits: Array<any>;
    points: Array<any>;
    selectedPointId: number | null;
}

export default function Dashboard({
    stats,
    churnAlerts,
    tomorrowLoad,
    recentVisits,
    points,
    selectedPointId,
}: Props) {
    const { kpis, chart_7_dias, distribucion_categorias, distribucion_puntos } = stats;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Panel de Control PuntoTIC</h1>
                        <p className="text-xs text-slate-500 font-medium">Monitoreo en tiempo real — Plataforma de Puntos y Aulas Digitales de Acacías</p>
                    </div>
                </div>
            }
        >
            <Head title="Panel de Control PuntoTIC" />

            {/* AI Alert Banner */}
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 border border-emerald-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-alcaldia-green text-white flex items-center justify-center shrink-0 shadow-md shadow-alcaldia-green/30">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-alcaldia-green uppercase tracking-wider flex items-center gap-1.5">
                            <span>IA Predictiva de Asistencia</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-alcaldia-green/10 font-black">Activa</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800">
                            Para mañana <span className="font-bold text-alcaldia-green">{tomorrowLoad.dia_semana}</span> se estiman{' '}
                            <span className="font-bold underline text-alcaldia-green">{tomorrowLoad.visitas_estimadas} visitas</span>. Franja pico:{' '}
                            <span className="font-bold text-slate-900">{tomorrowLoad.hora_pico}</span>.
                        </p>
                    </div>
                </div>
                <Link
                    href={route('visitas.create')}
                    className="shrink-0 px-4 py-2 rounded-xl bg-alcaldia-green hover:bg-alcaldia-green-dark text-white text-xs font-bold shadow-sm transition-all"
                >
                    + Registrar Nueva Visita
                </Link>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Visitas Hoy */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Visitas Hoy</span>
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-alcaldia-green flex items-center justify-center font-bold">
                            <CalendarCheck className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900 tracking-tight">{kpis.visitas_hoy}</span>
                        <span className={`text-xs font-bold ${kpis.delta_visitas_hoy >= 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {kpis.delta_visitas_hoy >= 0 ? `+${kpis.delta_visitas_hoy}%` : `${kpis.delta_visitas_hoy}%`} vs ayer
                        </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium mt-1">Registradas durante la jornada actual</div>
                </div>

                {/* Visitas Mes */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Visitas Este Mes</span>
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-alcaldia-blue flex items-center justify-center font-bold">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900 tracking-tight">{kpis.visitas_mes}</span>
                        <span className="text-xs font-semibold text-slate-500">atenciones</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium mt-1">Acumulado mes en curso</div>
                </div>

                {/* Impresiones */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Impresiones / Copias</span>
                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-alcaldia-yellow flex items-center justify-center font-bold">
                            <Printer className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900 tracking-tight">{kpis.impresiones_hoy_hojas}</span>
                        <span className="text-xs font-semibold text-slate-500">hojas hoy</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium mt-1">{kpis.impresiones_mes_hojas} hojas totales este mes</div>
                </div>

                {/* Ciudadanos Registrados */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Directorio Ciudadano</span>
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900 tracking-tight">{kpis.total_ciudadanos}</span>
                        <span className="text-xs font-bold text-emerald-600">+{kpis.ciudadanos_esta_semana} sem</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium mt-1">Base de datos de ciudadanos única</div>
                </div>
            </div>

            {/* Charts & Breakdown Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* 7-Day Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Evolución de Visitas (Últimos 7 Días)</h3>
                                <p className="text-xs text-slate-500">Comportamiento diario de usuarios atendidos en salas</p>
                            </div>
                            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-alcaldia-green border border-emerald-200">
                                7 Días
                            </span>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chart_7_dias} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis dataKey="dia" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                                        formatter={(val: any) => [`${val} visitas`, 'Atenciones']}
                                    />
                                    <Bar dataKey="visitas" fill="#1B6B35" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Pico semanal registrado con alta concurrencia matutina</span>
                        <Link href={route('visitas.index')} className="text-alcaldia-green font-bold hover:underline flex items-center gap-1">
                            Ver historial completo <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>

                {/* Top Categories */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-slate-900">Servicios más Solicitados</h3>
                            <span className="text-xs font-semibold text-slate-400">Este mes</span>
                        </div>
                        <div className="space-y-3.5">
                            {distribucion_categorias.map((cat) => (
                                <div key={cat.id_categoria}>
                                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                                        <span className="text-slate-800 truncate">{cat.nombre}</span>
                                        <span className="text-slate-500 font-bold">{cat.porcentaje}% ({cat.total_visitas})</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{ width: `${Math.max(5, cat.porcentaje)}%`, backgroundColor: cat.color || '#1B6B35' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="pt-4 border-t border-slate-100 mt-4">
                        <Link href={route('categorias.index')} className="text-xs font-bold text-alcaldia-green hover:underline flex items-center justify-between">
                            <span>Gestionar taxonomía de servicios</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Bottom Grid: Recent Activity & AI Churn Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Visits Table */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
                    <div>
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Últimas Visitas Registradas</h3>
                                <p className="text-xs text-slate-500">Atenciones ciudadanas en tiempo real</p>
                            </div>
                            <Link
                                href={route('visitas.index')}
                                className="text-xs font-bold text-alcaldia-green hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                            >
                                Ver Todas
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                                    <tr>
                                        <th className="px-5 py-3">Ciudadano</th>
                                        <th className="px-4 py-3">Categoría / Trámite</th>
                                        <th className="px-4 py-3">Sede</th>
                                        <th className="px-4 py-3">Gestor</th>
                                        <th className="px-5 py-3 text-right">Hora</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recentVisits.map((v) => (
                                        <tr key={v.id_visita} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-5 py-3">
                                                <div className="font-bold text-slate-900 text-xs">{v.ciudadano?.nombre_completo || 'Ciudadano'}</div>
                                                <div className="text-[11px] text-slate-400">CC {v.ciudadano?.documento}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">
                                                    {v.subcategoria?.nombre || v.categoria?.nombre || v.servicio_texto || 'Servicio General'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-600 font-medium">{v.punto?.nombre_punto}</td>
                                            <td className="px-4 py-3 text-xs text-slate-500">{v.gestor?.name || 'Gestor'}</td>
                                            <td className="px-5 py-3 text-right text-xs font-semibold text-slate-400">
                                                {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                        </tr>
                                    ))}
                                    {recentVisits.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-xs">
                                                No hay visitas registradas hoy aún.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* AI Churn Alerts Panel */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <h3 className="text-base font-bold text-slate-900">Alertas de Inactividad (IA)</h3>
                        </div>
                        <p className="text-xs text-slate-500 mb-4">Ciudadanos frecuentes que llevan más de 60 días sin acudir</p>

                        <div className="space-y-3">
                            {churnAlerts.map((citizen) => (
                                <div
                                    key={citizen.id_form_pvd}
                                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-amber-200 transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <Link
                                            href={route('ciudadanos.show', citizen.id_form_pvd)}
                                            className="text-xs font-bold text-slate-900 hover:text-alcaldia-green truncate"
                                        >
                                            {citizen.nombre_completo}
                                        </Link>
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                            {citizen.dias_inactivo} días
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                                        <span>Tel: {citizen.telefono || 'Sin tel'}</span>
                                        <span>{citizen.total_visitas} visitas previas</span>
                                    </div>
                                </div>
                            ))}
                            {churnAlerts.length === 0 && (
                                <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium text-center">
                                    Todos los ciudadanos frecuentes se encuentran con asistencia regular.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 mt-4">
                        <Link href={route('ciudadanos.index')} className="text-xs font-bold text-alcaldia-green hover:underline flex items-center justify-between">
                            <span>Ver directorio completo</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
