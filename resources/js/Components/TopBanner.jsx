import React, { useState, useEffect, useRef } from 'react';

const slides = [
  {
    image: '/images/summer1.jpg',
    text: '¡Oferta exclusiva en trajes de baño!',
    coupon: 'VERANO10',
  },
  {
    image: '/images/summer2.png',
    text: '¡Accesorios de playa con descuento!',
    coupon: 'PLAYA15',
  },
  {
    image: '/images/summer3.png',
    text: '¡Todo para tus vacaciones con 20% OFF!',
    coupon: 'VACACIONES20',
  },
];

const TopBanner = ({ height = 'h-64' }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showCoupon, setShowCoupon] = useState('');
  const intervalRef = useRef(null);

  useEffect(() => {
    startAutoSlide();
    return () => stopAutoSlide();
  }, []);

  const startAutoSlide = () => {
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 10000);
  };

  const stopAutoSlide = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const goToSlide = (index) => {
    stopAutoSlide();
    setCurrentSlide(index);
    startAutoSlide();
  };

  const handleClick = (coupon) => {
    setShowCoupon(`Cupón aplicado: ${coupon}`);
    setTimeout(() => setShowCoupon(''), 3000);
  };

  return (
    <div className={`relative w-full ${height} overflow-hidden rounded-lg shadow-lg mb-6`}>
      <img
        src={slides[currentSlide].image}
        alt="Promoción de verano"
        className="w-full h-full object-cover transition duration-700"
      />
      <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center items-center text-white p-4">
        <h2 className="text-2xl font-bold mb-4 text-center">{slides[currentSlide].text}</h2>
        <button
          onClick={() => handleClick(slides[currentSlide].coupon)}
          className="bg-yellow-400 text-black px-6 py-2 rounded-full hover:bg-yellow-500 transition"
        >
          ¡Usar Cupón!
        </button>
        {showCoupon && (
          <div className="mt-4 bg-white text-green-700 px-4 py-2 rounded shadow">
            {showCoupon}
          </div>
        )}

        {/* Botones de navegación */}
        <div className="absolute bottom-4 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-6 h-2 rounded-full transition ${
                index === currentSlide ? 'bg-white' : 'bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopBanner;
