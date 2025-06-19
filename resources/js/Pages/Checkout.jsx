import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { loadStripe } from '@stripe/stripe-js';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AddressModal from '../components/AddressModal';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const Checkout = () => {
    const {
        cartItems: initialCartItems = {},
        total: initialTotal = 0,
        auth,
        addresses = []
    } = usePage().props;

    const [cartItems] = useState(initialCartItems);
    const [total] = useState(initialTotal);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [selectedAddressId, setSelectedAddressId] = useState(
        addresses.find(addr => addr.id === auth.user.default_address_id)?.id || addresses[0]?.id || null
    );

    const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
    const formatAddress = (addr) =>
        `${addr.street}, ${addr.city}, ${addr.province}, ${addr.zip_code}, ${addr.country}`;

    const handleStripePayment = async () => {
        const stripe = await stripePromise;
        try {
            const response = await fetch('/checkout/stripe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
                body: JSON.stringify({ address_id: selectedAddressId }),
            });
            const data = await response.json();
            if (data.sessionId) {
                const result = await stripe.redirectToCheckout({ sessionId: data.sessionId });
                if (result.error) {
                    console.error(result.error.message);
                }
            } else {
                console.error('No se recibió sessionId:', data.error);
            }
        } catch (err) {
            console.error('Error al iniciar el pago:', err);
        }
    };

    const handlePayPalPayment = async () => {
        console.log("Iniciando pago con PayPal...");
        try {
            const response = await fetch('/checkout/paypal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
                body: JSON.stringify({ address_id: selectedAddressId }),
            });

            // Revisa la respuesta en la pestaña Network y en consola
            const data = await response.json();
            console.log("Respuesta de PayPal:", data);

            if (data.approvalLink) {
                window.location.href = data.approvalLink;
            } else {
                console.error('No se recibió approvalLink:', data.error);
            }
        } catch (err) {
            console.error('Error al iniciar el pago con PayPal:', err);
        }
    };


    return (
        <div className="bg-gray-100 min-h-screen">
            <Header />
            <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
                <h2 className="text-3xl font-bold text-center mb-6">Checkout</h2>

                <div className="border-b pb-4 mb-4">
                    <h3 className="text-lg font-semibold mb-2">Resumen del pedido</h3>
                    <ul>
                        {Object.values(cartItems).map((item) => (
                            <li key={item.id} className="flex justify-between items-center py-3 border-b last:border-b-0">
                                <img src={item.image_url} alt={item.title} className="w-16 h-16 object-cover rounded-lg" />
                                <div className="ml-3 flex-1">
                                    <p className="font-semibold text-gray-800">{item.title}</p>
                                    <p className="text-gray-500">{item.quantity} x ${item.price}</p>
                                </div>
                                <span className="font-bold text-gray-900">
                                    ${(item.quantity * item.price).toFixed(2)}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="border-b pb-4 mb-4">
                    <h3 className="text-lg font-semibold mb-2">Información de entrega</h3>
                    {addresses.length > 0 ? (
                        <select
                            value={selectedAddressId}
                            onChange={(e) => setSelectedAddressId(Number(e.target.value))}
                            className="w-full p-3 rounded border bg-gray-100 mb-2"
                        >
                            {addresses.map((addr) => (
                                <option key={addr.id} value={addr.id}>
                                    {formatAddress(addr)}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <p className="text-gray-600 mb-2">No tienes direcciones guardadas.</p>
                    )}

                    <div className="bg-gray-200 p-4 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{auth.user.name}</p>
                            <p className="text-gray-600">{auth.user.email}</p>
                            <p className="text-gray-600">
                                Dirección de entrega:{' '}
                                <span className="font-bold">
                                    {selectedAddress ? formatAddress(selectedAddress) : "Ninguna seleccionada"}
                                </span>
                            </p>
                        </div>
                        <button onClick={() => setIsAddressModalOpen(true)} className="bg-blue-500 text-white px-4 py-2 rounded">
                            Añadir nueva
                        </button>
                    </div>
                </div>

                <div className="text-xl font-bold text-right pb-4">Total: ${total}</div>

                <div className="flex flex-col gap-4">
                    <button
                        onClick={handleStripePayment}
                        className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                    >
                        Pagar con Tarjeta (Stripe)
                    </button>
                    <button
                        onClick={handlePayPalPayment}
                        className="w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600"
                    >
                        Pagar con PayPal
                    </button>
                </div>
            </div>
            <Footer />

            {isAddressModalOpen && (
                <AddressModal
                    closeModal={() => setIsAddressModalOpen(false)}
                    onAddressAdded={() => window.location.reload()}
                />
            )}
        </div>
    );
};

export default Checkout;
