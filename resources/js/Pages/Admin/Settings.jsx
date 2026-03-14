import React from 'react';
import { useForm } from '@inertiajs/react';

export default function Settings({ settings }) {
  const { data, setData, post, processing } = useForm({
    campaign: {
      mode: settings?.campaign?.mode || 'auto',
      manual_slug: settings?.campaign?.manual_slug || '',
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    post('/admin/settings/update');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-6">Configuración Global</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold mb-1">Modo de campaña</label>
          <select
            value={data.campaign.mode}
            onChange={(event) => setData('campaign', { ...data.campaign, mode: event.target.value })}
            className="border px-2 py-1 w-full"
          >
            <option value="auto">Auto</option>
            <option value="manual">Manual</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Slug manual de campaña</label>
          <input
            value={data.campaign.manual_slug}
            onChange={(event) => setData('campaign', { ...data.campaign, manual_slug: event.target.value })}
            className="border px-2 py-1 w-full"
            placeholder="campaña-manual"
          />
        </div>
        <button type="submit" disabled={processing} className="bg-blue-600 text-white px-4 py-2 rounded mt-4 disabled:opacity-60">
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
