import React, { useState } from "react";
import { usePage, Head } from "@inertiajs/react";
import Header from '@/Components/Header';
import TopNavMenu from '@/Components/TopNavMenu';
import SidebarBanners from '@/Components/SidebarBanners';

// Card visual mejorada para producto con tamaño fijo
function ProductCard({ product, onQuickView }) {
    return (
        <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col hover:shadow-xl transition group border border-blue-100 relative"
            style={{ width: 220, minHeight: 340, maxWidth: 220 }}>
            <div className="relative mb-3">
                <img
                    src={product.image_url || "/images/logo.png"}
                    alt={product.name}
                    className="h-32 w-full object-contain rounded-lg bg-gray-50"
                    style={{ minHeight: 128, maxHeight: 128 }}
                />
                <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded font-bold shadow">
                    🚚 Envío rápido
                </span>
                {product.discount > 0 && (
                    <span className="absolute top-2 right-2 bg-rose-500 text-white text-xs px-2 py-1 rounded font-bold shadow">
                        -{product.discount}%
                    </span>
                )}
            </div>
            <h2 className="font-semibold text-base mb-1 group-hover:text-blue-700 transition line-clamp-2">{product.name}</h2>
            <p className="text-gray-500 text-xs mb-2">{product.category?.name}</p>
            <div className="flex items-center gap-2 mb-2">
                <span className="text-green-600 font-bold text-lg">
                    {product.price} €
                </span>
                {product.discount > 0 && (
                    <span className="line-through text-gray-400 text-xs">
                        {(product.price * (1 - product.discount / 100)).toFixed(2)} €
                    </span>
                )}
            </div>
            <div className="flex gap-2 mt-auto">
                <button
                    className="flex-1 bg-blue-600 text-white rounded-lg py-2 px-2 text-xs font-semibold transition-all duration-200 hover:bg-blue-700"
                >
                    Añadir al carrito
                </button>
                <button
                    className="flex-1 bg-white border border-blue-600 text-blue-600 rounded-lg py-2 px-2 text-xs font-semibold transition-all duration-200 hover:bg-blue-50"
                    onClick={() => onQuickView(product)}
                >
                    Vista rápida
                </button>
            </div>
        </div>
    );
}

// Modal simple para vista rápida
function QuickViewModal({ product, onClose }) {
    if (!product) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full relative">
                <button
                    className="absolute top-2 right-2 text-2xl text-gray-400 hover:text-blue-600"
                    onClick={onClose}
                    aria-label="Cerrar"
                >×</button>
                <img
                    src={product.image_url || "/images/logo.png"}
                    alt={product.name}
                    className="w-full h-48 object-contain rounded-lg mb-4 bg-gray-50"
                />
                <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
                <p className="text-gray-500 mb-2">{product.category?.name}</p>
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-green-600 font-bold text-xl">
                        {product.price} €
                    </span>
                    {product.discount > 0 && (
                        <span className="line-through text-gray-400 text-sm">
                            {(product.price * (1 - product.discount / 100)).toFixed(2)} €
                        </span>
                    )}
                </div>
                <p className="text-gray-700 mb-4">{product.description}</p>
                <button
                    className="w-full bg-blue-600 text-white rounded-lg py-2 font-semibold hover:bg-blue-700 transition"
                >
                    Añadir al carrito
                </button>
            </div>
        </div>
    );
}

export default function FastShipping() {
    const { products, banners } = usePage().props;
    const [quickViewProduct, setQuickViewProduct] = useState(null);

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 text-slate-800">
            <Head title="Productos con Envío Rápido" />
            <Header />
            <TopNavMenu />

            <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[5fr_2fr] gap-8">
                    {/* Contenido principal */}
                    <div>
                        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8 text-center border border-blue-100">
                            <h1 className="text-3xl md:text-4xl font-extrabold mb-4 flex items-center gap-2 justify-center text-blue-700 drop-shadow">
                                🚚 Productos con Envío Rápido
                            </h1>
                            <p className="mb-8 text-gray-700 text-lg">
                                Descubre todos los productos que llegan a tu casa en tiempo récord.<br />
                                <span className="text-blue-600 font-semibold">¡Compra ahora y recibe tu pedido en menos de 48h!</span>
                            </p>
                            {products.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">No hay productos con envío rápido.</div>
                            ) : (
                                <div className="flex flex-wrap justify-center gap-6">
                                    {products.map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            onQuickView={setQuickViewProduct}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Banners laterales, menos prominentes en móvil */}
                    <aside className="mt-4 lg:mt-0">
                        <div className="hidden lg:block">
                            <SidebarBanners banners={banners?.fastShipping || banners?.default || []} />
                        </div>
                        <div className="block lg:hidden mb-4">
                            {/* Banner solo visible en móvil/tablet, más pequeño */}
                            {banners?.fastShipping?.[0] && (
                                <img
                                    src={banners.fastShipping[0].src}
                                    alt={banners.fastShipping[0].alt || "Banner"}
                                    className="rounded-xl shadow-md w-full max-h-32 object-cover"
                                />
                            )}
                        </div>
                    </aside>
                </div>
            </main>
            {/* Modal de vista rápida */}
            <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
        </div>
    );
}