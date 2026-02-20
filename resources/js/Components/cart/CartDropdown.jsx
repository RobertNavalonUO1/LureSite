import React, { useState, useEffect, useRef } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { usePage } from '@inertiajs/react';

const CartDropdown = () => {
    const { cartItems: initialCartItems, cartCount: initialCartCount, total: initialTotal } = usePage().props;
    const dropdownRef = useRef(null);

    const [isDropdownVisible, setIsDropdownVisible] = useState(() => {
        return localStorage.getItem("cartDropdown") === "true";
    });

    const [cartItems, setCartItems] = useState(initialCartItems);
    const [cartCount, setCartCount] = useState(initialCartCount);
    const [total, setTotal] = useState(initialTotal);

    useEffect(() => {
        setCartItems(initialCartItems);
        setCartCount(initialCartCount);
        setTotal(initialTotal);
    }, [initialCartItems, initialCartCount, initialTotal]);

    useEffect(() => {
        localStorage.setItem("cartDropdown", isDropdownVisible);
    }, [isDropdownVisible]);

    const toggleDropdown = (forceOpen = null) => {
        setIsDropdownVisible(prev => (forceOpen !== null ? forceOpen : !prev));
    };

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsDropdownVisible(false);
        }
    };

    useEffect(() => {
        if (isDropdownVisible) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDropdownVisible]);

    const updateCartState = (newCartItems) => {
        const newCartCount = Object.values(newCartItems).reduce((sum, item) => sum + item.quantity, 0);
        const newTotal = Object.values(newCartItems).reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);

        setCartItems(newCartItems);
        setCartCount(newCartCount);
        setTotal(newTotal);
    };

    const handleRemove = (productId) => {
        const updatedCart = { ...cartItems };
        delete updatedCart[productId];
        updateCartState(updatedCart);

        Inertia.post(`/cart/${productId}/remove`, {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => toggleDropdown(true),
        });
    };

    const handleIncrement = (productId) => {
        const updatedCart = { ...cartItems };
        if (updatedCart[productId]) {
            updatedCart[productId].quantity++;
            updateCartState(updatedCart);
        }

        Inertia.post(`/cart/${productId}/increment`, {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => toggleDropdown(true),
        });
    };

    const handleDecrement = (productId) => {
        const updatedCart = { ...cartItems };
        if (updatedCart[productId]) {
            if (updatedCart[productId].quantity > 1) {
                updatedCart[productId].quantity--;
            } else {
                delete updatedCart[productId];
            }
            updateCartState(updatedCart);
        }

        Inertia.post(`/cart/${productId}/decrement`, {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => toggleDropdown(true),
        });
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => toggleDropdown()}
                className="bg-yellow-500 px-4 py-2 rounded-lg hover:bg-yellow-600 flex items-center transition duration-300 ease-in-out transform hover:scale-105"
            >
                🛒 Ver carrito
                {cartCount > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-sm px-2 rounded-full">
                        {cartCount}
                    </span>
                )}
            </button>
            {isDropdownVisible && (
                <div className="absolute right-0 bg-white shadow-2xl rounded-lg p-4 mt-2 w-80 max-h-96 overflow-y-auto z-50">
                    {cartCount > 0 ? (
                        <div>
                            <ul>
                                {Object.values(cartItems).map((item) => (
                                    <li key={item.id} className="flex justify-between items-center py-3 border-b last:border-b-0">
                                        <img
                                            src={item.image_url}
                                            alt={item.title}
                                            className="w-14 h-14 object-cover rounded-lg"
                                        />
                                        <div className="ml-3 flex-1">
                                            <p className="font-semibold text-gray-800">{item.title}</p>
                                            <div className="flex items-center mt-1">
                                                <button
                                                    onClick={() => handleDecrement(item.id)}
                                                    className="bg-gray-200 text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-300 transition duration-300 ease-in-out"
                                                >
                                                    -
                                                </button>
                                                <p className="text-sm text-gray-500 mx-2">{item.quantity}</p>
                                                <button
                                                    onClick={() => handleIncrement(item.id)}
                                                    className="bg-gray-200 text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-300 transition duration-300 ease-in-out"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <p className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                        <button
                                            onClick={() => handleRemove(item.id)}
                                            className="text-red-500 hover:text-red-700 text-sm transition duration-300 ease-in-out"
                                        >
                                            Eliminar
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-4 pt-4 border-t">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-gray-800">Total:</span>
                                    <span className="font-bold text-gray-900">${total}</span>
                                </div>
                                <a
                                    href="/checkout"
                                    className="mt-4 block w-full bg-blue-500 text-white text-center py-2 rounded-lg hover:bg-blue-600 transition duration-300 ease-in-out"
                                >
                                    Ir a Checkout
                                </a>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center">Tu carrito está vacío.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default CartDropdown;
