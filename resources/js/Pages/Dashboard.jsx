import React from 'react';
import { usePage } from '@inertiajs/react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Dashboard = () => {
    const { auth, orders, cartItems } = usePage().props;

    return (
        <div className="bg-gray-100 min-h-screen">
            <Header />
            <div className="max-w-6xl mx-auto py-10 px-6">
                <div className="bg-white shadow-lg rounded-lg p-6">
                    <div className="flex items-center border-b pb-4 mb-4">
                        <img src="/default-avatar.png" alt="User Avatar" className="w-16 h-16 rounded-full border" />
                        <div className="ml-4">
                            <h2 className="text-2xl font-bold">{auth.user.name}</h2>
                            <p className="text-gray-500">{auth.user.email}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <a href="/orders" className="bg-blue-500 text-white p-4 rounded-lg text-center shadow-md hover:bg-blue-600 transition">
                            <p className="text-lg font-semibold">Mis Pedidos</p>
                        </a>
                        <a href="/orders/shipped" className="bg-green-500 text-white p-4 rounded-lg text-center shadow-md hover:bg-green-600 transition">
                            <p className="text-lg font-semibold">Enviados</p>
                        </a>
                        <a href="/orders/paid" className="bg-yellow-500 text-white p-4 rounded-lg text-center shadow-md hover:bg-yellow-600 transition">
                            <p className="text-lg font-semibold">Pagados</p>
                        </a>
                        <a href="/profile/edit" className="bg-gray-500 text-white p-4 rounded-lg text-center shadow-md hover:bg-gray-600 transition">
                            <p className="text-lg font-semibold">Editar Perfil</p>
                        </a>
                    </div>
                </div>

                <div className="bg-white shadow-lg rounded-lg p-6 mt-8">
                    <h3 className="text-xl font-semibold mb-4">Pedidos Recientes</h3>
                    <div className="space-y-4">
                        {orders.length > 0 ? (
                            orders.map(order => (
                                <div key={order.id} className="flex justify-between items-center p-4 border rounded-lg">
                                    <div>
                                        <p className="text-gray-700 font-medium">Pedido #{order.id}</p>
                                        <p className="text-gray-500 text-sm">Fecha: {order.date}</p>
                                    </div>
                                    <p className="text-lg font-bold text-gray-900">${order.total}</p>
                                    <a href={`/orders/${order.id}`} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">Ver Detalles</a>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500">No tienes pedidos recientes.</p>
                        )}
                    </div>
                </div>

                <div className="bg-white shadow-lg rounded-lg p-6 mt-8">
                    <h3 className="text-xl font-semibold mb-4">Carrito de Compras</h3>
                    <div className="space-y-4">
                        {cartItems.length > 0 ? (
                            cartItems.map(item => (
                                <div key={item.id} className="flex justify-between items-center p-4 border rounded-lg">
                                    <div>
                                        <p className="text-gray-700 font-medium">{item.title}</p>
                                        <p className="text-gray-500 text-sm">Cantidad: {item.quantity}</p>
                                    </div>
                                    <p className="text-lg font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                                    <a href={`/cart`} className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition">Ir al Carrito</a>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500">Tu carrito está vacío.</p>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Dashboard;
