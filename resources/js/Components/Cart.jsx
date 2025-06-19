import React from 'react';
import { usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { Inertia } from '@inertiajs/inertia'; // <- Este faltaba para que funcione el handleRemoveFromCart


const Cart = () => {
  const { cartItems, cartCount } = usePage().props;  // Obtener los items del carrito desde las props de Inertia

  // Calcular el total del carrito
  const totalPrice = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2);

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6">
        <h1 className="text-4xl font-semibold text-gray-800 text-center mb-8">Tu carrito de compras</h1>

        {/* Si no hay productos en el carrito */}
        {cartCount === 0 ? (
          <div className="text-center">
            <p className="text-xl text-gray-500">Tu carrito está vacío.</p>
            <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">Seguir comprando</Link>
          </div>
        ) : (
          <>
            {/* Mostrar los productos en el carrito */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-6">
                    <div className="flex items-center">
                      <img src={item.image} alt={item.title} className="w-20 h-20 object-cover rounded-md mr-4" />
                      <div>
                        <p className="font-semibold text-gray-800">{item.title}</p>
                        <p className="text-gray-500">Cantidad: {item.quantity}</p>
                        <p className="text-gray-600">€{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                    {/* Botón para eliminar producto */}
                    <button
                      className="text-red-600 hover:text-red-800"
                      onClick={() => handleRemoveFromCart(item.id)} // Método para eliminar
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen del carrito */}
            <div className="mt-6 flex justify-between items-center bg-white p-6 shadow-md rounded-lg">
              <div>
                <p className="text-xl font-semibold text-gray-800">Total: €{totalPrice}</p>
              </div>
              <div className="space-x-4">
                <Link
                  href="/checkout"
                  className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition"
                >
                  Proceder al pago
                </Link>
                <Link
                  href="/"
                  className="bg-gray-300 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-400 transition"
                >
                  Seguir comprando
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Método para eliminar producto del carrito
const handleRemoveFromCart = (productId) => {
  // Aquí puedes hacer una llamada al backend para eliminar el producto
  // Por ejemplo, con un POST a la ruta que elimina el producto del carrito
  Inertia.post(`/cart/${productId}/remove`);
};

export default Cart;
