import { useForm, usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";

export default function SelectProducts({ temporaryProducts, categories, migratedProducts = [], error }) {
    const { post, processing } = useForm();
    const [selectedProducts, setSelectedProducts] = useState({});
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState("");

    const [modalVisible, setModalVisible] = useState(false);
    const [migratedTitles, setMigratedTitles] = useState([]);
    const [modalStep, setModalStep] = useState("migrating");
    const [errorMessage, setErrorMessage] = useState("");

    const perPage = 50;
    const paginated = temporaryProducts
        .filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
        .slice(page * perPage, (page + 1) * perPage);

    useEffect(() => {
        if (error) {
            setErrorMessage(error);
            setModalVisible(false);
            const timer = setTimeout(() => setErrorMessage(""), 6000);
            return () => clearTimeout(timer);
        }

        if (migratedProducts.length > 0) {
            setMigratedTitles(migratedProducts);
            setModalVisible(true);
            setModalStep("done");
            setTimeout(() => window.location.reload(), 3000);
        }
    }, [error, migratedProducts]);

    const handleSelect = (id) => {
        setSelectedProducts((prev) => ({
            ...prev,
            [id]: prev[id] ? undefined : {
                stock: 10,
                category_id: categories[0]?.id || 1,
                is_adult: false,
                title: temporaryProducts.find(p => p.id === id)?.title || '',
                price: temporaryProducts.find(p => p.id === id)?.price || '',
                image_url: temporaryProducts.find(p => p.id === id)?.image_url || ''
            }
        }));
    };

    const handleChange = (id, field, value) => {
        setSelectedProducts((prev) => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
    };

    const handleMigrate = (e) => {
        e.preventDefault();
        
        // Convertimos el objeto selectedProducts a un array
        const selected = Object.entries(selectedProducts)
            .filter(([_, value]) => value !== undefined)
            .map(([id, data]) => {
                const tempProduct = temporaryProducts.find(p => p.id == id);
                return {
                    id: parseInt(id),
                    name: data.title,
                    description: data.title,
                    price: parseFloat(data.price),
                    image_url: data.image_url,
                    stock: parseInt(data.stock) || 10,
                    category_id: parseInt(data.category_id) || categories[0]?.id || 1,
                    is_adult: Boolean(data.is_adult),
                    link: tempProduct?.image_url || ''
                };
            });

        if (selected.length === 0) {
            alert("Debes seleccionar al menos un producto.");
            return;
        }

        setModalVisible(true);
        setModalStep("migrating");

        // Enviamos los datos con el formato exacto que espera el backend
        post(route("products.migrate"), { 
            selected_products: selected 
        }, {
            onError: (errors) => {
                setModalVisible(false);
                setErrorMessage(`Error de validación: ${JSON.stringify(errors)}`);
            }
        });
    };

    return (
        <div className="max-w-7xl mx-auto p-6 bg-white shadow-lg rounded-lg relative">
            <h2 className="text-3xl font-bold text-center mb-6">Migrador de Productos</h2>

            {errorMessage && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded relative transition">
                    <strong className="block mb-1">Error:</strong>
                    <span>{errorMessage}</span>
                    <button
                        onClick={() => setErrorMessage("")}
                        className="absolute top-2 right-2 text-red-700 hover:text-red-900 font-bold text-xl leading-none"
                        aria-label="Cerrar"
                    >
                        ×
                    </button>
                </div>
            )}

            <div className="flex justify-between items-center mb-4">
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar por nombre..."
                    className="border px-3 py-2 rounded w-1/3"
                />
                <p className="text-gray-500">Página {page + 1} de {Math.ceil(temporaryProducts.length / perPage)}</p>
            </div>

            <form onSubmit={handleMigrate}>
                <div className="overflow-x-auto">
                    <table className="w-full border text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2 border">OK</th>
                                <th className="p-2 border">Imagen</th>
                                <th className="p-2 border">Título</th>
                                <th className="p-2 border">Precio</th>
                                <th className="p-2 border">Stock</th>
                                <th className="p-2 border">Categoría</th>
                                <th className="p-2 border">¿+18?</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50">
                                    <td className="p-2 text-center">
                                        <input
                                            type="checkbox"
                                            onChange={() => handleSelect(product.id)}
                                            checked={Boolean(selectedProducts[product.id])}
                                        />
                                    </td>
                                    <td className="p-2 text-center">
                                        <img src={product.image_url} alt="Producto" className="w-16 h-auto rounded" />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            className="w-full border rounded px-2"
                                            value={selectedProducts[product.id]?.title || product.title}
                                            disabled={!selectedProducts[product.id]}
                                            onChange={(e) => handleChange(product.id, 'title', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full border rounded px-2"
                                            value={selectedProducts[product.id]?.price || product.price}
                                            disabled={!selectedProducts[product.id]}
                                            onChange={(e) => handleChange(product.id, 'price', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            className="w-full border rounded px-2"
                                            value={selectedProducts[product.id]?.stock || ''}
                                            disabled={!selectedProducts[product.id]}
                                            onChange={(e) => handleChange(product.id, 'stock', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <select
                                            className="w-full border rounded px-2"
                                            value={selectedProducts[product.id]?.category_id || ''}
                                            disabled={!selectedProducts[product.id]}
                                            onChange={(e) => handleChange(product.id, 'category_id', e.target.value)}
                                        >
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedProducts[product.id]?.is_adult || false}
                                            disabled={!selectedProducts[product.id]}
                                            onChange={(e) => handleChange(product.id, 'is_adult', e.target.checked)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between items-center mt-4">
                    <button type="button" className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                        disabled={page === 0}
                        onClick={() => setPage(prev => Math.max(prev - 1, 0))}
                    >Anterior</button>

                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        disabled={processing}
                    >Migrar Seleccionados</button>

                    <button type="button" className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                        disabled={(page + 1) * perPage >= temporaryProducts.length}
                        onClick={() => setPage(prev => prev + 1)}
                    >Siguiente</button>
                </div>
            </form>

            {/* Modal de progreso */}
            {modalVisible && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full text-center">
                        {modalStep === "migrating" ? (
                            <>
                                <h3 className="text-xl font-bold mb-2">Migrando productos...</h3>
                                <p className="text-gray-600">Por favor espera mientras se completan los cambios.</p>
                            </>
                        ) : (
                            <>
                                <h3 className="text-xl font-bold text-green-600 mb-2">Productos migrados</h3>
                                <ul className="text-left mt-4 max-h-60 overflow-y-auto text-sm">
                                    {migratedTitles.map((name, idx) => (
                                        <li key={idx} className="mb-1">• {name}</li>
                                    ))}
                                </ul>
                                <p className="mt-4 text-gray-500 text-sm">Esta ventana se cerrará en unos segundos.</p>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
