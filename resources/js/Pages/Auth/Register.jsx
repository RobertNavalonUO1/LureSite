import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';

import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebookF } from 'react-icons/fa';

import {
  registerWithEmail,
  loginWithGoogle,
  loginWithFacebook,
} from '@/utils/firebaseLogin';
import TermsModal from '@/Components/TermsModal';

export default function Register() {
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  const { props } = usePage();
  const serverError = props?.errors?.default || props?.flash?.error;

  const [showTerms, setShowTerms] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    post(route('register'), {
      onFinish: () => reset('password', 'password_confirmation'),
    });
  };

  const submitFirebaseToken = (idToken) => {
    const csrfToken = document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute('content');

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
    <>
      <Head title="Registro" />
      <Header />
      <div className="bg-gradient-to-r from-blue-200 via-indigo-600 to-purple-200 py-2 text-center text-white">
        <h1 className="text-4xl font-bold"> </h1>
      </div>
      <div className="max-w-xl mx-auto my-12 bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-center text-indigo-700 mb-6">
          Crea tu cuenta
        </h2>
        {serverError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {serverError}
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <InputLabel htmlFor="name" value="Nombre completo" />
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
          <div>
            <InputLabel htmlFor="email" value="Correo electrónico" />
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
          <div>
            <InputLabel htmlFor="password" value="Contraseña" />
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
          <div>
            <InputLabel htmlFor="password_confirmation" value="Confirmar contraseña" />
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
          <div className="flex items-center justify-between mt-6">
            <Link
              href={route('login')}
              className="text-sm text-indigo-600 hover:underline"
            >
              ¿Ya tienes una cuenta?
            </Link>
            <PrimaryButton className="ml-4" disabled={processing}>
              Registrarse
            </PrimaryButton>
          </div>
        </form>
        <div className="flex items-center gap-4 my-6">
          <div className="flex-grow h-px bg-gray-300" />
          <span className="text-sm text-gray-500">o regístrate con</span>
          <div className="flex-grow h-px bg-gray-300" />
        </div>
        <div className="grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={() => handleFirebaseRegister('google')}
            className="flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold py-2 rounded-lg shadow-sm transition"
          >
            <FcGoogle size={20} />
            Google
          </button>
          <button
            type="button"
            onClick={() => handleFirebaseRegister('facebook')}
            className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg shadow transition"
          >
            <FaFacebookF size={18} />
            Facebook
          </button>
        </div>
        <div className="mt-6 text-center text-sm text-gray-500">
          Al registrarte, aceptas nuestros{' '}
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setShowTerms(true);
            }}
            className="text-indigo-600 hover:underline"
          >
            Términos de servicio
          </Link>{' '}
          y{' '}
          <Link href="/privacy" className="text-indigo-600 hover:underline">
            Política de privacidad
          </Link>.
        </div>
        <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
      </div>
      <Footer />
    </>
  );
}
