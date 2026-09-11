import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArrowLeft,
    Search,
    Sparkles,
    UserCheck,
    Save,
    CheckCircle2,
    Clock,
    Layers,
    UserPlus,
    Building2,
    SlidersHorizontal,
    GraduationCap,
    Laptop,
    User,
    Zap,
    RotateCcw,
} from 'lucide-react';
import axios from 'axios';

interface Props {
    points: Array<any>;
    categories: Array<any>;
    dynamicFields: Array<any>;
    prefillDocument: string;
    initialCitizen: any;
    initialPredictions: Array<any>;
    puedeAulaDigital?: boolean;
    puedePvdGeneral?: boolean;
}

export default function VisitCreate({
    points,
    categories,
    dynamicFields,
    prefillDocument,
    initialCitizen,
    initialPredictions,
    puedeAulaDigital,
    puedePvdGeneral,
}: Props) {
    const { auth } = usePage<any>().props;
    const user = auth?.user;
    const userPointId = user?.id_punto || points[0]?.id_punto || 1;

    // Strict role permissions
    const canAulaDigital = typeof puedeAulaDigital === 'boolean'
        ? puedeAulaDigital
        : (user?.puede_acceder_aula_digital ?? false);

    const canPvdGeneral = typeof puedePvdGeneral === 'boolean'
        ? puedePvdGeneral
        : (user?.puede_acceder_pvd_general ?? true);

    // If user cannot access Aula Digital (e.g. Gestor PVD / Coordinador PVD), mode is strictly 'pvd'
    // If user cannot access PVD General (e.g. Gestor Aula Digital), mode is strictly 'aula'
    const initialMode: 'aula' | 'pvd' = !canAulaDigital
        ? 'pvd'
        : (!canPvdGeneral ? 'aula' : ((user?.es_aula_digital || [3, 4].includes(Number(userPointId))) ? 'aula' : 'pvd'));

    const [mode, setMode] = useState<'aula' | 'pvd'>(initialMode);

    // State for standard PVD mode
    const [documentInput, setDocumentInput] = useState(prefillDocument || '');
    const [searching, setSearching] = useState(false);
    const [citizenFound, setCitizenFound] = useState<any>(initialCitizen || null);
    const [predictions, setPredictions] = useState<Array<any>>(initialPredictions || []);

    // State for Aula Digital fast mode
    const [studentSearch, setStudentSearch] = useState('');
    const [studentSuggestions, setStudentSuggestions] = useState<Array<any>>([]);
    const [searchingStudents, setSearchingStudents] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [selectedActivity, setSelectedActivity] = useState('Acceso libre a computador y tareas escolares');
    const [selectedTime, setSelectedTime] = useState(60);

    const { data, setData, post, processing, errors, reset } = useForm({
        id_form_pvd: initialCitizen?.id_form_pvd || null,
        documento: prefillDocument || '',
        id_tipo: 1,
        nombres: '',
        apellidos: '',
        nombre_completo: '',
        es_registro_rapido: initialMode === 'aula',
        id_punto: userPointId || (initialMode === 'aula' ? 3 : 1),
        id_categoria: categories[0]?.id_categoria || null,
        id_subcategoria: categories[0]?.subcategorias[0]?.id_subcategoria || null,
        servicio_texto: initialMode === 'aula' ? 'Acceso libre a computador y tareas escolares' : '',
        descripcion: '',
        duracion_minutos: initialMode === 'aula' ? 60 : 30,
        campos_dinamicos: {} as Record<number, any>,
    });

    const currentCategory = categories.find((c) => c.id_categoria === Number(data.id_categoria));

    // Autocomplete student search for Aula Digital
    useEffect(() => {
        if (mode !== 'aula' || studentSearch.trim().length < 2 || selectedStudent) {
            setStudentSuggestions([]);
            return;
        }
        const timer = setTimeout(async () => {
            setSearchingStudents(true);
            try {
                const res = await axios.get(route('ciudadanos.buscar-estudiantes'), {
                    params: {
                        term: studentSearch,
                        id_punto: data.id_punto,
                    },
                });
                setStudentSuggestions(res.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setSearchingStudents(false);
            }
        }, 200);

        return () => clearTimeout(timer);
    }, [studentSearch, data.id_punto, mode, selectedStudent]);

    const selectStudent = (student: any) => {
        setSelectedStudent(student);
        setStudentSearch(`${student.nombres} ${student.apellidos}`);
        setStudentSuggestions([]);
        setData((prev) => ({
            ...prev,
            id_form_pvd: student.id_form_pvd,
            documento: student.documento,
            nombres: student.nombres,
            apellidos: student.apellidos,
            nombre_completo: `${student.nombres} ${student.apellidos}`,
        }));
    };

    const clearStudentSelection = () => {
        setSelectedStudent(null);
        setStudentSearch('');
        setData((prev) => ({
            ...prev,
            id_form_pvd: null,
            documento: '',
            nombres: '',
            apellidos: '',
            nombre_completo: '',
        }));
    };

    // Handle standard document verification
    const verifyCitizen = async (doc: string) => {
        if (!doc || doc.length < 3) return;
        setSearching(true);
        try {
            const res = await axios.post(route('ciudadanos.verify'), {
                documento: doc,
                id_punto: data.id_punto,
            });

            if (res.data.exists && res.data.citizen) {
                setCitizenFound(res.data.citizen);
                setData((prev) => ({
                    ...prev,
                    id_form_pvd: res.data.citizen.id_form_pvd,
                    documento: res.data.citizen.documento,
                    nombres: res.data.citizen.nombres,
                    apellidos: res.data.citizen.apellidos,
                }));
                setPredictions(res.data.predictions || []);

                if (res.data.predictions && res.data.predictions.length > 0) {
                    const top = res.data.predictions[0];
                    setData((prev) => ({
                        ...prev,
                        id_categoria: top.id_categoria,
                        id_subcategoria: top.id_subcategoria,
                    }));
                }
            } else {
                setCitizenFound(null);
                setPredictions([]);
                setData((prev) => ({
                    ...prev,
                    id_form_pvd: null,
                    documento: doc,
                }));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSearching(false);
        }
    };

    useEffect(() => {
        if (prefillDocument && !initialCitizen) {
            verifyCitizen(prefillDocument);
        }
    }, [prefillDocument]);

    const handleDescriptionChange = async (val: string) => {
        setData('descripcion', val);
        if (val.length > 8 && !citizenFound) {
            try {
                const res = await axios.post(route('visitas.classify-nlp'), { descripcion: val });
                if (res.data.classified && res.data.suggestion) {
                    setData((prev) => ({
                        ...prev,
                        id_categoria: res.data.suggestion.id_categoria,
                        id_subcategoria: res.data.suggestion.subcategorias?.[0]?.id_subcategoria || prev.id_subcategoria,
                    }));
                }
            } catch (err) {
                // Ignore NLP errors
            }
        }
    };

    const handleApplyPrediction = (pred: any) => {
        setData((prev) => ({
            ...prev,
            id_categoria: pred.id_categoria,
            id_subcategoria: pred.id_subcategoria,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('visitas.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('visitas.index')}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 tracking-tight">
                                {mode === 'aula' ? 'Ingreso a Aula Digital (Estudiantes)' : 'Registrar Visita / Atención'}
                            </h1>
                            <p className="text-xs text-slate-500 font-medium">
                                {mode === 'aula'
                                    ? 'Modalidad ágil para niños de corregimientos (Dinamarca / Chichimene) sin requerir documento'
                                    : 'Atención presencial en salas PVD con asistencia inteligente de categorización'}
                            </p>
                        </div>
                    </div>

                    {/* Sede indicator */}
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
                        <Building2 className="w-4 h-4 text-alcaldia-green" />
                        <span>{points.find((p) => p.id_punto === Number(data.id_punto))?.nombre_punto || 'Sede'}</span>
                    </div>
                </div>
            }
        >
            <Head title={mode === 'aula' ? 'Ingreso Aula Digital - PuntoTIC' : 'Registrar Visita - PuntoTIC'} />

            {/* Mode Switcher Tabs - Solo visible si el usuario tiene acceso a AMBOS modos */}
            {canAulaDigital && canPvdGeneral ? (
                <div className="flex bg-slate-200/80 p-1 rounded-2xl max-w-xl mx-auto mb-6 border border-slate-300/60 shadow-inner">
                    <button
                        type="button"
                        onClick={() => {
                            setMode('aula');
                            setData((prev) => ({
                                ...prev,
                                es_registro_rapido: true,
                                duracion_minutos: 60,
                                servicio_texto: 'Acceso libre a computador y tareas escolares',
                                id_punto: user?.es_aula_digital ? userPointId : 3,
                            }));
                        }}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                            mode === 'aula'
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20'
                                : 'text-slate-600 hover:text-slate-900 font-bold'
                        }`}
                    >
                        <GraduationCap className="w-4 h-4" />
                        <span>Modo Aula Digital (Niños / Rápido)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setMode('pvd');
                            setData((prev) => ({
                                ...prev,
                                es_registro_rapido: false,
                                duracion_minutos: 30,
                                servicio_texto: '',
                                id_punto: userPointId || 1,
                            }));
                        }}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                            mode === 'pvd'
                                ? 'bg-slate-900 text-white shadow-md'
                                : 'text-slate-600 hover:text-slate-900 font-bold'
                        }`}
                    >
                        <Building2 className="w-4 h-4" />
                        <span>Modo General PVD (Adultos / Completo)</span>
                    </button>
                </div>
            ) : (
                /* Distintivo Institucional según Rol */
                <div className="max-w-xl mx-auto mb-6 flex justify-center">
                    {!canAulaDigital ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-sm">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                            <Building2 className="w-4 h-4 text-blue-600" />
                            <span>Punto Vive Digital Acacías — Registro Integral de Ciudadanos</span>
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-950 border border-emerald-500/30 text-emerald-200 text-xs font-bold shadow-sm">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                            <GraduationCap className="w-4 h-4 text-emerald-400" />
                            <span>Aula Digital Rural — Registro Rápido Infantil</span>
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================= */}
            {/* MODO AULA DIGITAL (ESTUDIANTES Y NIÑOS DE CORREGIMIENTOS) */}
            {/* ========================================================= */}
            {mode === 'aula' ? (
                <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
                    <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 p-6 sm:p-7 rounded-3xl text-white shadow-xl border border-emerald-500/30 relative overflow-hidden">
                        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-inner">
                                <Laptop className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Corregimientos Acacías
                                </span>
                                <h2 className="text-xl font-black text-white tracking-tight">Ingreso Rápido de Niños al Computador</h2>
                            </div>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed mt-1">
                            En las aulas rurales de <strong>Dinamarca y Chichimene</strong> no se exige cédula, teléfono ni dirección a los niños.
                            Solo digite el <strong>nombre y apellido</strong> para habilitar su equipo.
                        </p>

                        {/* Sede selector */}
                        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <label className="text-xs font-bold text-slate-300">Sede del Aula Digital:</label>
                            <div className="flex gap-2">
                                {points
                                    .filter((p) => p.es_aula_digital || [3, 4].includes(p.id_punto))
                                    .map((p) => (
                                        <button
                                            key={p.id_punto}
                                            type="button"
                                            onClick={() => setData('id_punto', p.id_punto)}
                                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                                Number(data.id_punto) === Number(p.id_punto)
                                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                                            }`}
                                        >
                                            {p.nombre_punto}
                                        </button>
                                    ))}
                            </div>
                        </div>
                    </div>

                    {/* Input Card */}
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                        <div>
                            <label className="block text-sm font-black text-slate-900 mb-1.5">
                                Nombre y Apellidos del Estudiante <span className="text-rose-500">*</span>
                            </label>
                            <p className="text-xs text-slate-500 mb-3">
                                Si el estudiante ya ha asistido, el sistema sugerirá su ficha automáticamente. Si es nuevo, solo escriba su nombre.
                            </p>

                            <div className="relative">
                                <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={studentSearch}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setStudentSearch(val);
                                        setSelectedStudent(null);
                                        setData((prev) => ({
                                            ...prev,
                                            id_form_pvd: null,
                                            documento: '',
                                            nombre_completo: val,
                                            nombres: val,
                                            apellidos: '',
                                        }));
                                    }}
                                    placeholder="Ej: Juan David Gómez Parra"
                                    className="w-full pl-11 pr-10 py-3.5 rounded-2xl border-2 border-slate-200 text-sm font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                                    required
                                    autoFocus
                                />
                                {searchingStudents && (
                                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>

                            {/* Suggestions Dropdown */}
                            {studentSuggestions.length > 0 && (
                                <div className="mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
                                    <div className="p-2.5 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                                        <span>Estudiantes registrados en este corregimiento:</span>
                                        <span className="text-[10px] text-emerald-600 font-bold">Haga clic para seleccionar</span>
                                    </div>
                                    {studentSuggestions.map((s) => (
                                        <button
                                            key={s.id_form_pvd}
                                            type="button"
                                            onClick={() => selectStudent(s)}
                                            className="w-full px-4 py-3 text-left hover:bg-emerald-50/60 transition-colors flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                                                    {s.nombres.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-black text-slate-900 group-hover:text-emerald-700">
                                                        {s.nombres} {s.apellidos}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">
                                                        Código: <span className="font-mono font-semibold text-slate-600">{s.documento}</span> • {s.barrio}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-emerald-600 bg-emerald-100/50 px-2.5 py-1 rounded-lg">
                                                Seleccionar
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Status Badge */}
                            {selectedStudent ? (
                                <div className="mt-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>Estudiante recurrente enlazado ({selectedStudent.documento})</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={clearStudentSelection}
                                        className="text-xs text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>Cambiar</span>
                                    </button>
                                </div>
                            ) : studentSearch.trim().length >= 3 && (
                                <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                                    <span>Se creará automáticamente como <strong>nuevo estudiante escolar</strong> con código correlativo.</span>
                                </div>
                            )}
                        </div>

                        {/* Actividad en el Computador */}
                        <div>
                            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                                Actividad en el Computador
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {[
                                    'Acceso libre a computador y tareas escolares',
                                    'Investigación y consultas en Internet',
                                    'Clases de informática y mecanografía',
                                    'Lúdica educativa y talleres digitales',
                                ].map((act) => (
                                    <button
                                        key={act}
                                        type="button"
                                        onClick={() => {
                                            setSelectedActivity(act);
                                            setData('servicio_texto', act);
                                        }}
                                        className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 ${
                                            selectedActivity === act
                                                ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 shadow-sm'
                                                : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                        }`}
                                    >
                                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                            selectedActivity === act ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                                        }`}>
                                            {selectedActivity === act && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>
                                        <span className="leading-tight">{act}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Duración */}
                        <div>
                            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                                Tiempo de Uso Asignado
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {[30, 60, 90, 120].map((mins) => (
                                    <button
                                        key={mins}
                                        type="button"
                                        onClick={() => {
                                            setSelectedTime(mins);
                                            setData('duracion_minutos', mins);
                                        }}
                                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                            selectedTime === mins
                                                ? 'bg-slate-900 text-white shadow-md'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {mins} minutos {mins === 60 && '⭐ (Estándar)'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={processing || (!selectedStudent && !studentSearch.trim())}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-sm font-black shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <Zap className="w-5 h-5 text-amber-300" />
                                <span>{processing ? 'Registrando...' : '⚡ Registrar Ingreso al Computador'}</span>
                            </button>
                        </div>
                    </div>
                </form>
            ) : (
                /* ========================================================= */
                /* MODO GENERAL PVD (FORMULARIO ESTÁNDAR PARA ADULTOS)      */
                /* ========================================================= */
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
                    {/* Step 1: Citizen Identification & Verification */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-alcaldia-green text-white flex items-center justify-center font-black text-xs">
                                    1
                                </div>
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Identificación del Ciudadano</h2>
                            </div>
                            {citizenFound && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-alcaldia-green border border-emerald-200">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Ciudadano Identificado
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 items-end">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Número de Documento (Cédula / Tarjeta de Identidad) <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Ingrese número de documento y presione Verificar..."
                                        value={documentInput}
                                        onChange={(e) => setDocumentInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                verifyCitizen(documentInput);
                                            }
                                        }}
                                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold font-mono focus:border-alcaldia-green focus:ring-1 focus:ring-alcaldia-green outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => verifyCitizen(documentInput)}
                                disabled={searching || !documentInput}
                                className="px-5 py-2.5 rounded-xl bg-alcaldia-green hover:bg-alcaldia-green-dark text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 shrink-0"
                            >
                                {searching ? (
                                    <span>Verificando...</span>
                                ) : (
                                    <>
                                        <UserCheck className="w-4 h-4" />
                                        <span>Verificar Cédula</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Citizen Profile Card if Found */}
                        {citizenFound && (
                            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-alcaldia-green text-white font-bold text-sm flex items-center justify-center shrink-0">
                                        {citizenFound.nombres.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900">{citizenFound.nombre_completo}</h3>
                                        <div className="text-xs text-slate-500 flex flex-wrap gap-2 mt-0.5">
                                            <span>Edad: <strong>{citizenFound.edad || 'N/A'} años</strong></span>
                                            <span>•</span>
                                            <span>Barrio: <strong>{citizenFound.barrio || 'N/A'}</strong></span>
                                            <span>•</span>
                                            <span>Nivel: <strong>{citizenFound.nivel_educativo || 'N/A'}</strong></span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-slate-400 uppercase font-bold">Historial en el PVD</div>
                                    <div className="text-xs font-black text-alcaldia-green">{citizenFound.total_visitas || 0} visitas previas</div>
                                </div>
                            </div>
                        )}

                        {/* Quick Register Citizen Form if not found */}
                        {!citizenFound && documentInput.length >= 3 && !searching && (
                            <div className="mt-4 p-4 rounded-xl bg-amber-50/60 border border-amber-200">
                                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 mb-3">
                                    <UserPlus className="w-4 h-4 text-amber-600" />
                                    <span>Ciudadano no empadronado. Complete nombres para auto-creación atómica:</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Nombres *</label>
                                        <input
                                            type="text"
                                            value={data.nombres}
                                            onChange={(e) => setData('nombres', e.target.value)}
                                            placeholder="Nombres del ciudadano"
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:border-alcaldia-green outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Apellidos *</label>
                                        <input
                                            type="text"
                                            value={data.apellidos}
                                            onChange={(e) => setData('apellidos', e.target.value)}
                                            placeholder="Apellidos del ciudadano"
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:border-alcaldia-green outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Step 2: Service Categorization */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-alcaldia-green text-white flex items-center justify-center font-black text-xs">
                                    2
                                </div>
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Categorización del Trámite / Servicio</h2>
                            </div>
                        </div>

                        {/* IA Suggestions if citizen has predictions */}
                        {predictions.length > 0 && (
                            <div className="mb-5 p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 border border-emerald-200">
                                <div className="flex items-center gap-2 text-xs font-bold text-alcaldia-green mb-2">
                                    <Sparkles className="w-4 h-4 text-alcaldia-yellow" />
                                    <span>Sugerencias IA basadas en el historial del ciudadano:</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {predictions.map((pred, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleApplyPrediction(pred)}
                                            className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-xs font-bold text-slate-800 hover:bg-emerald-50 flex items-center gap-1.5 shadow-sm transition-all"
                                        >
                                            <span>{pred.categoria_nombre}</span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                                {pred.probabilidad}%
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Categoría de Servicio <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.id_categoria || ''}
                                    onChange={(e) => {
                                        const catId = Number(e.target.value);
                                        const cat = categories.find((c) => c.id_categoria === catId);
                                        setData((prev) => ({
                                            ...prev,
                                            id_categoria: catId,
                                            id_subcategoria: cat?.subcategorias?.[0]?.id_subcategoria || null,
                                        }));
                                    }}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:border-alcaldia-green outline-none"
                                >
                                    {categories.map((c) => (
                                        <option key={c.id_categoria} value={c.id_categoria}>
                                            {c.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Subcategoría / Trámite Específico
                                </label>
                                <select
                                    value={data.id_subcategoria || ''}
                                    onChange={(e) => setData('id_subcategoria', Number(e.target.value))}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green outline-none"
                                >
                                    <option value="">Seleccione subcategoría...</option>
                                    {currentCategory?.subcategorias?.map((s: any) => (
                                        <option key={s.id_subcategoria} value={s.id_subcategoria}>
                                            {s.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* NLP Assisted Description */}
                        <div className="mt-4">
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Descripción Libre u Observaciones de la Visita
                            </label>
                            <textarea
                                value={data.descripcion}
                                onChange={(e) => handleDescriptionChange(e.target.value)}
                                placeholder="Describa brevemente el motivo de la atención..."
                                rows={2}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green outline-none"
                            />
                        </div>
                    </div>

                    {/* Step 3: Location and Duration */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-alcaldia-green text-white flex items-center justify-center font-black text-xs">
                                    3
                                </div>
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Sede y Permanencia</h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Punto Vive Digital</label>
                                <select
                                    value={data.id_punto}
                                    onChange={(e) => setData('id_punto', Number(e.target.value))}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:border-alcaldia-green outline-none"
                                >
                                    {points.map((p) => (
                                        <option key={p.id_punto} value={p.id_punto}>
                                            {p.nombre_punto} ({p.zona})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Duración Estimada</label>
                                <div className="flex items-center gap-2">
                                    {[15, 30, 60, 120].map((mins) => (
                                        <button
                                            key={mins}
                                            type="button"
                                            onClick={() => setData('duracion_minutos', mins)}
                                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                                                data.duracion_minutos === mins
                                                    ? 'bg-alcaldia-green text-white border-alcaldia-green shadow-sm'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            {mins} min
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Bar */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <Link
                            href={route('visitas.index')}
                            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={processing || (!citizenFound && !data.nombres)}
                            className="px-6 py-2.5 rounded-xl bg-alcaldia-green hover:bg-alcaldia-green-dark text-white text-xs font-bold shadow-md shadow-alcaldia-green/20 transition-all flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            <span>{processing ? 'Registrando...' : 'Registrar Visita'}</span>
                        </button>
                    </div>
                </form>
            )}
        </AuthenticatedLayout>
    );
}
