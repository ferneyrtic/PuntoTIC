import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef } from 'react';
import { KeyRound, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function UpdatePasswordForm({
    className = '',
}: {
    className?: string;
}) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <section className={className}>
            <header className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <KeyRound className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-800">
                        Actualizar Contraseña
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                        Asegúrate de que tu cuenta utilice una contraseña segura para proteger tu información.
                    </p>
                </div>
            </header>

            <form onSubmit={updatePassword} className="mt-6 space-y-5">
                <div>
                    <InputLabel
                        htmlFor="current_password"
                        value="Contraseña Actual"
                        className="text-xs font-bold text-slate-700 uppercase tracking-wider"
                    />

                    <TextInput
                        id="current_password"
                        ref={currentPasswordInput}
                        value={data.current_password}
                        onChange={(e) =>
                            setData('current_password', e.target.value)
                        }
                        type="password"
                        className="mt-1.5 block w-full rounded-2xl border-slate-200 text-sm shadow-sm focus:border-amber-500 focus:ring-amber-500"
                        autoComplete="current-password"
                        placeholder="Ingresa tu contraseña actual"
                    />

                    <InputError
                        message={errors.current_password}
                        className="mt-2"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <InputLabel 
                            htmlFor="password" 
                            value="Nueva Contraseña" 
                            className="text-xs font-bold text-slate-700 uppercase tracking-wider"
                        />

                        <TextInput
                            id="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            type="password"
                            className="mt-1.5 block w-full rounded-2xl border-slate-200 text-sm shadow-sm focus:border-amber-500 focus:ring-amber-500"
                            autoComplete="new-password"
                            placeholder="Mínimo 8 caracteres"
                        />

                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="password_confirmation"
                            value="Confirmar Nueva Contraseña"
                            className="text-xs font-bold text-slate-700 uppercase tracking-wider"
                        />

                        <TextInput
                            id="password_confirmation"
                            value={data.password_confirmation}
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                            type="password"
                            className="mt-1.5 block w-full rounded-2xl border-slate-200 text-sm shadow-sm focus:border-amber-500 focus:ring-amber-500"
                            autoComplete="new-password"
                            placeholder="Repite la nueva contraseña"
                        />

                        <InputError
                            message={errors.password_confirmation}
                            className="mt-2"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4 pt-3">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-2xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50"
                    >
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        {processing ? 'Guardando...' : 'Guardar Nueva Contraseña'}
                    </button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out duration-300"
                        enterFrom="opacity-0 translate-y-1"
                        leave="transition ease-in-out duration-300"
                        leaveTo="opacity-0 -translate-y-1"
                    >
                        <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/60">
                            <CheckCircle2 className="w-4 h-4" />
                            ¡Contraseña guardada correctamente!
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
