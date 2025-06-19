import React from "react";

export default function ShippingAddress({ selectedAddress, setSelectedAddress, openModal }) {
  return (
    <div className="p-4 border rounded-lg shadow-md">
      <h2 className="text-lg font-semibold">Dirección de Envío</h2>
      {selectedAddress ? (
        <p>
          {selectedAddress.street}, {selectedAddress.city} ({selectedAddress.zip_code})
        </p>
      ) : (
        <p>No has seleccionado una dirección.</p>
      )}
      <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded" onClick={openModal}>
        Seleccionar / Agregar dirección
      </button>
    </div>
  );
}
