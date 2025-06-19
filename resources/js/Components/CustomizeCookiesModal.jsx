import React from 'react';

const CustomizeCookiesModal = ({ isOpen, onClose, onSave }) => {
  const [settings, setSettings] = React.useState({
    analytics: false,
    marketing: false,
    funcionales: true,
  });

  const handleChange = (e) => {
    const { name, checked } = e.target;
    setSettings((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSave = () => {
    localStorage.setItem('cookieSettings', JSON.stringify(settings));
    onSave();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Personaliza tus cookies</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="funcionales" checked={settings.funcionales} disabled />
            <span>Cookies funcionales (siempre activas)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="analytics" checked={settings.analytics} onChange={handleChange} />
            <span>Cookies de analítica</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="marketing" checked={settings.marketing} onChange={handleChange} />
            <span>Cookies de marketing</span>
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
            Cancelar
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Guardar preferencias
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizeCookiesModal;
