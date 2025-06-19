import { useForm } from "@inertiajs/react";
import { useState } from "react";

export default function SelectProducts({ temporaryProducts, categories }) {
    const { post, processing, errors } = useForm();
    const [selectedProducts, setSelectedProducts] = useState({});
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    console.log("Productos temporales:", temporaryProducts);

    // Manejar la selección de un producto
    const handleSelect = (id) => {
        setSelectedProducts((prev) => ({
            ...prev,
            [id]: prev[id] ? undefined : { stock: 10, category_id: categories[0]?.id || 1, is_adult: false }
        }));
    };

    // Manejar cambios en los campos de stock, categoría o is_adult
    const handleChange = (id, field, value) => {
        setSelectedProducts((prev) => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
    };

    // Manejar la migración de productos seleccionados
    const handleMigrate = (e) => {
        e.preventDefault();
        setSuccessMessage("");
        setErrorMessage("");

        // Preparar los datos para enviar al backend
        const selected = Object.entries(selectedProducts)
            .filter(([_, value]) => value) // Filtrar solo los productos seleccionados
            .map(([id, data]) => ({
                id: parseInt(id),
                stock: parseInt(data.stock) || 10,
                category_id: parseInt(data.category_id) || categories[0]?.id || 1,
                is_adult: Boolean(data.is_adult)
            }));

        // Validar que se haya seleccionado al menos un producto
        if (selected.length === 0) {
            setErrorMessage("Debes seleccionar al menos un producto.");
            return;
        }

        console.log("✅ Enviando productos seleccionados:", selected);

        // Enviar los datos al backend
        post(route("products.migrate"), { selected_products: selected }, {
            onSuccess: () => {
                setSuccessMessage("Productos migrados correctamente.");
                window.location.reload(); // Recargar la página para ver los cambios
            },
            onError: (errors) => {
                console.error("Errores en la validación:", errors);
                setErrorMessage("Hubo un error al migrar los productos. Por favor, inténtalo de nuevo.");
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
            <h2 className="text-2xl font-bold text-center mb-6">Seleccionar Productos para Migrar</h2>
            {successMessage && <p className="text-green-600 font-bold mb-4">{successMessage}</p>}
            {errorMessage && <p className="text-red-600 font-bold mb-4">{errorMessage}</p>}
            <form onSubmit={handleMigrate}>
                <table className="w-full border-collapse border border-gray-200">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-2 border">Seleccionar</th>
                            <th className="p-2 border">Imagen</th>
                            <th className="p-2 border">Título</th>
                            <th className="p-2 border">Precio</th>
                            <th className="p-2 border">Stock</th>
                            <th className="p-2 border">Categoría</th>
                            <th className="p-2 border">¿Adult?</th>
                        </tr>
                    </thead>
                    <tbody>
                        {temporaryProducts.map((product) => (
                            <tr key={product.id} className="border">
                                <td className="p-2 text-center">
                                    <input
                                        type="checkbox"
                                        onChange={() => handleSelect(product.id)}
                                        checked={Boolean(selectedProducts[product.id])}
                                    />
                                </td>
                                <td className="p-2 text-center">
                                    <img src={product.image_url} alt="Producto" className="w-20 h-auto" />
                                </td>
                                <td className="p-2">{product.title}</td>
                                <td className="p-2">{product.price} €</td>
                                <td className="p-2">
                                    <input
                                        type="number"
                                        value={selectedProducts[product.id]?.stock || ""}
                                        onChange={(e) => handleChange(product.id, "stock", e.target.value)}
                                        className="border p-1 w-16"
                                    />
                                </td>
                                <td className="p-2">
                                    <select
                                        value={selectedProducts[product.id]?.category_id || ""}
                                        onChange={(e) => handleChange(product.id, "category_id", e.target.value)}
                                        className="border p-1"
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="p-2 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedProducts[product.id]?.is_adult || false}
                                        onChange={(e) => handleChange(product.id, "is_adult", e.target.checked)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="mt-4 text-center">
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        disabled={processing}
                    >
                        Validar y Migrar Seleccionados
                    </button>
                </div>
            </form>
        </div>
    );
}
