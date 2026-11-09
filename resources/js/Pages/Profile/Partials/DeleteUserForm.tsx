import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

export default function DeleteUserForm({
    className = '',
}: {
    className?: string;
}) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                    <Trash2 className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-800">
                        Eliminar Cuenta
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                        Una vez eliminada la cuenta, todos sus recursos y datos asociados se eliminarán de forma permanente.
                    </p>
                </div>
            </header>

            <DangerButton onClick={confirmUserDeletion} className="rounded-2xl">
                Eliminar Cuenta Definitivamente
            </DangerButton>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">
                            ¿Estás seguro de que deseas eliminar tu cuenta?
                        </h2>
                    </div>

                    <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                        Esta acción es irreversible. Se eliminarán de forma permanente todos tus datos. Por favor, ingresa tu contraseña para confirmar la eliminación.
                    </p>

                    <div className="mt-5">
                        <InputLabel
                            htmlFor="password"
                            value="Contraseña"
                            className="sr-only"
                        />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            className="mt-1 block w-full rounded-2xl border-slate-200 text-sm focus:border-rose-500 focus:ring-rose-500"
                            isFocused
                            placeholder="Ingresa tu contraseña para confirmar"
                        />

                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={closeModal} className="rounded-2xl">
                            Cancelar
                        </SecondaryButton>

                        <DangerButton className="rounded-2xl" disabled={processing}>
                            {processing ? 'Eliminando...' : 'Sí, Eliminar Cuenta'}
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
