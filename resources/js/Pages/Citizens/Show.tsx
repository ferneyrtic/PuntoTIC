import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArrowLeft,
    Edit3,
    UserPlus,
    Sparkles,
    CalendarCheck,
    DoorOpen,
    Printer,
    MapPin,
    Phone,
    Mail,
    GraduationCap,
    HeartPulse,
    Shield,
    Users,
} from 'lucide-react';

interface Props {
    citizen: any;
    mlPredictions: Array<{
        id_categoria: number;
        categoria_nombre: string;
        id_subcategoria: number;
        subcategoria_nombre: string;
        porcentaje: number;
        motivo: string;
    }>;
}

export default function CitizenShow({ citizen, mlPredictions }: Props) {
    const [activeTab, setActiveTab] = useState<'visitas' | 'prestamos' | 'impresiones'>('visitas');

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('ciudadanos.index')}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 tracking-tight">{citizen.nombre_completo}</h1>
                            <p className="text-xs text-slate-500 font-medium">
                                {citizen.tipo_documento?.sigla || 'CC'} {citizen.documento} · Registrado el{' '}
                                {new Date(citizen.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href={route('ciudadanos.edit', citizen.id_form_pvd)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
                        >
                            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Editar Datos</span>
                        </Link>
                        <Link
                            href={route('visitas.create', { documento: citizen.documento })}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-alcaldia-green hover:bg-alcaldia-green-dark text-white text-xs font-bold shadow-sm transition-all"
                        >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>+ Registrar Visita Hoy</span>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Ciudadano - ${citizen.nombre_completo}`} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Citizen Profile & Demographics Card */}
                <div className="space-y-6">
                    {/* Main Demographics Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
                            <div className="w-12 h-12 rounded-2xl bg-alcaldia-green text-white font-black text-base flex items-center justify-center shadow-md shadow-alcaldia-green/20">
                                {citizen.nombres ? citizen.nombres.substring(0, 1) : 'C'}
                                {citizen.apellidos ? citizen.apellidos.substring(0, 1) : 'D'}
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-900 leading-tight">{citizen.nombre_completo}</h2>
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-alcaldia-green border border-emerald-200 mt-1">
                                    Ciudadano Activo
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                                <span>{citizen.telefono || 'Sin teléfono registrado'}</span>
                            </div>

                            <div className="flex items-center gap-2 text-slate-600">
                                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="truncate">{citizen.correo || 'Sin correo registrado'}</span>
                            </div>

                            <div className="flex items-center gap-2 text-slate-600">
                                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                <span>
                                    {citizen.direccion || 'Sin dirección'} · {citizen.barrio || 'Acacías'} ({citizen.zona || 'Urbana'})
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-slate-600">
                                <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
                                <span>Nivel: <strong className="text-slate-800">{citizen.nivel_educativo || 'Sin registrar'}</strong></span>
                            </div>

                            <div className="flex items-center gap-2 text-slate-600">
                                <HeartPulse className="w-4 h-4 text-slate-400 shrink-0" />
                                <span>Salud: <strong className="text-slate-800">{citizen.t_aseguramiento || 'Subsidiado'}</strong></span>
                            </div>

                            <div className="flex items-center gap-2 text-slate-600">
                                <Users className="w-4 h-4 text-slate-400 shrink-0" />
                                <span>Estrato {citizen.estrato || '1'} · {citizen.ocupacion || 'Empleado'}</span>
                            </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 rounded-xl bg-slate-50">
                                <div className="text-base font-black text-slate-900">{citizen.visitas?.length || 0}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Visitas</div>
                            </div>
                            <div className="p-2 rounded-xl bg-slate-50">
                                <div className="text-base font-black text-slate-900">{citizen.prestamos?.length || 0}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Salas</div>
                            </div>
                            <div className="p-2 rounded-xl bg-slate-50">
                                <div className="text-base font-black text-slate-900">{citizen.impresiones?.length || 0}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Impres.</div>
                            </div>
                        </div>
                    </div>

                    {/* AI Predictions Panel */}
                    <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/60 p-5 rounded-2xl border border-emerald-200/90 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-lg bg-alcaldia-green text-white flex items-center justify-center font-bold text-xs shadow-sm">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-alcaldia-green uppercase tracking-wider">Predicción IA de Trámites</h3>
                                <div className="text-[11px] text-slate-600 font-medium">Servicios más probables para hoy:</div>
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            {mlPredictions.map((pred, i) => (
                                <div key={i} className="p-3 rounded-xl bg-white/90 border border-emerald-200/60 shadow-xs">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-1">
                                        <span className="truncate">{pred.subcategoria_nombre}</span>
                                        <span className="text-alcaldia-green font-black">{pred.porcentaje}%</span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mb-1.5">
                                        <div
                                            className="h-full rounded-full bg-alcaldia-green transition-all duration-500"
                                            style={{ width: `${pred.porcentaje}%` }}
                                        />
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-medium">{pred.motivo}</div>
                                </div>
                            ))}
                        </div>

                        <Link
                            href={route('visitas.create', { documento: citizen.documento })}
                            className="mt-3.5 w-full py-2 rounded-xl bg-alcaldia-green hover:bg-alcaldia-green-dark text-white text-xs font-bold text-center block shadow-sm transition-colors"
                        >
                            Registrar con Sugerencia IA →
                        </Link>
                    </div>
                </div>

                {/* Right Column: Historical Activity Tabs */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Tab Selector */}
                    <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1">
                        <button
                            onClick={() => setActiveTab('visitas')}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                                activeTab === 'visitas'
                                    ? 'bg-alcaldia-green text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <CalendarCheck className="w-3.5 h-3.5" />
                            <span>Historial de Visitas ({citizen.visitas?.length || 0})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('prestamos')}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                                activeTab === 'prestamos'
                                    ? 'bg-alcaldia-green text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <DoorOpen className="w-3.5 h-3.5" />
                            <span>Préstamos ({citizen.prestamos?.length || 0})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('impresiones')}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                                activeTab === 'impresiones'
                                    ? 'bg-alcaldia-green text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Impresiones ({citizen.impresiones?.length || 0})</span>
                        </button>
                    </div>

                    {/* Tab Content: Visitas */}
                    {activeTab === 'visitas' && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                                        <tr>
                                            <th className="px-5 py-3">Fecha y Hora</th>
                                            <th className="px-4 py-3">Categoría</th>
                                            <th className="px-4 py-3">Subcategoría / Servicio</th>
                                            <th className="px-4 py-3">Sede PVD</th>
                                            <th className="px-4 py-3">Gestor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {citizen.visitas?.map((v: any) => (
                                            <tr key={v.id_visita} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-5 py-3 text-xs font-semibold text-slate-800">
                                                    {new Date(v.created_at).toLocaleDateString()} ·{' '}
                                                    <span className="text-slate-400">
                                                        {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">
                                                        {v.categoria?.nombre || 'General'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-xs font-bold text-slate-900">
                                                        {v.subcategoria?.nombre || v.servicio_texto || 'Servicio'}
                                                    </div>
                                                    {v.descripcion && (
                                                        <div className="text-[11px] text-slate-500 italic truncate max-w-[220px]">
                                                            "{v.descripcion}"
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-600">{v.punto?.nombre_punto}</td>
                                                <td className="px-4 py-3 text-xs text-slate-500">{v.gestor?.name || 'Gestor'}</td>
                                            </tr>
                                        ))}
                                        {(!citizen.visitas || citizen.visitas.length === 0) && (
                                            <tr>
                                                <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-xs">
                                                    No hay visitas registradas para este ciudadano.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Tab Content: Préstamos */}
                    {activeTab === 'prestamos' && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                                        <tr>
                                            <th className="px-5 py-3">Fecha</th>
                                            <th className="px-4 py-3">Tipo de Actividad</th>
                                            <th className="px-4 py-3">Asistentes</th>
                                            <th className="px-4 py-3">Sede PVD</th>
                                            <th className="px-4 py-3">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {citizen.prestamos?.map((p: any) => (
                                            <tr key={p.id_prestamo} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-5 py-3 text-xs font-semibold text-slate-800">{p.fecha_prestamo}</td>
                                                <td className="px-4 py-3 text-xs font-bold text-slate-900">{p.tipo_actividad}</td>
                                                <td className="px-4 py-3 text-xs text-slate-600">{p.num_asistentes} personas</td>
                                                <td className="px-4 py-3 text-xs text-slate-600">{p.punto?.nombre_punto}</td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                        {p.estado}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!citizen.prestamos || citizen.prestamos.length === 0) && (
                                            <tr>
                                                <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-xs">
                                                    No hay préstamos de salas asociados a este ciudadano.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Tab Content: Impresiones */}
                    {activeTab === 'impresiones' && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                                        <tr>
                                            <th className="px-5 py-3">Fecha y Hora</th>
                                            <th className="px-4 py-3">Hojas</th>
                                            <th className="px-4 py-3">Tipo Documento</th>
                                            <th className="px-4 py-3">Descripción</th>
                                            <th className="px-4 py-3">Sede PVD</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {citizen.impresiones?.map((imp: any) => (
                                            <tr key={imp.id_impresion} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-5 py-3 text-xs font-semibold text-slate-800">
                                                    {new Date(imp.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-block px-2 py-0.5 rounded-md text-xs font-black bg-amber-50 text-alcaldia-yellow border border-amber-200">
                                                        {imp.numero_hojas} págs
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-xs font-bold text-slate-900">{imp.tipo_impresion}</td>
                                                <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-[200px]">{imp.descripcion || '-'}</td>
                                                <td className="px-4 py-3 text-xs text-slate-600">{imp.punto?.nombre_punto}</td>
                                            </tr>
                                        ))}
                                        {(!citizen.impresiones || citizen.impresiones.length === 0) && (
                                            <tr>
                                                <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-xs">
                                                    No hay registros de impresiones para este ciudadano.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
