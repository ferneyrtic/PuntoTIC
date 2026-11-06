import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Layers, Plus, Trash2, Edit2, FolderPlus, CheckCircle2, X, Sparkles, ChevronDown, ChevronUp, Search } from 'lucide-react';

interface Props {
    categories: Array<any>;
}

export default function CategoriesIndex({ categories }: Props) {
    const [selectedCategoryForSub, setSelectedCategoryForSub] = useState<any>(null);
    const [newCatModal, setNewCatModal] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({});
    const [searchTerms, setSearchTerms] = useState<Record<number, string>>({});

    const toggleExpand = (catId: number) => {
        setExpandedCategories((prev) => ({
            ...prev,
            [catId]: !prev[catId],
        }));
    };

    const handleSearchChange = (catId: number, val: string) => {
        setSearchTerms((prev) => ({
            ...prev,
            [catId]: val,
        }));
    };

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
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-bold text-slate-900 leading-tight">{cat.nombre}</h3>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                {cat.subcategorias?.length || 0} ítems
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-0.5">{cat.descripcion || 'Servicios agrupados'}</p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                                    {cat.visitas_count || 0} atenciones
                                </span>
                            </div>

                            {/* Subcategories List */}
                            <div className="space-y-1.5">
                                {(() => {
                                    const subList = cat.subcategorias || [];
                                    const isExpanded = !!expandedCategories[cat.id_categoria];
                                    const search = (searchTerms[cat.id_categoria] || '').toLowerCase().trim();

                                    const filteredList = search
                                        ? subList.filter((s: any) => s.nombre.toLowerCase().includes(search))
                                        : subList;

                                    const visibleList = isExpanded || search
                                        ? filteredList
                                        : filteredList.slice(0, 5);

                                    const hasMore = filteredList.length > 5 && !isExpanded && !search;

                                    return (
                                        <>
                                            {/* Search input for categories with more than 6 items */}
                                            {subList.length > 6 && (isExpanded || search) && (
                                                <div className="relative mb-2">
                                                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                                    <input
                                                        type="text"
                                                        value={searchTerms[cat.id_categoria] || ''}
                                                        onChange={(e) => handleSearchChange(cat.id_categoria, e.target.value)}
                                                        placeholder={`Buscar entre los ${subList.length} elementos de ${cat.nombre}...`}
                                                        className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-emerald-600"
                                                    />
                                                    {search && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSearchChange(cat.id_categoria, '')}
                                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {/* Subcategory items container */}
                                            <div className={`space-y-1.5 ${isExpanded && subList.length > 6 ? 'max-h-72 overflow-y-auto pr-1' : ''}`}>
                                                {visibleList.map((sub: any) => (
                                                    <div
                                                        key={sub.id_subcategoria}
                                                        className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between text-xs font-medium text-slate-800 hover:bg-slate-100/70 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2 truncate">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
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
                                            </div>

                                            {/* Has more indicator / expander */}
                                            {hasMore && (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleExpand(cat.id_categoria)}
                                                    className="btn-tactile w-full mt-2 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-dashed border-emerald-300 text-xs font-bold text-emerald-800 transition-all flex items-center justify-between group"
                                                >
                                                    <span className="flex items-center gap-1.5">
                                                        <ChevronDown className="w-4 h-4 text-emerald-600 group-hover:translate-y-0.5 transition-transform" />
                                                        <span>Mostrar los {subList.length - 5} restantes (ver todos)...</span>
                                                    </span>
                                                    <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-mono">
                                                        Total: {subList.length}
                                                    </span>
                                                </button>
                                            )}

                                            {/* Collapse button when expanded */}
                                            {isExpanded && subList.length > 5 && !search && (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleExpand(cat.id_categoria)}
                                                    className="btn-tactile w-full mt-2 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 transition-all flex items-center justify-center gap-1.5"
                                                >
                                                    <ChevronUp className="w-4 h-4" />
                                                    <span>Mostrar menos (colapsar a 5)</span>
                                                </button>
                                            )}

                                            {/* Empty State */}
                                            {subList.length === 0 && (
                                                <div className="p-4 rounded-xl bg-slate-50 text-center text-slate-400 text-xs">
                                                    No hay subcategorías registradas en esta categoría.
                                                </div>
                                            )}

                                            {/* No results for search */}
                                            {search && visibleList.length === 0 && (
                                                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center text-amber-800 text-xs font-medium">
                                                    No se encontraron coincidencias para "{search}".
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
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
