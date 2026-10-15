import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Search,
    UserPlus,
    Filter,
    FileSpreadsheet,
    Eye,
    Edit3,
    X,
    Users,
    MapPin,
    ArrowRight,
} from 'lucide-react';

interface Props {
    citizens: {
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
    documentTypes?: Array<any>;
}

export default function CitizensIndex({ citizens, filters, points }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedPoint, setSelectedPoint] = useState(filters.id_punto || '');
    const [selectedZone, setSelectedZone] = useState(filters.zona || '');
    const [selectedEducation, setSelectedEducation] = useState(filters.nivel_educativo || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('ciudadanos.index'),
            {
                search: searchTerm,
                id_punto: selectedPoint,
                zona: selectedZone,
                nivel_educativo: selectedEducation,
            },
            { preserveState: true }
        );
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedPoint('');
        setSelectedZone('');
        setSelectedEducation('');
        router.get(route('ciudadanos.index'));
    };

    const hasFilters = Boolean(
        searchTerm || selectedPoint || selectedZone || selectedEducation
    );

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                Directorio de Ciudadanos
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                                {citizens.total.toLocaleString()} empadronados
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                            Base única de ciudadanos atendidos en la red de Puntos y Aulas Digitales
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href={route('exportar.index', { tipo: 'ciudadanos' })}
                            className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-soft-xs transition-all"
                        >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="hidden sm:inline">Exportar Directorio</span>
                            <span className="sm:hidden">Excel</span>
                        </Link>
                        <Link
                            href={route('ciudadanos.create')}
                            className="btn-tactile inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-soft hover:shadow-soft-lg hover:shadow-emerald-600/30 transition-all"
                        >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>+ Nuevo Ciudadano</span>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Directorio de Ciudadanos · PuntoTIC" />

            {/* Filter Toolbar */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-soft mb-6">
                <form
                    onSubmit={handleSearch}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
                >
                    <div className="lg:col-span-2 relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar por cédula, nombre, correo o teléfono..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                        />
                    </div>

                    <div>
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

                    <div>
                        <select
                            value={selectedZone}
                            onChange={(e) => setSelectedZone(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium text-slate-700 focus:border-emerald-600 outline-none"
                        >
                            <option value="">Zona (Todas)</option>
                            <option value="Urbana">Urbana</option>
                            <option value="Rural">Rural</option>
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="btn-tactile flex-1 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-soft flex items-center justify-center gap-1.5"
                        >
                            <Filter className="w-3.5 h-3.5" />
                            <span>Filtrar</span>
                        </button>
                        {hasFilters && (
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="btn-tactile px-3 py-2.5 rounded-2xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                                title="Limpiar filtros"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Citizens List: Desktop Table + Mobile Cards */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-soft overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Ciudadano / Documento</th>
                                <th className="px-4 py-4">Edad / Género</th>
                                <th className="px-4 py-4">Nivel Educativo</th>
                                <th className="px-4 py-4">Zona / Barrio</th>
                                <th className="px-4 py-4">Sede Registro</th>
                                <th className="px-4 py-4 text-center">Visitas</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {citizens.data.map((citizen) => (
                                <tr
                                    key={citizen.id_form_pvd}
                                    className="hover:bg-slate-50/80 transition-colors group"
                                >
                                    <td className="px-6 py-4">
                                        <Link
                                            href={route('ciudadanos.show', citizen.id_form_pvd)}
                                            className="font-bold text-slate-900 text-xs hover:text-emerald-700 flex items-center gap-1.5"
                                        >
                                            <span>{citizen.nombre_completo}</span>
                                            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600" />
                                        </Link>
                                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                            {citizen.tipo_documento?.sigla || 'CC'}{' '}
                                            {citizen.documento}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="text-xs font-semibold text-slate-800">
                                            {citizen.edad ? `${citizen.edad} años` : 'N/A'}
                                        </div>
                                        <div className="text-[11px] text-slate-400">
                                            {citizen.genero || 'No especificado'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="inline-block px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-100 text-slate-700">
                                            {citizen.nivel_educativo || 'Sin registrar'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                                            <span
                                                className={`w-2 h-2 rounded-full ${
                                                    citizen.zona === 'Rural'
                                                        ? 'bg-amber-500'
                                                        : 'bg-emerald-500'
                                                }`}
                                            />
                                            <span>{citizen.zona || 'Urbana'}</span>
                                        </div>
                                        <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                                            {citizen.barrio || citizen.up || 'Acacías'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-xs font-medium text-slate-600">
                                        {citizen.punto?.nombre_punto || 'PVD Principal'}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            {citizen.visitas_count}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <Link
                                                href={route('visitas.create', {
                                                    documento: citizen.documento,
                                                })}
                                                className="btn-tactile p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                                title="Registrar visita"
                                            >
                                                <UserPlus className="w-3.5 h-3.5" />
                                            </Link>
                                            <Link
                                                href={route('ciudadanos.show', citizen.id_form_pvd)}
                                                className="btn-tactile p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                                title="Ver perfil completo"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </Link>
                                            <Link
                                                href={route('ciudadanos.edit', citizen.id_form_pvd)}
                                                className="btn-tactile p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                                title="Editar ciudadano"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {citizens.data.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <Users className="w-10 h-10 text-slate-300 mb-2" />
                                            <p className="text-xs font-medium text-slate-600">
                                                No se encontraron ciudadanos con los criterios seleccionados.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards View (< lg) */}
                <div className="lg:hidden divide-y divide-slate-100">
                    {citizens.data.map((citizen) => (
                        <div key={citizen.id_form_pvd} className="p-4 space-y-2 hover:bg-slate-50">
                            <div className="flex items-center justify-between">
                                <Link
                                    href={route('ciudadanos.show', citizen.id_form_pvd)}
                                    className="font-bold text-slate-900 text-xs hover:text-emerald-700 flex items-center gap-1"
                                >
                                    <span>{citizen.nombre_completo}</span>
                                    <ArrowRight className="w-3 h-3 text-emerald-600" />
                                </Link>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {citizen.visitas_count} visitas
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                                <span className="font-mono">
                                    {citizen.tipo_documento?.sigla || 'CC'} {citizen.documento}
                                </span>
                                <span>
                                    {citizen.edad ? `${citizen.edad} años` : 'N/A'} ·{' '}
                                    {citizen.genero || 'N/A'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                                    <span
                                        className={`w-2 h-2 rounded-full ${
                                            citizen.zona === 'Rural'
                                                ? 'bg-amber-500'
                                                : 'bg-emerald-500'
                                        }`}
                                    />
                                    <span>{citizen.barrio || citizen.zona || 'Acacías'}</span>
                                </div>

                                <div className="flex items-center gap-1">
                                    <Link
                                        href={route('visitas.create', {
                                            documento: citizen.documento,
                                        })}
                                        className="btn-tactile p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                        title="Registrar visita"
                                    >
                                        <UserPlus className="w-3.5 h-3.5" />
                                    </Link>
                                    <Link
                                        href={route('ciudadanos.show', citizen.id_form_pvd)}
                                        className="btn-tactile p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        title="Ver perfil"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                    </Link>
                                    <Link
                                        href={route('ciudadanos.edit', citizen.id_form_pvd)}
                                        className="btn-tactile p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        title="Editar"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}

                    {citizens.data.length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-xs">
                            No se encontraron ciudadanos que coincidan.
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                    <div>
                        Mostrando <span className="font-bold text-slate-800">{citizens.from || 0}</span> a{' '}
                        <span className="font-bold text-slate-800">{citizens.to || 0}</span> de{' '}
                        <span className="font-bold text-slate-800">{citizens.total}</span> ciudadanos
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-1">
                        {citizens.links.map((link, i) => (
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
