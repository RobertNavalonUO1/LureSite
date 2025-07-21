import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { registerWithEmail, loginWithGoogle, loginWithFacebook } from '@/utils/firebaseLogin';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const { props } = usePage();
    const serverError = props?.errors?.default || props?.flash?.error;

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const submitFirebaseToken = (idToken) => {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        if (!csrfToken) {
            alert('CSRF token no encontrado. Recarga la página.');
            return;
        }

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/auth/firebase';

        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = 'id_token';
        tokenInput.value = idToken;

        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = '_token';
        csrfInput.value = csrfToken;

        form.appendChild(tokenInput);
        form.appendChild(csrfInput);
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
            } else {
                idToken = await registerWithEmail(data.name, data.email, data.password);
            }

            submitFirebaseToken(idToken);
        } catch (err) {
            console.error(err);
            alert('Error al registrar con Firebase: ' + err.message);
        }
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            {serverError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {serverError}
                </div>
            )}

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="name" value="Name" />
                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="mt-1 block w-full"
                        autoComplete="name"
                        isFocused={true}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />
                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="email" value="Email" />
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Password" />
                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password_confirmation" value="Confirm Password" />
                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        required
                    />
                    <InputError message={errors.password_confirmation} className="mt-2" />
                </div>

                <div className="mt-4 flex items-center justify-end">
                    <Link href={route('login')} className="rounded-md text-sm text-gray-600 underline hover:text-gray-900">
                        Already registered?
                    </Link>

                    <PrimaryButton className="ms-4" disabled={processing}>
                        Register
                    </PrimaryButton>
                </div>
            </form>

            <div className="mt-6 space-y-2">
                <button
                    onClick={() => handleFirebaseRegister('google')}
                    className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 transition"
                >
                    Registrarse con Google
                </button>
                <button
                    onClick={() => handleFirebaseRegister('facebook')}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                >
                    Registrarse con Facebook
                </button>
            </div>
        </GuestLayout>
    );
}
