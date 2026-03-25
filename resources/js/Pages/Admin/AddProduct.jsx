import Modal from '@/Components/ui/Modal.jsx';
import AdminWorkspaceLayout from '@/Layouts/AdminWorkspaceLayout.jsx';
import { useToastStack } from '@/hooks/useToastStack.js';
import ProfileToastRegion from '@/Pages/Profile/components/ProfileToastRegion.jsx';
import { useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const currencyFormatter = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
});

const blankState = {
    name: '',
    description: '',
    price: '',
    image_url: '',
    stock: '',
    category_id: '',
    is_adult: false,
    link: '',
};

function validate(values) {
    const nextErrors = {};

    if (!String(values.name || '').trim()) {
        nextErrors.name = 'El nombre es obligatorio.';
    }

    if (values.price === '' || Number(values.price) < 0) {
        nextErrors.price = 'Introduce un precio valido.';
    }

    if (values.stock === '' || Number(values.stock) < 0) {
        nextErrors.stock = 'Introduce un stock valido.';
    }

    if (!values.category_id) {
        nextErrors.category_id = 'Selecciona una categoria.';
    }

    if (values.image_url) {
        try {
            new URL(values.image_url);
        } catch {
            nextErrors.image_url = 'La URL de imagen no es valida.';
        }
    }

    if (values.link) {
        try {
            new URL(values.link);
        } catch {
            nextErrors.link = 'El enlace del producto no es valido.';
        }
    }

    return nextErrors;
}

