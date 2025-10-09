import React from 'react';

const fallbackImage = '/images/autumn-photo-02.jpg';

const SidebarBanners = ({ banners }) => {
  const defaultBanners = [
    {
      src: '/images/autumn-photo-02.jpg',
      alt: 'Bufandas de cashmere en tonos tierra',
      href: '/otono/accesorios',
      button: 'Comprar bufandas',
    },
    {
      src: '/images/autumn-photo-04.jpg',
      alt: 'Canasta gourmet con productos de otono',
      href: '/otono/regalos',
      button: 'Armar canasta',
    },
    {
      src: '/images/autumn-photo-06.jpg',
      alt: 'Coleccion de velas aromaticas y citricos secos',
      href: '/otono/aromas',
      button: 'Elegir velas',
    },
    {
      src: '/images/autumn-photo-08.jpg',
      alt: 'Puesto de mercado con vegetales de temporada',
      href: '/otono/mercado',
      button: 'Comprar frescos',
    },
  ];

  const bannerList = banners?.length ? banners : defaultBanners;

  const handleImageError = (event) => {
    event.target.onerror = null;
    event.target.src = fallbackImage;
  };

  const isVideo = (src) => src.endsWith('.mp4') || src.includes('.mp4');

  return (
    <div className="flex w-full flex-col gap-4 lg:gap-8 lg:sticky lg:top-24">
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 lg:flex-col lg:snap-none lg:overflow-visible">
        {bannerList.map((banner, index) => (
          <a
            key={`${banner.src}-${index}`}
            href={banner.href}
            className="group relative block min-w-[260px] overflow-hidden rounded-3xl bg-slate-100 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl lg:min-w-0 lg:w-full"
          >
            {isVideo(banner.src) ? (
              <video
                src={banner.src}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                src={banner.src}
                alt={banner.alt}
                onError={handleImageError}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent transition-opacity duration-300 group-hover:from-slate-900/60" />
            <div className="absolute bottom-6 left-1/2 w-[80%] -translate-x-1/2 text-center">
              <span className="inline-flex items-center justify-center rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg transition-colors duration-200 group-hover:bg-amber-300">
                {banner.button}
              </span>
            </div>
          </a>
        ))}
      </div>

      <div className="hidden border-t border-slate-200 pt-4 text-xs text-slate-500 lg:block">
        Descubre promociones y lanzamientos seleccionados para ti.
      </div>
    </div>
  );
};

export default SidebarBanners;
