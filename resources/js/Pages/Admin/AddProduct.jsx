import { useForm, usePage } from "@inertiajs/react";
import { useState } from "react";

export default function AddProduct() {
    const { temporaryProducts, categories } = usePage().props; // Obtiene productos temporales y categorías desde Laravel

    const { data, setData, post, processing, errors } = useForm({
        name: "",
        description: "",
        price: "",
        image_url: "",
        stock: "",
        category_id: "",
        is_adult: false,
        link: "",
    });

    const [successMessage, setSuccessMessage] = useState("");

    // ✅ Cuando se selecciona un producto temporal, llena el formulario con sus valores
    const handleSelectProduct = (product) => {
        setData({
            name: product.title,
            description: product.title, // ✅ La descripción también será el título
            price: product.price,
            image_url: product.image_url,
            stock: "", // ✅ El usuario lo ingresará manualmente
            category_id: categories.length > 0 ? categories[0].id : "", // ✅ Primera categoría por defecto
            is_adult: false, // ✅ Por defecto en false
            link: product.image_url, // ✅ El link será el mismo que la imagen
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSuccessMessage("");

        post(route("products.store"), {
            onSuccess: () => {
                setSuccessMessage("Producto agregado correctamente.");
            },
            onError: (errors) => {
                console.error("Errores en la validación:", errors);
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
            <h2 className="text-2xl font-bold text-center mb-6">Agregar Producto</h2>
            {successMessage && <p className="text-green-600 font-bold mb-4">{successMessage}</p>}

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-sm font-medium">Nombre</label>
                    <input
                        type="text"
                        value={data.name}
                        onChange={(e) => setData("name", e.target.value)}
                        className="w-full border p-2 rounded"
                    />
                    {errors.name && <p className="text-red-500">{errors.name}</p>}
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium">Descripción</label>
                    <textarea
                        value={data.description}
                        onChange={(e) => setData("description", e.target.value)}
                        className="w-full border p-2 rounded"
                    />
                    {errors.description && <p className="text-red-500">{errors.description}</p>}
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium">Precio</label>
                    <input
                        type="number"
                        value={data.price}
                        onChange={(e) => setData("price", e.target.value)}
                        className="w-full border p-2 rounded"
                    />
                    {errors.price && <p className="text-red-500">{errors.price}</p>}
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium">URL de Imagen</label>
                    <input
                        type="text"
                        value={data.image_url}
                        onChange={(e) => setData("image_url", e.target.value)}
                        className="w-full border p-2 rounded"
                    />
                    {errors.image_url && <p className="text-red-500">{errors.image_url}</p>}
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium">Stock</label>
                    <input
                        type="number"
                        value={data.stock}
                        onChange={(e) => setData("stock", e.target.value)}
                        className="w-full border p-2 rounded"
                    />
                    {errors.stock && <p className="text-red-500">{errors.stock}</p>}
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium">Categoría</label>
                    <select
                        value={data.category_id}
                        onChange={(e) => setData("category_id", e.target.value)}
                        className="w-full border p-2 rounded"
                    >
                        <option value="">Seleccione una categoría</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                    {errors.category_id && <p className="text-red-500">{errors.category_id}</p>}
                </div>

                <div className="mb-4 flex items-center">
                    <input
                        type="checkbox"
                        checked={data.is_adult}
                        onChange={(e) => setData("is_adult", e.target.checked)}
                        className="mr-2"
                    />
                    <label className="text-sm font-medium">¿Es un producto para adultos?</label>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium">Link</label>
                    <input
                        type="text"
                        value={data.link}
                        onChange={(e) => setData("link", e.target.value)}
                        className="w-full border p-2 rounded"
                    />
                    {errors.link && <p className="text-red-500">{errors.link}</p>}
                </div>

                <div className="mt-4 text-center">
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        disabled={processing}
                    >
                        Agregar Producto
                    </button>
                </div>
            </form>

            {/* Tabla de Productos Temporales */}
            <div className="mt-8">
                <h3 className="text-xl font-bold mb-4">Productos Temporales</h3>
                {temporaryProducts.length > 0 ? (
                    <table className="w-full border-collapse border border-gray-200">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-2 border">Imagen</th>
                                <th className="p-2 border">Título</th>
                                <th className="p-2 border">Precio</th>
                                <th className="p-2 border">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {temporaryProducts.map((product) => (
                                <tr key={product.id} className="border">
                                    <td className="p-2 text-center">
                                        <img src={product.image_url} alt="Producto" className="w-20 h-auto" />
                                    </td>
                                    <td className="p-2">{product.title}</td>
                                    <td className="p-2">{product.price} €</td>
                                    <td className="p-2 text-center">
                                        <button
                                            type="button"
                                            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                                            onClick={() => handleSelectProduct(product)}
                                        >
                                            Usar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-gray-500">No hay productos temporales.</p>
                )}
            </div>
        </div>
    );
}
