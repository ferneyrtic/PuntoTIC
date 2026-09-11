import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Layers, Plus, Trash2, Edit2, FolderPlus, CheckCircle2, X, Sparkles } from 'lucide-react';

interface Props {
    categories: Array<any>;
}

export default function CategoriesIndex({ categories }: Props) {
    const [selectedCategoryForSub, setSelectedCategoryForSub] = useState<any>(null);
    const [newCatModal, setNewCatModal] = useState(false);

    const catForm = useForm({
        nombre: '',
        descripcion: '',
        color: '#1B6B35',
        icono: 'Folder',
        orden: categories.length + 1,
    });

    const subForm = useForm({
        nombre: '',
        descripcion: '',
        orden: 1,
    });

    const handleCreateCategory = (e: React.FormEvent) => {
        e.preventDefault();
        catForm.post(route('categorias.store'), {
            onSuccess: () => {
                setNewCatModal(false);
                catForm.reset();
            },
        });
    };

    const handleCreateSubcategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCategoryForSub) return;
        subForm.post(route('categorias.subcategorias.store', selectedCategoryForSub.id_categoria), {
            onSuccess: () => {
                setSelectedCategoryForSub(null);
                subForm.reset();
            },
        });
    };

    const handleDeleteSubcategory = (subId: number) => {
        if (confirm('¿Está seguro de eliminar esta subcategoría de servicio?')) {
            router.delete(route('categorias.subcategorias.destroy', subId));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Taxonomía de Categorías y Servicios</h1>
                        <p className="text-xs text-slate-500 font-medium">
                            Configuración de servicios públicos y trámites disponibles en los Puntos Vive Digital
                        </p>
                    </div>
                    <button
                        onClick={() => setNewCatModal(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-alcaldia-green hover:bg-alcaldia-green-dark text-white text-xs font-bold shadow-sm transition-all"
                    >
                        <FolderPlus className="w-3.5 h-3.5" />
                        <span>+ Nueva Categoría Principal</span>
                    </button>
                </div>
            }
        >
            <Head title="Categorías y Servicios" />

            {/* Categorías Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categories.map((cat) => (
                    <div
                        key={cat.id_categoria}
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between"
                    >
                        <div className="p-5">
                            {/* Header */}
                            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className="w-4 h-4 rounded-full shrink-0"
                                        style={{ backgroundColor: cat.color || '#1B6B35' }}
                                    />
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 leading-tight">{cat.nombre}</h3>
                                        <p className="text-[11px] text-slate-400 mt-0.5">{cat.descripcion || 'Servicios agrupados'}</p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 shrink-0">
                                    {cat.visitas_count || 0} visitas
                                </span>
                            </div>

                            {/* Subcategories List */}
                            <div className="space-y-1.5">
                                {cat.subcategorias?.map((sub: any) => (
                                    <div
                                        key={sub.id_subcategoria}
                                        className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between text-xs font-medium text-slate-800 hover:bg-slate-100/70 transition-colors"
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                                            <span className="truncate">{sub.nombre}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[10px] text-slate-400 font-bold">
                                                {sub.visitas_count || 0} usos
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteSubcategory(sub.id_subcategoria)}
                                                className="text-slate-300 hover:text-rose-500 transition-colors"
                                                title="Eliminar subcategoría"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {(!cat.subcategorias || cat.subcategorias.length === 0) && (
                                    <div className="p-4 rounded-xl bg-slate-50 text-center text-slate-400 text-xs">
                                        No hay subcategorías registradas en esta categoría.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Card Footer: Add Subcategory button */}
                        <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedCategoryForSub(cat);
                                    subForm.reset();
                                }}
                                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-alcaldia-green hover:bg-emerald-50 hover:border-emerald-200 transition-all flex items-center gap-1.5 shadow-xs"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ Agregar Subcategoría / Trámite</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal: Nueva Categoría Principal */}
            {newCatModal && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Crear Categoría Principal</h3>
                            <button onClick={() => setNewCatModal(false)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCategory} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de la Categoría *</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Trámites de Hacienda"
                                    value={catForm.data.nombre}
                                    onChange={(e) => catForm.setData('nombre', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción</label>
                                <input
                                    type="text"
                                    placeholder="Breve descripción del alcance de los servicios..."
                                    value={catForm.data.descripcion}
                                    onChange={(e) => catForm.setData('descripcion', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Color Identificador</label>
                                    <input
                                        type="color"
                                        value={catForm.data.color}
                                        onChange={(e) => catForm.setData('color', e.target.value)}
                                        className="w-full h-9 rounded-xl border border-slate-200 p-1 cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Orden Visual</label>
                                    <input
                                        type="number"
                                        value={catForm.data.orden}
                                        onChange={(e) => catForm.setData('orden', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setNewCatModal(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={catForm.processing}
                                    className="px-5 py-2 rounded-xl bg-alcaldia-green hover:bg-alcaldia-green-dark text-white text-xs font-bold shadow-sm"
                                >
                                    {catForm.processing ? 'Guardando...' : 'Crear Categoría'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Nueva Subcategoría */}
            {selectedCategoryForSub && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Agregar Subcategoría</h3>
                                <p className="text-[11px] text-slate-500">Para: {selectedCategoryForSub.nombre}</p>
                            </div>
                            <button onClick={() => setSelectedCategoryForSub(null)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubcategory} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Trámite o Servicio *</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Certificado de Residencia"
                                    value={subForm.data.nombre}
                                    onChange={(e) => subForm.setData('nombre', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none"
                                    required
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setSelectedCategoryForSub(null)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={subForm.processing}
                                    className="px-5 py-2 rounded-xl bg-alcaldia-green hover:bg-alcaldia-green-dark text-white text-xs font-bold shadow-sm"
                                >
                                    {subForm.processing ? 'Guardando...' : 'Agregar Subcategoría'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
