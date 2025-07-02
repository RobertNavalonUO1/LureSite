import { useForm, usePage, Link, router } from "@inertiajs/react";
import { useState } from "react";
import { Check, Upload, Loader2, Link as LinkIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MigrateProducts() {
    const { temporaryProducts, categories, defaultStock, defaultCategory } = usePage().props;
    const { data, setData, processing, errors } = useForm({
        category_id: defaultCategory,
        stock: defaultStock,
    });

    const [editableProducts, setEditableProducts] = useState({});
    const [selectedAll, setSelectedAll] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [progress, setProgress] = useState(0);
    const [completed, setCompleted] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isMigrating, setIsMigrating] = useState(false);

    const startProgress = () => {
        setProgress(0);
        setCompleted(false);
        setError(null);
        setSuccessMessage(null);
        setShowModal(true);
        setIsMigrating(true);
    };

    const resetMigration = () => {
        setIsMigrating(false);
        setProgress(0);
        setCompleted(false);
    };

    const handleMigrate = async (productId, productName = null) => {
        const productData = {
            category_id: data.category_id,
            stock: data.stock,
            ...(productName && { name: productName })
        };

        startProgress();

        try {
            const response = await fetch(`/migrate-products/${productId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(productData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Error al migrar el producto');
            }

            setProgress(100);
            setSuccessMessage(result.message);
            setCompleted(true);

            setTimeout(() => {
                router.reload({ only: ['temporaryProducts'] });
            }, 1000);

        } catch (err) {
            setProgress(100);
            setError(err.message);
            setCompleted(true);
        } finally {
            setIsMigrating(false);
        }
    };

    const handleBulkMigrate = async () => {
        startProgress();

        try {
            const response = await fetch('/bulk-migrate-products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    category_id: data.category_id,
                    stock: data.stock
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Error al migrar los productos');
            }

            setProgress(100);
            setSuccessMessage(result.message);
            setCompleted(true);

            if (result.migrated_count !== undefined) {
                const interval = setInterval(() => {
                    setProgress(prev => {
                        const newProgress = prev + (100 / temporaryProducts.length);
                        if (newProgress >= 100) clearInterval(interval);
                        return Math.min(newProgress, 100);
                    });
                }, 100);
            } else {
                setProgress(100);
            }

            setTimeout(() => {
                router.reload();
            }, 2000);

        } catch (err) {
            setProgress(100);
            setError(err.message);
            setCompleted(true);
        } finally {
            setIsMigrating(false);
        }
    };

    const toggleProductSelection = (id) => {
        setSelectedProducts(prev =>
            prev.includes(id)
                ? prev.filter(productId => productId !== id)
                : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        setSelectedAll(!selectedAll);
        setSelectedProducts(selectedAll ? [] : temporaryProducts.map(p => p.id));
    };

    const handleNameChange = (id, value) => {
        setEditableProducts(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const closeModal = () => {
        setShowModal(false);
        resetMigration();

        if (completed && !error) {
            router.reload();
        }
    };

    return (
        <>
            <div className="max-w-7xl mx-auto mt-10 p-6 bg-gradient-to-br from-white to-gray-50 shadow-xl rounded-2xl">
                <div className="mb-6 flex justify-end">
                    <Link
                        href="/agregador-enlaces"
                        className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                        <LinkIcon className="w-4 h-4" />
                        Ir al Agregador de Enlaces
                    </Link>
                </div>

                <h2 className="text-3xl font-semibold text-gray-800 mb-8 tracking-tight">🚚 Migración de Productos</h2>

                <div className="bg-white p-6 rounded-xl shadow border border-gray-200 mb-8">
                    <h3 className="text-xl font-medium mb-6 text-gray-700">🔧 Configuración de Migración</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-gray-600">Categoría</label>
                            <select
                                value={data.category_id}
                                onChange={(e) => setData("category_id", e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                disabled={isMigrating}
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            {errors.category_id && <p className="text-sm text-red-500 mt-1">{errors.category_id}</p>}
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-semibold text-gray-600">Stock por defecto</label>
                            <input
                                type="number"
                                min="0"
                                value={data.stock}
                                onChange={(e) => setData("stock", e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                disabled={isMigrating}
                            />
                            {errors.stock && <p className="text-sm text-red-500 mt-1">{errors.stock}</p>}
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={handleBulkMigrate}
                                disabled={processing || temporaryProducts.length === 0 || isMigrating}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg font-semibold transition-all duration-200 ${
                                    processing || temporaryProducts.length === 0 || isMigrating 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                            >
                                {isMigrating ? <Loader2 className="animate-spin h-5 w-5" /> : <Upload className="h-5 w-5" />}
                                {isMigrating ? 'Migrando...' : 'Migrar Todos'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wide">
                            <tr>
                                <th className="px-6 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedAll}
                                        onChange={toggleSelectAll}
                                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                        disabled={isMigrating}
                                    />
                                </th>
                                <th className="px-6 py-3 text-left">Imagen</th>
                                <th className="px-6 py-3 text-left">Nombre</th>
                                <th className="px-6 py-3 text-left">Precio</th>
                                <th className="px-6 py-3 text-left">Enlace</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {temporaryProducts.length > 0 ? (
                                temporaryProducts.map(prod => (
                                    <tr key={prod.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedProducts.includes(prod.id)}
                                                onChange={() => toggleProductSelection(prod.id)}
                                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                disabled={isMigrating}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <img 
                                                src={prod.image_url} 
                                                alt={prod.title} 
                                                className="h-12 w-12 rounded-md object-cover border border-gray-200" 
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = '/images/placeholder-product.png';
                                                }}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="text"
                                                defaultValue={prod.title}
                                                onChange={(e) => handleNameChange(prod.id, e.target.value)}
                                                className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                disabled={isMigrating}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">
                                            {prod.price} €
                                        </td>
                                        <td className="px-6 py-4">
                                            {prod.link ? (
                                                <a
                                                    href={prod.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
                                                >
                                                    Ver Producto
                                                </a>
                                            ) : (
                                                <span className="text-gray-400 text-xs italic">Sin enlace</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleMigrate(prod.id, editableProducts[prod.id])}
                                                disabled={processing || isMigrating}
                                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                                    processing || isMigrating
                                                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                }`}
                                            >
                                                <Check className="h-4 w-4" />
                                                Migrar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center text-gray-500 px-6 py-6">
                                        No hay productos temporales para migrar.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {temporaryProducts.length > 0 && (
                    <div className="mt-6 flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                            {selectedProducts.length > 0
                                ? `${selectedProducts.length} productos seleccionados`
                                : `${temporaryProducts.length} productos disponibles`}
                        </p>

                        {selectedProducts.length > 0 && (
                            <button
                                onClick={() => {
                                    startProgress();
                                    selectedProducts.forEach(id => handleMigrate(id, editableProducts[id]));
                                }}
                                disabled={processing || isMigrating}
                                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                    processing || isMigrating
                                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}
                            >
                                Migrar Seleccionados ({selectedProducts.length})
                            </button>
                        )}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                {completed ? 
                                    (error ? 'Error en la migración' : '¡Migración completada!') 
                                    : 'Migrando productos...'}
                            </h3>

                            {error && (
                                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                                    {error}
                                </div>
                            )}

                            {successMessage && (
                                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                                    {successMessage}
                                </div>
                            )}

                            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden mb-4">
                                <motion.div
                                    className={`h-full ${
                                        error ? 'bg-red-500' : 
                                        completed ? 'bg-green-500' : 'bg-indigo-600'
                                    }`}
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ ease: "easeInOut", duration: 0.3 }}
                                />
                            </div>

                            <div className="flex justify-center mt-4">
                                {completed ? (
                                    error ? (
                                        <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    ) : (
                                        <Check className="h-10 w-10 text-green-500" />
                                    )
                                ) : (
                                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                                )}
                            </div>

                            <div className="flex justify-end mt-6">
                                <button
                                    onClick={closeModal}
                                    className="px-4 py-2 rounded-md text-sm font-medium bg-gray-200 hover:bg-gray-300"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
