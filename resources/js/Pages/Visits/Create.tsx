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
    UserPlus,
    Building2,
    GraduationCap,
    Laptop,
    User,
    Zap,
    RotateCcw,
    MapPin,
    AlertCircle,
    Database,
} from 'lucide-react';
import axios from 'axios';
import { addToOfflineQueue } from '@/services/pwaService';

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
    const canAulaDigital =
        typeof puedeAulaDigital === 'boolean'
            ? puedeAulaDigital
            : (user?.puede_acceder_aula_digital ?? false);

    const canPvdGeneral =
        typeof puedePvdGeneral === 'boolean'
            ? puedePvdGeneral
            : (user?.puede_acceder_pvd_general ?? true);

    const initialMode: 'aula' | 'pvd' = !canAulaDigital
        ? 'pvd'
        : !canPvdGeneral
        ? 'aula'
        : user?.es_aula_digital || [3, 4].includes(Number(userPointId))
        ? 'aula'
        : 'pvd';

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
    const [selectedActivity, setSelectedActivity] = useState(
        'Acceso libre a computador y tareas escolares'
    );
    const [selectedTime, setSelectedTime] = useState(60);
    const [offlineSavedNotice, setOfflineSavedNotice] = useState(false);

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
        id_subcategoria: categories[0]?.subcategorias?.[0]?.id_subcategoria || null,
        servicio_texto:
            initialMode === 'aula' ? 'Acceso libre a computador y tareas escolares' : '',
        descripcion: '',
        duracion_minutos: initialMode === 'aula' ? 60 : 30,
        campos_dinamicos: {} as Record<number, any>,
    });

    const currentCategory = categories.find(
        (c) => c.id_categoria === Number(data.id_categoria)
    );

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
                        id_subcategoria:
                            res.data.suggestion.subcategorias?.[0]?.id_subcategoria ||
                            prev.id_subcategoria,
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
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

        if (isOffline) {
            const visitorName =
                mode === 'aula'
                    ? selectedStudent?.nombre_completo || data.nombre_completo || 'Estudiante Aula Digital'
                    : citizenFound
                    ? `${citizenFound.primer_nombre} ${citizenFound.primer_apellido}`
                    : data.nombre_completo || data.documento || 'Ciudadano PVD';

            const serviceName =
                mode === 'aula'
                    ? data.servicio_texto || 'Acceso Aula Digital'
                    : currentCategory?.nombre_categoria || 'Servicio TIC';

            addToOfflineQueue('visita', data, `Visita: ${visitorName} — ${serviceName}`);
            setOfflineSavedNotice(true);
            setTimeout(() => setOfflineSavedNotice(false), 8000);

            // Preparar para la siguiente atención
            if (mode === 'aula') {
                setSelectedStudent(null);
                setStudentSearch('');
                setData((prev) => ({
                    ...prev,
                    id_form_pvd: null,
                    documento: '',
                    nombre_completo: '',
                }));
            } else {
                setCitizenFound(null);
                setDocumentInput('');
                reset();
            }
            return;
        }

        post(route('visitas.store'), {
            onError: () => {
                if (typeof navigator !== 'undefined' && !navigator.onLine) {
                    const visitorName =
                        citizenFound
                            ? `${citizenFound.primer_nombre} ${citizenFound.primer_apellido}`
                            : data.nombre_completo || data.documento || 'Ciudadano PVD';
                    addToOfflineQueue('visita', data, `Visita: ${visitorName}`);
                    setOfflineSavedNotice(true);
                    setTimeout(() => setOfflineSavedNotice(false), 8000);
                }
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('visitas.index')}
                            className="btn-tactile p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-soft-xs transition-colors"
                            title="Volver al historial"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                {mode === 'aula'
                                    ? 'Ingreso a Aula Digital (Estudiantes)'
                                    : 'Registrar Visita y Atención'}
                            </h1>
                            <p className="text-xs text-slate-500 font-medium">
                                {mode === 'aula'
                                    ? 'Atención ágil para niños y jóvenes de corregimientos sin requerir cédula'
                                    : 'Atención presencial en salas PVD con asistencia inteligente'}
                            </p>
                        </div>
                    </div>

                    {/* Sede Indicator */}
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
                        <Building2 className="w-4 h-4 text-emerald-600" />
                        <span>
                            {points.find((p) => p.id_punto === Number(data.id_punto))
                                ?.nombre_punto || 'Sede'}
                        </span>
                    </div>
                </div>
            }
        >
            <Head
                title={
                    mode === 'aula'
                        ? 'Ingreso Aula Digital · PuntoTIC'
                        : 'Registrar Visita · PuntoTIC'
                }
            />

            {/* Mode Switcher Tabs */}
            {canAulaDigital && canPvdGeneral ? (
                <div className="flex bg-slate-200/70 p-1.5 rounded-2xl max-w-xl mx-auto mb-6 border border-slate-300/60 shadow-inner">
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
                        className={`btn-tactile flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                            mode === 'aula'
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-soft shadow-emerald-700/20'
                                : 'text-slate-600 hover:text-slate-900 font-bold'
                        }`}
                    >
                        <GraduationCap className="w-4 h-4" />
                        <span>Aula Digital (Niños / Rápido)</span>
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
                        className={`btn-tactile flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                            mode === 'pvd'
                                ? 'bg-slate-900 text-white shadow-soft'
                                : 'text-slate-600 hover:text-slate-900 font-bold'
                        }`}
                    >
                        <Building2 className="w-4 h-4" />
                        <span>Modo PVD (Adultos / Completo)</span>
                    </button>
                </div>
            ) : (
                <div className="max-w-xl mx-auto mb-6 flex justify-center">
                    {!canAulaDigital ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-soft-xs">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                            <Building2 className="w-4 h-4 text-blue-600" />
                            <span>Punto Vive Digital Acacías — Atención y Registro Integral</span>
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-950 border border-emerald-500/30 text-emerald-200 text-xs font-bold shadow-soft-xs">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                            <GraduationCap className="w-4 h-4 text-emerald-400" />
                            <span>Aula Digital Rural — Registro Rápido Escolar</span>
                        </div>
                    )}
                </div>
            )}

            {/* Aviso de Registro Guardado en Modo Fuera de Línea */}
            {offlineSavedNotice && (
                <div className="max-w-2xl mx-auto mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-3 shadow-sm animate-fade-in-down">
                    <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5">
                        <Database className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <div className="text-sm font-bold text-amber-900">
                            Registro Guardado Fuera de Línea
                        </div>
                        <p className="text-xs text-amber-800 mt-0.5">
                            La visita fue almacenada de forma segura en este dispositivo. Tan pronto regrese la conexión con el servidor, se sincronizará automáticamente en segundo plano.
                        </p>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODO AULA DIGITAL (ESTUDIANTES Y NIÑOS DE CORREGIMIENTOS) */}
            {/* ========================================================= */}
            {mode === 'aula' ? (
                <form
                    onSubmit={handleSubmit}
                    className="max-w-2xl mx-auto space-y-6 animate-fade-in-up"
                >
                    <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 p-6 sm:p-7 rounded-3xl text-white shadow-soft-xl border border-emerald-500/30 relative overflow-hidden">
                        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />

                        <div className="flex items-center gap-3.5 mb-2 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-inner">
                                <Laptop className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Corregimientos Acacías
                                </span>
                                <h2 className="text-xl font-black text-white tracking-tight">
                                    Ingreso Rápido al Computador
                                </h2>
                            </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed mt-2 relative z-10">
                            En las aulas rurales de <strong>Dinamarca y Chichimene</strong> no se exige cédula ni dirección a los niños.
                            Solo digite el <strong>nombre del estudiante</strong> para asignarle equipo.
                        </p>

                        {/* Sede selector */}
                        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
                            <label className="text-xs font-bold text-slate-300">
                                Sede del Aula Digital:
                            </label>
                            <div className="flex gap-2">
                                {points
                                    .filter((p) => p.es_aula_digital || [3, 4].includes(p.id_punto))
                                    .map((p) => (
                                        <button
                                            key={p.id_punto}
                                            type="button"
                                            onClick={() => setData('id_punto', p.id_punto)}
                                            className={`btn-tactile px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                                Number(data.id_punto) === Number(p.id_punto)
                                                    ? 'bg-emerald-500 text-white shadow-soft shadow-emerald-500/30'
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
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-soft space-y-6">
                        <div>
                            <label className="block text-sm font-black text-slate-900 mb-1.5">
                                Nombre y Apellidos del Estudiante <span className="text-rose-500">*</span>
                            </label>
                            <p className="text-xs text-slate-500 mb-3 font-medium">
                                Si el estudiante ya asistió antes, el sistema sugerirá su perfil. Si es nuevo, solo escriba su nombre.
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
                                <div className="mt-2 bg-white rounded-2xl border border-slate-200 shadow-soft-xl overflow-hidden divide-y divide-slate-100 animate-fade-in-down">
                                    <div className="p-2.5 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                                        <span>Estudiantes registrados:</span>
                                        <span className="text-[10px] text-emerald-600 font-bold">
                                            Clic para seleccionar
                                        </span>
                                    </div>
                                    {studentSuggestions.map((s) => (
                                        <button
                                            key={s.id_form_pvd}
                                            type="button"
                                            onClick={() => selectStudent(s)}
                                            className="w-full px-4 py-3 text-left hover:bg-emerald-50/70 transition-colors flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                                                    {s.nombres.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-black text-slate-900 group-hover:text-emerald-700">
                                                        {s.nombres} {s.apellidos}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-mono">
                                                        Código: {s.documento} • {s.barrio}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-xl">
                                                Seleccionar
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Status Badge */}
                            {selectedStudent ? (
                                <div className="mt-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between animate-fade-in">
                                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>Estudiante recurrente enlazado ({selectedStudent.documento})</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={clearStudentSelection}
                                        className="btn-tactile text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>Cambiar</span>
                                    </button>
                                </div>
                            ) : (
                                studentSearch.trim().length >= 3 && (
                                    <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2 animate-fade-in">
                                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                                        <span>
                                            Se creará automáticamente como <strong>nuevo estudiante</strong> en el aula.
                                        </span>
                                    </div>
                                )
                            )}
                        </div>

                        {/* Actividad en el Computador */}
                        <div>
                            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                                Actividad Asignada
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                                        className={`btn-tactile p-3 rounded-2xl border text-left text-xs font-bold transition-all flex items-center gap-2.5 ${
                                            selectedActivity === act
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-soft-xs'
                                                : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                                        }`}
                                    >
                                        <div
                                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                                selectedActivity === act
                                                    ? 'border-emerald-600 bg-emerald-600'
                                                    : 'border-slate-300'
                                            }`}
                                        >
                                            {selectedActivity === act && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                            )}
                                        </div>
                                        <span className="leading-tight">{act}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Duración */}
                        <div>
                            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                                Tiempo de Uso
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
                                        className={`btn-tactile px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                                            selectedTime === mins
                                                ? 'bg-slate-900 text-white shadow-soft'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {mins} min {mins === 60 && '(Recomendado)'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={processing || (!selectedStudent && !studentSearch.trim())}
                                className="btn-tactile w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-sm font-black shadow-soft hover:shadow-soft-lg hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Laptop className="w-5 h-5 text-white" />
                                <span>
                                    {processing ? 'Registrando...' : 'Registrar Ingreso al Computador'}
                                </span>
                            </button>
                        </div>
                    </div>
                </form>
            ) : (
                /* ========================================================= */
                /* MODO GENERAL PVD (FORMULARIO ESTÁNDAR PARA ADULTOS)      */
                /* ========================================================= */
                <form
                    onSubmit={handleSubmit}
                    className="max-w-4xl mx-auto space-y-6 animate-fade-in-up"
                >
                    {/* Step 1: Citizen Identification & Verification */}
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-soft">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-black text-xs shadow-soft-xs">
                                    1
                                </div>
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                    Identificación del Ciudadano
                                </h2>
                            </div>
                            {citizenFound && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Ciudadano Identificado
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 items-end">
                            <div className="flex-1 w-full">
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Número de Documento (Cédula / TI) <span className="text-rose-500">*</span>
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
                                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 text-xs font-bold font-mono focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => verifyCitizen(documentInput)}
                                disabled={searching || !documentInput}
                                className="btn-tactile w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-soft transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
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
                            <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-scale-in">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-soft-xs">
                                        {citizenFound.nombres?.charAt(0) || 'C'}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900">
                                            {citizenFound.nombre_completo}
                                        </h3>
                                        <div className="text-xs text-slate-500 flex flex-wrap gap-2 mt-0.5 font-medium">
                                            <span>
                                                Edad: <strong>{citizenFound.edad || 'N/A'} años</strong>
                                            </span>
                                            <span>•</span>
                                            <span>
                                                Barrio: <strong>{citizenFound.barrio || 'N/A'}</strong>
                                            </span>
                                            <span>•</span>
                                            <span>
                                                Nivel: <strong>{citizenFound.nivel_educativo || 'N/A'}</strong>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-left sm:text-right">
                                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                                        Historial de Atención
                                    </div>
                                    <div className="text-xs font-black text-emerald-700">
                                        {citizenFound.total_visitas || 0} visitas previas
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quick Register Citizen Form if not found */}
                        {!citizenFound && documentInput.length >= 3 && !searching && (
                            <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200 animate-scale-in">
                                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-3">
                                    <UserPlus className="w-4 h-4 text-amber-600" />
                                    <span>
                                        Ciudadano nuevo en la plataforma. Escriba nombres para registro automático:
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                            Nombres *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.nombres}
                                            onChange={(e) => setData('nombres', e.target.value)}
                                            placeholder="Nombres del ciudadano"
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-emerald-600 outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                            Apellidos *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.apellidos}
                                            onChange={(e) => setData('apellidos', e.target.value)}
                                            placeholder="Apellidos del ciudadano"
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-emerald-600 outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Step 2: Service Categorization */}
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-soft">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-black text-xs shadow-soft-xs">
                                    2
                                </div>
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                    Categorización del Trámite / Servicio
                                </h2>
                            </div>
                        </div>

                        {/* Frequent services if citizen has history */}
                        {predictions.length > 0 && (
                            <div className="mb-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 animate-scale-in">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
                                    <Clock className="w-4 h-4 text-emerald-600" />
                                    <span>Trámites habituales de este ciudadano:</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {predictions.map((pred, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleApplyPrediction(pred)}
                                            className="btn-tactile px-3.5 py-1.5 rounded-xl bg-white border border-emerald-300 text-xs font-bold text-slate-800 hover:bg-emerald-50 flex items-center gap-1.5 shadow-soft-xs transition-all"
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
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                                            id_subcategoria:
                                                cat?.subcategorias?.[0]?.id_subcategoria || null,
                                        }));
                                    }}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:border-emerald-600 outline-none"
                                >
                                    {categories.map((c) => (
                                        <option key={c.id_categoria} value={c.id_categoria}>
                                            {c.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Subcategoría / Trámite Específico
                                </label>
                                <select
                                    value={data.id_subcategoria || ''}
                                    onChange={(e) =>
                                        setData('id_subcategoria', Number(e.target.value))
                                    }
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-emerald-600 outline-none"
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
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                Descripción Libre u Observaciones de la Atención
                            </label>
                            <textarea
                                value={data.descripcion}
                                onChange={(e) => handleDescriptionChange(e.target.value)}
                                placeholder="Escriba el motivo de la atención ciudadana..."
                                rows={2}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-emerald-600 outline-none"
                            />
                        </div>
                    </div>

                    {/* Step 3: Location and Duration */}
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-soft">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-black text-xs shadow-soft-xs">
                                    3
                                </div>
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                    Sede y Tiempo de Permanencia
                                </h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Punto Vive Digital
                                </label>
                                <select
                                    value={data.id_punto}
                                    onChange={(e) => setData('id_punto', Number(e.target.value))}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:border-emerald-600 outline-none"
                                >
                                    {points.map((p) => (
                                        <option key={p.id_punto} value={p.id_punto}>
                                            {p.nombre_punto} ({p.zona})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Duración Estimada
                                </label>
                                <div className="flex items-center gap-2">
                                    {[15, 30, 60, 120].map((mins) => (
                                        <button
                                            key={mins}
                                            type="button"
                                            onClick={() => setData('duracion_minutos', mins)}
                                            className={`btn-tactile flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                                                data.duracion_minutos === mins
                                                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-transparent shadow-soft-xs'
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

                    {/* Submit Action Bar */}
                    <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-soft flex items-center justify-between gap-3">
                        <Link
                            href={route('visitas.index')}
                            className="btn-tactile px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={processing || (!citizenFound && !data.nombres)}
                            className="btn-tactile px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-soft hover:shadow-soft-lg hover:shadow-emerald-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
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
