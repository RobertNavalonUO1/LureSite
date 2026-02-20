import InputError from '@/Components/ui/InputError.jsx';
import PrimaryButton from '@/Components/ui/PrimaryButton.jsx';
import TextInput from '@/Components/ui/TextInput.jsx';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { sendResetEmail } from '@/utils/firebaseLogin';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setError(null);

        try {
            await sendResetEmail(email);
            setSuccess(true);
        } catch (err) {
            setError('No se pudo enviar el enlace de recuperación.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <GuestLayout>
            <Head title="Recuperar contraseña" />

            <div className="mb-4 text-sm text-gray-600">
                Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </div>

            {success && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    Enlace enviado correctamente. Revisa tu bandeja de entrada.
                </div>
            )}

            {error && <InputError message={error} className="mt-2" />}

            <form onSubmit={submit}>
                <TextInput
                    id="email"
                    type="email"
                    name="email"
                    value={email}
                    className="mt-1 block w-full"
                    isFocused={true}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <div className="mt-4 flex items-center justify-end">
                    <PrimaryButton className="ms-4" disabled={processing}>
                        Enviar enlace
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}