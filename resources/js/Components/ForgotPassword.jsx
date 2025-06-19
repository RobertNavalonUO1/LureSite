import { useForm } from '@inertiajs/react';
import InputLabel from './InputLabel';
import TextInput from './TextInput';
import InputError from './InputError';

export default function ForgotPassword({ isOpen, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'), {
            onSuccess: () => {
                alert('Correo de recuperación enviado.');
                reset();
                onClose();
            },
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl">
                    &times;
                </button>
                <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">¿Olvidaste tu contraseña?</h2>
                <form onSubmit={submit}>
                    <div className="mb-4">
                        <InputLabel htmlFor="email" value="Correo electrónico" />
                        <TextInput
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="mt-1 block w-full"
                            required
                            autoFocus
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>
                    <div className="text-center mt-6">
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            disabled={processing}
                        >
                            Enviar correo
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
