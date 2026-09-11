import React, { useState } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    DoorOpen,
    Plus,
    Search,
    Calendar,
    Clock,
    UserCheck,
    X,
    Save,
    CheckCircle2,
    Filter,
} from 'lucide-react';
import axios from 'axios';

interface Props {
    loans: {
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
    tiposActividad: Array<string>;
}

const CATEGORIAS_PRESTAMO = [
    'Convenios Formativos y Cursos SENA / Alcaldía',
    'Instituciones Educativas y Colegios',
    'ICBF y Programas de Niñez / Primera Infancia',
    'Juntas de Acción Comunal (JAC) y Asambleas Barriales',
    'Cine Comunitario, Cineclub y Proyecciones Audiovisuales',
    'Programas Sociales, Paz y Fundaciones Comunitarias',
    'Expresiones Culturales, Arte, Deporte y Danza',
    'Jornadas de Salud, Vacunación y Brigadas',
    'Emprendimiento, Comercio Local y Empleo',
    'Reuniones y Eventos Institucionales de la Alcaldía',
    'Otras Actividades Comunitarias',
];

export default function RoomLoansIndex({ loans, filters, points, tiposActividad }: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const [documentInput, setDocumentInput] = useState('');
    const [citizenFound, setCitizenFound] = useState<any>(null);

    // Filters state
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedPoint, setSelectedPoint] = useState(filters.id_punto || '');
    const [selectedTipo, setSelectedTipo] = useState(filters.tipo_actividad || '');
    const [dateFrom, setDateFrom] = useState(filters.fecha_desde || '');
    const [dateTo, setDateTo] = useState(filters.fecha_hasta || '');

    const { data, setData, post, processing, reset, errors } = useForm({
        id_form_pvd: null as number | null,
        nombre_responsable_texto: '',
        id_punto: points[0]?.id_punto || 1,
        tipo_actividad: CATEGORIAS_PRESTAMO[0],
        num_asistentes: 15,
        fecha_prestamo: new Date().toISOString().substring(0, 10),
        hora_inicio: '09:00',
        hora_fin: '11:00',
        observaciones: '',
        estado: 'Completado',
    });

