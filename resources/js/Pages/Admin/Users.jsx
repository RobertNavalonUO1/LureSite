import React from 'react';
import { router, usePage } from '@inertiajs/react';
import Notification from './Notification';

export default function Users({ users }) {
  const currentUserId = usePage().props?.auth?.user?.id;
  const adminCount = users.filter((user) => user.is_admin).length;

  const handleToggleAdmin = (user) => {
    const action = user.is_admin ? 'retirar' : 'conceder';
    if (!window.confirm(`¿Seguro que quieres ${action} permisos de administrador a ${user.name}?`)) {
      return;
    }

    router.patch(`/admin/users/${user.id}/toggle-admin`, {}, { preserveScroll: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Notification />
      <h1 className="text-2xl font-bold mb-6">Gestión de Usuarios</h1>
      <p className="mb-6 max-w-3xl text-sm text-slate-600">
        Desde aquí puedes conceder o retirar privilegios administrativos. El sistema bloquea la auto-democión y evita dejar la plataforma sin ningún administrador activo.
      </p>
      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Admin</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className="border-b">
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${user.is_admin ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {user.is_admin ? 'Administrador' : 'Usuario'}
                </span>
                {currentUserId === user.id && (
                  <span className="ml-2 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                    Tu cuenta
                  </span>
                )}
                {user.is_admin && adminCount === 1 && (
                  <span className="ml-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    Último admin
                  </span>
                )}
              </td>
              <td>
                <button
                  type="button"
                  onClick={() => handleToggleAdmin(user)}
                  disabled={(currentUserId === user.id && user.is_admin) || (user.is_admin && adminCount === 1)}
                  className="bg-indigo-500 text-white px-3 py-1 rounded disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {user.is_admin ? 'Quitar Admin' : 'Hacer Admin'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
