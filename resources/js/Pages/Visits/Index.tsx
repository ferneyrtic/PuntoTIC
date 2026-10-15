import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    CalendarCheck,
    Search,
    Filter,
    FileSpreadsheet,
    UserPlus,
    X,
    Eye,
    Building2,
    Calendar,
    Clock,
    User,
    ArrowRight,
} from 'lucide-react';

interface Props {
    visits: {
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
    categories: Array<any>;
    dynamicFields?: Array<any>;
}

export default function VisitsIndex({ visits, filters, points, categories }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedPoint, setSelectedPoint] = useState(filters.id_punto || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.id_categoria || '');
    const [dateFrom, setDateFrom] = useState(filters.fecha_desde || '');
    const [dateTo, setDateTo] = useState(filters.fecha_hasta || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('visitas.index'),
            {
                search: searchTerm,
                id_punto: selectedPoint,
                id_categoria: selectedCategory,
                fecha_desde: dateFrom,
                fecha_hasta: dateTo,
            },
            { preserveState: true }
        );
    };

    const handleClear = () => {
        setSearchTerm('');
        setSelectedPoint('');
        setSelectedCategory('');
        setDateFrom('');
        setDateTo('');
        router.get(route('visitas.index'));
    };

    const hasFilters = Boolean(
        searchTerm || selectedPoint || selectedCategory || dateFrom || dateTo
    );

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                Registro de Visitas
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                                {visits.total.toLocaleString()} total
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                            Historial y trazabilidad de atenciones en los Puntos Vive Digital
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href={route('exportar.index', { tipo: 'visitas' })}
                            className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-soft-xs transition-all"
                        >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="hidden sm:inline">Exportar a Excel</span>
                            <span className="sm:hidden">Excel</span>
                        </Link>
                        <Link
                            href={route('visitas.create')}
                            className="btn-tactile inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-soft hover:shadow-soft-lg hover:shadow-emerald-600/30 transition-all"
                        >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>+ Registrar Visita</span>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Registro de Visitas · PuntoTIC" />

            {/* Filter Bar */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-soft mb-6">
                <form
                    onSubmit={handleSearch}
                    className="flex flex-wrap items-center gap-3"
                >
                    <div className="flex-1 min-w-[220px] relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar por cédula o nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                        />
                    </div>

                    <div className="w-full sm:w-auto min-w-[160px]">
                        <select
                            value={selectedPoint}
                            onChange={(e) => setSelectedPoint(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium text-slate-700 focus:border-emerald-600 outline-none"
                        >
                            <option value="">Todas las Sedes</option>
                            {points.map((p) => (
                                <option key={p.id_punto} value={p.id_punto}>
                                    {p.nombre_punto}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full sm:w-auto min-w-[160px]">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium text-slate-700 focus:border-emerald-600 outline-none"
                        >
                            <option value="">Todas las Categorías</option>
                            {categories.map((c) => (
                                <option key={c.id_categoria} value={c.id_categoria}>
                                    {c.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto bg-slate-50/80 px-3 py-2 rounded-2xl border border-slate-200">
                        <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                            <span className="text-[11px] font-semibold text-slate-500 select-none">Desde:</span>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full sm:w-32 bg-transparent text-xs font-medium text-slate-700 outline-none"
                                title="Fecha inicial"
                            />
                        </div>
                        <span className="text-slate-300 font-bold select-none">|</span>
                        <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                            <span className="text-[11px] font-semibold text-slate-500 select-none">Hasta:</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full sm:w-32 bg-transparent text-xs font-medium text-slate-700 outline-none"
                                title="Fecha final"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            type="submit"
                            className="btn-tactile flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-soft flex items-center justify-center gap-1.5 whitespace-nowrap"
                        >
                            <Filter className="w-3.5 h-3.5" />
                            <span>Filtrar</span>
                        </button>
                        {hasFilters && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="btn-tactile px-3 py-2.5 rounded-2xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 shrink-0"
                                title="Limpiar filtros"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Visits List: Desktop Table + Mobile Cards */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-soft overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Ciudadano / Documento</th>
                                <th className="px-5 py-4">Categoría</th>
                                <th className="px-5 py-4">Trámite / Servicio</th>
                                <th className="px-5 py-4">Sede PVD</th>
                                <th className="px-5 py-4">Gestor</th>
                                <th className="px-6 py-4 text-right">Fecha y Hora</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {visits.data.map((v) => (
                                <tr
                                    key={v.id_visita}
                                    className="hover:bg-slate-50/80 transition-colors group"
                                >
                                    <td className="px-6 py-4">
                                        <Link
                                            href={route(
                                                'ciudadanos.show',
                                                v.ciudadano?.id_form_pvd || 1
                                            )}
                                            className="font-bold text-slate-900 text-xs hover:text-emerald-700 flex items-center gap-1.5"
                                        >
                                            <span>
                                                {v.ciudadano?.nombre_completo || 'Ciudadano'}
                                            </span>
                                            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600" />
                                        </Link>
                                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                            {v.ciudadano?.tipo_documento?.sigla || 'CC'}{' '}
                                            {v.ciudadano?.documento}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="inline-block px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 text-slate-700">
                                            {v.categoria?.nombre || 'General'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="text-xs font-bold text-slate-900">
                                            {v.subcategoria?.nombre ||
                                                v.servicio_texto ||
                                                'Servicio'}
                                        </div>
                                        {v.descripcion && (
                                            <div className="text-[11px] text-slate-500 italic truncate max-w-[240px] mt-0.5">
                                                "{v.descripcion}"
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-xs text-slate-600 font-medium">
                                        {v.punto?.nombre_punto}
                                    </td>
                                    <td className="px-5 py-4 text-xs text-slate-500">
                                        {v.gestor?.name || 'Gestor'}
                                    </td>
                                    <td className="px-6 py-4 text-right text-xs font-semibold text-slate-600">
                                        <div>{new Date(v.created_at).toLocaleDateString()}</div>
                                        <div className="text-[10px] text-slate-400 font-mono">
                                            {new Date(v.created_at).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {visits.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <CalendarCheck className="w-10 h-10 text-slate-300 mb-2" />
                                            <p className="text-xs font-medium text-slate-600">
                                                No se encontraron visitas con los filtros aplicados.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards View (< md) */}
                <div className="md:hidden divide-y divide-slate-100">
                    {visits.data.map((v) => (
                        <div key={v.id_visita} className="p-4 space-y-2 hover:bg-slate-50">
                            <div className="flex items-center justify-between">
                                <Link
                                    href={route('ciudadanos.show', v.ciudadano?.id_form_pvd || 1)}
                                    className="font-bold text-slate-900 text-xs hover:text-emerald-700 flex items-center gap-1"
                                >
                                    <span>{v.ciudadano?.nombre_completo || 'Ciudadano'}</span>
                                    <ArrowRight className="w-3 h-3 text-emerald-600" />
                                </Link>
                                <span className="text-[10px] font-mono text-slate-400">
                                    {new Date(v.created_at).toLocaleDateString()} ·{' '}
                                    {new Date(v.created_at).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                                <span className="font-mono">
                                    {v.ciudadano?.tipo_documento?.sigla || 'CC'}{' '}
                                    {v.ciudadano?.documento}
                                </span>
                                <span className="font-medium text-slate-700">
                                    {v.punto?.nombre_punto}
                                </span>
                            </div>

                            <div className="pt-1 flex flex-wrap gap-1.5 items-center">
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700">
                                    {v.categoria?.nombre || 'General'}
                                </span>
                                <span className="text-xs font-semibold text-slate-800">
                                    {v.subcategoria?.nombre || v.servicio_texto || 'Servicio'}
                                </span>
                            </div>
                        </div>
                    ))}

                    {visits.data.length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-xs">
                            No hay visitas registradas que coincidan.
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                    <div>
                        Mostrando <span className="font-bold text-slate-800">{visits.from || 0}</span> a{' '}
                        <span className="font-bold text-slate-800">{visits.to || 0}</span> de{' '}
                        <span className="font-bold text-slate-800">{visits.total}</span> visitas
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-1">
                        {visits.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`btn-tactile px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    link.active
                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-soft-xs'
                                        : link.url
                                        ? 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                                        : 'text-slate-300 pointer-events-none'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
