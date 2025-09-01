import React, { useState, useEffect } from 'react';
import { Inertia } from '@inertiajs/inertia';
import CartDropdownLateral from '@/Components/CartDropdownLateral';
import LeftBanner from '@/Components/LeftBanner';
import Header from '@/Components/Header';
import { usePage } from '@inertiajs/react';
import RelatedProducts from '@/Components/RelatedProducts'; // Nuevo componente

const ProductPageLayout = ({ product, products = [] }) => {
  const [cartOpen, setCartOpen] = useState(false);

  const { auth } = usePage().props;
  const user = auth?.user;

  const [activeTab, setActiveTab] = useState('descripcion');
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [reviewing, setReviewing] = useState(false);

  // Obtener reseñas del producto
  const fetchReviews = () => {
    Inertia.get(`/products/${product.id}/reviews`, {}, {
      onSuccess: (response) => {
        setReviews(response.props.reviews || []);
      },
      onError: () => console.error('Error al cargar las reseñas.'),
    });
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line
  }, []);

  // Enviar nueva reseña
  const handleReviewSubmit = (e) => {
    e.preventDefault();
    setReviewing(true);

    Inertia.post(`/products/${product.id}/reviews`, newReview, {
      onSuccess: (response) => {
        setReviews([...reviews, response.props.review]);
        setNewReview({ rating: 5, comment: '' });
        setReviewing(false);
      },
      onError: () => {
        console.error('Error al enviar la reseña.');
        setReviewing(false);
      },
    });
  };

  // Agregar al carrito
  const handleAddToCart = (productId) => {
    Inertia.post(`/cart/${productId}/add`, {}, {
      onSuccess: (response) => {
        const { success, error } = response.data;
        if (success) console.log(success);
        else if (error) console.error(error);
      },
      onError: () => console.error('Hubo un error al agregar el producto al carrito.'),
    });
  };

  // Debug: muestra el objeto recibido
  console.log('Product:', product);
  console.log('Products:', products);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="bg-white p-8 rounded shadow text-center">
            <h2 className="text-xl font-bold text-rose-600 mb-2">Error</h2>
            <p>No se ha recibido información del producto.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
      <Header />

      <div className="max-w-7xl mx-auto flex mt-6 px-4 gap-6">
        <LeftBanner />

        <div className="flex-1 bg-white p-6 rounded-xl shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-[420px] object-contain border rounded-xl shadow-sm"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 mb-1">{product.name}</h1>
              <p className="text-sm text-gray-500 mb-1">{product.category?.name}</p>
              <p className="text-xl text-rose-600 font-semibold mb-2">${product.price}</p>
              <p className={`text-sm font-medium mb-3 ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {product.stock > 0 ? `En stock: ${product.stock}` : 'Agotado'}
              </p>
              <p className="text-sm text-gray-600 mb-4">{product.details?.description}</p>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => handleAddToCart(product.id)}
                  disabled={product.stock === 0}
                  className={`px-6 py-3 font-semibold text-white rounded-xl shadow transition ${product.stock > 0 ? 'bg-rose-600 hover:bg-rose-700' : 'bg-gray-400 cursor-not-allowed'}`}
                >
                  Agregar al carrito
                </button>
              </div>
              <div className="mt-6 text-xs text-gray-400">
                SKU: {product.id} • Vendidos: {product.sold_count || 0} • Valoración: ⭐ {product.rating || 4.5}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mt-8 px-4">
        <div className="flex gap-6 border-b text-sm font-medium text-indigo-600">
          {['descripcion', 'especificaciones', 'reviews'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 border-b-2 ${activeTab === tab ? 'border-indigo-600 font-bold' : 'border-transparent'}`}
            >
              {tab === 'descripcion' ? 'Descripción' : tab === 'especificaciones' ? 'Especificaciones' : 'Reseñas'}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === 'descripcion' && (
            <div>
              <h2 className="text-lg font-bold mb-2">Descripción del producto</h2>
              <p className="text-gray-600">{product.details?.description}</p>
            </div>
          )}

          {activeTab === 'especificaciones' && (
            <div>
              <h2 className="text-lg font-bold mb-2">Especificaciones técnicas</h2>
              <ul className="list-disc list-inside text-gray-600">
                {product.details?.specifications
                  ? product.details.specifications.split('\n').map((spec, i) => (
                      <li key={i}>{spec}</li>
                    ))
                  : <li>No hay especificaciones técnicas disponibles.</li>
                }
              </ul>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <h2 className="text-lg font-bold mb-2">Opiniones de clientes</h2>
              <p className="text-sm text-gray-500 mb-4">⭐ {product.rating || 4.5} de 5</p>
              <form onSubmit={handleReviewSubmit} className="mb-6">
                <h3 className="text-md font-semibold text-gray-800 mb-2">Escribe tu opinión</h3>
                <div className="flex gap-4 mb-4">
                  <div className="flex items-center">
                    <span className="text-yellow-500 mr-1">⭐</span>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={newReview.rating}
                      onChange={(e) => setNewReview({ ...newReview, rating: e.target.value })}
                      className="w-16 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      placeholder="Escribe tu comentario aquí..."
                      className="w-full p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows="3"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={reviewing}
                  className={`px-4 py-2 font-semibold text-white rounded-md transition ${reviewing ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                  {reviewing ? 'Enviando...' : 'Enviar reseña'}
                </button>
              </form>
              <ul className="space-y-4">
                {reviews.map(review => (
                  <li key={review.id} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="text-yellow-500 mr-1">⭐</span>
                        <span className="font-semibold text-gray-800">{review.author}</span>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-gray-700 mb-2">
                      {Array.from({ length: review.rating }, (_, i) => (
                        <span key={i} className="text-yellow-500">⭐</span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">{review.comment}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Recomendaciones de productos similares */}
        <RelatedProducts
          categoryId={product.category?.id}
          excludeId={product.id}
          products={products}
        />

        {/* Búsquedas frecuentes */}
        <div className="mt-10">
          <h2 className="text-lg font-bold mb-2">Búsquedas frecuentes</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {['Monitores ultraanchos', 'Ofertas pantallas', 'Accesorios gamer'].map((term, i) => (
              <a
                key={i}
                href={`/search?query=${encodeURIComponent(term)}`}
                className="px-3 py-1 text-sm border border-indigo-300 text-indigo-700 rounded-full hover:bg-indigo-50 transition"
              >
                {term}
              </a>
            ))}
          </div>
        </div>
      </div>

      <CartDropdownLateral isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
};

export default ProductPageLayout;