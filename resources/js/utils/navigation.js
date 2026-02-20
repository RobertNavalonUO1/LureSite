import { router } from '@inertiajs/react';

/**
 * Navegación centralizada para evitar mezclar window.location con Inertia.
 */

export function goToDashboard() {
  router.visit('/dashboard');
}

export function goHome() {
  router.visit('/');
}

export function goToSearch(rawQuery) {
  const query = String(rawQuery ?? '').trim();
  if (!query) return;

  router.get(
    '/search',
    { query },
    {
      preserveScroll: true,
      preserveState: true,
      replace: true,
    }
  );
}

export function logout() {
  // Laravel normalmente responde con redirect; Inertia lo sigue.
  router.post('/logout');
}
