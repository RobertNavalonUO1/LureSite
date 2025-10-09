import React, { useState, useEffect, useRef } from 'react';

const SLIDES = [
  {
    image: '/images/autumn-photo-01.jpg',
    headline: 'Velas y decoracion artesanal',
    subheadline: 'Centros de mesa con velas de soja, calabazas y especias para iluminar tu casa.',
    cta: 'Comprar decoracion',
    href: '/otono/decoracion',
  },
  {
    image: '/images/autumn-photo-05.jpg',
    headline: 'Textiles suaves para dias frios',
    subheadline: 'Plaids de lana merina y cojines en tonos tierra listos para tu sofa.',
    cta: 'Elegir mantas',
    href: '/otono/textiles',
  },
  {
    image: '/images/autumn-photo-10.jpg',
    headline: 'Moda en capas para la temporada',
    subheadline: 'Botas, gabardinas y accesorios que combinan estilo y confort en otono.',
    cta: 'Ver atuendos',
    href: '/otono/moda',
  },
];

const TopBanner = ({ height = 'h-64' }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    startAutoSlide();
    return () => stopAutoSlide();
  }, []);

  const startAutoSlide = () => {
    stopAutoSlide();
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 8000);
  };

  const stopAutoSlide = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const goToSlide = (index) => {
    stopAutoSlide();
    setCurrentSlide(index);
    startAutoSlide();
  };

  const activeSlide = SLIDES[currentSlide];

  return (
    <div className={`relative w-full ${height} overflow-hidden rounded-2xl shadow-xl mb-6 group`}>
      <img
        src={activeSlide.image}
        alt={activeSlide.headline}
        className="w-full h-full object-cover transition duration-700 ease-in-out"
        draggable="false"
      />

      <div className="absolute inset-0 bg-gradient-to-tr from-black/65 via-black/35 to-transparent flex flex-col justify-center items-center text-white p-6 sm:p-10 text-center">
        <h2 className="text-2xl sm:text-4xl font-bold mb-3 drop-shadow-md tracking-tight uppercase">
          {activeSlide.headline}
        </h2>
        <p className="max-w-2xl text-sm sm:text-lg text-white/90 mb-6">
          {activeSlide.subheadline}
        </p>

        <a
          href={activeSlide.href}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-base font-semibold text-slate-900 shadow-md transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/70"
        >
          {activeSlide.cta}
          <span aria-hidden="true">→</span>
        </a>

        <div className="absolute bottom-4 flex gap-2 justify-center">
          {SLIDES.map((slide, index) => (
            <button
              key={slide.href}
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
