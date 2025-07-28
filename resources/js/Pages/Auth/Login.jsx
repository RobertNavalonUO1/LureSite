import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';

import Header from '@/Components/Header';
import Footer from '@/Components/Footer';

import { FcGoogle } from 'react-icons/fc';
import { FaFacebookF } from 'react-icons/fa';

import {
  loginWithGoogle,
  loginWithFacebook,
} from '@/utils/firebaseLogin';

export default function Login({ status, canResetPassword }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    email: '',
    password: '',
    remember: false,
  });

  const submit = (e) => {
    e.preventDefault();
    post(route('login'), {
      onFinish: () => reset('password'),
    });
  };

  const submitFirebaseToken = async (idToken) => {
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

  const handleFirebaseLogin = async (provider) => {
    try {
      let idToken;
      if (provider === 'google') {
        idToken = await loginWithGoogle();
      } else if (provider === 'facebook') {
        idToken = await loginWithFacebook();
      }

      await submitFirebaseToken(idToken);
    } catch (err) {
      console.error(err);
      alert('Error al iniciar sesión con Firebase: ' + err.message);
    }
  };

  return (
    <>
      <Head title="Iniciar Sesión" />

      <Header />

      <div className="bg-gradient-to-r from-blue-200 via-indigo-600 to-purple-200 py-2 text-center text-white">

      </div>

      <div className="max-w-md mx-auto mt-12 mb-20 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <h2 className="text-2xl font-bold text-center text-indigo-700 mb-6">Inicia sesión en tu cuenta</h2>

        {status && (
          <div className="mb-4 text-sm font-medium text-green-600 text-center">
            {status}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <InputLabel htmlFor="email" value="Correo electrónico" />
            <TextInput
              id="email"
              type="email"
              name="email"
              value={data.email}
              className="mt-1 block w-full"
              autoComplete="username"
              isFocused={true}
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
              autoComplete="current-password"
              onChange={(e) => setData('password', e.target.value)}
              required
            />
            <InputError message={errors.password} className="mt-2" />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center text-sm">
              <Checkbox
                name="remember"
                checked={data.remember}
                onChange={(e) => setData('remember', e.target.checked)}
              />
              <span className="ml-2 text-gray-600">Recordarme</span>
            </label>

            {canResetPassword && (
              <Link
                href={route('password.request')}
                className="text-sm text-indigo-600 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            )}
          </div>

          <PrimaryButton className="w-full bg-indigo-600 hover:bg-indigo-700 mt-4" disabled={processing}>
            Entrar
          </PrimaryButton>
        </form>

        {/* Separador */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-grow h-px bg-gray-300" />
          <span className="text-sm text-gray-500">o continúa con</span>
          <div className="flex-grow h-px bg-gray-300" />
        </div>

        {/* Botones sociales */}
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => handleFirebaseLogin('google')}
            className="flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold py-2 rounded-lg shadow-sm transition"
          >
            <FcGoogle size={20} />
            Google
          </button>

          <button
            onClick={() => handleFirebaseLogin('facebook')}
            className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg shadow transition"
          >
            <FaFacebookF size={18} />
            Facebook
          </button>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          ¿No tienes una cuenta?{' '}
          <Link href={route('register')} className="text-indigo-600 hover:underline">
            Regístrate
          </Link>
        </p>
      </div>

      <Footer />
    </>
  );
}
