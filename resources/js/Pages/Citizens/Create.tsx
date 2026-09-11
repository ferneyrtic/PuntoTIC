import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft, Save, UserCheck, AlertCircle, Sparkles } from 'lucide-react';

interface Props {
    points: Array<any>;
    documentTypes: Array<any>;
    categories: Array<any>;
}

export default function CitizenCreate({ points, documentTypes }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        documento: '',
        id_tipo: 1,
        nombres: '',
        apellidos: '',
        fecha_nac: '',
        edad: '',
        genero: 'Femenino',
        correo: '',
        telefono: '',
        direccion: '',
        barrio: '',
        zona: 'Urbana',
        up: '',
        estrato: 1,
        grupo_etnico: 'Ninguno',
        nivel_educativo: 'Bachillerato completo',
        ocupacion: 'Empleado',
        g_poblacional: 'Ninguno',
        t_aseguramiento: 'Subsidiado',
        id_punto: points[0]?.id_punto || 1,
        crear_visita_inmediata: true,
    });

    const [calculatingAge, setCalculatingAge] = useState<number | null>(null);

    const handleBirthDateChange = (val: string) => {
        setData('fecha_nac', val);
        if (val) {
            const birth = new Date(val);
            const now = new Date();
            let age = now.getFullYear() - birth.getFullYear();
            const m = now.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
                age--;
            }
            if (!isNaN(age) && age >= 0) {
                setCalculatingAge(age);
                setData('edad', age.toString());
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('ciudadanos.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route('ciudadanos.index')}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Registrar Nuevo Ciudadano</h1>
                        <p className="text-xs text-slate-500 font-medium">Formulario de vinculación al sistema de Puntos Vive Digital</p>
                    </div>
                </div>
            }
        >
            <Head title="Registrar Ciudadano" />

            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
                {/* Section 1: Identificación y Datos Personales */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                        <div className="w-7 h-7 rounded-lg bg-alcaldia-green text-white flex items-center justify-center font-black text-xs">
                            1
                        </div>
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Identificación y Datos Básicos</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Tipo de Documento <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={data.id_tipo}
                                onChange={(e) => setData('id_tipo', parseInt(e.target.value))}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green focus:ring-1 focus:ring-alcaldia-green outline-none"
                            >
                                {documentTypes.map((dt) => (
                                    <option key={dt.id_tipo} value={dt.id_tipo}>
                                        {dt.sigla} - {dt.nombre_tipo}
                                    </option>
                                ))}
                            </select>
                            {errors.id_tipo && <p className="text-[11px] text-rose-500 mt-1">{errors.id_tipo}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Número de Documento <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Ej: 1015234567"
                                value={data.documento}
                                onChange={(e) => setData('documento', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green focus:ring-1 focus:ring-alcaldia-green outline-none"
                                required
                            />
                            {errors.documento && <p className="text-[11px] text-rose-500 mt-1">{errors.documento}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Sede PVD de Registro <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={data.id_punto}
                                onChange={(e) => setData('id_punto', parseInt(e.target.value))}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green focus:ring-1 focus:ring-alcaldia-green outline-none"
                            >
                                {points.map((p) => (
                                    <option key={p.id_punto} value={p.id_punto}>
                                        {p.nombre_punto} ({p.zona})
                                    </option>
                                ))}
                            </select>
                            {errors.id_punto && <p className="text-[11px] text-rose-500 mt-1">{errors.id_punto}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Nombres <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Ej: María Camila"
                                value={data.nombres}
                                onChange={(e) => setData('nombres', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green focus:ring-1 focus:ring-alcaldia-green outline-none"
                                required
                            />
                            {errors.nombres && <p className="text-[11px] text-rose-500 mt-1">{errors.nombres}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Apellidos <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Ej: García López"
                                value={data.apellidos}
                                onChange={(e) => setData('apellidos', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green focus:ring-1 focus:ring-alcaldia-green outline-none"
                                required
                            />
                            {errors.apellidos && <p className="text-[11px] text-rose-500 mt-1">{errors.apellidos}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Género</label>
                            <select
                                value={data.genero}
                                onChange={(e) => setData('genero', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green focus:ring-1 focus:ring-alcaldia-green outline-none"
                            >
                                <option value="Femenino">Femenino</option>
                                <option value="Masculino">Masculino</option>
                                <option value="No binario">No binario</option>
                                <option value="Prefiere no responder">Prefiere no responder</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Nacimiento</label>
                            <input
                                type="date"
                                value={data.fecha_nac}
                                onChange={(e) => handleBirthDateChange(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green focus:ring-1 focus:ring-alcaldia-green outline-none"
                            />
                            {calculatingAge !== null && (
                                <p className="text-[11px] font-bold text-alcaldia-green mt-1">
                                    Edad calculada: {calculatingAge} años
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono / Celular</label>
                            <input
                                type="text"
                                placeholder="Ej: 3142567890"
                                value={data.telefono}
                                onChange={(e) => setData('telefono', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green focus:ring-1 focus:ring-alcaldia-green outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico</label>
                            <input
                                type="email"
                                placeholder="ejemplo@correo.com"
                                value={data.correo}
                                onChange={(e) => setData('correo', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green focus:ring-1 focus:ring-alcaldia-green outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Section 2: Ubicación y Datos Demográficos */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                        <div className="w-7 h-7 rounded-lg bg-alcaldia-yellow text-slate-900 flex items-center justify-center font-black text-xs">
                            2
                        </div>
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Ubicación y Perfil Sociodemográfico</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Zona <span className="text-rose-500">*</span></label>
                            <select
                                value={data.zona}
                                onChange={(e) => setData('zona', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green focus:ring-1 focus:ring-alcaldia-green outline-none"
                            >
                                <option value="Urbana">Urbana</option>
                                <option value="Rural">Rural</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Barrio o Vereda</label>
                            <input
                                type="text"
                                placeholder="Ej: Centro, Dinamarca, Chichimene..."
                                value={data.barrio}
                                onChange={(e) => setData('barrio', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green focus:ring-1 focus:ring-alcaldia-green outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Estrato Socioeconómico</label>
                            <select
                                value={data.estrato}
                                onChange={(e) => setData('estrato', parseInt(e.target.value))}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green focus:ring-1 focus:ring-alcaldia-green outline-none"
                            >
                                {[1, 2, 3, 4, 5, 6].map((num) => (
                                    <option key={num} value={num}>
                                        Estrato {num}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-700 mb-1">Dirección de Residencia</label>
                            <input
                                type="text"
                                placeholder="Ej: Calle 15 # 20-30"
                                value={data.direccion}
                                onChange={(e) => setData('direccion', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green focus:ring-1 focus:ring-alcaldia-green outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Unidad Poblacional / Comuna</label>
                            <input
                                type="text"
                                placeholder="Ej: Comuna 1, Vereda..."
                                value={data.up}
                                onChange={(e) => setData('up', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green focus:ring-1 focus:ring-alcaldia-green outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
                        {/* Nivel Educativo - TOTALMENTE EDITABLE */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                                <span>Nivel Educativo</span>
                                <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">Editable</span>
                            </label>
                            <select
                                value={data.nivel_educativo}
                                onChange={(e) => setData('nivel_educativo', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green focus:ring-1 focus:ring-alcaldia-green outline-none"
                            >
                                <option value="Primaria incompleta">Primaria incompleta</option>
                                <option value="Primaria completa">Primaria completa</option>
                                <option value="Bachillerato incompleto">Bachillerato incompleto</option>
                                <option value="Bachillerato completo">Bachillerato completo</option>
                                <option value="Técnico / Tecnológico">Técnico / Tecnológico</option>
                                <option value="Universitario">Universitario</option>
                                <option value="Posgrado">Posgrado</option>
                                <option value="Ninguno">Ninguno</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Ocupación Actual</label>
                            <select
                                value={data.ocupacion}
                                onChange={(e) => setData('ocupacion', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green focus:ring-1 focus:ring-alcaldia-green outline-none"
                            >
                                <option value="Empleado">Empleado</option>
                                <option value="Independiente">Independiente</option>
                                <option value="Estudiante">Estudiante</option>
                                <option value="Ama de casa">Ama de casa</option>
                                <option value="Desempleado">Desempleado</option>
                                <option value="Jubilado / Pensionado">Jubilado / Pensionado</option>
                                <option value="Agricultor / Campo">Agricultor / Campo</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Grupo Étnico</label>
                            <select
                                value={data.grupo_etnico}
                                onChange={(e) => setData('grupo_etnico', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green focus:ring-1 focus:ring-alcaldia-green outline-none"
                            >
                                <option value="Ninguno">Ninguno</option>
                                <option value="Indígena">Indígena</option>
                                <option value="Afrodescendiente">Afrodescendiente</option>
                                <option value="Raizal">Raizal</option>
                                <option value="Palenquero">Palenquero</option>
                                <option value="ROM / Gitano">ROM / Gitano</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Grupo Poblacional / Enfoque</label>
                            <select
                                value={data.g_poblacional}
                                onChange={(e) => setData('g_poblacional', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green focus:ring-1 focus:ring-alcaldia-green outline-none"
                            >
                                <option value="Ninguno">Ninguno</option>
                                <option value="Madre Cabeza de Hogar">Madre Cabeza de Hogar</option>
                                <option value="Adulto Mayor">Adulto Mayor</option>
                                <option value="Víctima del Conflicto">Víctima del Conflicto</option>
                                <option value="Persona con Discapacidad">Persona con Discapacidad</option>
                                <option value="Jóvenes">Jóvenes</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Régimen de Salud</label>
                            <select
                                value={data.t_aseguramiento}
                                onChange={(e) => setData('t_aseguramiento', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green focus:ring-1 focus:ring-alcaldia-green outline-none"
                            >
                                <option value="Subsidiado">Subsidiado (SISBEN)</option>
                                <option value="Contributivo">Contributivo (EPS)</option>
                                <option value="Especial">Especial (Magisterio / Militares)</option>
                                <option value="Vinculado">Vinculado</option>
                                <option value="Ninguno">Sin aseguramiento</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Submit & Next Step Bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.crear_visita_inmediata}
                            onChange={(e) => setData('crear_visita_inmediata', e.target.checked)}
                            className="rounded border-slate-300 text-alcaldia-green focus:ring-alcaldia-green w-4 h-4"
                        />
                        <span className="text-xs font-bold text-slate-700">
                            Pasar inmediatamente al registro del servicio / visita de hoy
                        </span>
                    </label>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Link
                            href={route('ciudadanos.index')}
                            className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 text-center transition-colors"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 sm:flex-none px-6 py-2 rounded-xl bg-alcaldia-green hover:bg-alcaldia-green-dark text-white text-xs font-bold shadow-md shadow-alcaldia-green/20 transition-all flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            <span>{processing ? 'Guardando...' : 'Guardar Ciudadano'}</span>
                        </button>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
