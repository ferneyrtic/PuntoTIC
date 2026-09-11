import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { SlidersHorizontal, Plus, Trash2, X, CheckCircle2, Sparkles } from 'lucide-react';

interface Props {
    fields: Array<any>;
}

export default function DynamicFieldsIndex({ fields }: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const [optionsString, setOptionsString] = useState('');

    const { data, setData, post, processing, reset, errors } = useForm({
        modulo: 'visitas',
        nombre_campo: '',
        tipo: 'texto',
        opciones: [] as string[],
        requerido: false,
        incluir_en_reporte: true,
    });

    const handleOptionsChange = (val: string) => {
        setOptionsString(val);
        const arr = val
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        setData('opciones', arr);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('campos-dinamicos.store'), {
            onSuccess: () => {
                setModalOpen(false);
                reset();
                setOptionsString('');
            },
        });
    };

    const handleDelete = (fieldId: number) => {
        if (confirm('¿Está seguro de eliminar este campo dinámico? Los datos previos se conservarán en el historial.')) {
            router.delete(route('campos-dinamicos.destroy', fieldId));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Campos Dinámicos Personalizados</h1>
                        <p className="text-xs text-slate-500 font-medium">
                            Agregue columnas y preguntas adicionales a los formularios sin modificar código fuente
                        </p>
                    </div>
                    <button
                        onClick={() => setModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-alcaldia-green hover:bg-alcaldia-green-dark text-white text-xs font-bold shadow-sm transition-all"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Nuevo Campo Personalizado</span>
                    </button>
                </div>
            }
        >
            <Head title="Campos Dinámicos" />

            {/* Explanation Banner */}
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                    Cualquier campo creado aquí aparecerá automáticamente en el formulario del módulo seleccionado y se incluirá como columna en las descargas de Excel.
                </span>
            </div>

            {/* Fields Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="px-5 py-3.5">Módulo Asociado</th>
                                <th className="px-4 py-3.5">Nombre de la Columna</th>
                                <th className="px-4 py-3.5">Tipo de Dato</th>
                                <th className="px-4 py-3.5">Opciones / Valores</th>
                                <th className="px-4 py-3.5">Obligatorio</th>
                                <th className="px-4 py-3.5">En Reportes Excel</th>
                                <th className="px-5 py-3.5 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {fields.map((field) => (
                                <tr key={field.id_campo} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-slate-100 text-slate-700">
                                            {field.modulo}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 font-bold text-slate-900 text-xs">{field.nombre_campo}</td>
                                    <td className="px-4 py-3.5 text-xs text-slate-600 font-medium capitalize">{field.tipo}</td>
                                    <td className="px-4 py-3.5 text-xs text-slate-500">
                                        {field.tipo === 'lista' && field.opciones ? (
                                            <div className="flex flex-wrap gap-1">
                                                {field.opciones.map((opt: string, i: number) => (
                                                    <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px]">
                                                        {opt}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                    <td className="px-4 py-3.5 text-xs">
                                        {field.requerido ? (
                                            <span className="text-rose-600 font-bold">Sí</span>
                                        ) : (
                                            <span className="text-slate-400">Opcional</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3.5 text-xs">
                                        {field.incluir_en_reporte ? (
                                            <span className="text-emerald-600 font-bold">Incluido</span>
                                        ) : (
                                            <span className="text-slate-400">No</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3.5 text-right">
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(field.id_campo)}
                                            className="text-slate-400 hover:text-rose-600 transition-colors"
                                            title="Eliminar campo"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {fields.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-xs">
                                        No hay campos dinámicos creados aún. Haga clic en "+ Nuevo Campo Personalizado" para agregar columnas adicionales.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Crear Campo Dinámico</h3>
                            <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Módulo Destino *</label>
                                <select
                                    value={data.modulo}
                                    onChange={(e) => setData('modulo', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none"
                                >
                                    <option value="visitas">Registro de Visitas</option>
                                    <option value="form_pvd">Directorio de Ciudadanos</option>
                                    <option value="prestamo_sala">Préstamo de Salas</option>
                                    <option value="registro_impresion">Registro de Impresiones</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Campo / Pregunta *</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Tipo de dispositivo utilizado"
                                    value={data.nombre_campo}
                                    onChange={(e) => setData('nombre_campo', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Entrada *</label>
                                <select
                                    value={data.tipo}
                                    onChange={(e) => setData('tipo', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none"
                                >
                                    <option value="texto">Texto Libre</option>
                                    <option value="numero">Número Entero / Decimal</option>
                                    <option value="lista">Lista Desplegable de Opciones</option>
                                    <option value="fecha">Fecha</option>
                                    <option value="booleano">Interruptor Sí / No</option>
                                </select>
                            </div>

                            {data.tipo === 'lista' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Opciones (Separadas por comas) *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Computador de mesa, Portátil, Celular, Tablet"
                                        value={optionsString}
                                        onChange={(e) => handleOptionsChange(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none"
                                        required
                                    />
                                </div>
                            )}

                            <div className="space-y-2 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.requerido}
                                        onChange={(e) => setData('requerido', e.target.checked)}
                                        className="rounded border-slate-300 text-alcaldia-green focus:ring-alcaldia-green"
                                    />
                                    <span className="text-xs font-medium text-slate-700">Campo obligatorio para guardar</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.incluir_en_reporte}
                                        onChange={(e) => setData('incluir_en_reporte', e.target.checked)}
                                        className="rounded border-slate-300 text-alcaldia-green focus:ring-alcaldia-green"
                                    />
                                    <span className="text-xs font-medium text-slate-700">Incluir como columna en reportes Excel</span>
                                </label>
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
                                    {processing ? 'Guardando...' : 'Crear Campo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
