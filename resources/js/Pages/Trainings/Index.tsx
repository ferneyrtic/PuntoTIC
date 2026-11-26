import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    GraduationCap,
    Plus,
    Search,
    Calendar,
    Clock,
    Users,
    MapPin,
    CheckCircle2,
    XCircle,
    Edit3,
    Trash2,
    Building2,
    Sparkles,
    BookOpen,
    Filter,
    X,
    UserCheck,
    ChevronRight,
    Image as ImageIcon,
    Upload,
} from 'lucide-react';
import { asset } from '@/utils/asset';

interface Point {
    id_punto: number;
    nombre_punto: string;
    zona: string;
}

interface Training {
    id_capacitacion: number;
    id_punto: number | null;
    titulo: string;
    slug: string;
    descripcion: string;
    categoria: string;
    tipo: string;
    instructor: string | null;
    fecha_inicio: string | null;
    fecha_fin: string | null;
    horario: string | null;
    duracion_horas: number;
    cupos_totales: number;
    cupos_disponibles: number;
    requisitos: string | null;
    dirigido_a: string | null;
    imagen_url?: string | null;
    color_tema: string;
    activo: boolean;
    destacado: boolean;
    inscripciones_count?: number;
    punto?: Point | null;
}

interface Props {
    trainings: {
        data: Training[];
        current_page: number;
        last_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    points: Point[];
    categorias: string[];
    filters: {
        search: string | null;
        categoria: string | null;
        id_punto: string | null;
    };
}

export default function TrainingsIndex({ trainings, points, categorias, filters }: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTraining, setEditingTraining] = useState<Training | null>(null);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.categoria || '');
    const [selectedPoint, setSelectedPoint] = useState(filters.id_punto || '');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const form = useForm({
        titulo: '',
        id_punto: '' as string | number,
        descripcion: '',
        categoria: 'Ofimática & Empleabilidad',
        tipo: 'Taller',
        instructor: '',
        fecha_inicio: '',
        fecha_fin: '',
        horario: '',
        duracion_horas: 20,
        cupos_totales: 25,
        requisitos: '',
        dirigido_a: 'Comunidad en general',
        imagen_url: '',
        imagen: null as File | null,
        color_tema: 'emerald',
        activo: true,
        destacado: false,
    });

    const openCreateModal = () => {
        setEditingTraining(null);
        setPreviewUrl(null);
        form.reset();
        form.clearErrors();
        setModalOpen(true);
    };

    const openEditModal = (t: Training) => {
        setEditingTraining(t);
        setPreviewUrl(t.imagen_url ? asset(t.imagen_url) : null);
        form.setData({
            titulo: t.titulo,
            id_punto: t.id_punto ? String(t.id_punto) : '',
            descripcion: t.descripcion,
            categoria: t.categoria,
            tipo: t.tipo,
            instructor: t.instructor || '',
            fecha_inicio: t.fecha_inicio ? t.fecha_inicio.substring(0, 10) : '',
            fecha_fin: t.fecha_fin ? t.fecha_fin.substring(0, 10) : '',
            horario: t.horario || '',
            duracion_horas: t.duracion_horas || 20,
            cupos_totales: t.cupos_totales || 25,
            requisitos: t.requisitos || '',
            dirigido_a: t.dirigido_a || '',
            imagen_url: t.imagen_url || '',
            imagen: null,
            color_tema: t.color_tema || 'emerald',
            activo: t.activo,
            destacado: t.destacado,
        });
        form.clearErrors();
        setModalOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        form.setData('imagen', file);
        if (file) {
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingTraining) {
            form.transform((data) => ({
                ...data,
                _method: 'put',
            }));
            form.post(route('capacitaciones.update', editingTraining.id_capacitacion), {
                forceFormData: true,
                onSuccess: () => {
                    setModalOpen(false);
                    setPreviewUrl(null);
                },
            });
        } else {
            form.transform((data) => data);
            form.post(route('capacitaciones.store'), {
                forceFormData: true,
                onSuccess: () => {
                    setModalOpen(false);
                    setPreviewUrl(null);
                },
            });
        }
    };

    const handleFilter = () => {
        router.get(
            route('capacitaciones.index'),
            {
                search: searchTerm || undefined,
                categoria: selectedCategory || undefined,
                id_punto: selectedPoint || undefined,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleToggle = (t: Training) => {
        router.patch(route('capacitaciones.toggle', t.id_capacitacion), {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDelete = (t: Training) => {
        if (confirm(`¿Estás seguro de eliminar la capacitación "${t.titulo}"?`)) {
            router.delete(route('capacitaciones.destroy', t.id_capacitacion), {
                preserveState: true,
                preserveScroll: true,
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                <GraduationCap className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                                <span>Gestión de Capacitaciones & Cursos PVD</span>
                            </h1>
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                Landing & Oferta Pública
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Publica y administra los cursos, talleres y semilleros que se muestran a la ciudadanía en la página de inicio.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Nueva Capacitación</span>
                    </button>
                </div>
            }
        >
            <Head title="Capacitaciones & Cursos · Administración PuntoTIC" />

            <div className="space-y-6">
                {/* TARJETAS DE RESUMEN */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Oferta</div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{trainings.total}</div>
                        <div className="text-[11px] text-slate-400">talleres y cursos registrados</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                        <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Activos en Landing</div>
                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                            {trainings.data.filter((t) => t.activo).length}
                        </div>
                        <div className="text-[11px] text-slate-400">visibles para la comunidad</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                        <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Sedes Cubiertas</div>
                        <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                            {points.length} Sedes
                        </div>
                        <div className="text-[11px] text-slate-400">Juan Rozo, Las Colinas, Dinamarca, Chichimene</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                        <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Costo Ciudadano</div>
                        <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">100% Gratuito</div>
                        <div className="text-[11px] text-slate-400">política de inclusión digital Alcaldía</div>
                    </div>
                </div>

                {/* BARRA DE FILTROS */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3 flex-1">
                        <div className="relative min-w-[240px] flex-1 sm:flex-initial">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Buscar curso, tema o instructor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                        </div>

                        <select
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                            }}
                            className="py-2 pl-3 pr-8 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200"
                        >
                            <option value="">Todas las Categorías</option>
                            {categorias.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>

                        <select
                            value={selectedPoint}
                            onChange={(e) => {
                                setSelectedPoint(e.target.value);
                            }}
                            className="py-2 pl-3 pr-8 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200"
                        >
                            <option value="">Todas las Sedes (Consolidado)</option>
                            {points.map((p) => (
                                <option key={p.id_punto} value={p.id_punto}>
                                    {p.nombre_punto} ({p.zona})
                                </option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={handleFilter}
                            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition-colors"
                        >
                            Filtrar
                        </button>
                    </div>
                </div>

                {/* LISTADO DE CAPACITACIONES */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {trainings.data.map((t) => (
                            <div
                                key={t.id_capacitacion}
                                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                            >
                                <div className="flex items-start gap-4 flex-1">
                                    {t.imagen_url ? (
                                        <img
                                            src={asset(t.imagen_url)}
                                            alt={t.titulo}
                                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 hidden sm:block"
                                            onError={(e) => {
                                                const target = e.target as HTMLElement;
                                                if (target) target.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 items-center justify-center shrink-0 hidden sm:flex text-slate-400">
                                            <GraduationCap className="w-7 h-7 opacity-50" />
                                        </div>
                                    )}
                                    <div className="space-y-2 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                                            {t.tipo}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                            {t.categoria}
                                        </span>
                                        {t.destacado && (
                                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                                                <Sparkles className="w-3 h-3" />
                                                Destacado en Portada
                                            </span>
                                        )}
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                t.activo
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                            }`}
                                        >
                                            {t.activo ? 'Publicado' : 'Borrador'}
                                        </span>
                                    </div>

                                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                                        {t.titulo}
                                    </h3>

                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 max-w-3xl leading-relaxed">
                                        {t.descripcion}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-1">
                                        <div className="flex items-center gap-1.5">
                                            <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                                {t.punto ? t.punto.nombre_punto : 'Toda la Red / Virtual'}
                                            </span>
                                        </div>

                                        {t.horario && (
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{t.horario}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5 text-slate-400" />
                                            <span>
                                                Cupos: <strong className="text-slate-900 dark:text-white">{t.cupos_disponibles}</strong> de {t.cupos_totales}
                                            </span>
                                        </div>

                                        {t.instructor && (
                                            <div className="text-[11px] text-slate-500">
                                                Facilitador: <span className="font-semibold">{t.instructor}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ACCIONES */}
                                <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => handleToggle(t)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                                            t.activo
                                                ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                                                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-transparent'
                                        }`}
                                    >
                                        {t.activo ? 'Ocultar' : 'Publicar'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => openEditModal(t)}
                                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                                        title="Editar capacitación"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleDelete(t)}
                                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors"
                                        title="Eliminar capacitación"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {trainings.data.length === 0 && (
                            <div className="p-12 text-center text-slate-400 space-y-3">
                                <GraduationCap className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                                <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                    No hay capacitaciones registradas con los filtros actuales
                                </div>
                                <p className="text-xs text-slate-400">
                                    Haz clic en "Nueva Capacitación" para crear la primera oferta formativa.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL CREAR / EDITAR CAPACITACIÓN */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-scale-in">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                                    <GraduationCap className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                                        {editingTraining ? 'Editar Capacitación' : 'Nueva Capacitación o Taller'}
                                    </h3>
                                    <p className="text-[11px] text-slate-500">
                                        Define el contenido, sede, horarios y cupos que verá el ciudadano en la Landing.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                    Título de la Capacitación *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Excel Básico e Intermedio para el Empleo"
                                    value={form.data.titulo}
                                    onChange={(e) => form.setData('titulo', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                                />
                                {form.errors.titulo && (
                                    <div className="text-[11px] text-rose-600 mt-1">{form.errors.titulo}</div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                        Sede PVD Responsable
                                    </label>
                                    <select
                                        value={form.data.id_punto}
                                        onChange={(e) => form.setData('id_punto', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                                    >
                                        <option value="">Toda la Red / Virtual / Mixta</option>
                                        {points.map((p) => (
                                            <option key={p.id_punto} value={p.id_punto}>
                                                {p.nombre_punto} ({p.zona})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                        Categoría Temática *
                                    </label>
                                    <select
                                        value={form.data.categoria}
                                        onChange={(e) => form.setData('categoria', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                                    >
                                        {categorias.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                        Tipo de Formación
                                    </label>
                                    <select
                                        value={form.data.tipo}
                                        onChange={(e) => form.setData('tipo', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                                    >
                                        <option value="Taller">Taller Práctico</option>
                                        <option value="Curso Corto">Curso Corto Certificado</option>
                                        <option value="Seminario">Seminario</option>
                                        <option value="Diplomado">Diplomado Comunitario</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                        Cupos Totales
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={300}
                                        value={form.data.cupos_totales}
                                        onChange={(e) => form.setData('cupos_totales', parseInt(e.target.value) || 20)}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                        Duración (Horas)
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={300}
                                        value={form.data.duracion_horas}
                                        onChange={(e) => form.setData('duracion_horas', parseInt(e.target.value) || 20)}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                        Horario y Días
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Lunes y Miércoles · 2:00 PM - 4:00 PM"
                                        value={form.data.horario}
                                        onChange={(e) => form.setData('horario', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                        Instructor / Facilitador
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Ing. Facilitador TIC"
                                        value={form.data.instructor}
                                        onChange={(e) => form.setData('instructor', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                    Descripción del Curso *
                                </label>
                                <textarea
                                    rows={3}
                                    required
                                    placeholder="Describe qué aprenderán los asistentes, beneficios e impacto..."
                                    value={form.data.descripcion}
                                    onChange={(e) => form.setData('descripcion', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 leading-relaxed"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                        Público Objetivo
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Adultos mayores, Jóvenes bachilleres..."
                                        value={form.data.dirigido_a}
                                        onChange={(e) => form.setData('dirigido_a', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                        Requisitos Previos
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Documento de identidad, traer celular..."
                                        value={form.data.requisitos}
                                        onChange={(e) => form.setData('requisitos', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                                    Imagen / Foto de Portada (opcional)
                                </label>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-dashed border-slate-300 dark:border-slate-700">
                                    {previewUrl ? (
                                        <div className="relative w-28 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-white">
                                            <img
                                                src={previewUrl}
                                                alt="Vista previa de portada"
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPreviewUrl(null);
                                                    form.setData('imagen', null);
                                                    form.setData('imagen_url', '');
                                                }}
                                                title="Quitar imagen"
                                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-900/75 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-28 h-20 rounded-xl bg-slate-200/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 shrink-0">
                                            <ImageIcon className="w-6 h-6 mb-1" />
                                            <span className="text-[10px] font-medium">Sin portada</span>
                                        </div>
                                    )}

                                    <div className="flex-1 space-y-2 w-full">
                                        <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer transition-colors shadow-2xs">
                                            <Upload className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>{previewUrl ? 'Cambiar imagen...' : 'Subir imagen desde tu equipo'}</span>
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                        </label>
                                        <p className="text-[11px] text-slate-500">
                                            Formatos permitidos: JPG, PNG o WebP (máx. 4 MB).
                                        </p>
                                        {form.errors.imagen && (
                                            <p className="text-xs font-semibold text-rose-600">{form.errors.imagen}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 pt-2">
                                <label className="inline-flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.data.activo}
                                        onChange={(e) => form.setData('activo', e.target.checked)}
                                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                                    />
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                        Activo (Visible en Landing)
                                    </span>
                                </label>

                                <label className="inline-flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.data.destacado}
                                        onChange={(e) => form.setData('destacado', e.target.checked)}
                                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                                    />
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                        Destacado en Portada
                                    </span>
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                                >
                                    {editingTraining ? 'Guardar Cambios' : 'Publicar Capacitación'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
