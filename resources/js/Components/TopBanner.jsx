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
    }, 8000);
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
    setShowCoupon(`🎉 ¡Cupón "${coupon}" aplicado correctamente!`);
    setTimeout(() => setShowCoupon(''), 3000);
  };

  return (
    <div className={`relative w-full ${height} overflow-hidden rounded-2xl shadow-xl mb-6 group`}>
      <img
        src={slides[currentSlide].image}
        alt={`Slide ${currentSlide + 1}`}
        className="w-full h-full object-cover transition duration-700 ease-in-out"
        draggable="false"
      />

      <div className="absolute inset-0 bg-gradient-to-tr from-black/60 to-black/30 flex flex-col justify-center items-center text-white p-6 sm:p-10 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 drop-shadow-md">
          {slides[currentSlide].text}
        </h2>

        <button
          onClick={() => handleClick(slides[currentSlide].coupon)}
          aria-label="Usar cupón"
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-2 sm:py-3 rounded-full shadow-md transition focus:outline-none focus:ring-2 focus:ring-yellow-500"
        >
          ¡Usar Cupón!
        </button>

        {showCoupon && (
          <div className="mt-4 bg-white text-green-700 px-4 py-2 rounded shadow-lg text-sm font-medium">
            {showCoupon}
          </div>
        )}

        {/* Indicadores de navegación */}
        <div className="absolute bottom-4 flex gap-2 justify-center">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition duration-300 ${
                index === currentSlide
                  ? 'bg-white scale-110'
                  : 'bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Ir al slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopBanner;
