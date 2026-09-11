import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Printer, Plus, X, UserCheck, CheckCircle2, FileText, Users } from 'lucide-react';
import axios from 'axios';

interface Props {
    records: {
        data: Array<any>;
        links: Array<any>;
        current_page: number;
        last_page: number;
        total: number;
        from: number;
        to: number;
    };
    filters: any;
    points: Array<any>;
    stats: {
        hojas_hoy: number;
        hojas_mes: number;
        ciudadanos_mes: number;
    };
}

export default function PrintRecordsIndex({ records, filters, points, stats }: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const [documentInput, setDocumentInput] = useState('');
    const [citizenFound, setCitizenFound] = useState<any>(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        id_form_pvd: null as number | null,
        nombre_usuario_texto: '',
        id_punto: points[0]?.id_punto || 1,
        numero_hojas: 2,
        tipo_impresion: 'Impresión de documentos de identidad y personales',
        descripcion: '',
    });

    const verifyCitizen = async (doc: string) => {
        if (!doc) return;
        try {
            const res = await axios.post(route('ciudadanos.verify'), { documento: doc });
            if (res.data.exists && res.data.citizen) {
                setCitizenFound(res.data.citizen);
                setData('id_form_pvd', res.data.citizen.id_form_pvd);
                setData('nombre_usuario_texto', res.data.citizen.nombre_completo);
            } else {
                setCitizenFound(null);
                setData('id_form_pvd', null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('impresiones.store'), {
            onSuccess: () => {
                setModalOpen(false);
                reset();
                setCitizenFound(null);
                setDocumentInput('');
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Registro de Impresiones y Copias</h1>
                        <p className="text-xs text-slate-500 font-medium">Control de uso de consumibles y digitalización por ciudadano</p>
                    </div>
                    <button
                        onClick={() => setModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-alcaldia-green hover:bg-alcaldia-green-dark text-white text-xs font-bold shadow-sm transition-all"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Registrar Impresión</span>
                    </button>
                </div>
            }
        >
            <Head title="Registro de Impresiones" />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Hojas Hoy</div>
                    <div className="text-2xl font-black text-alcaldia-green">{stats.hojas_hoy}</div>
                    <div className="text-[11px] text-slate-400">impresas durante la jornada</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Hojas Este Mes</div>
                    <div className="text-2xl font-black text-alcaldia-yellow">{stats.hojas_mes}</div>
                    <div className="text-[11px] text-slate-400">acumulado mensual</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ciudadanos Atendidos</div>
                    <div className="text-2xl font-black text-slate-900">{stats.ciudadanos_mes}</div>
                    <div className="text-[11px] text-slate-400">usuarios únicos con servicio</div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="px-5 py-3.5">Ciudadano / Documento</th>
                                <th className="px-4 py-3.5">Hojas</th>
                                <th className="px-4 py-3.5">Tipo de Documento / Trámite</th>
                                <th className="px-4 py-3.5">Sede PVD</th>
                                <th className="px-4 py-3.5">Gestor</th>
                                <th className="px-5 py-3.5 text-right">Fecha y Hora</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {records.data.map((rec) => (
                                <tr key={rec.id_impresion} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <div className="font-bold text-slate-900 text-xs">
                                            {rec.ciudadano?.nombre_completo || rec.nombre_usuario_texto || 'Ciudadano'}
                                        </div>
                                        <div className="text-[11px] text-slate-400">
                                            {rec.ciudadano ? `CC ${rec.ciudadano.documento}` : 'Registro externo'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-black bg-amber-50 text-alcaldia-yellow border border-amber-200">
                                            {rec.numero_hojas} págs
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <div className="text-xs font-bold text-slate-900">{rec.tipo_impresion}</div>
                                        {rec.descripcion && (
                                            <div className="text-[11px] text-slate-500 italic truncate max-w-[220px]">
                                                "{rec.descripcion}"
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3.5 text-xs text-slate-600 font-medium">{rec.punto?.nombre_punto}</td>
                                    <td className="px-4 py-3.5 text-xs text-slate-500">{rec.gestor?.name || 'Gestor'}</td>
                                    <td className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600">
                                        {new Date(rec.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {records.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-xs">
                                        No hay registros de impresiones en el período seleccionado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Registro */}
            {modalOpen && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Registrar Impresión / Copias</h3>
                            <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Cédula del Ciudadano</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Ingrese número de cédula..."
                                        value={documentInput}
                                        onChange={(e) => setDocumentInput(e.target.value)}
                                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => verifyCitizen(documentInput)}
                                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                                    >
                                        Buscar
                                    </button>
                                </div>
                                {citizenFound ? (
                                    <p className="text-[11px] text-emerald-600 font-bold mt-1">✓ {citizenFound.nombre_completo}</p>
                                ) : (
                                    <input
                                        type="text"
                                        placeholder="O ingrese nombre si no está registrado..."
                                        value={data.nombre_usuario_texto}
                                        onChange={(e) => setData('nombre_usuario_texto', e.target.value)}
                                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium mt-2 outline-none"
                                    />
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Sede PVD *</label>
                                    <select
                                        value={data.id_punto}
                                        onChange={(e) => setData('id_punto', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none"
                                    >
                                        {points.map((p) => (
                                            <option key={p.id_punto} value={p.id_punto}>
                                                {p.nombre_punto}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">N° de Hojas *</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={200}
                                        value={data.numero_hojas}
                                        onChange={(e) => setData('numero_hojas', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-black text-alcaldia-yellow outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Impresión *</label>
                                <select
                                    value={data.tipo_impresion}
                                    onChange={(e) => setData('tipo_impresion', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none"
                                >
                                    <option value="Impresión de documentos de identidad y personales">Documentos de identidad y personales</option>
                                    <option value="Impresión de certificados y recibos de pago">Certificados y recibos de pago</option>
                                    <option value="Impresión de hojas de vida y soportes laborales">Hojas de vida y soportes laborales</option>
                                    <option value="Digitalización / Escaneo de documentos físicos">Digitalización / Escaneo</option>
                                    <option value="Fotografías tamaño documento">Fotografías tamaño documento</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción Opcional</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Certificado SISBEN y cédula ampliada..."
                                    value={data.descripcion}
                                    onChange={(e) => setData('descripcion', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2 rounded-xl bg-alcaldia-green hover:bg-alcaldia-green-dark text-white text-xs font-bold shadow-sm"
                                >
                                    {processing ? 'Guardando...' : 'Guardar Registro'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
