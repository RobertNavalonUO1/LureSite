import React from 'react';
import { usePage } from '@inertiajs/react';

export default function Notification() {
  const { flash } = usePage().props;
  if (!flash || (!flash.success && !flash.error)) return null;
  return (
    <div className="fixed top-4 right-4 z-50">
      {flash.success && (
        <div className="bg-green-600 text-white px-4 py-2 rounded shadow mb-2">{flash.success}</div>
      )}
      {flash.error && (
        <div className="bg-red-600 text-white px-4 py-2 rounded shadow">{flash.error}</div>
      )}
    </div>
  );
}
