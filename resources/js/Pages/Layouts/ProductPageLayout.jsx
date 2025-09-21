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
          const found = data.find(r => r.author === user.name);
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
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
      },
      body: JSON.stringify({ rating, comment }),
    })
      .then(res => res.json())
      .then((data) => {
        setReviews(prev => {
          const exists = prev.find(r => r.id === data.id);
          if (exists) {
            return prev.map(r => (r.id === data.id ? data : r));
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

      <div className="max-w-7xl mx-auto flex mt-6 px-4 gap-6">
        <LeftBanner />
        <div className="flex-1">
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
      </div>

      <div className="max-w-7xl mx-auto mt-8 px-4">
        {/* Productos relacionados */}
        <RelatedProducts
          categoryId={product.category?.id}
          excludeId={product.id}
          products={relatedProducts}
        />

        {/* Búsquedas frecuentes */}
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
