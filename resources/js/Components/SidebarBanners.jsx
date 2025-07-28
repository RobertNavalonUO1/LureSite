import React from 'react';

const fallbackImage = '/images/banner1.webp';

const SidebarBanners = ({ banners }) => {
  const defaultBanners = [
    { src: '/images/banner1.webp', alt: 'Promoción 1', href: '/promocion/1', button: 'Ver oferta' },
    { src: '/videos/banner2.mp4', alt: 'Promoción 2', href: '/promocion/2', button: 'Ver más' }, // ejemplo mp4
    { src: '/images/banner3.webp', alt: 'Promoción 3', href: '/promocion/3', button: 'Descubrir' },
    { src: '/images/banner4.webp', alt: 'Promoción 3', href: '/promocion/3', button: 'Descubrir' },
  ];

  const bannerList = banners?.length ? banners : defaultBanners;

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = fallbackImage;
  };

  const isVideo = (src) => src.endsWith('.mp4') || src.includes('.mp4');

  return (
    <aside className="hidden lg:flex flex-col gap-10 w-[420px] p-4 self-start top-24">
      {bannerList.map((banner, idx) => (
        <a
          key={idx}
          href={banner.href}
          className="relative block overflow-hidden rounded-3xl shadow-xl transition-transform hover:scale-105 hover:shadow-2xl"
        >
          {isVideo(banner.src) ? (
            <video
              src={banner.src}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-[480px] object-cover rounded-3xl"
            />
          ) : (
            <img
              src={banner.src}
              alt={banner.alt}
              onError={handleImageError}
              className="w-full h-[480px] object-cover rounded-3xl"
            />
          )}
          <div className="absolute inset-0 bg-black/30 rounded-3xl" />
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-2 rounded-full shadow-lg transition">
              {banner.button}
            </button>
          </div>
        </a>
      ))}
    </aside>
  );
};

export default SidebarBanners;