    const verifyCitizen = async (doc: string) => {
        if (!doc) return;
        try {
            const res = await axios.post(route('ciudadanos.verify'), { documento: doc });
            if (res.data.exists && res.data.citizen) {
                setCitizenFound(res.data.citizen);
                setData('id_form_pvd', res.data.citizen.id_form_pvd);
                setData('nombre_responsable_texto', res.data.citizen.nombre_completo);
            } else {
                setCitizenFound(null);
                setData('id_form_pvd', null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('prestamos.index'),
            {
                search: searchTerm,
                id_punto: selectedPoint,
                tipo_actividad: selectedTipo,
                fecha_desde: dateFrom,
                fecha_hasta: dateTo,
            },
            { preserveState: true }
        );
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedPoint('');
        setSelectedTipo('');
        setDateFrom('');
        setDateTo('');
        router.get(route('prestamos.index'));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('prestamos.store'), {
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
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Préstamo de Salas y Espacios</h1>
                        <p className="text-xs text-slate-500 font-medium">
                            {loans.total} préstamos registrados y clasificados por categoría de actividad real
                        </p>
                    </div>
                    <button
                        onClick={() => setModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-alcaldia-green hover:bg-alcaldia-green-dark text-white text-xs font-bold shadow-sm transition-all"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Registrar Préstamo de Sala</span>
                    </button>
                </div>
            }
        >
            <Head title="Préstamo de Salas" />

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6">
                <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                    <div className="lg:col-span-2 relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar por responsable o detalle..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green outline-none"
                        />
                    </div>

                    <div>
                        <select
                            value={selectedTipo}
                            onChange={(e) => setSelectedTipo(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:border-alcaldia-green outline-none"
                        >
                            <option value="">Todas las Categorías</option>
                            {(tiposActividad || CATEGORIAS_PRESTAMO).map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <select
                            value={selectedPoint}
                            onChange={(e) => setSelectedPoint(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:border-alcaldia-green outline-none"
                        >
                            <option value="">Todas las Sedes</option>
                            {points.map((p) => (
                                <option key={p.id_punto} value={p.id_punto}>
                                    {p.nombre_punto}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full px-2 py-1.5 rounded-xl border border-slate-200 text-[11px] font-medium outline-none"
                            placeholder="Desde"
                        />
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full px-2 py-1.5 rounded-xl border border-slate-200 text-[11px] font-medium outline-none"
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
                        {(searchTerm || selectedPoint || selectedTipo || dateFrom || dateTo) && (
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 text-xs font-bold hover:bg-slate-50"
                                title="Limpiar filtros"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Loans Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="px-5 py-3.5">Responsable / Solicitante</th>
                                <th className="px-4 py-3.5">Categoría de Actividad</th>
                                <th className="px-4 py-3.5">Detalle / Observaciones</th>
                                <th className="px-4 py-3.5">Sede PVD</th>
                                <th className="px-4 py-3.5">Asistentes</th>
                                <th className="px-4 py-3.5">Estado</th>
                                <th className="px-5 py-3.5 text-right">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loans.data.map((loan) => (
                                <tr key={loan.id_prestamo} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <div className="font-bold text-slate-900 text-xs">
                                            {loan.ciudadano?.nombre_completo || loan.nombre_responsable_texto || 'Responsable'}
                                        </div>
                                        <div className="text-[11px] text-slate-400">
                                            {loan.ciudadano ? `CC ${loan.ciudadano.documento}` : 'Entidad / Particular'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-alcaldia-green border border-emerald-200">
                                            {loan.tipo_actividad}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-xs text-slate-600 max-w-[260px] truncate" title={loan.observaciones || '-'}>
                                        {loan.observaciones || '-'}
                                    </td>
                                    <td className="px-4 py-3.5 text-xs text-slate-600 font-medium">
                                        {loan.punto?.nombre_punto}
                                    </td>
                                    <td className="px-4 py-3.5 text-xs text-slate-700 font-semibold">{loan.num_asistentes} pers.</td>
                                    <td className="px-4 py-3.5">
                                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                            {loan.estado}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-right text-xs font-bold text-slate-800">{loan.fecha_prestamo}</td>
                                </tr>
                            ))}
                            {loans.data.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-xs">
                                        No se encontraron préstamos que coincidan con los filtros seleccionados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                    <div>
                        Mostrando <span className="font-bold text-slate-800">{loans.from || 0}</span> a{' '}
                        <span className="font-bold text-slate-800">{loans.to || 0}</span> de{' '}
                        <span className="font-bold text-slate-800">{loans.total}</span> préstamos
                    </div>
                    <div className="flex items-center gap-1">
                        {loans.links?.map((link: any, i: number) => (
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

            {/* Modal de Registro */}
            {modalOpen && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Registrar Préstamo de Sala</h3>
                            <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Cédula del Responsable</label>
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
                                        placeholder="O ingrese nombre de entidad o persona si no está registrado..."
                                        value={data.nombre_responsable_texto}
                                        onChange={(e) => setData('nombre_responsable_texto', e.target.value)}
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
                                    <label className="block text-xs font-bold text-slate-700 mb-1">N° Asistentes *</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={data.num_asistentes}
                                        onChange={(e) => setData('num_asistentes', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Actividad Real *</label>
                                <select
                                    value={data.tipo_actividad}
                                    onChange={(e) => setData('tipo_actividad', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:border-alcaldia-green outline-none"
                                >
                                    {CATEGORIAS_PRESTAMO.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Fecha *</label>
                                    <input
                                        type="date"
                                        value={data.fecha_prestamo}
                                        onChange={(e) => setData('fecha_prestamo', e.target.value)}
                                        className="w-full px-2 py-1.5 rounded-xl border border-slate-200 text-xs font-medium outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Hora Inicio</label>
                                    <input
                                        type="time"
                                        value={data.hora_inicio}
                                        onChange={(e) => setData('hora_inicio', e.target.value)}
                                        className="w-full px-2 py-1.5 rounded-xl border border-slate-200 text-xs font-medium outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Hora Fin</label>
                                    <input
                                        type="time"
                                        value={data.hora_fin}
                                        onChange={(e) => setData('hora_fin', e.target.value)}
                                        className="w-full px-2 py-1.5 rounded-xl border border-slate-200 text-xs font-medium outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Detalle / Requerimientos</label>
                                <textarea
                                    rows={2}
                                    placeholder="Detalles sobre proyector, micrófonos o nombre específico del evento..."
                                    value={data.observaciones}
                                    onChange={(e) => setData('observaciones', e.target.value)}
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
                                    {processing ? 'Guardando...' : 'Guardar Préstamo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
