import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({
    mustVerifyEmail,
    status,
    ciudadano,
    esCiudadano = false,
}: PageProps<{
    mustVerifyEmail: boolean;
    status?: string;
    ciudadano?: any;
    esCiudadano?: boolean;
}>) {
    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-xl font-black tracking-tight text-slate-900">
                        Mi Perfil
                    </h1>
                    <p className="text-xs text-slate-500 font-medium">
                        Actualiza tu información personal, datos de caracterización y seguridad de tu cuenta
                    </p>
                </div>
            }
        >
            <Head title="Mi Perfil" />

            <div className="py-8">
                <div className="mx-auto max-w-5xl space-y-6 sm:px-6 lg:px-8">
                    <div className="bg-white p-6 shadow-sm rounded-3xl border border-slate-200/90 sm:p-8">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            ciudadano={ciudadano}
                            esCiudadano={esCiudadano}
                        />
                    </div>

                    <div className="bg-white p-6 shadow-sm rounded-3xl border border-slate-200/90 sm:p-8">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    {!esCiudadano && (
                        <div className="bg-white p-6 shadow-sm rounded-3xl border border-slate-200/90 sm:p-8">
                            <DeleteUserForm className="max-w-xl" />
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
