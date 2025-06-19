import React, { useState, useEffect } from 'react';
import { useParams, usePage, useForm } from '@inertiajs/react';

const ProductDetails = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const { cartCount, cartItems } = usePage().props; // Get current cart data from Inertia props
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Simulación de llamada a API (reemplaza con tu lógica real)
        setProduct({
            id,
            title: `Producto ${id}`,
            description: 'Descripción detallada del producto...',
            price: 20,
            image: 'https://via.placeholder.com/300',
        });
    }, [id]);

    const addToCart = () => {
        if (product) {
            setIsLoading(true);
            Inertia.post(`/cart/${product.id}/add`, {}, {
                preserveState: true,
                onSuccess: (response) => {
                    const { cartItems: updatedCartItems, cartCount: updatedCartCount, success, error } = response.props;
                    if (success) {
                        // No need to update state manually; Inertia will re-render with new props
                        alert(success); // Optional: Show a success message
                    } else if (error) {
                        alert(error); // Optional: Show an error message
                    }
                    setIsLoading(false);
                },
                onError: (errors) => {
                    alert('Hubo un error al agregar el producto al carrito.');
                    setIsLoading(false);
                },
            });
        }
    };

    return (
        <div className="container mx-auto p-4">
            {product ? (
                <div>
                    <h1 className="text-2xl font-bold">{product.title}</h1>
                    <img src={product.image} alt={product.title} className="w-full h-64 object-cover my-4" />
                    <p>{product.description}</p>
                    <p className="text-lg font-semibold">Precio: ${product.price}</p>
                    <button
                        onClick={addToCart}
                        className="bg-blue-500 text-white py-2 px-4 rounded-lg mt-4"
                        disabled={isLoading || !product}
                    >
                        {isLoading ? 'Cargando...' : 'Añadir al carrito'}
                    </button>
                </div>
            ) : (
                <p>Cargando detalles del producto...</p>
            )}
        </div>
    );
};

export default ProductDetails;
