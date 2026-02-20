import { useEffect, useRef } from 'react';
import { useForm } from '@inertiajs/react';
import InputLabel from '@/Components/ui/InputLabel';
import TextInput from '@/Components/ui/TextInput';
import InputError from '@/Components/ui/InputError';
import { registerWithEmail, loginWithGoogle, loginWithFacebook } from '@/utils/firebaseLogin';

export default function RegisterModal({ isOpen, onClose }) {
    const modalRef = useRef(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (modalRef.current && !modalRef.current.contains(e.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleOutsideClick);
        }

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [isOpen]);

    const submitFirebaseToken = async (idToken) => {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/auth/firebase';

        form.innerHTML = `
            <input type="hidden" name="id_token" value="${idToken}" />
            <input type="hidden" name="_token" value="${csrfToken}" />
        `;

        document.body.appendChild(form);
        form.submit();
    };

    const handleFirebaseRegister = async (provider) => {
        try {
            let idToken;

            if (provider === 'google') {
                idToken = await loginWithGoogle();
            } else if (provider === 'facebook') {
                idToken = await loginWithFacebook();
            } else if (provider === 'email') {
                idToken = await registerWithEmail(data.name, data.email, data.password);
            }

            await submitFirebaseToken(idToken);
        } catch (error) {
            console.error(error);
            alert('Error registering with Firebase: ' + error.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center px-4">
            <div
                ref={modalRef}
                className="relative bg-[#F8FAFC] rounded-3xl shadow-2xl w-full max-w-md p-8 border border-gray-200 animate-fade-in"
            >
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl transition"
                    aria-label="Cerrar"
                >
                    &times;
                </button>

                <h2 className="text-3xl font-extrabold text-center text-[#6C63FF] mb-6 tracking-tight">
                    Crear tu cuenta
                </h2>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleFirebaseRegister('email');
                    }}
                    className="space-y-4"
                >
                    <div>
                        <InputLabel htmlFor="name" value="Nombre completo" />
                        <TextInput
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="mt-1 block w-full rounded-xl border-gray-300 focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/30"
                            required
                            autoFocus
                        />
                        <InputError message={errors.name} className="mt-2 text-[#F87171]" />
                    </div>

                    <div>
                        <InputLabel htmlFor="email" value="Correo electrónico" />
                        <TextInput
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="mt-1 block w-full rounded-xl border-gray-300 focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/30"
                            required
                        />
                        <InputError message={errors.email} className="mt-2 text-[#F87171]" />
                    </div>

                    <div>
                        <InputLabel htmlFor="password" value="Contraseña" />
                        <TextInput
                            id="password"
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="mt-1 block w-full rounded-xl border-gray-300 focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/30"
                            required
                        />
                        <InputError message={errors.password} className="mt-2 text-[#F87171]" />
                    </div>

                    <div>
                        <InputLabel htmlFor="password_confirmation" value="Confirmar contraseña" />
                        <TextInput
                            id="password_confirmation"
                            type="password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            className="mt-1 block w-full rounded-xl border-gray-300 focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/30"
                            required
                        />
                        <InputError message={errors.password_confirmation} className="mt-2 text-[#F87171]" />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-[#6C63FF] hover:bg-[#5a51e0] text-white font-semibold py-2 rounded-xl shadow-md transition"
                        disabled={processing}
                    >
                        Registrarse
                    </button>
                </form>

                <div className="mt-6 space-y-3">
                    <button
                        onClick={() => handleFirebaseRegister('google')}
                        className="w-full bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 py-2 rounded-xl shadow-sm flex items-center justify-center gap-2 transition"
                    >
                        <img
                            src="/images/google-icon.svg"
                            alt="Google"
                            className="w-5 h-5"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                        Registrarse con Google
                    </button>

                    <button
                        onClick={() => handleFirebaseRegister('facebook')}
                        className="w-full bg-[#4267B2] hover:bg-[#37569c] text-white py-2 rounded-xl shadow-md flex items-center justify-center gap-2 transition"
                    >
                        <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                            <path d="M22 12.073C22 6.49 17.523 2 12 2S2 6.49 2 12.073C2 17.057 5.656 21.147 10.438 21.954v-6.212H7.898v-2.669h2.54v-2.034c0-2.506 1.493-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.463h-1.26c-1.243 0-1.63.771-1.63 1.562v1.704h2.773l-.443 2.669h-2.33V21.954C18.344 21.147 22 17.057 22 12.073z" />
                        </svg>
                        Registrarse con Facebook
                    </button>
                </div>
            </div>
        </div>
    );
}