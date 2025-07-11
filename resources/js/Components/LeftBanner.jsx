import React from 'react';

const LeftBanner = () => {
  return (
    <div className="hidden lg:block w-60 p-4">
      <div className="bg-yellow-100 rounded-xl overflow-hidden shadow-md">
        <img
          src="/images/banner-left.jpg"
          alt="Oferta destacada"
          className="w-full h-40 object-cover"
        />
        <div className="p-3">
          <h3 className="font-bold text-lg mb-1 text-gray-800">¡Oferta del día!</h3>
          <p className="text-sm text-gray-600">Descuentos exclusivos por tiempo limitado.</p>
        </div>
      </div>
    </div>
  );
};

export default LeftBanner;
