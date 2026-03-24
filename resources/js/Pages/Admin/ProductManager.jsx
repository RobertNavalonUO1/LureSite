import AdminWorkspaceLayout from '@/Layouts/AdminWorkspaceLayout.jsx';
import Modal from '@/Components/ui/Modal.jsx';
import StatsCard from '@/Components/Admin/StatsCard.jsx';
import { useToastStack } from '@/hooks/useToastStack.js';
import ProfileToastRegion from '@/Pages/Profile/components/ProfileToastRegion.jsx';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const DEFAULT_FORM = {
    name: '',
    description: '',
    price: '',
    image_url: '',
    stock: 0,
    category_id: '',
    is_adult: false,
    link: '',
    discount: 0,
    commercial_state: 'base',
};

const DEFAULT_BULK = {
    category_id: '',
    commercial_state: '',
    price_action: 'delta_percent',
    price_value: '',
};

const SCRIPTS_WITH_MENU = {
    'scripy_web.py': [
        { value: 'listado', label: 'Extraer productos del listado' },
        { value: 'detalle', label: 'Agregar imagenes desde ficha' },
    ],
    'scripy.py': [
        { value: 'listado', label: 'Extraer tarjetas del listado' },
        { value: 'detalle', label: 'Analizar ficha de producto' },
    ],
};

const numberFormatter = new Intl.NumberFormat('es-ES');

const currencyFormatter = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
});

const stateLabels = {
    base: 'Base',
    featured: 'Destacado',
    superdeal: 'Superdeal',
    fast_shipping: 'Envio rapido',
    new_arrival: 'Nuevo',
    seasonal: 'Estacional',
};

function getCsrfToken() {
    if (typeof document === 'undefined') {
        return '';
    }

    return document.querySelector('meta[name="csrf-token"]')?.content || '';
}

