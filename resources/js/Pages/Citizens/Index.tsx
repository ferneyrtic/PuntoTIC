import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Search,
    UserPlus,
    Filter,
    FileSpreadsheet,
    ChevronLeft,
    ChevronRight,
    Eye,
    Edit3,
    CheckCircle2,
    X,
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
    documentTypes: Array<any>;
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

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Directorio de Ciudadanos</h1>
                        <p className="text-xs text-slate-500 font-medium">
                            {citizens.total} ciudadanos registrados en los Puntos Vive Digital
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={route('exportar.index', { tipo: 'ciudadanos' })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
                        >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Exportar Directorio</span>
                        </Link>
                        <Link
                            href={route('ciudadanos.create')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-alcaldia-green hover:bg-alcaldia-green-dark text-white text-xs font-bold shadow-sm transition-all"
                        >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>+ Nuevo Ciudadano</span>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Directorio de Ciudadanos" />

            {/* Filter Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6">
                <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="lg:col-span-2 relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar por cédula, nombre, correo o teléfono..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green focus:ring-1 focus:ring-alcaldia-green outline-none"
                        />
                    </div>

                    <div>
                        <select
                            value={selectedPoint}
                            onChange={(e) => setSelectedPoint(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:border-alcaldia-green focus:ring-1 focus:ring-alcaldia-green outline-none"
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
                            value={selectedZone}
                            onChange={(e) => setSelectedZone(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:border-alcaldia-green focus:ring-1 focus:ring-alcaldia-green outline-none"
                        >
                            <option value="">Zona (Todas)</option>
                            <option value="Urbana">Urbana</option>
                            <option value="Rural">Rural</option>
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 rounded-xl bg-alcaldia-green text-white text-xs font-bold hover:bg-alcaldia-green-dark transition-colors flex items-center justify-center gap-1.5"
                        >
                            <Filter className="w-3.5 h-3.5" />
                            Filtrar
                        </button>
                        {(searchTerm || selectedPoint || selectedZone || selectedEducation) && (
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 text-xs font-bold hover:bg-slate-50 transition-colors"
                                title="Limpiar filtros"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Citizens Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="px-5 py-3.5">Ciudadano / Documento</th>
                                <th className="px-4 py-3.5">Edad / Género</th>
                                <th className="px-4 py-3.5">Nivel Educativo</th>
                                <th className="px-4 py-3.5">Zona / Barrio</th>
                                <th className="px-4 py-3.5">Sede Registro</th>
                                <th className="px-4 py-3.5 text-center">Visitas</th>
                                <th className="px-5 py-3.5 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {citizens.data.map((citizen) => (
                                <tr key={citizen.id_form_pvd} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                            <span>{citizen.nombre_completo}</span>
                                        </div>
                                        <div className="text-[11px] text-slate-500 font-mono">
                                            {citizen.tipo_documento?.sigla || 'CC'} {citizen.documento}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <div className="text-xs font-semibold text-slate-800">{citizen.edad ? `${citizen.edad} años` : 'N/A'}</div>
                                        <div className="text-[11px] text-slate-400">{citizen.genero || 'No especificado'}</div>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                                            {citizen.nivel_educativo || 'Sin registrar'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <div className="text-xs font-semibold text-slate-800">
                                            <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${citizen.zona === 'Rural' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                            {citizen.zona || 'Urbana'}
                                        </div>
                                        <div className="text-[11px] text-slate-400 truncate max-w-[140px]">{citizen.barrio || citizen.up || 'Acacías'}</div>
                                    </td>
                                    <td className="px-4 py-3.5 text-xs font-medium text-slate-600">
                                        {citizen.punto?.nombre_punto || 'PVD Principal'}
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-alcaldia-green border border-emerald-200">
                                            {citizen.visitas_count}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <Link
                                                href={route('visitas.create', { documento: citizen.documento })}
                                                className="p-1.5 rounded-lg bg-emerald-50 text-alcaldia-green hover:bg-emerald-100 transition-colors"
                                                title="Registrar visita para este ciudadano"
                                            >
                                                <UserPlus className="w-3.5 h-3.5" />
                                            </Link>
                                            <Link
                                                href={route('ciudadanos.show', citizen.id_form_pvd)}
                                                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                                title="Ver perfil completo e historial"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </Link>
                                            <Link
                                                href={route('ciudadanos.edit', citizen.id_form_pvd)}
                                                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                                title="Editar todos los datos del ciudadano"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {citizens.data.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-xs">
                                        No se encontraron ciudadanos que coincidan con los criterios de búsqueda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                    <div>
                        Mostrando <span className="font-bold text-slate-800">{citizens.from || 0}</span> a{' '}
                        <span className="font-bold text-slate-800">{citizens.to || 0}</span> de{' '}
                        <span className="font-bold text-slate-800">{citizens.total}</span> ciudadanos
                    </div>
                    <div className="flex items-center gap-1">
                        {citizens.links.map((link, i) => (
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
