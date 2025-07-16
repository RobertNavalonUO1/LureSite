import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head } from '@inertiajs/react';
import { auth } from '@/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { useState } from 'react';

export default function VerifyEmail() {
    const [status, setStatus] = useState(null);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    const resend = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setError(null);

        try {
            if (auth.currentUser) {
                await sendEmailVerification(auth.currentUser);
                setStatus('verification-link-sent');
            } else {
                setError('No hay usuario autenticado.');
            }
        } catch (err) {
            setError('No se pudo enviar el correo de verificación.');
        } finally {
            setProcessing(false);
        }
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

            {error && (
                <div className="mb-4 text-sm font-medium text-red-600">
                    {error}
                </div>
            )}

            <form onSubmit={resend}>
                <div className="mt-4 flex items-center justify-between">
                    <PrimaryButton disabled={processing}>
                        Reenviar correo de verificación
                    </PrimaryButton>
                    <button
                        type="button"
                        onClick={() => auth.signOut().then(() => window.location.href = '/login')}
                        className="text-sm text-gray-600 underline hover:text-gray-900"
                    >
                        Cerrar sesión
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