export default function AddProduct() {
    const { temporaryProducts = [], categories = [], flash } = usePage().props;
    const { toasts, addToast, dismissToast } = useToastStack();
    const [localErrors, setLocalErrors] = useState({});
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [selectedTempId, setSelectedTempId] = useState(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        ...blankState,
        category_id: categories[0]?.id ? String(categories[0].id) : '',
    });

    useEffect(() => {
        if (flash?.success) {
            addToast({ type: 'success', title: 'Producto guardado', message: flash.success });
        }

        if (flash?.error) {
            addToast({ type: 'error', title: 'No se pudo guardar', message: flash.error });
        }
    }, [flash?.error, flash?.success, addToast]);

    const previewCategory = useMemo(
        () => categories.find((category) => String(category.id) === String(data.category_id)),
        [categories, data.category_id]
    );

    const currentErrors = useMemo(() => ({
        ...errors,
        ...localErrors,
    }), [errors, localErrors]);

    const isFormReady = useMemo(() => Object.keys(validate(data)).length === 0, [data]);

    const updateField = (field, value) => {
        setData(field, value);
        clearErrors(field);
        setLocalErrors((current) => {
            const nextValues = { ...data, [field]: value };
            return validate(nextValues);
        });
    };

    const resetForm = () => {
        reset();
        setData('category_id', categories[0]?.id ? String(categories[0].id) : '');
        setLocalErrors({});
        clearErrors();
        setSelectedTempId(null);
    };

    const handleSelectProduct = (product) => {
        setSelectedTempId(product.id);
        setData({
            name: product.title || '',
            description: product.seo_description || product.title || '',
            price: product.price || '',
            image_url: product.image_url || '',
            stock: '0',
            category_id: categories[0]?.id ? String(categories[0].id) : '',
            is_adult: false,
            link: product.product_url || product.link || '',
        });
        setLocalErrors(validate({
            name: product.title || '',
            description: product.seo_description || product.title || '',
            price: product.price || '',
            image_url: product.image_url || '',
            stock: '0',
            category_id: categories[0]?.id ? String(categories[0].id) : '',
            is_adult: false,
            link: product.product_url || product.link || '',
        }));
        addToast({ type: 'info', title: 'Temporal cargado', message: 'Los datos se han copiado al formulario para revisarlos antes de guardar.' });
    };

    const requestSaveReview = () => {
        const nextErrors = validate(data);
        setLocalErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            addToast({ type: 'error', title: 'Formulario incompleto', message: 'Corrige los campos marcados antes de continuar.' });
            return;
        }

        setSaveModalOpen(true);
    };

    const openSaveModal = (event) => {
        event.preventDefault();
        requestSaveReview();
    };

    const confirmSave = () => {
        post(route('products.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setSaveModalOpen(false);
                addToast({ type: 'success', title: 'Producto creado', message: 'El producto se ha guardado correctamente.' });
                resetForm();
            },
            onError: () => {
                setSaveModalOpen(false);
                addToast({ type: 'error', title: 'Error de validacion', message: 'El servidor devolvio errores. Revisa el formulario y vuelve a intentar.' });
            },
        });
    };

    const stats = [
        {
            label: 'Temporales disponibles',
            value: temporaryProducts.length,
            helper: 'Usalos como base para acelerar altas nuevas.',
            tone: 'amber',
        },
        {
            label: 'Categorias activas',
            value: categories.length,
            helper: 'Elige la taxonomia correcta antes de publicar.',
            tone: 'emerald',
        },
    ];

    return (
        <AdminWorkspaceLayout
            title="Agregar Producto"
            description="Formulario de alta con validacion inmediata, previsualizacion del resultado y carga rapida desde productos temporales para reducir pasos manuales."
            actions={(
                <>
                    <button
                        type="button"
                        onClick={resetForm}
                        className="inline-flex items-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                        Limpiar formulario
                    </button>
                    <button
                        type="button"
                        onClick={requestSaveReview}
                        disabled={!isFormReady || processing}
                        className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                        Guardar en modal
                    </button>
                </>
            )}
        >
            <ProfileToastRegion toasts={toasts} onDismiss={dismissToast} />

            <section className="grid gap-6 xl:grid-cols-[1.45fr,0.95fr]">
                <form onSubmit={openSaveModal} className="space-y-6">
                    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                    Formulario principal
                                </p>
                                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                                    Datos del producto
                                </h2>
                            </div>
                            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
                                {isFormReady ? 'Listo para guardar' : 'Revisar campos'}
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(event) => updateField('name', event.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                                />
                                {currentErrors.name ? <p className="mt-1 text-sm text-rose-600">{currentErrors.name}</p> : null}
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-1 block text-sm font-medium text-slate-700">Descripcion</label>
                                <textarea
                                    rows={4}
                                    value={data.description}
                                    onChange={(event) => updateField('description', event.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                                />
                                {currentErrors.description ? <p className="mt-1 text-sm text-rose-600">{currentErrors.description}</p> : null}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Precio</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={data.price}
                                    onChange={(event) => updateField('price', event.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                                />
                                {currentErrors.price ? <p className="mt-1 text-sm text-rose-600">{currentErrors.price}</p> : null}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Stock</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.stock}
                                    onChange={(event) => updateField('stock', event.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                                />
                                {currentErrors.stock ? <p className="mt-1 text-sm text-rose-600">{currentErrors.stock}</p> : null}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Categoria</label>
                                <select
                                    value={data.category_id}
                                    onChange={(event) => updateField('category_id', event.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                                >
                                    <option value="">Selecciona una categoria</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                {currentErrors.category_id ? <p className="mt-1 text-sm text-rose-600">{currentErrors.category_id}</p> : null}
                            </div>

                            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={data.is_adult}
                                    onChange={(event) => updateField('is_adult', event.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-300"
                                />
                                Marcar como producto para adultos
                            </label>

                            <div className="md:col-span-2">
                                <label className="mb-1 block text-sm font-medium text-slate-700">URL de imagen</label>
                                <input
                                    type="url"
                                    value={data.image_url}
                                    onChange={(event) => updateField('image_url', event.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                                />
                                {currentErrors.image_url ? <p className="mt-1 text-sm text-rose-600">{currentErrors.image_url}</p> : null}
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-1 block text-sm font-medium text-slate-700">Link del producto</label>
                                <input
                                    type="url"
                                    value={data.link}
                                    onChange={(event) => updateField('link', event.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                                />
                                {currentErrors.link ? <p className="mt-1 text-sm text-rose-600">{currentErrors.link}</p> : null}
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap justify-end gap-3">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                                Resetear
                            </button>
                            <button
                                type="submit"
                                disabled={!isFormReady || processing}
                                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                            >
                                Revisar y guardar
                            </button>
                        </div>
                    </div>

                    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                    Base temporal
                                </p>
                                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                                    Productos temporales reutilizables
                                </h2>
                            </div>
                            <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
                                {temporaryProducts.length} disponibles
                            </div>
                        </div>

                        {temporaryProducts.length === 0 ? (
                            <p className="mt-4 text-sm text-slate-500">No hay productos temporales cargados en este momento.</p>
                        ) : (
                            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {temporaryProducts.map((product) => (
                                    <article
                                        key={product.id}
                                        className={[
                                            'overflow-hidden rounded-[1.5rem] border p-4 transition',
                                            selectedTempId === product.id
                                                ? 'border-amber-300 bg-amber-50 shadow-sm'
                                                : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white',
                                        ].join(' ')}
                                    >
                                        <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-white">
                                            {product.image_url ? (
                                                <img src={product.image_url} alt={product.title} className="h-full w-full object-cover" />
                                            ) : null}
                                        </div>
                                        <h3 className="mt-4 text-sm font-semibold text-slate-900">{product.title}</h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            {currencyFormatter.format(Number(product.price || 0))}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => handleSelectProduct(product)}
                                            className="mt-4 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                        >
                                            Usar como base
                                        </button>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </form>

                <aside className="space-y-6">
                    <section className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                            Preview en tiempo real
                        </p>
                        <h2 className="mt-3 text-2xl font-semibold">Vista previa del alta</h2>
                        <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5">
                            <div className="aspect-square bg-slate-900/60">
                                {data.image_url ? (
                                    <img src={data.image_url} alt={data.name || 'Vista previa'} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-400">
                                        Añade una imagen valida para ver la previsualizacion del producto.
                                    </div>
                                )}
                            </div>
                            <div className="space-y-3 p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-lg font-semibold text-white">{data.name || 'Nombre pendiente'}</p>
                                        <p className="text-sm text-slate-300">{previewCategory?.name || 'Categoria sin definir'}</p>
                                    </div>
                                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-amber-200">
                                        {data.price !== '' ? currencyFormatter.format(Number(data.price || 0)) : 'Sin precio'}
                                    </span>
                                </div>
                                <p className="text-sm leading-6 text-slate-300">
                                    {data.description || 'La descripcion aparecera aqui para validar tono, longitud y claridad.'}
                                </p>
                                <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                                    <span className="rounded-full bg-white/10 px-3 py-1">Stock: {data.stock || 0}</span>
                                    <span className="rounded-full bg-white/10 px-3 py-1">{data.is_adult ? 'Adultos' : 'General'}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                            Señales UX
                        </p>
                        <div className="mt-4 space-y-4">
                            {stats.map((item) => (
                                <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                                    <p className="mt-2 text-3xl font-semibold text-slate-950">{item.value}</p>
                                    <p className="mt-2 text-sm text-slate-500">{item.helper}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                            Flujo sugerido
                        </p>
                        <ol className="mt-4 space-y-4 text-sm text-slate-600">
                            <li className="rounded-2xl border border-slate-200 bg-slate-50 p-4">1. Selecciona un temporal si quieres ahorrar tiempo de carga manual.</li>
                            <li className="rounded-2xl border border-slate-200 bg-slate-50 p-4">2. Ajusta categoria, stock y enlace mientras validas la preview.</li>
                            <li className="rounded-2xl border border-slate-200 bg-slate-50 p-4">3. Confirma en el modal para evitar publicar un producto incompleto.</li>
                        </ol>
                    </section>
                </aside>
            </section>

            <Modal show={saveModalOpen} onClose={() => setSaveModalOpen(false)} maxWidth="xl">
                <div className="p-6 sm:p-8">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Confirmacion final</p>
                            <h3 className="mt-2 text-2xl font-semibold text-slate-950">Guardar producto</h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSaveModalOpen(false)}
                            className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                            Cerrar
                        </button>
                    </div>

                    <div className="mt-6 grid gap-6 md:grid-cols-[180px,1fr]">
                        <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
                            {data.image_url ? (
                                <img src={data.image_url} alt={data.name || 'Producto'} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full min-h-[180px] items-center justify-center px-4 text-center text-sm text-slate-500">
                                    Sin imagen
                                </div>
                            )}
                        </div>
                        <dl className="space-y-3 text-sm text-slate-600">
                            <div>
                                <dt className="font-semibold text-slate-900">Nombre</dt>
                                <dd className="mt-1">{data.name || 'Sin nombre'}</dd>
                            </div>
                            <div>
                                <dt className="font-semibold text-slate-900">Categoria</dt>
                                <dd className="mt-1">{previewCategory?.name || 'Sin categoria'}</dd>
                            </div>
                            <div>
                                <dt className="font-semibold text-slate-900">Precio y stock</dt>
                                <dd className="mt-1">{data.price !== '' ? currencyFormatter.format(Number(data.price || 0)) : 'Sin precio'} · Stock {data.stock || 0}</dd>
                            </div>
                            <div>
                                <dt className="font-semibold text-slate-900">Descripcion</dt>
                                <dd className="mt-1 leading-6">{data.description || 'Sin descripcion'}</dd>
                            </div>
                            <div>
                                <dt className="font-semibold text-slate-900">Enlace</dt>
                                <dd className="mt-1 break-all">{data.link || 'Sin enlace'}</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setSaveModalOpen(false)}
                            className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                            Seguir editando
                        </button>
                        <button
                            type="button"
                            onClick={confirmSave}
                            disabled={processing}
                            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                            {processing ? 'Guardando...' : 'Confirmar guardado'}
                        </button>
                    </div>
                </div>
            </Modal>
        </AdminWorkspaceLayout>
    );
}
