import { useForm } from '@inertiajs/react';
import InputLabel from './InputLabel';
import TextInput from './TextInput';
import InputError from './InputError';

export default function RegistrarModal({ isOpen, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onSuccess: () => {
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

                <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">Crear Cuenta</h2>

                <form onSubmit={submit}>
                    <div className="mb-4">
                        <InputLabel htmlFor="name" value="Nombre completo" />
                        <TextInput
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="mt-1 block w-full"
                            required
                            autoFocus
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div className="mb-4">
                        <InputLabel htmlFor="email" value="Correo electrónico" />
                        <TextInput
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="mt-1 block w-full"
                            required
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    <div className="mb-4">
                        <InputLabel htmlFor="password" value="Contraseña" />
                        <TextInput
                            id="password"
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="mt-1 block w-full"
                            required
                        />
                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div className="mb-4">
                        <InputLabel htmlFor="password_confirmation" value="Confirmar contraseña" />
                        <TextInput
                            id="password_confirmation"
                            type="password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            className="mt-1 block w-full"
                            required
                        />
                        <InputError message={errors.password_confirmation} className="mt-2" />
                    </div>

                    <div className="mt-6 text-center">
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            disabled={processing}
                        >
                            Registrarse
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
