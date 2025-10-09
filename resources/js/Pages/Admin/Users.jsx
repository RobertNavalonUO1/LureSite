import React from 'react';

export default function Users({ users }) {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-6">Gestión de Usuarios</h1>
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
              <td>{user.is_admin ? 'Sí' : 'No'}</td>
              <td>
                <form method="POST" action={`/admin/users/${user.id}/toggle-admin`}>
                  <button type="submit" className="bg-indigo-500 text-white px-3 py-1 rounded">
                    {user.is_admin ? 'Quitar Admin' : 'Hacer Admin'}
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}