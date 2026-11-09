import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Home,
    GraduationCap,
    Briefcase,
    ShieldAlert,
    HeartPulse,
    Save,
    CheckCircle2,
    Users,
} from 'lucide-react';

interface Props {
    mustVerifyEmail: boolean;
    status?: string;
    ciudadano?: any;
    esCiudadano?: boolean;
    className?: string;
}

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    ciudadano,
    esCiudadano = false,
    className = '',
}: Props) {
    const user = usePage().props.auth.user as any;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name || '',
            email: user.email || '',
            telefono: user.telefono || ciudadano?.telefono || '',
            direccion: ciudadano?.direccion || '',
            barrio: ciudadano?.barrio || '',
            zona: ciudadano?.zona || 'Urbana',
            estrato: ciudadano?.estrato || 1,
            nivel_educativo: ciudadano?.nivel_educativo || 'Bachillerato completo',
            ocupacion: ciudadano?.ocupacion || 'Empleado',
            g_poblacional: ciudadano?.g_poblacional || 'Ninguno',
            grupo_etnico: ciudadano?.grupo_etnico || 'Ninguno',
            t_aseguramiento: ciudadano?.t_aseguramiento || 'Subsidiado',
        });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    const docNumero = user.documento || ciudadano?.documento || 'No registrado';

    return (
        <section className={className}>
            <header className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <User className="w-5 h-5 text-emerald-600" />
                        <span>Información Personal y de Caracterización</span>
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 font-medium">
                        Mantén tus datos actualizados para agilizar tus solicitudes de salas y trámites en los PVD.
                    </p>
                </div>

                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs self-start sm:self-auto">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Documento:</span>
                    <span className="font-mono font-black text-slate-800">CC {docNumero}</span>
                </div>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-8">
                {/* Bloque 1: Datos Básicos y Contacto */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                            1
                        </span>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Datos Básicos y Canales de Contacto
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="name" value="Nombre Completo *" className="text-xs font-bold text-slate-700" />
                            <TextInput
                                id="name"
                                className="mt-1 block w-full text-xs rounded-xl"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                                isFocused
                                autoComplete="name"
                            />
                            <InputError className="mt-1 text-xs" message={errors.name} />
                        </div>

                        <div>
                            <InputLabel htmlFor="email" value="Correo Electrónico *" className="text-xs font-bold text-slate-700" />
                            <TextInput
                                id="email"
                                type="email"
                                className="mt-1 block w-full text-xs rounded-xl"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                autoComplete="username"
                            />
                            <InputError className="mt-1 text-xs" message={errors.email} />
                        </div>

                        <div>
                            <InputLabel htmlFor="telefono" value="Teléfono / Celular (WhatsApp)" className="text-xs font-bold text-slate-700" />
                            <TextInput
                                id="telefono"
                                type="text"
                                placeholder="Ej: 3213618632"
                                className="mt-1 block w-full text-xs rounded-xl"
                                value={data.telefono}
                                onChange={(e) => setData('telefono', e.target.value)}
                            />
                            <InputError className="mt-1 text-xs" message={errors.telefono} />
                        </div>

                        <div>
                            <InputLabel htmlFor="direccion" value="Dirección de Residencia" className="text-xs font-bold text-slate-700" />
                            <TextInput
                                id="direccion"
                                type="text"
                                placeholder="Ej: Calle 15 # 20-30"
                                className="mt-1 block w-full text-xs rounded-xl"
                                value={data.direccion}
                                onChange={(e) => setData('direccion', e.target.value)}
                            />
                            <InputError className="mt-1 text-xs" message={errors.direccion} />
                        </div>
                    </div>
                </div>

                {/* Bloque 2: Ubicación y Residencia */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                            2
                        </span>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Ubicación Territorial y Estrato
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Zona</label>
                            <select
                                value={data.zona}
                                onChange={(e) => setData('zona', e.target.value)}
                                className="w-full text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none p-2.5 font-medium"
                            >
                                <option value="Urbana">Urbana</option>
                                <option value="Rural">Rural</option>
                            </select>
                            <InputError className="mt-1 text-xs" message={errors.zona} />
                        </div>

                        <div>
                            <InputLabel htmlFor="barrio" value="Barrio o Vereda" className="text-xs font-bold text-slate-700" />
                            <TextInput
                                id="barrio"
                                type="text"
                                placeholder="Ej: Centro, Dinamarca, Chichimene..."
                                className="mt-1 block w-full text-xs rounded-xl"
                                value={data.barrio}
                                onChange={(e) => setData('barrio', e.target.value)}
                            />
                            <InputError className="mt-1 text-xs" message={errors.barrio} />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Estrato Socioeconómico</label>
                            <select
                                value={data.estrato}
                                onChange={(e) => setData('estrato', parseInt(e.target.value))}
                                className="w-full text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none p-2.5 font-medium"
                            >
                                {[1, 2, 3, 4, 5, 6].map((num) => (
                                    <option key={num} value={num}>
                                        Estrato {num}
                                    </option>
                                ))}
                            </select>
                            <InputError className="mt-1 text-xs" message={errors.estrato} />
                        </div>
                    </div>
                </div>

                {/* Bloque 3: Caracterización y Enfoque Diferencial */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                            3
                        </span>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Caracterización Social, Educativa y Enfoque Diferencial
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Grupo Poblacional / Enfoque
                            </label>
                            <select
                                value={data.g_poblacional}
                                onChange={(e) => setData('g_poblacional', e.target.value)}
                                className="w-full text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none p-2.5 font-medium"
                            >
                                <option value="Ninguno">Ninguno</option>
                                <option value="Víctima del Conflicto">Víctima del Conflicto</option>
                                <option value="Persona con Discapacidad">Persona con Discapacidad</option>
                                <option value="Madre Cabeza de Hogar">Madre Cabeza de Hogar</option>
                                <option value="Adulto Mayor">Adulto Mayor</option>
                                <option value="Jóvenes">Jóvenes</option>
                            </select>
                            <InputError className="mt-1 text-xs" message={errors.g_poblacional} />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Nivel Educativo</label>
                            <select
                                value={data.nivel_educativo}
                                onChange={(e) => setData('nivel_educativo', e.target.value)}
                                className="w-full text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none p-2.5 font-medium"
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
                            <InputError className="mt-1 text-xs" message={errors.nivel_educativo} />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Ocupación Actual</label>
                            <select
                                value={data.ocupacion}
                                onChange={(e) => setData('ocupacion', e.target.value)}
                                className="w-full text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none p-2.5 font-medium"
                            >
                                <option value="Empleado">Empleado</option>
                                <option value="Independiente">Independiente</option>
                                <option value="Estudiante">Estudiante</option>
                                <option value="Ama de casa">Ama de casa</option>
                                <option value="Desempleado">Desempleado</option>
                                <option value="Jubilado / Pensionado">Jubilado / Pensionado</option>
                                <option value="Agricultor / Campo">Agricultor / Campo</option>
                            </select>
                            <InputError className="mt-1 text-xs" message={errors.ocupacion} />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Grupo Étnico</label>
                            <select
                                value={data.grupo_etnico}
                                onChange={(e) => setData('grupo_etnico', e.target.value)}
                                className="w-full text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none p-2.5 font-medium"
                            >
                                <option value="Ninguno">Ninguno</option>
                                <option value="Indígena">Indígena</option>
                                <option value="Afrodescendiente">Afrodescendiente</option>
                                <option value="Raizal">Raizal</option>
                                <option value="Palenquero">Palenquero</option>
                                <option value="ROM / Gitano">ROM / Gitano</option>
                            </select>
                            <InputError className="mt-1 text-xs" message={errors.grupo_etnico} />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Régimen de Salud</label>
                            <select
                                value={data.t_aseguramiento}
                                onChange={(e) => setData('t_aseguramiento', e.target.value)}
                                className="w-full text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none p-2.5 font-medium"
                            >
                                <option value="Subsidiado">Subsidiado (SISBEN)</option>
                                <option value="Contributivo">Contributivo (EPS)</option>
                                <option value="Especial">Especial (Magisterio/Fuerzas)</option>
                                <option value="Ninguno">Sin Aseguramiento</option>
                            </select>
                            <InputError className="mt-1 text-xs" message={errors.t_aseguramiento} />
                        </div>
                    </div>
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                        <p>
                            Tu correo electrónico aún no ha sido verificado.{' '}
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="underline font-bold text-amber-950 hover:text-black"
                            >
                                Haz clic aquí para reenviar el enlace de verificación.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 font-bold text-emerald-700">
                                Se ha enviado un nuevo enlace de verificación a tu correo.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        <span>{processing ? 'Guardando...' : 'Guardar Información'}</span>
                    </button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Información actualizada exitosamente.</span>
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
