import PrimaryButton from '@/Components/ui/PrimaryButton.jsx';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm, usePage } from '@inertiajs/react';

export default function VerifyEmail() {
    const { status } = usePage().props;
    const resendForm = useForm({});
    const logoutForm = useForm({});

    const resend = (e) => {
        e.preventDefault();
        resendForm.post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Verificar Correo" />

            <div className="mb-4 text-sm text-gray-600">
                Gracias por registrarte. Por favor, revisa tu correo electrónico y haz clic en el enlace de verificación.
                Si no lo recibiste, puedes solicitar otro.
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    Se envió un nuevo enlace de verificación a tu correo.
                </div>
            )}

            <form onSubmit={resend}>
                <div className="mt-4 flex items-center justify-between">
                    <PrimaryButton disabled={resendForm.processing}>
                        Reenviar correo de verificación
                    </PrimaryButton>
                    <button
                        type="button"
                        onClick={() => logoutForm.post(route('logout'))}
                        className="text-sm text-gray-600 underline hover:text-gray-900"
                    >
                        Cerrar sesión
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}