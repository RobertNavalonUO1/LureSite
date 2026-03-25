// resources/js/Pages/Admin/Logs.jsx
import React from 'react';

export default function Logs({ logs }) {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-6">Logs de la Aplicación</h1>
      <pre className="bg-white p-4 rounded shadow max-h-[600px] overflow-auto text-xs">
        {logs.join('\n')}
      </pre>
    </div>
  );
}
