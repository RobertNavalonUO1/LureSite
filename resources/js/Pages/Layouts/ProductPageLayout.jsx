// ProductPageLayout combinado con funcionalidad de reviews, tabs y productos relacionados
import React, { useState, useEffect } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { usePage } from '@inertiajs/react';

import CartDropdown from '@/Components/CartDropdown';
import CartDropdownLateral from '@/Components/CartDropdownLateral';
import LeftBanner from '@/Components/LeftBanner';
import TopNavMenu from '@/Components/TopNavMenu';
import ProductDetails from '@/Components/ProductDetails';
import RelatedProducts from '@/Components/RelatedProducts';
import SearchTags from '@/Components/SearchTags';
import Header from '@/Components/Header';

const ProductPageLayout = ({ product, relatedProducts = [] }) => {
  const [cartOpen, setCartOpen] = useState(false);
  const { auth } = usePage().props;
  const user = auth?.user;

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userReview, setUserReview] = useState(null);

  // Fetch reviews
  useEffect(() => {
    fetch(`/products/${product.id}/reviews`)
      .then((res) => res.json())
      .then((data) => {
        setReviews(data);
        if (user) {
          const found = data.find((r) => r.author === user.name);
          setUserReview(found || null);
        }
      })
      .catch(() => setReviews([]));
  }, [product.id, user]);

  // Handle review submit
  const handleReviewSubmit = ({ rating, comment }) => {
    setSubmittingReview(true);
    fetch(`/products/${product.id}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
      },
      body: JSON.stringify({ rating, comment }),
    })
      .then((res) => res.json())
      .then((data) => {
        setReviews((prev) => {
          const exists = prev.find((r) => r.id === data.id);
          if (exists) {
            return prev.map((r) => (r.id === data.id ? data : r));
          }
          return [...prev, data];
        });
        setUserReview(data);
        setSubmittingReview(false);
      })
      .catch(() => setSubmittingReview(false));
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
      <Header />
      <TopNavMenu />

      {/* Centro con más representación: contenedor más ancho y columnas laterales más compactas */}
      <div
        className="
          mx-auto mt-6 w-full max-w-[1600px]
          grid grid-cols-1 gap-4 px-2 lg:gap-8
          lg:grid-cols-[minmax(140px,200px)_minmax(980px,1fr)_minmax(200px,280px)]
          xl:grid-cols-[minmax(160px,220px)_minmax(1120px,1fr)_minmax(220px,300px)]
          2xl:grid-cols-[minmax(180px,240px)_minmax(1280px,1fr)_minmax(240px,320px)]
        "
      >
        {/* Izquierda */}
        <div className="hidden lg:block">
          <LeftBanner />
        </div>

        {/* Centro (mínimos reforzados para darle mayor peso visual) */}
        <div className="min-w-0 lg:min-w-[980px] xl:min-w-[1120px] 2xl:min-w-[1280px]">
          <ProductDetails
            product={product}
            onCartOpen={() => setCartOpen(true)}
            reviews={reviews}
            user={user}
            onReviewSubmit={handleReviewSubmit}
            submittingReview={submittingReview}
            userReview={userReview}
          />
        </div>

        {/* Derecha */}
        <div className="hidden lg:flex w-full flex-col gap-4 lg:gap-8 lg:sticky lg:top-24">
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 lg:flex-col lg:snap-none lg:overflow-visible">
            <a
              href="/promocion/3"
              className="group relative block min-w-[200px] overflow-hidden rounded-3xl bg-slate-100 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl lg:min-w-0 lg:w-full"
            >
              <img
                alt="Promocion destacada"
                className="h-48 w-full object-contain"
                loading="lazy"
                src="/images/banner1.webp"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent transition-opacity duration-300 group-hover:from-slate-900/60" />
              <div className="absolute bottom-6 left-1/2 w-[80%] -translate-x-1/2 text-center">
                <span className="inline-flex items-center justify-center rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg transition-colors duration-200 group-hover:bg-amber-300">
                  Descubrir
                </span>
              </div>
            </a>
          </div>
          <div className="hidden border-t border-slate-200 pt-4 text-xs text-slate-500 lg:block">
            Descubre promociones y lanzamientos seleccionados para ti.
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 w-full max-w-[1600px] px-4">
        <RelatedProducts
          categoryId={product.category?.id}
          excludeId={product.id}
          products={relatedProducts}
        />

        <div className="mt-10">
          <h2 className="text-lg font-bold mb-2">Búsquedas frecuentes</h2>
          <SearchTags tags={['Monitores ultraanchos', 'Ofertas pantallas', 'Accesorios gamer']} />
        </div>
      </div>

      <CartDropdownLateral isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
};

export default ProductPageLayout;
