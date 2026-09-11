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
    dynamicFields: Array<any>;
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

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Registro de Visitas y Atenciones</h1>
                        <p className="text-xs text-slate-500 font-medium">
                            {visits.total} visitas registradas en las sedes de los Puntos Vive Digital
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={route('exportar.index', { tipo: 'visitas' })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
                        >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Exportar a Excel</span>
                        </Link>
                        <Link
                            href={route('visitas.create')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-alcaldia-green hover:bg-alcaldia-green-dark text-white text-xs font-bold shadow-sm transition-all"
                        >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>+ Registrar Nueva Visita</span>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Registro de Visitas" />

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6">
                <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                    <div className="lg:col-span-2 relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar por cédula o nombre del ciudadano..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green outline-none"
                        />
                    </div>

                    <div>
                        <select
                            value={selectedPoint}
                            onChange={(e) => setSelectedPoint(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:border-alcaldia-green outline-none"
                        >
                            <option value="">Todas las Sedes PVD</option>
                            {points.map((p) => (
                                <option key={p.id_punto} value={p.id_punto}>
                                    {p.nombre_punto}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:border-alcaldia-green outline-none"
                        >
                            <option value="">Todas las Categorías</option>
                            {categories.map((c) => (
                                <option key={c.id_categoria} value={c.id_categoria}>
                                    {c.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full px-2 py-1.5 rounded-xl border border-slate-200 text-[11px] font-medium focus:border-alcaldia-green outline-none"
                            placeholder="Desde"
                        />
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full px-2 py-1.5 rounded-xl border border-slate-200 text-[11px] font-medium focus:border-alcaldia-green outline-none"
                            placeholder="Hasta"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 rounded-xl bg-alcaldia-green text-white text-xs font-bold hover:bg-alcaldia-green-dark transition-colors flex items-center justify-center gap-1.5"
                        >
                            <Filter className="w-3.5 h-3.5" />
                            Filtrar
                        </button>
                        {(searchTerm || selectedPoint || selectedCategory || dateFrom || dateTo) && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 text-xs font-bold hover:bg-slate-50"
                                title="Limpiar filtros"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Visits Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="px-5 py-3.5">Ciudadano / Documento</th>
                                <th className="px-4 py-3.5">Categoría</th>
                                <th className="px-4 py-3.5">Trámite / Servicio Solicitado</th>
                                <th className="px-4 py-3.5">Sede PVD</th>
                                <th className="px-4 py-3.5">Gestor</th>
                                <th className="px-5 py-3.5 text-right">Fecha y Hora</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {visits.data.map((v) => (
                                <tr key={v.id_visita} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <Link
                                            href={route('ciudadanos.show', v.ciudadano?.id_form_pvd || 1)}
                                            className="font-bold text-slate-900 text-xs hover:text-alcaldia-green flex items-center gap-1"
                                        >
                                            <span>{v.ciudadano?.nombre_completo || 'Ciudadano'}</span>
                                        </Link>
                                        <div className="text-[11px] text-slate-400 font-mono">
                                            {v.ciudadano?.tipo_documento?.sigla || 'CC'} {v.ciudadano?.documento}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">
                                            {v.categoria?.nombre || 'General'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <div className="text-xs font-bold text-slate-900">
                                            {v.subcategoria?.nombre || v.servicio_texto || 'Servicio'}
                                        </div>
                                        {v.descripcion && (
                                            <div className="text-[11px] text-slate-500 italic truncate max-w-[240px]">
                                                "{v.descripcion}"
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3.5 text-xs text-slate-600 font-medium">
                                        {v.punto?.nombre_punto}
                                    </td>
                                    <td className="px-4 py-3.5 text-xs text-slate-500">{v.gestor?.name || 'Gestor'}</td>
                                    <td className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600">
                                        <div>{new Date(v.created_at).toLocaleDateString()}</div>
                                        <div className="text-[10px] text-slate-400">
                                            {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {visits.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-xs">
                                        No hay visitas registradas que coincidan con los filtros seleccionados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                    <div>
                        Mostrando <span className="font-bold text-slate-800">{visits.from || 0}</span> a{' '}
                        <span className="font-bold text-slate-800">{visits.to || 0}</span> de{' '}
                        <span className="font-bold text-slate-800">{visits.total}</span> visitas
                    </div>
                    <div className="flex items-center gap-1">
                        {visits.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                    link.active
                                        ? 'bg-alcaldia-green text-white'
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
