import React, { useState } from 'react';

export default function Settings({ settings }) {
  const [form, setForm] = useState(settings);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-6">Configuración Global</h1>
      <form method="POST" action="/admin/settings/update" className="space-y-4">
        <input type="hidden" name="_token" value={window.Laravel.csrfToken} />
        {Object.keys(form).map(key => (
          <div key={key}>
            <label className="block font-semibold mb-1">{key.replace('_', ' ')}</label>
            <input
              name={key}
              value={form[key] || ''}
              onChange={e => setForm({ ...form, [key]: e.target.value })}
              className="border px-2 py-1 w-full"
            />
          </div>
        ))}
        {/* Campo para añadir nueva configuración */}
        <div>
          <label className="block font-semibold mb-1">Nuevo campo</label>
          <input
            name="new_key"
            placeholder="Clave"
            className="border px-2 py-1 mr-2"
            onChange={e => setForm({ ...form, new_key: e.target.value })}
          />
          <input
            name="new_value"
            placeholder="Valor"
            className="border px-2 py-1"
            onChange={e => setForm({ ...form, new_value: e.target.value })}
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded mt-4">Guardar cambios</button>
      </form>
    </div>
  );
}