import React, { useEffect, useState } from "react";
import { usePage, Head } from "@inertiajs/react";
import Header from "@/Components/Header";
import TopNavMenu from "@/Components/TopNavMenu";
import SidebarBanners from "@/Components/SidebarBanners";

// Card visual para oferta del día, con colores propios
function DealCard({ offer }) {
    return (
        <div
            className="bg-gradient-to-br from-yellow-50 via-white to-orange-100 rounded-2xl shadow-md p-4 flex flex-col hover:shadow-xl transition group border border-orange-200 relative"
            style={{ width: 220, minHeight: 340, maxWidth: 220 }}
        >
            <div className="relative mb-3">
                <img
                    src={offer.image || "/images/logo.png"}
                    alt={offer.title}
                    className="h-32 w-full object-contain rounded-lg bg-orange-50"
                    style={{ minHeight: 128, maxHeight: 128 }}
                />
                {offer.old_price && (
                    <span className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded font-bold shadow">
                        -{Math.round(((offer.old_price - offer.price) / offer.old_price) * 100)}%
                    </span>
                )}
                <span className="absolute top-2 right-2 bg-orange-400 text-white text-xs px-2 py-1 rounded font-bold shadow">
                    ⭐ Oferta Hoy
                </span>
            </div>
            <h2 className="font-semibold text-base mb-1 group-hover:text-orange-700 transition line-clamp-2">{offer.title}</h2>
            <p className="text-gray-500 text-xs mb-2">{offer.category?.name}</p>
            <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-600 font-bold text-lg">
                    ${offer.price}
                </span>
                {offer.old_price && (
                    <span className="line-through text-gray-400 text-xs">
                        ${offer.old_price}
                    </span>
                )}
            </div>
            <div className="flex gap-2 mt-auto">
                <a
                    href={offer.link}
                    className="flex-1 bg-orange-500 text-white rounded-lg py-2 px-2 text-xs font-semibold transition-all duration-200 hover:bg-orange-600 text-center"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Comprar ahora
                </a>
            </div>
        </div>
    );
}

export default function DealsToday() {
    const { banners } = usePage().props;
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/deals-today")
            .then((res) => res.json())
            .then((data) => {
                setOffers(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-yellow-50 via-white to-orange-100 text-slate-800">
            <Head title="Ofertas Destacadas de Hoy" />
            <Header />
            <TopNavMenu />

            <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[5fr_2fr] gap-8">
                    {/* Contenido principal */}
                    <div>
                        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8 text-center border border-orange-200">
                            <h1 className="text-3xl md:text-4xl font-extrabold mb-4 flex items-center gap-2 justify-center text-orange-600 drop-shadow">
                                🔥 Ofertas Destacadas de Hoy
                            </h1>
                            <p className="mb-8 text-gray-700 text-lg">
                                Aprovecha nuestras ofertas exclusivas de hoy. <span className="text-orange-500 font-semibold">¡Los precios cambian a diario!</span>
                            </p>
                            {loading ? (
                                <div className="text-center py-12 text-gray-500">Cargando ofertas...</div>
                            ) : offers.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">No hay ofertas disponibles hoy.</div>
                            ) : (
                                <div className="flex flex-wrap justify-center gap-6">
                                    {offers.map((offer) => (
                                        <DealCard key={offer.id} offer={offer} />
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className="mt-8 text-center text-gray-500 text-sm">
                            ⚡ ¡Apresúrate! Estas ofertas cambian todos los días. Vuelve mañana para más sorpresas.
                        </p>
                    </div>
                    {/* Banners laterales, menos prominentes en móvil */}
                    <aside className="mt-4 lg:mt-0">
                        <div className="hidden lg:block">
                            <SidebarBanners banners={banners?.dealsToday || banners?.default || []} />
                        </div>
                        <div className="block lg:hidden mb-4">
                            {/* Banner solo visible en móvil/tablet, más pequeño */}
                            {banners?.dealsToday?.[0] && (
                                <img
                                    src={banners.dealsToday[0].src}
                                    alt={banners.dealsToday[0].alt || "Banner"}
                                    className="rounded-xl shadow-md w-full max-h-32 object-cover"
                                />
                            )}
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