async function requestJson(url, options = {}) {
    const headers = {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
    };

    const csrfToken = getCsrfToken();
    if (csrfToken) {
        headers['X-CSRF-TOKEN'] = csrfToken;
        headers['X-Requested-With'] = 'XMLHttpRequest';
    }

    const response = await fetch(url, {
        credentials: 'same-origin',
        ...options,
        headers,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        const error = new Error(payload?.message || 'No se pudo completar la solicitud.');
        error.status = response.status;
        error.payload = payload;
        throw error;
    }

    return payload;
}

function buildQuery(filters, page = 1) {
    const params = new URLSearchParams();

    if (filters.search) params.set('search', filters.search);
    if (filters.category_id) params.set('category_id', filters.category_id);
    if (filters.price_min) params.set('price_min', filters.price_min);
    if (filters.price_max) params.set('price_max', filters.price_max);
    params.set('page', String(page));
    params.set('per_page', String(filters.per_page || 10));

    return params.toString();
}

function formatPrice(value) {
    return currencyFormatter.format(Number(value || 0));
}

function ProductFormFields({
    form,
    categories,
    commercialStates,
    errors,
    onChange,
}) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
                <input
                    type="text"
                    value={form.name}
                    onChange={(event) => onChange('name', event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
                {errors.name ? <p className="mt-1 text-sm text-rose-600">{errors.name}</p> : null}
            </div>

            <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Descripcion</label>
                <textarea
                    rows={4}
                    value={form.description}
                    onChange={(event) => onChange('description', event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
                {errors.description ? <p className="mt-1 text-sm text-rose-600">{errors.description}</p> : null}
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Precio</label>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) => onChange('price', event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
                {errors.price ? <p className="mt-1 text-sm text-rose-600">{errors.price}</p> : null}
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Stock</label>
                <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(event) => onChange('stock', event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
                {errors.stock ? <p className="mt-1 text-sm text-rose-600">{errors.stock}</p> : null}
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Categoria</label>
                <select
                    value={form.category_id}
                    onChange={(event) => onChange('category_id', event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                >
                    <option value="">Selecciona una categoria</option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>
                {errors.category_id ? <p className="mt-1 text-sm text-rose-600">{errors.category_id}</p> : null}
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Estado comercial</label>
                <select
                    value={form.commercial_state}
                    onChange={(event) => onChange('commercial_state', event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                >
                    {commercialStates.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Descuento (%)</label>
                <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.discount}
                    onChange={(event) => onChange('discount', event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
                {errors.discount ? <p className="mt-1 text-sm text-rose-600">{errors.discount}</p> : null}
            </div>

            <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">URL de imagen</label>
                <input
                    type="url"
                    value={form.image_url}
                    onChange={(event) => onChange('image_url', event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
                {errors.image_url ? <p className="mt-1 text-sm text-rose-600">{errors.image_url}</p> : null}
            </div>

            <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Enlace</label>
                <input
                    type="url"
                    value={form.link}
                    onChange={(event) => onChange('link', event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
                {errors.link ? <p className="mt-1 text-sm text-rose-600">{errors.link}</p> : null}
            </div>

            <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 md:col-span-2">
                <input
                    type="checkbox"
                    checked={form.is_adult}
                    onChange={(event) => onChange('is_adult', event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-300"
                />
                Marcar como producto para adultos
            </label>
        </div>
    );
}

export default function ProductManager({
    initialProducts,
    initialStats,
    filters: initialFilters,
    categories,
    commercialStates,
}) {
    const { flash } = usePage().props;
    const { toasts, addToast, dismissToast } = useToastStack();

    const [products, setProducts] = useState(initialProducts);
    const [stats, setStats] = useState(initialStats);
    const [filters, setFilters] = useState({
        search: initialFilters.search || '',
        category_id: initialFilters.category_id ? String(initialFilters.category_id) : '',
        price_min: initialFilters.price_min ?? '',
        price_max: initialFilters.price_max ?? '',
        per_page: initialFilters.per_page || 10,
    });
    const [selectedIds, setSelectedIds] = useState([]);
    const [listLoading, setListLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(DEFAULT_FORM);
    const [formErrors, setFormErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [bulkForm, setBulkForm] = useState(DEFAULT_BULK);
    const [scripts, setScripts] = useState([]);
    const [script, setScript] = useState('');
    const [scriptMode, setScriptMode] = useState('');
    const [scriptHtml, setScriptHtml] = useState('');
    const [scriptLoading, setScriptLoading] = useState(false);
    const [scriptProducts, setScriptProducts] = useState([]);
    const [scriptDetected, setScriptDetected] = useState([]);
    const [scriptStatus, setScriptStatus] = useState('');
    const [scriptImporting, setScriptImporting] = useState(false);

    useEffect(() => {
        if (flash?.success) {
            addToast({ type: 'success', title: 'Operacion completada', message: flash.success });
        }

        if (flash?.error) {
            addToast({ type: 'error', title: 'Operacion fallida', message: flash.error });
        }
    }, [flash?.error, flash?.success, addToast]);

    useEffect(() => {
        let cancelled = false;

        requestJson('/api/scripts')
            .then((payload) => {
                if (cancelled || !Array.isArray(payload)) {
                    return;
                }

                setScripts(payload);
                const preferred = payload.includes('scripy_web.py') ? 'scripy_web.py' : (payload[0] || '');
                setScript(preferred);
            })
            .catch(() => {
                if (!cancelled) {
                    addToast({ type: 'error', title: 'Scripts no disponibles', message: 'No se pudo cargar la lista de scripts autorizados.' });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [addToast]);

    useEffect(() => {
        const options = SCRIPTS_WITH_MENU[script] || [];
        setScriptMode(options[0]?.value || '');
    }, [script]);

    const loadProducts = async (page = 1, overrideFilters = filters) => {
        setListLoading(true);

        try {
            const query = buildQuery(overrideFilters, page);
            const payload = await requestJson(`/api/admin/products?${query}`);

            setProducts(payload.products);
            setStats(payload.stats);
            setSelectedIds([]);
        } catch (error) {
            addToast({ type: 'error', title: 'No se pudo actualizar', message: error.message });
        } finally {
            setListLoading(false);
        }
    };

    const openCreateModal = () => {
        setModalMode('create');
        setEditingId(null);
        setForm({
            ...DEFAULT_FORM,
            category_id: categories[0]?.id ? String(categories[0].id) : '',
        });
        setFormErrors({});
        setModalOpen(true);
    };

    const openEditModal = (product) => {
        setModalMode('edit');
        setEditingId(product.id);
        setForm({
            name: product.name || '',
            description: product.description || '',
            price: product.price ?? '',
            image_url: product.image_url || '',
            stock: product.stock ?? 0,
            category_id: product.category?.id ? String(product.category.id) : '',
            is_adult: Boolean(product.is_adult),
            link: product.link || '',
            discount: product.discount ?? 0,
            commercial_state: product.commercial_state || 'base',
        });
        setFormErrors({});
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setFormErrors({});
    };

    const handleFormChange = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setFormErrors({});

        try {
            const body = JSON.stringify({
                ...form,
                category_id: form.category_id ? Number(form.category_id) : null,
                price: form.price === '' ? '' : Number(form.price),
                stock: form.stock === '' ? 0 : Number(form.stock),
                discount: form.discount === '' ? 0 : Number(form.discount),
            });

            const url = modalMode === 'create'
                ? '/api/admin/products'
                : `/api/admin/products/${editingId}`;

            const method = modalMode === 'create' ? 'POST' : 'PUT';

            const payload = await requestJson(url, {
                method,
                body,
            });

            addToast({
                type: 'success',
                title: modalMode === 'create' ? 'Producto creado' : 'Producto actualizado',
                message: payload.message,
            });

            setStats(payload.stats || stats);
            closeModal();
            await loadProducts(products.meta.current_page || 1);
        } catch (error) {
            if (error.status === 422 && error.payload?.errors) {
                const nextErrors = {};
                Object.entries(error.payload.errors).forEach(([key, value]) => {
                    nextErrors[key] = Array.isArray(value) ? value[0] : value;
                });
                setFormErrors(nextErrors);
            } else {
                addToast({ type: 'error', title: 'No se pudo guardar', message: error.message });
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (product) => {
        if (!window.confirm(`¿Eliminar el producto "${product.name}"?`)) {
            return;
        }

        try {
            const payload = await requestJson(`/api/admin/products/${product.id}`, {
                method: 'DELETE',
            });

            addToast({ type: 'success', title: 'Producto eliminado', message: payload.message });
            setStats(payload.stats || stats);
            await loadProducts(products.meta.current_page || 1);
        } catch (error) {
            addToast({ type: 'error', title: 'No se pudo eliminar', message: error.message });
        }
    };

    const handleApplyFilters = async (event) => {
        event.preventDefault();
        await loadProducts(1);
    };

    const handleClearFilters = async () => {
        const nextFilters = {
            search: '',
            category_id: '',
            price_min: '',
            price_max: '',
            per_page: filters.per_page,
        };

        setFilters(nextFilters);
        await loadProducts(1, nextFilters);
    };

    const toggleSelection = (productId) => {
        setSelectedIds((current) =>
            current.includes(productId)
                ? current.filter((id) => id !== productId)
                : [...current, productId]
        );
    };

    const toggleAll = () => {
        const currentPageIds = products.data.map((product) => product.id);

        if (currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.includes(id))) {
            setSelectedIds((current) => current.filter((id) => !currentPageIds.includes(id)));
            return;
        }

        setSelectedIds((current) => Array.from(new Set([...current, ...currentPageIds])));
    };

    const applyBulkUpdate = async () => {
        try {
            const payload = await requestJson('/api/admin/products/bulk-update', {
                method: 'POST',
                body: JSON.stringify({
                    ids: selectedIds,
                    category_id: bulkForm.category_id ? Number(bulkForm.category_id) : null,
                    commercial_state: bulkForm.commercial_state || null,
                    price_action: bulkForm.price_value === '' ? null : bulkForm.price_action,
                    price_value: bulkForm.price_value === '' ? null : Number(bulkForm.price_value),
                }),
            });

            addToast({ type: 'success', title: 'Cambios aplicados', message: payload.message });
            setStats(payload.stats || stats);
            await loadProducts(products.meta.current_page || 1);
        } catch (error) {
            if (error.status === 422) {
                addToast({ type: 'error', title: 'Bulk edit incompleto', message: error.payload?.message || error.message });
            } else {
                addToast({ type: 'error', title: 'No se pudo aplicar', message: error.message });
            }
        }
    };

    const applyBulkDelete = async () => {
        if (!window.confirm(`¿Eliminar ${selectedIds.length} producto(s)?`)) {
            return;
        }

        try {
            const payload = await requestJson('/api/admin/products/bulk-delete', {
                method: 'POST',
                body: JSON.stringify({ ids: selectedIds }),
            });

            addToast({ type: 'success', title: 'Seleccion eliminada', message: payload.message });
            setStats(payload.stats || stats);
            await loadProducts(products.meta.current_page || 1);
        } catch (error) {
            addToast({ type: 'error', title: 'No se pudo eliminar', message: error.message });
        }
    };

    const runScript = async () => {
        if (!script) {
            return;
        }

        setScriptLoading(true);
        setScriptStatus('');
        setScriptProducts([]);
        setScriptDetected([]);

        try {
            const body = {
                script,
                input: scriptHtml,
            };

            if ((SCRIPTS_WITH_MENU[script] || []).length > 0 && scriptMode) {
                body.menu_option = scriptMode;
            }

            const payload = await requestJson('/run-script', {
                method: 'POST',
                body: JSON.stringify(body),
            });

            setScriptProducts(Array.isArray(payload.products) ? payload.products : []);
            setScriptDetected(Array.isArray(payload.detectedProducts) ? payload.detectedProducts : []);
            setScriptStatus(payload.output || `Extraccion completada con ${payload.products?.length || 0} resultado(s).`);
            addToast({ type: 'success', title: 'Extraccion lista', message: 'Puedes revisar el resumen e importar a temporales.' });
        } catch (error) {
            setScriptStatus(error.message);
            addToast({ type: 'error', title: 'Extraccion fallida', message: error.message });
        } finally {
            setScriptLoading(false);
        }
    };

    const importTemporaryProducts = async () => {
        if (scriptProducts.length === 0) {
            return;
        }

        setScriptImporting(true);

        try {
            const payload = await requestJson('/admin/temporary-products/import', {
                method: 'POST',
                body: JSON.stringify({ products: scriptProducts }),
            });

            addToast({
                type: 'success',
                title: 'Importacion completada',
                message: `Se guardaron ${payload.created || 0} productos temporales.`,
            });
            await loadProducts(products.meta.current_page || 1);
        } catch (error) {
            addToast({ type: 'error', title: 'No se pudo importar', message: error.message });
        } finally {
            setScriptImporting(false);
        }
    };

    const allCurrentSelected = products.data.length > 0 && products.data.every((product) => selectedIds.includes(product.id));

    return (
        <AdminWorkspaceLayout
            title="Panel de Gestion de Productos"
            description="Centraliza inventario, operaciones masivas y extraccion desde una sola vista. La UX prioriza acciones rapidas, contexto visible y navegacion consistente entre agregador, alta y migracion."
            actions={(
                <>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                        Nuevo producto
                    </button>
                    <Link
                        href="/migrate-products"
                        className="inline-flex items-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                        Ir a migracion
                    </Link>
                </>
            )}
        >
            <ProfileToastRegion toasts={toasts} onDismiss={dismissToast} />

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatsCard
                    label="Productos activos"
                    value={numberFormatter.format(stats.active_products || 0)}
                    helper="Catalogo principal disponible para venta y mantenimiento."
                    tone="slate"
                />
                <StatsCard
                    label="Temporales"
                    value={numberFormatter.format(stats.temporary_products || 0)}
                    helper="Pendientes de revision o migracion desde los scrapers."
                    tone="amber"
                />
                <StatsCard
                    label="Categorias"
                    value={numberFormatter.format(stats.categories || 0)}
                    helper="Taxonomia lista para filtros y asignacion rapida."
                    tone="emerald"
                />
                <StatsCard
                    label="Enlaces importados"
                    value={numberFormatter.format(stats.imported_links || 0)}
                    helper="Suma de productos enlazados y temporales capturados."
                    tone="rose"
                />
            </section>

            <section className="mt-8 grid gap-6 xl:grid-cols-[1.45fr,0.95fr]">
                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                Gestion de base de datos
                            </p>
                            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                                Inventario filtrable y acciones masivas
                            </h2>
                        </div>
                        <p className="text-sm text-slate-500">
                            {products.meta.from || 0}-{products.meta.to || 0} de {products.meta.total || 0} resultados
                        </p>
                    </div>

                    <form onSubmit={handleApplyFilters} className="mt-6 grid gap-3 lg:grid-cols-[1.4fr,1fr,0.8fr,0.8fr,auto]">
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                            placeholder="Buscar por nombre, descripcion o categoria"
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                            aria-label="Buscar productos"
                        />
                        <select
                            value={filters.category_id}
                            onChange={(event) => setFilters((current) => ({ ...current, category_id: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                            aria-label="Filtrar por categoria"
                        >
                            <option value="">Todas las categorias</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={filters.price_min}
                            onChange={(event) => setFilters((current) => ({ ...current, price_min: event.target.value }))}
                            placeholder="Precio min"
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                            aria-label="Precio minimo"
                        />
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={filters.price_max}
                            onChange={(event) => setFilters((current) => ({ ...current, price_max: event.target.value }))}
                            placeholder="Precio max"
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                            aria-label="Precio maximo"
                        />
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                                Buscar
                            </button>
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                                Limpiar
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Edicion masiva</p>
                                <p className="text-sm text-slate-500">
                                    Seleccionados: {selectedIds.length}. Ajusta categoria, precio o estado en una sola operacion.
                                </p>
                            </div>
                            <div className="grid gap-3 md:grid-cols-4">
                                <select
                                    value={bulkForm.category_id}
                                    onChange={(event) => setBulkForm((current) => ({ ...current, category_id: event.target.value }))}
                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                                    disabled={selectedIds.length === 0}
                                >
                                    <option value="">Sin cambio de categoria</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={bulkForm.commercial_state}
                                    onChange={(event) => setBulkForm((current) => ({ ...current, commercial_state: event.target.value }))}
                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                                    disabled={selectedIds.length === 0}
                                >
                                    <option value="">Sin cambio de estado</option>
                                    {commercialStates.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="grid grid-cols-[1fr,0.9fr] gap-2">
                                    <select
                                        value={bulkForm.price_action}
                                        onChange={(event) => setBulkForm((current) => ({ ...current, price_action: event.target.value }))}
                                        className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                                        disabled={selectedIds.length === 0}
                                    >
                                        <option value="delta_percent">% precio</option>
                                        <option value="delta_fixed">+/- fijo</option>
                                        <option value="set">Precio final</option>
                                    </select>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={bulkForm.price_value}
                                        onChange={(event) => setBulkForm((current) => ({ ...current, price_value: event.target.value }))}
                                        placeholder="Valor"
                                        className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                                        disabled={selectedIds.length === 0}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={applyBulkUpdate}
                                        disabled={selectedIds.length === 0}
                                        className="rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-amber-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                                    >
                                        Aplicar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={applyBulkDelete}
                                        disabled={selectedIds.length === 0}
                                        className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                                    >
                                        Borrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
                        <div className="hidden overflow-x-auto lg:block">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                    <tr>
                                        <th className="px-4 py-4">
                                            <input
                                                type="checkbox"
                                                checked={allCurrentSelected}
                                                onChange={toggleAll}
                                                className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-300"
                                                aria-label="Seleccionar productos visibles"
                                            />
                                        </th>
                                        <th className="px-4 py-4">Producto</th>
                                        <th className="px-4 py-4">Categoria</th>
                                        <th className="px-4 py-4">Precio</th>
                                        <th className="px-4 py-4">Stock</th>
                                        <th className="px-4 py-4">Estado</th>
                                        <th className="px-4 py-4">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {products.data.map((product) => (
                                        <tr key={product.id} className="align-top transition hover:bg-amber-50/40">
                                            <td className="px-4 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(product.id)}
                                                    onChange={() => toggleSelection(product.id)}
                                                    className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-300"
                                                    aria-label={`Seleccionar ${product.name}`}
                                                />
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex gap-3">
                                                    <div className="h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                                                        {product.image_url ? (
                                                            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                                                        ) : null}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-slate-900">{product.name}</p>
                                                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                                            {product.description || 'Sin descripcion.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-slate-600">{product.category?.name || 'Sin categoria'}</td>
                                            <td className="px-4 py-4 font-medium text-slate-900">{formatPrice(product.price)}</td>
                                            <td className="px-4 py-4 text-slate-600">{product.stock}</td>
                                            <td className="px-4 py-4">
                                                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                                                    {stateLabels[product.commercial_state] || product.commercial_state}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(product)}
                                                        className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(product)}
                                                        className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid gap-4 p-4 lg:hidden">
                            {products.data.map((product) => (
                                <article key={product.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(product.id)}
                                            onChange={() => toggleSelection(product.id)}
                                            className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-300"
                                            aria-label={`Seleccionar ${product.name}`}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-semibold text-slate-900">{product.name}</p>
                                                    <p className="text-sm text-slate-500">{product.category?.name || 'Sin categoria'}</p>
                                                </div>
                                                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                                                    {stateLabels[product.commercial_state] || product.commercial_state}
                                                </span>
                                            </div>
                                            <p className="mt-3 text-sm text-slate-600">{formatPrice(product.price)} · Stock {product.stock}</p>
                                            <div className="mt-4 flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(product)}
                                                    className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(product)}
                                                    className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {products.data.length === 0 ? (
                            <div className="border-t border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
                                No hay productos que coincidan con los filtros activos.
                            </div>
                        ) : null}

                        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm text-slate-500">
                                {listLoading ? 'Actualizando listado...' : 'Paginacion preparada para operaciones rapidas.'}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => loadProducts((products.meta.current_page || 1) - 1)}
                                    disabled={(products.meta.current_page || 1) <= 1 || listLoading}
                                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                                >
                                    Anterior
                                </button>
                                <button
                                    type="button"
                                    onClick={() => loadProducts((products.meta.current_page || 1) + 1)}
                                    disabled={(products.meta.current_page || 1) >= (products.meta.last_page || 1) || listLoading}
                                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <aside className="space-y-6">
                    <section className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                            Acceso rapido al scraper
                        </p>
                        <h2 className="mt-3 text-2xl font-semibold">Extraccion e importacion en 1 click</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                            Ejecuta un script, valida la salida y manda el resultado a temporales sin salir de esta pagina.
                        </p>

                        <div className="mt-5 space-y-3">
                            <select
                                value={script}
                                onChange={(event) => setScript(event.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/40"
                                aria-label="Seleccionar script"
                            >
                                {scripts.length === 0 ? <option value="">Sin scripts</option> : null}
                                {scripts.map((item) => (
                                    <option key={item} value={item} className="text-slate-900">
                                        {item}
                                    </option>
                                ))}
                            </select>

                            {(SCRIPTS_WITH_MENU[script] || []).length > 0 ? (
                                <select
                                    value={scriptMode}
                                    onChange={(event) => setScriptMode(event.target.value)}
                                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/40"
                                    aria-label="Seleccionar modo del script"
                                >
                                    {SCRIPTS_WITH_MENU[script].map((option) => (
                                        <option key={option.value} value={option.value} className="text-slate-900">
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            ) : null}

                            <textarea
                                rows={9}
                                value={scriptHtml}
                                onChange={(event) => setScriptHtml(event.target.value)}
                                placeholder="Pega aqui el HTML o bloque de producto que quieres procesar."
                                className="w-full rounded-[1.5rem] border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/40"
                            />

                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={runScript}
                                    disabled={scriptLoading || !script}
                                    className="rounded-full bg-amber-400 px-4 py-3 text-sm font-semibold text-amber-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-400"
                                >
                                    {scriptLoading ? 'Ejecutando...' : 'Ejecutar extraccion'}
                                </button>
                                <button
                                    type="button"
                                    onClick={importTemporaryProducts}
                                    disabled={scriptImporting || scriptProducts.length === 0}
                                    className="rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-400"
                                >
                                    {scriptImporting ? 'Importando...' : 'Importar a temporales'}
                                </button>
                            </div>
                        </div>

                        <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                            <p className="font-semibold text-white">Resultado rapido</p>
                            <p className="mt-2 text-slate-300">
                                {scriptStatus || 'La salida del scraper aparecera aqui para una validacion rapida.'}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-300">
                                <span className="rounded-full bg-white/10 px-3 py-1">
                                    Detectados: {scriptDetected.length}
                                </span>
                                <span className="rounded-full bg-white/10 px-3 py-1">
                                    Importables: {scriptProducts.length}
                                </span>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                            Flujo recomendado
                        </p>
                        <ol className="mt-4 space-y-4 text-sm text-slate-600">
                            <li className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                1. Ejecuta el scraper desde esta pagina o entra en el agregador completo si necesitas diagnostico ampliado.
                            </li>
                            <li className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                2. Revisa temporales y migra cuando los datos y las imagenes principales ya sean correctos.
                            </li>
                            <li className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                3. Ajusta inventario, categoria o estado comercial con filtros y bulk edit para acelerar la publicacion.
                            </li>
                        </ol>
                    </section>

                    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                            Muestras detectadas
                        </p>
                        <div className="mt-4 space-y-3">
                            {(scriptDetected.length > 0 ? scriptDetected : scriptProducts).slice(0, 3).map((item, index) => (
                                <article key={`${item.title || item.name || 'item'}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="font-semibold text-slate-900">{item.title || item.name || 'Producto sin titulo'}</p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {typeof item.price === 'number' ? formatPrice(item.price) : item.price || 'Precio no disponible'}
                                    </p>
                                </article>
                            ))}
                            {scriptDetected.length === 0 && scriptProducts.length === 0 ? (
                                <p className="text-sm text-slate-500">
                                    Aqui veras una muestra de los productos detectados antes de importarlos.
                                </p>
                            ) : null}
                        </div>
                    </section>
                </aside>
            </section>

            <Modal show={modalOpen} onClose={closeModal} maxWidth="2xl">
                <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                {modalMode === 'create' ? 'Alta rapida' : 'Edicion inline'}
                            </p>
                            <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                                {modalMode === 'create' ? 'Crear producto' : 'Editar producto'}
                            </h3>
                        </div>
                        <button
                            type="button"
                            onClick={closeModal}
                            className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                            Cerrar
                        </button>
                    </div>

                    <div className="mt-6">
                        <ProductFormFields
                            form={form}
                            categories={categories}
                            commercialStates={commercialStates}
                            errors={formErrors}
                            onChange={handleFormChange}
                        />
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                            {saving ? 'Guardando...' : modalMode === 'create' ? 'Crear producto' : 'Guardar cambios'}
                        </button>
                    </div>
                </form>
            </Modal>
        </AdminWorkspaceLayout>
    );
}