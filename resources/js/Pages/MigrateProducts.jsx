import { useForm, usePage, Link, router } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import { Check, Upload, Loader2, Link as LinkIcon, PenLine, Images } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FALLBACK_IMAGE = "/images/placeholder-product.png";

const buildImageOptions = (product) => {
    const seen = new Set();
    const urls = [];
    const pushUrl = (value) => {
        const url = (value || "").trim();
        if (!url || seen.has(url)) return;
        seen.add(url);
        urls.push(url);
    };
    pushUrl(product?.image_url);
    if (Array.isArray(product?.images)) {
        product.images.forEach((image) => {
            if (image) pushUrl(image.image_url);
        });
    }
    return urls;
};

const getCsrfToken = () => {
    if (typeof document === "undefined") return "";
    return document.querySelector('meta[name="csrf-token"]')?.content || "";
};

const parseImagesText = (value) =>
    value
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

export default function MigrateProducts() {
    const {
        temporaryProducts = [],
        existingProducts: existingProductsProp = [],
        categories = [],
        defaultStock = 0,
        defaultCategory = "",
    } = usePage().props;

    const { data, setData, processing, errors } = useForm({
        category_id: defaultCategory,
        stock: defaultStock,
    });

    const [existingProducts, setExistingProducts] = useState(existingProductsProp);
    const [editableProducts, setEditableProducts] = useState({});
    const [selectedAll, setSelectedAll] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [primaryImages, setPrimaryImages] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [progress, setProgress] = useState(0);
    const [completed, setCompleted] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isMigrating, setIsMigrating] = useState(false);

    const [editingProductId, setEditingProductId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [editingMainImage, setEditingMainImage] = useState("");
    const [newImagesText, setNewImagesText] = useState("");
    const [existingFeedback, setExistingFeedback] = useState(null);
    const [existingError, setExistingError] = useState(null);
    const [updatingExisting, setUpdatingExisting] = useState(false);
    const [addingImages, setAddingImages] = useState(false);

    const [activeTab, setActiveTab] = useState('migration');
    useEffect(() => {
        setExistingProducts(existingProductsProp);
    }, [existingProductsProp]);

    const imageOptionsByTempProduct = useMemo(() => {
        const map = {};
        temporaryProducts.forEach((product) => {
            map[product.id] = buildImageOptions(product);
        });
        return map;
    }, [temporaryProducts]);

    const imageOptionsByExistingProduct = useMemo(() => {
        const map = {};
        existingProducts.forEach((product) => {
            map[product.id] = buildImageOptions(product);
        });
        return map;
    }, [existingProducts]);

    useEffect(() => {
        setPrimaryImages((prev) => {
            const next = {};
            temporaryProducts.forEach((product) => {
                const options = imageOptionsByTempProduct[product.id] || [];
                if (options.length === 0) {
                    return;
                }
                const current = prev[product.id];
                next[product.id] = current && options.includes(current) ? current : options[0];
            });
            return next;
        });
    }, [temporaryProducts, imageOptionsByTempProduct]);

    useEffect(() => {
        setSelectedProducts((prev) =>
            prev.filter((id) => temporaryProducts.some((product) => product.id === id))
        );
        setSelectedAll(false);
    }, [temporaryProducts]);

    const editingProduct = useMemo(
        () => existingProducts.find((product) => product.id === editingProductId) || null,
        [existingProducts, editingProductId]
    );

    useEffect(() => {
        if (editingProduct) {
            setEditingName(editingProduct.name || "");
            setEditingMainImage(editingProduct.image_url || "");
            setNewImagesText("");
            setExistingFeedback(null);
            setExistingError(null);
        } else {
            setEditingName("");
            setEditingMainImage("");
            setNewImagesText("");
            setExistingFeedback(null);
            setExistingError(null);
        }
    }, [editingProduct]);
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

    const closeModal = () => {
        if (!completed) {
            return;
        }
        setShowModal(false);
        resetMigration();
    };

    const handleNameChange = (id, value) => {
        setEditableProducts((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    const handlePrimarySelect = (productId, url) => {
        if (!url) {
            return;
        }
        setPrimaryImages((prev) => ({
            ...prev,
            [productId]: url,
        }));
    };

    const toggleProductSelection = (id) => {
        setSelectedProducts((prev) =>
            prev.includes(id) ? prev.filter((productId) => productId !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedAll) {
            setSelectedProducts([]);
            setSelectedAll(false);
            return;
        }
        const allIds = temporaryProducts.map((product) => product.id);
        setSelectedProducts(allIds);
        setSelectedAll(true);
    };

    const normalizeStock = () => {
        const parsed = parseInt(data.stock, 10);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const migrateProductRequest = async (productId) => {
        const token = getCsrfToken();
        const payload = {
            category_id: data.category_id,
            stock: normalizeStock(),
        };

        const name = editableProducts[productId]?.trim();
        if (name) {
            payload.name = name;
        }

        const primaryUrl = primaryImages[productId];
        if (primaryUrl) {
            payload.image_url = primaryUrl;
        }

        const response = await fetch(`/migrate-products/${productId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "X-Requested-With": "XMLHttpRequest",
                "X-CSRF-TOKEN": token,
            },
            credentials: "same-origin",
            body: JSON.stringify(payload),
        });

        let result = {};
        try {
            result = await response.json();
        } catch (parseError) {
            // ignore parse errors so we can still surface a generic error
        }

        if (!response.ok) {
            throw new Error(result.message || "Error al migrar el producto.");
        }

        return result;
    };

    const buildPrimaryOverrides = (productIds) => {
        const overrides = {};
        productIds.forEach((id) => {
            const primaryUrl = primaryImages[id];
            if (primaryUrl) {
                overrides[id] = primaryUrl;
            }
        });
        return overrides;
    };
    const handleMigrate = async (productId) => {
        startProgress();

        try {
            await migrateProductRequest(productId);
            setProgress(100);
            setSuccessMessage("Producto migrado con exito.");
            setCompleted(true);
            setSelectedProducts((prev) => prev.filter((id) => id !== productId));
            setSelectedAll(false);

            setTimeout(() => {
                router.reload({ only: ["temporaryProducts", "existingProducts"], preserveScroll: true });
            }, 600);
        } catch (err) {
            setProgress(100);
            setError(err.message || "Error al migrar el producto.");
            setCompleted(true);
        } finally {
            setIsMigrating(false);
        }
    };

    const handleMigrateSelected = async () => {
        if (selectedProducts.length === 0) {
            return;
        }

        startProgress();

        const total = selectedProducts.length;
        const errorsFound = [];
        let migratedCount = 0;

        for (let index = 0; index < total; index += 1) {
            const productId = selectedProducts[index];

            try {
                await migrateProductRequest(productId);
                migratedCount += 1;
            } catch (err) {
                errorsFound.push(
                    err?.message ? `ID ${productId}: ${err.message}` : `ID ${productId}: error desconocido`
                );
            }

            const percent = Math.round(((index + 1) / total) * 100);
            setProgress(percent);
        }

        if (migratedCount > 0) {
            const message =
                migratedCount === total
                    ? `Todos los productos (${migratedCount}) migrados con exito.`
                    : `${migratedCount} de ${total} productos migrados con exito.`;
            setSuccessMessage(message);
        }

        if (errorsFound.length > 0) {
            setError(errorsFound.join(" | "));
        }

        setCompleted(true);
        setIsMigrating(false);
        setSelectedProducts([]);
        setSelectedAll(false);

        if (migratedCount > 0) {
            setTimeout(() => {
                router.reload({ only: ["temporaryProducts", "existingProducts"], preserveScroll: true });
            }, 600);
        }
    };

    const handleBulkMigrate = async () => {
        if (temporaryProducts.length === 0) {
            return;
        }

        startProgress();

        try {
            const token = getCsrfToken();
            const productIds = temporaryProducts.map((product) => product.id);
            const primaryOverrides = buildPrimaryOverrides(productIds);

            const payload = {
                category_id: data.category_id,
                stock: normalizeStock(),
            };

            if (Object.keys(primaryOverrides).length > 0) {
                payload.primary_images = primaryOverrides;
            }

            const response = await fetch("/migrate-products/bulk", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    "X-CSRF-TOKEN": token,
                },
                credentials: "same-origin",
                body: JSON.stringify(payload),
            });

            let result = {};
            try {
                result = await response.json();
            } catch (parseError) {
                // ignore parse errors
            }

            if (!response.ok) {
                throw new Error(result.message || "Error al migrar los productos.");
            }

            setProgress(100);
            setSuccessMessage(result.message || "Migracion masiva completada.");
            if (Array.isArray(result.errors) && result.errors.length > 0) {
                setError(result.errors.join(" | "));
            }
            setCompleted(true);
            setSelectedProducts([]);
            setSelectedAll(false);

            setTimeout(() => {
                router.reload({ only: ["temporaryProducts", "existingProducts"], preserveScroll: true });
            }, 600);
        } catch (err) {
            setProgress(100);
            setError(err.message || "Error al migrar los productos.");
            setCompleted(true);
        } finally {
            setIsMigrating(false);
        }
    };
    const handleSelectExistingProduct = (productId) => {
        if (editingProductId === productId) {
            setEditingProductId(null);
            return;
        }
        setEditingProductId(productId);
    };

    const handleSaveExistingProduct = async () => {
        if (!editingProduct) {
            return;
        }

        setUpdatingExisting(true);
        setExistingError(null);
        setExistingFeedback(null);

        try {
            const token = getCsrfToken();
            const payload = {
                name: editingName.trim(),
                image_url: editingMainImage.trim(),
            };

            const response = await fetch(`/migrate-products/product/${editingProduct.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    "X-CSRF-TOKEN": token,
                },
                credentials: "same-origin",
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Error al actualizar el producto.");
            }

            setExistingFeedback(result.message || "Producto actualizado.");
            setExistingProducts((prev) =>
                prev.map((item) => (item.id === result.product.id ? result.product : item))
            );
        } catch (err) {
            setExistingError(err.message || "Error al actualizar el producto.");
        } finally {
            setUpdatingExisting(false);
        }
    };

    const handleAddImagesToExisting = async () => {
        if (!editingProduct) {
            return;
        }

        const images = parseImagesText(newImagesText);
        if (images.length === 0) {
            setExistingError("Agrega al menos una URL de imagen");
            return;
        }

        setAddingImages(true);
        setExistingError(null);
        setExistingFeedback(null);

        try {
            const token = getCsrfToken();
            const response = await fetch(`/migrate-products/product/${editingProduct.id}/images`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    "X-CSRF-TOKEN": token,
                },
                credentials: "same-origin",
                body: JSON.stringify({ images }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Error al agregar imagenes.");
            }

            setExistingFeedback(result.message || "Imagenes agregadas.");
            setExistingProducts((prev) =>
                prev.map((item) => (item.id === result.product.id ? result.product : item))
            );
            setNewImagesText("");
        } catch (err) {
            setExistingError(err.message || "Error al agregar imagenes.");
        } finally {
            setAddingImages(false);
        }
    };
    const renderPrimaryImageCell = (product) => {
        const options = imageOptionsByTempProduct[product.id] || [];
        const activeUrl = primaryImages[product.id] || options[0];
        const primaryUrl = activeUrl || FALLBACK_IMAGE;

        return (
            <td className="px-6 py-4">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Imagen principal</span>
                        {options.length > 1 && (
                            <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                                {options.length} opciones
                            </span>
                        )}
                    </div>

                    <div className="h-16 w-16 overflow-hidden rounded-md border border-gray-200 bg-white">
                        <img
                            src={primaryUrl}
                            alt={product.title}
                            className="h-full w-full object-cover"
                            onError={(event) => {
                                event.target.onerror = null;
                                event.target.src = FALLBACK_IMAGE;
                            }}
                        />
                    </div>

                    {options.length > 1 && (
                        <div className="flex max-w-xs gap-2 overflow-x-auto">
                            {options.map((url, index) => {
                                const isActive = url === activeUrl;
                                return (
                                    <button
                                        key={`${product.id}-${index}`}
                                        type="button"
                                        onClick={() => handlePrimarySelect(product.id, url)}
                                        className={`h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border ${
                                            isActive
                                                ? "border-indigo-500 ring-2 ring-indigo-400"
                                                : "border-gray-200"
                                        }`}
                                        disabled={isMigrating}
                                        title="Elegir como principal"
                                    >
                                        <img
                                            src={url}
                                            alt={`${product.title} alternativa ${index + 1}`}
                                            className="h-full w-full object-cover"
                                            onError={(event) => {
                                                event.target.onerror = null;
                                                event.target.src = FALLBACK_IMAGE;
                                            }}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </td>
        );
    };

    const renderTemporaryProductsTable = () => {
        if (temporaryProducts.length === 0) {
            return (
                <tbody>
                    <tr>
                        <td colSpan="6" className="px-6 py-6 text-center text-gray-500">
                            No hay productos temporales para migrar.
                        </td>
                    </tr>
                </tbody>
            );
        }

        return (
            <tbody className="divide-y divide-gray-100">
                {temporaryProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                            <input
                                type="checkbox"
                                checked={selectedProducts.includes(product.id)}
                                onChange={() => toggleProductSelection(product.id)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                disabled={isMigrating}
                            />
                        </td>
                        {renderPrimaryImageCell(product)}
                        <td className="px-6 py-4">
                            <input
                                type="text"
                                defaultValue={product.title}
                                onChange={(event) => handleNameChange(product.id, event.target.value)}
                                className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                disabled={isMigrating}
                            />
                        </td>
                        <td className="px-6 py-4 text-gray-700">{product.price}</td>
                        <td className="px-6 py-4">
                            {product.link ? (
                                <a
                                    href={product.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                                >
                                    Ver producto
                                </a>
                            ) : (
                                <span className="text-xs italic text-gray-400">Sin enlace</span>
                            )}
                        </td>
                        <td className="px-6 py-4 text-right">
                            <button
                                onClick={() => handleMigrate(product.id)}
                                disabled={processing || isMigrating}
                                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                                    processing || isMigrating
                                        ? "cursor-not-allowed bg-gray-400 text-gray-600"
                                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                                }`}
                            >
                                <Check className="h-4 w-4" />
                                Migrar
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        );
    };

    const renderExistingProductsTable = () => {
        if (existingProducts.length === 0) {
            return (
                <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-gray-500">
                    Todav�a no hay productos migrados.
                </div>
            );
        }

        return (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Producto
                            </th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Imagenes
                            </th>
                            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {existingProducts.map((product) => {
                            const isActive = editingProductId === product.id;
                            const imageUrl = product.image_url || FALLBACK_IMAGE;
                            const imagesCount = Array.isArray(product.images) ? product.images.length : 0;

                            return (
                                <tr key={product.id} className={isActive ? "bg-indigo-50/40" : "hover:bg-gray-50"}>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                                <img
                                                    src={imageUrl}
                                                    alt={product.name}
                                                    className="h-full w-full object-cover"
                                                    onError={(event) => {
                                                        event.target.onerror = null;
                                                        event.target.src = FALLBACK_IMAGE;
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800">{product.name}</p>
                                                <p className="text-xs text-gray-500">ID #{product.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Images className="h-4 w-4 text-indigo-500" />
                                            <span>{imagesCount} imagen{imagesCount === 1 ? "" : "es"}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <button
                                            onClick={() => handleSelectExistingProduct(product.id)}
                                            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                                                isActive
                                                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                        >
                                            <PenLine className="h-4 w-4" />
                                            {isActive ? "Cerrar" : "Editar"}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderExistingEditor = () => {
        if (!editingProduct) {
            return (
                <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-gray-500">
                    Selecciona un producto para editarlo y agregar nuevas imagenes.
                </div>
            );
        }

        const options = imageOptionsByExistingProduct[editingProduct.id] || [];

        return (
            <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow">
                <div>
                    <h4 className="text-lg font-semibold text-gray-800">Editar producto</h4>
                    <p className="text-sm text-gray-500">Actualiza el nombre o selecciona una nueva imagen principal.</p>
                </div>

                {existingError && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {existingError}
                    </div>
                )}

                {existingFeedback && (
                    <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                        {existingFeedback}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600">Nombre</label>
                    <input
                        type="text"
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        disabled={updatingExisting}
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-600">Imagen principal</label>
                    <div className="flex items-center gap-3">
                        <div className="h-16 w-16 overflow-hidden rounded-md border border-gray-200">
                            <img
                                src={editingMainImage || FALLBACK_IMAGE}
                                alt={editingProduct.name}
                                className="h-full w-full object-cover"
                                onError={(event) => {
                                    event.target.onerror = null;
                                    event.target.src = FALLBACK_IMAGE;
                                }}
                            />
                        </div>
                        <input
                            type="text"
                            value={editingMainImage}
                            onChange={(event) => setEditingMainImage(event.target.value)}
                            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="URL de la imagen principal"
                            disabled={updatingExisting}
                        />
                    </div>

                    {options.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {options.map((url, index) => {
                                const isActive = url === editingMainImage;
                                return (
                                    <button
                                        key={`${editingProduct.id}-option-${index}`}
                                        type="button"
                                        onClick={() => setEditingMainImage(url)}
                                        className={`h-14 w-14 overflow-hidden rounded-md border ${
                                            isActive
                                                ? "border-indigo-500 ring-2 ring-indigo-400"
                                                : "border-gray-200"
                                        }`}
                                        disabled={updatingExisting}
                                    >
                                        <img
                                            src={url}
                                            alt={`Opcion ${index + 1}`}
                                            className="h-full w-full object-cover"
                                            onError={(event) => {
                                                event.target.onerror = null;
                                                event.target.src = FALLBACK_IMAGE;
                                            }}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSaveExistingProduct}
                        disabled={updatingExisting || editingName.trim().length === 0}
                        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
                            updatingExisting || editingName.trim().length === 0
                                ? "cursor-not-allowed bg-gray-400"
                                : "bg-indigo-600 hover:bg-indigo-700"
                        }`}
                    >
                        <PenLine className="h-4 w-4" />
                        Guardar cambios
                    </button>
                </div>

                <div className="border-t border-gray-200 pt-4">
                    <h5 className="text-sm font-semibold text-gray-700">Agregar nuevas imagenes</h5>
                    <p className="text-xs text-gray-500">
                        Ingresa una URL por linea (o separadas por comas). Se ignorar�n duplicados automaticamente.
                    </p>
                    <textarea
                        value={newImagesText}
                        onChange={(event) => setNewImagesText(event.target.value)}
                        className="mt-2 h-24 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="https://...\nhttps://..."
                        disabled={addingImages}
                    />
                    <div className="mt-3 flex justify-end">
                        <button
                            onClick={handleAddImagesToExisting}
                            disabled={addingImages}
                            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
                                addingImages ? "cursor-not-allowed bg-gray-400" : "bg-emerald-600 hover:bg-emerald-700"
                            }`}
                        >
                            <Images className="h-4 w-4" />
                            Agregar imagenes
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    const tabs = [
        { id: 'migration', label: 'Migracion' },
        { id: 'existing', label: 'Productos migrados' },
    ];
    return (
        <>
            <div className="mx-auto mt-10 max-w-7xl space-y-10 rounded-2xl bg-gradient-to-br from-white to-gray-50 p-6 shadow-xl">
                <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-gray-800">Panel de Migracion</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Migra productos temporales y gestiona los ya creados desde un solo lugar.
                        </p>
                    </div>
                    <Link
                        href="/agregador-enlaces"
                        className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                        <LinkIcon className="h-4 w-4" />
                        Ir al Agregador de Enlaces
                    </Link>
                </div>

                <div className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-3">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                                    isActive
                                        ? 'bg-indigo-600 text-white shadow'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {activeTab === 'migration' && (
                    <section className="space-y-8">
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow">
                            <h2 className="mb-6 text-xl font-medium text-gray-700">Configuraci�n de Migracion</h2>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-600">Categor�a</label>
                                    <select
                                        value={data.category_id}
                                        onChange={(event) => setData('category_id', event.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        disabled={isMigrating}
                                    >
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.category_id && (
                                        <p className="mt-1 text-sm text-red-500">{errors.category_id}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-600">Stock por defecto</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.stock}
                                        onChange={(event) => setData('stock', event.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        disabled={isMigrating}
                                    />
                                    {errors.stock && <p className="mt-1 text-sm text-red-500">{errors.stock}</p>}
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={handleBulkMigrate}
                                        disabled={processing || temporaryProducts.length === 0 || isMigrating}
                                        className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 font-semibold text-white transition ${
                                            processing || temporaryProducts.length === 0 || isMigrating
                                                ? 'cursor-not-allowed bg-gray-400'
                                                : 'bg-indigo-600 hover:bg-indigo-700'
                                        }`}
                                    >
                                        <Upload className="h-4 w-4" />
                                        Migrar todo
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            <input
                                                type="checkbox"
                                                checked={selectedAll && selectedProducts.length === temporaryProducts.length && temporaryProducts.length > 0}
                                                onChange={toggleSelectAll}
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                disabled={isMigrating || temporaryProducts.length === 0}
                                            />
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Imagenes
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Nombre
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Precio
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Enlace
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                {renderTemporaryProductsTable()}
                            </table>
                        </div>

                        {temporaryProducts.length > 0 && (
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-600">
                                    {selectedProducts.length > 0
                                        ? `${selectedProducts.length} productos seleccionados`
                                        : `${temporaryProducts.length} productos disponibles`}
                                </p>

                                {selectedProducts.length > 0 && (
                                    <button
                                        onClick={handleMigrateSelected}
                                        disabled={processing || isMigrating}
                                        className={`rounded-lg px-4 py-2 text-sm font-medium ${
                                            processing || isMigrating
                                                ? 'cursor-not-allowed bg-gray-400 text-gray-600'
                                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                        }`}
                                    >
                                        Migrar seleccionados ({selectedProducts.length})
                                    </button>
                                )}
                            </div>
                        )}
                    </section>
                )}

                {activeTab === 'existing' && (
                    <section className="space-y-8">
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow">
                            <h2 className="text-xl font-medium text-gray-700">Productos en la base de datos</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Selecciona un producto para editar su informaci�n o agregar Imagenes adicionales.
                            </p>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-3">
                            <div className="lg:col-span-2 space-y-4">{renderExistingProductsTable()}</div>
                            <div>{renderExistingEditor()}</div>
                        </div>
                    </section>
                )}
            </div>

            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <h3 className="mb-4 text-lg font-semibold text-gray-800">
                                {completed ? (error ? "Error en la migracion" : "Migracion completada") : "Migrando productos..."}
                            </h3>

                            {error && (
                                <div className="mb-4 rounded-md bg-red-100 p-3 text-sm text-red-700">{error}</div>
                            )}

                            {successMessage && (
                                <div className="mb-4 rounded-md bg-green-100 p-3 text-sm text-green-700">
                                    {successMessage}
                                </div>
                            )}

                            <div className="mb-4 h-4 w-full overflow-hidden rounded-full bg-gray-200">
                                <motion.div
                                    className={`h-full ${
                                        error ? 'bg-red-500' : completed ? 'bg-green-500' : 'bg-indigo-600'
                                    }`}
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ ease: 'easeInOut', duration: 0.3 }}
                                />
                            </div>

                            <div className="mt-4 flex justify-center">
                                {completed ? (
                                    error ? (
                                        <svg
                                            className="h-10 w-10 text-red-500"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    ) : (
                                        <Check className="h-10 w-10 text-green-500" />
                                    )
                                ) : (
                                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                                )}
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={closeModal}
                                    disabled={!completed}
                                    className={`rounded-md px-4 py-2 text-sm font-medium ${
                                        completed
                                            ? 'bg-gray-200 hover:bg-gray-300'
                                            : 'cursor-not-allowed bg-gray-100 text-gray-400'
                                    }`}
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
