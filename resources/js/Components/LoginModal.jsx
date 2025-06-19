import { useForm } from '@inertiajs/react';
import InputLabel from './InputLabel';
import TextInput from './TextInput';
import InputError from './InputError';
import Checkbox from './Checkbox';

export default function LoginModal({ isOpen, onClose, onRegister, onForgot }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => {
                reset('password');
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
                <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">Iniciar Sesión</h2>

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

                    <div className="mb-4 flex items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                        />
                        <span className="ml-2 text-sm text-gray-600">Recordarme</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={onForgot}
                            className="text-sm text-blue-500 hover:underline"
                        >
                            ¿Olvidaste tu contraseña?
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            disabled={processing}
                        >
                            Entrar
                        </button>
                    </div>

                    <div className="mt-6 text-center text-sm text-gray-600">
                        ¿No tienes una cuenta?{' '}
                        <button onClick={onRegister} className="text-blue-500 hover:underline">
                            Regístrate
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
