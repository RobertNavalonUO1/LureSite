import React, { useState } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { usePage } from '@inertiajs/react';

import CartDropdown from '@/Components/CartDropdown';
import LoginModal from '@/Components/LoginModal';
import RegistrarModal from '@/Components/RegistrarModal';
import ForgotPassword from '@/Components/ForgotPassword';

const Home = () => {
    const { categories, products, auth } = usePage().props;

    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [modalMessage, setModalMessage] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Estado de los modales
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(search.toLowerCase()) &&
        (!selectedCategory || product.category.id === selectedCategory)
    );

    const addToCart = (productId) => {
        Inertia.post(`/cart/${productId}/add`, {}, {
            onSuccess: (response) => {
                const { success, error } = response.data;
                if (success) {
                    showModal(success, false);
                } else if (error) {
                    showModal(error, true);
                }
            },
            onError: () => {
                showModal('Hubo un error al agregar el producto al carrito.', true);
            },
        });
    };

    const showModal = (message, isError) => {
        setModalMessage(message);
        setIsModalVisible(true);
        setTimeout(() => {
            setIsModalVisible(false);
        }, 2000);
    };

    const modalClass = modalMessage.includes('error') ? 'bg-red-500' : 'bg-green-500';

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            {/* HEADER */}
            <header className="bg-blue-600 text-white py-4 px-6 flex justify-between items-center">
                <h1 className="text-xl font-bold">Mi Aplicación</h1>

                <div className="flex items-center space-x-4 flex-grow mx-6">
                    <input
                        type="text"
                        placeholder="Buscar productos..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-3 py-2 border rounded text-gray-700 flex-grow"
                    />
                    <button className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100">
                        Buscar
                    </button>
                </div>

                <nav className="flex items-center space-x-4">
                    <a href="/about" className="hover:underline">Acerca de</a>
                    <a href="/contact" className="hover:underline">Contacto</a>
                    <CartDropdown />

                    {auth.user ? (
                        <a href="/dashboard" className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-900">
                            Perfil
                        </a>
                    ) : (
                        <button
                            onClick={() => setIsLoginOpen(true)}
                            className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100"
                        >
                            Iniciar Sesión
                        </button>
                    )}
                </nav>
            </header>

            {/* BODY */}
            <div className="flex flex-grow">
                <aside className="w-64 bg-white shadow-md p-4">
                    <h2 className="text-xl font-semibold mb-4">Categorías</h2>
                    <ul>
                        <li
                            className={`py-2 px-3 rounded cursor-pointer ${!selectedCategory ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
                            onClick={() => setSelectedCategory(null)}
                        >
                            Todas las categorías
                        </li>
                        {categories.map(category => (
                            <li
                                key={category.id}
                                className={`py-2 px-3 rounded cursor-pointer ${selectedCategory === category.id ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
                                onClick={() => setSelectedCategory(category.id)}
                            >
                                {category.name}
                            </li>
                        ))}
                    </ul>
                </aside>

                <main className="flex-grow p-6">
                    <h1 className="text-2xl font-bold mb-4">Productos Destacados</h1>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map(product => (
                                <div key={product.id} className="bg-white p-4 shadow-md rounded-lg">
                                    <a href={product.link || `/product/${product.id}`}>
                                        <picture>
                                            <source srcSet={product.image_url} type="image/avif" />
                                            <img
                                                src={product.image_url.replace('.avif', '.jpg')}
                                                alt={product.name}
                                                className="w-full h-40 object-cover rounded-md"
                                            />
                                        </picture>
                                    </a>
                                    <h3 className="text-lg font-semibold mt-2">{product.name}</h3>
                                    <p className="text-gray-500 text-sm">{product.category.name}</p>
                                    <p className="text-blue-600 font-bold mt-2">${product.price}</p>
                                    <button
                                        className="mt-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
                                        onClick={() => addToCart(product.id)}
                                        disabled={product.stock === 0}
                                    >
                                        {product.stock > 0 ? "🛒 Agregar al carrito" : "Agotado"}
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-lg col-span-3">No hay productos en esta categoría.</p>
                        )}
                    </div>
                </main>
            </div>

            {/* MENSAJE MODAL */}
            {isModalVisible && (
                <div className={`${modalClass} fixed bottom-10 left-1/2 transform -translate-x-1/2 text-white p-4 rounded-lg shadow-md`}>
                    <p>{modalMessage}</p>
                </div>
            )}

            {/* MODALES */}
            <LoginModal
                isOpen={isLoginOpen}
                onClose={() => setIsLoginOpen(false)}
                onRegister={() => {
                    setIsLoginOpen(false);
                    setIsRegisterOpen(true);
                }}
                onForgot={() => {
                    setIsLoginOpen(false);
                    setIsForgotPasswordOpen(true);
                }}
            />

            <RegistrarModal
                isOpen={isRegisterOpen}
                onClose={() => setIsRegisterOpen(false)}
            />

            <ForgotPassword
                isOpen={isForgotPasswordOpen}
                onClose={() => setIsForgotPasswordOpen(false)}
            />
        </div>
    );
};

export default Home;
