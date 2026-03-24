// resources/js/Pages/LinkAggregator.jsx
import AdminWorkspaceLayout from '@/Layouts/AdminWorkspaceLayout.jsx';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePage } from '@inertiajs/react';

const MAX_HISTORY = 5;

const DEFAULT_GUIDE = {
    title: 'Guia rapida',
    description: 'Selecciona un script, pega el HTML del producto y ejecuta para obtener los enlaces procesados.',
    steps: [
        'Revisa la descripcion del script seleccionado para entender su proposito.',
        'Valida que el fragmento HTML contenga la informacion que necesitas analizar.',
        'Presiona Ejecutar script y revisa el resumen y la salida generada.'
    ],
    expected: 'La salida mostrara los enlaces detectados o los pasos completados por el script.',
    notes: 'Si necesitas parametros adicionales agregalos en el HTML o contacta al responsable del script.'
};

const SCRIPT_GUIDES = {
    default: DEFAULT_GUIDE,
    'verify_env.py': {
        title: 'Diagnostico del entorno',
        description: 'Confirma que las dependencias y rutas de Python estan configuradas correctamente antes de extraer enlaces.',
        steps: [
            'Ejecuta este script sin HTML adicional para validar el entorno.',
            'Verifica que cada verificacion muestre estado OK.',
            'Si detecta un problema corrige la dependencia indicada antes de continuar con otros scripts.'
        ],
        expected: 'La salida debe listar cada dependencia con estado OK o el detalle de la correccion necesaria.',
        notes: 'Repite el diagnostico cada vez que actualices librerias o cambies versiones de Python.'
    }
};

// Scripts que requieren menú interactivo
const SCRIPTS_WITH_MENU = {
    'scripy_web.py': [
        { value: 'listado', label: 'Extraer productos del listado' },
        { value: 'detalle', label: 'Añadir imágenes desde una ficha existente' }
    ],
    'scripy.py': [
        { value: 'listado', label: 'Extraer tarjetas del listado / slider' },
        { value: 'detalle', label: 'Añadir imágenes a un producto existente (detalle)' }
    ]
};

const buildDynamicGuide = (name) => ({
    title: `Guia rapida para ${name}`,
    description: 'Usa este script para automatizar un flujo especifico. Revisa la documentacion interna si requiere configuraciones adicionales.',
    steps: [
        'Confirma los datos de entrada antes de ejecutar.',
        'Verifica la salida y guarda evidencia si es necesario.',
        'Si obtienes errores consulta el resumen o ejecuta el script de diagnostico.'
    ],
    expected: 'El script deberia mostrar un resumen de los enlaces recopilados o de las acciones realizadas.',
    notes: 'Si no reconoces el nombre del script valida con el responsable del proceso antes de ejecutarlo.'
});

const formatDateTime = (value) => {
    if (!value) return '--';
    return new Date(value).toLocaleString('es-ES', { hour12: false });
};

const formatDuration = (ms) => {
    if (ms === undefined || ms === null) return '--';
    if (ms < 1000) return `${ms} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
};

const getStatusDetails = (status) => {
    switch (status) {
        case 'running':
            return {
                label: 'En ejecucion',
                badge: 'border-blue-200 bg-blue-50 text-blue-700'
            };
        case 'success':
            return {
                label: 'Completado',
                badge: 'border-green-200 bg-green-50 text-green-700'
            };
        case 'error':
            return {
                label: 'Error en el script',
                badge: 'border-red-200 bg-red-50 text-red-700'
            };
        case 'network-error':
            return {
                label: 'Error de red',
                badge: 'border-amber-200 bg-amber-50 text-amber-700'
            };
        default:
            return {
                label: 'Sin ejecutar',
                badge: 'border-gray-200 bg-gray-50 text-gray-700'
            };
    }
};

const getCsrfToken = () => {
    if (typeof document === 'undefined') {
        return '';
    }
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') || '' : '';
};

const buildCommandExample = (name) => {
    if (!name) {
        return 'python scripts/<nombre_script>.py --input entrada.html';
    }
    return `python scripts/${name} --input entrada.html`;
};

const trimForPreview = (text, limit = 160) => {
    if (!text) return 'Sin salida registrada';
    if (text.length <= limit) return text;
    return `${text.slice(0, limit - 3)}...`;
};

const extractJsonPayload = (text) => {
    if (!text) return null;
    const firstObject = text.indexOf('{');
    const firstArray = text.indexOf('[');
    const first = firstObject === -1 ? firstArray : firstArray === -1 ? firstObject : Math.min(firstObject, firstArray);
    if (first === -1) return null;

    const lastObject = text.lastIndexOf('}');
    const lastArray = text.lastIndexOf(']');
    const last = lastObject === -1 ? lastArray : lastArray === -1 ? lastObject : Math.max(lastObject, lastArray);
    if (last === -1 || last <= first) return null;

    return text.slice(first, last + 1).trim();
};

const parseProductsFromOutput = (text) => {
    try {
        const maybeJson = extractJsonPayload(text) ?? text;
        const parsed = JSON.parse(maybeJson);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && Array.isArray(parsed.products)) return parsed.products;
        return null;
    } catch {
        return null;
    }
};

const formatProductPrice = (product) => {
    const numericPrice = typeof product?.price === 'number' ? product.price : null;
    if (numericPrice !== null && Number.isFinite(numericPrice)) {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(numericPrice);
    }

    return product?.price_text || product?.price || 'Sin precio';
};

const getProductUrl = (product) => product?.product_url || product?.url || '';

const getProductImage = (product) => {
    if (product?.image_url) return product.image_url;
    if (Array.isArray(product?.images) && product.images.length > 0) return product.images[0];
    return '';
};

const pickPreferredScript = (scripts) => {
    if (!Array.isArray(scripts) || scripts.length === 0) {
        return '';
    }

    if (scripts.includes('scripy_web.py')) {
        return 'scripy_web.py';
    }

    return scripts[0];
};

export default function LinkAggregator() {
    const { auth } = usePage().props;
    const isAdmin = !!auth?.user?.is_admin;

    const [htmlInput, setHtmlInput] = useState('');
    const [script, setScript] = useState('');
    const [availableScripts, setAvailableScripts] = useState([]);
    const [scriptsError, setScriptsError] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [diagnostic, setDiagnostic] = useState('');
    const [diagnosticError, setDiagnosticError] = useState('');
    const [diagnosticLoading, setDiagnosticLoading] = useState(true);
    const [executionDetails, setExecutionDetails] = useState(null);
    const [executionHistory, setExecutionHistory] = useState([]);
    const [scriptMode, setScriptMode] = useState('');
    const [importProducts, setImportProducts] = useState(null);
    const [detectedProducts, setDetectedProducts] = useState(null);
    const [scriptStats, setScriptStats] = useState(null);
    const [importLoading, setImportLoading] = useState(false);
    const [importMessage, setImportMessage] = useState('');

    useEffect(() => {
        let cancelled = false;

        fetch('/api/scripts', { credentials: 'same-origin' })
            .then(async (res) => {
                if (!res.ok) {
                    const status = res.status;
                    if (status === 401) {
                        throw new Error('Necesitas iniciar sesión para ver los scripts.');
                    }
                    if (status === 403) {
                        throw new Error('No tienes permisos para ver los scripts (solo admin).');
                    }
                    throw new Error('No se pudieron cargar los scripts (error del servidor).');
                }

                return res.json();
            })
            .then((data) => {
                if (cancelled) return;

                if (Array.isArray(data) && data.length > 0) {
                    setAvailableScripts(data);
                    setScriptsError('');
                    setScript((current) => current || pickPreferredScript(data));
                } else {
                    setAvailableScripts([]);
                    setScriptsError('No se recibieron scripts disponibles desde la API.');
                }
            })
            .catch((err) => {
                if (cancelled) return;
                setScriptsError(err?.message || 'No se pudieron cargar los scripts disponibles.');
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const currentGuide = useMemo(() => {
        if (!script) return SCRIPT_GUIDES.default;
        return SCRIPT_GUIDES[script] || buildDynamicGuide(script);
    }, [script]);

    const commandExample = useMemo(() => buildCommandExample(script), [script]);

    // Detecta si el script seleccionado tiene menú
    const scriptHasMenu = useMemo(() => {
        return !!SCRIPTS_WITH_MENU[script];
    }, [script]);

    // Cuando cambie el script, resetea el modo si no aplica
    useEffect(() => {
        if (!scriptHasMenu) setScriptMode('');
        else setScriptMode(SCRIPTS_WITH_MENU[script][0].value);
    }, [script, scriptHasMenu]);

    const runDiagnostic = useCallback(async () => {
        setDiagnostic('');
        setDiagnosticError('');
        setDiagnosticLoading(true);

        try {
            const csrfToken = getCsrfToken();
            const headers = {
                'Content-Type': 'application/json'
            };
            if (csrfToken) {
                headers['X-CSRF-TOKEN'] = csrfToken;
            }

            const response = await fetch('/run-script', {
                method: 'POST',
                credentials: 'same-origin',
                headers,
                body: JSON.stringify({
                    script: 'verify_env.py',
                    input: '<!-- test -->'
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setDiagnostic(data.output || 'Diagnostico completado.');
            } else {
                setDiagnosticError(data.output || 'Fallo durante el diagnostico del entorno.');
            }
        } catch (err) {
            setDiagnosticError(`Error de red en diagnostico: ${err.message}`);
        } finally {
            setDiagnosticLoading(false);
        }
    }, []);

    useEffect(() => {
        runDiagnostic();
    }, [runDiagnostic]);

    const handleRunScript = async () => {
        if (!script) return;

        const startedAt = Date.now();
        setLoading(true);
        setOutput('');
        setError('');
        setExecutionDetails({
            status: 'running',
            script,
            startedAt,
            inputChars: htmlInput.length
        });
        setImportProducts(null);
        setDetectedProducts(null);
        setScriptStats(null);
        setImportMessage('');

        try {
            const csrfToken = getCsrfToken();
            const headers = {
                'Content-Type': 'application/json'
            };
            if (csrfToken) {
                headers['X-CSRF-TOKEN'] = csrfToken;
            }

            // Incluye el modo si aplica
            const body = {
                script,
                input: htmlInput
            };
            if (scriptHasMenu && scriptMode) {
                body.menu_option = scriptMode;
            }

            const response = await fetch('/run-script', {
                method: 'POST',
                credentials: 'same-origin',
                headers,
                body: JSON.stringify(body)
            });

            const data = await response.json();
            const finishedAt = Date.now();
            const baseRecord = {
                id: startedAt,
                script,
                startedAt,
                finishedAt,
                durationMs: finishedAt - startedAt,
                inputChars: htmlInput.length,
                rawOutput: data.output || ''
            };

            if (response.ok && data.success) {
                const fallbackProducts = parseProductsFromOutput(data.output || '');
                const normalizedImportProducts = Array.isArray(data.products) ? data.products : fallbackProducts;
                const normalizedDetectedProducts = Array.isArray(data.detectedProducts)
                    ? data.detectedProducts
                    : Array.isArray(normalizedImportProducts)
                        ? normalizedImportProducts
                        : [];
                const record = {
                    ...baseRecord,
                    status: 'success',
                    message: Array.isArray(data.detectedProducts) && data.detectedProducts.length > 0
                        ? `Se detectaron ${data.detectedProducts.length} productos.`
                        : 'Ejecucion completada sin errores.'
                };
                setOutput(data.output || 'Sin salida generada.');
                setImportProducts(normalizedImportProducts);
                setDetectedProducts(normalizedDetectedProducts);
                setScriptStats(data.stats || null);
                setExecutionDetails(record);
                setExecutionHistory((prev) => [record, ...prev].slice(0, MAX_HISTORY));
            } else {
                const message = data.output || 'Error al ejecutar el script.';
                const record = {
                    ...baseRecord,
                    status: 'error',
                    message
                };
                setError(message);
                setExecutionDetails(record);
                setExecutionHistory((prev) => [record, ...prev].slice(0, MAX_HISTORY));
            }
        } catch (err) {
            const finishedAt = Date.now();
            const message = `Error al conectarse con el servidor: ${err.message}`;
            const record = {
                id: startedAt,
                script,
                startedAt,
                finishedAt,
                durationMs: finishedAt - startedAt,
                inputChars: htmlInput.length,
                status: 'network-error',
                message,
                rawOutput: ''
            };
            setError(message);
            setExecutionDetails(record);
            setExecutionHistory((prev) => [record, ...prev].slice(0, MAX_HISTORY));
        } finally {
            setLoading(false);
        }
    };

    const handleImport = useCallback(async () => {
        if (!isAdmin || !Array.isArray(importProducts) || importProducts.length === 0) return;

        setImportLoading(true);
        setImportMessage('');

        try {
            const csrfToken = getCsrfToken();
            const headers = {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            };
            if (csrfToken) {
                headers['X-CSRF-TOKEN'] = csrfToken;
            }

            const response = await fetch('/admin/temporary-products/import', {
                method: 'POST',
                credentials: 'same-origin',
                headers,
                body: JSON.stringify({ products: importProducts }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                const message = data?.message || data?.error || 'No se pudo importar.';
                setImportMessage(`Error: ${message}`);
                return;
            }

            setImportMessage(`Importación completada: ${data.created ?? 0} productos.`);
        } catch (err) {
            setImportMessage(`Error de red: ${err.message}`);
        } finally {
            setImportLoading(false);
        }
    }, [importProducts, isAdmin]);

    const statusDetails = executionDetails ? getStatusDetails(executionDetails.status) : getStatusDetails();

    return (
        <AdminWorkspaceLayout
            title="Link Aggregator"
            description="Vista operativa para ejecutar scripts autorizados, revisar diagnostico y mandar resultados a temporales sin perder contexto del flujo admin."
        >
        <div className="max-w-6xl mx-auto px-6 py-10">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Agregador de enlaces</h1>
                <p className="mt-2 text-gray-600">
                    Controla y documenta las extracciones ejecutando los scripts autorizados desde una sola vista.
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-md border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                        1. Selecciona un script y revisa su guia rapida.
                    </div>
                    <div className="rounded-md border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                        2. Pega el HTML del producto o la pagina por analizar.
                    </div>
                    <div className="rounded-md border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                        3. Ejecuta, revisa el resumen y comparte resultados.
                    </div>
                </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
                <section className="space-y-6">
                    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-100 px-6 py-4">
                            <h2 className="text-lg font-semibold text-gray-900">Configurar ejecucion</h2>
                            <p className="text-sm text-gray-600">
                                Elige el script y confirma que la entrada contiene todos los datos requeridos.
                            </p>
                        </div>
                        <div className="px-6 py-6 space-y-4">
                            <label className="block text-sm font-medium text-gray-700" htmlFor="script-select">
                                Script disponible
                            </label>
                            <select
                                id="script-select"
                                value={script}
                                onChange={(e) => setScript(e.target.value)}
                                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                disabled={availableScripts.length === 0}
                            >
                                {availableScripts.length === 0 && (
                                    <option value="">Sin scripts disponibles</option>
                                )}
                                {availableScripts.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                            {scriptsError && (
                                <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    {scriptsError}
                                </p>
                            )}
                            {scriptHasMenu && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700" htmlFor="script-mode-select">
                                        Modo de extracción
                                    </label>
                                    <select
                                        id="script-mode-select"
                                        value={scriptMode}
                                        onChange={(e) => setScriptMode(e.target.value)}
                                        className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        {SCRIPTS_WITH_MENU[script].map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-100 px-6 py-4">
                            <h2 className="text-lg font-semibold text-gray-900">HTML del producto</h2>
                            <p className="text-sm text-gray-600">
                                Pega el bloque exacto que deseas procesar. El analisis se ejecuta en el servidor.
                            </p>
                        </div>
                        <div className="px-6 py-6">
                            <textarea
                                value={htmlInput}
                                onChange={(e) => setHtmlInput(e.target.value)}
                                rows={12}
                                className="w-full rounded-md border border-gray-300 p-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="&lt;div class=&quot;product-card&quot;&gt;...&lt;/div&gt;"
                            />
                            <p className="mt-2 text-xs text-gray-500">
                                Consejo: conserva atributos unicos (clases, data-* o ids) para que el script identifique los elementos correctos.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">Ejecutar script</h3>
                            <p className="mt-1 text-sm text-gray-600">
                                Obtendras un resumen con el estado de la ejecucion, el tiempo invertido y la salida completa.
                            </p>
                        </div>
                        <button
                            onClick={handleRunScript}
                            disabled={loading || !script}
                            className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                        >
                            {loading ? 'Ejecutando...' : 'Ejecutar script'}
                        </button>
                    </div>
                </section>

                <aside className="space-y-6">
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900">{currentGuide.title}</h2>
                        <p className="mt-1 text-sm text-gray-600">{currentGuide.description}</p>

                        <div className="mt-4">
                            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Pasos sugeridos</h3>
                            <ul className="mt-2 space-y-2 text-sm text-gray-600">
                                {currentGuide.steps.map((step, index) => (
                                    <li key={index} className="flex gap-2">
                                        <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="mt-4 rounded-md border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                            <p className="font-medium text-gray-800">Que esperar</p>
                            <p className="mt-1">{currentGuide.expected}</p>
                            <p className="mt-3 font-medium text-gray-800">Notas</p>
                            <p>{currentGuide.notes}</p>
                        </div>

                        <div className="mt-4 text-xs text-gray-500">
                            Comando de ejemplo: <code className="font-mono text-gray-700">{commandExample}</code>
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Diagnostico del entorno</h2>
                            <button
                                onClick={runDiagnostic}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                            >
                                Reintentar
                            </button>
                        </div>
                        {diagnosticLoading && (
                            <p className="mt-3 text-sm text-gray-600">Ejecutando diagnostico...</p>
                        )}
                        {!diagnosticLoading && diagnostic && (
                            <pre className="mt-3 max-h-60 overflow-auto rounded-md border border-green-200 bg-green-50 p-3 text-xs text-green-800">
                                {diagnostic}
                            </pre>
                        )}
                        {!diagnosticLoading && diagnosticError && (
                            <pre className="mt-3 max-h-60 overflow-auto rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                                {diagnosticError}
                            </pre>
                        )}
                        <p className="mt-3 text-xs text-gray-500">
                            El diagnostico se ejecuta con verify_env.py y valida dependencias antes de procesar otros scripts.
                        </p>
                    </div>
                </aside>
            </div>

            <section className="mt-10 space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Resumen de la ejecucion</h2>
                            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusDetails.badge}`}>
                                {statusDetails.label}
                            </span>
                        </div>
                        {executionDetails ? (
                            <dl className="mt-4 space-y-2 text-sm text-gray-700">
                                <div className="flex justify-between">
                                    <dt className="font-medium text-gray-600">Script</dt>
                                    <dd>{executionDetails.script || '--'}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="font-medium text-gray-600">Inicio</dt>
                                    <dd>{formatDateTime(executionDetails.startedAt)}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="font-medium text-gray-600">Fin</dt>
                                    <dd>{formatDateTime(executionDetails.finishedAt)}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="font-medium text-gray-600">Duracion</dt>
                                    <dd>{formatDuration(executionDetails.durationMs)}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="font-medium text-gray-600">Caracteres de entrada</dt>
                                    <dd>{executionDetails.inputChars}</dd>
                                </div>
                                <div>
                                    <dt className="font-medium text-gray-600">Resumen</dt>
                                    <dd className="mt-1 text-gray-800">{executionDetails.message}</dd>
                                </div>
                            </dl>
                        ) : (
                            <p className="mt-4 text-sm text-gray-600">Aun no hay ejecuciones registradas.</p>
                        )}
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900">Historial reciente</h2>
                        {executionHistory.length === 0 ? (
                            <p className="mt-3 text-sm text-gray-600">
                                Ejecuta un script para comenzar a generar historial.
                            </p>
                        ) : (
                            <ul className="mt-4 space-y-3 text-sm text-gray-700">
                                {executionHistory.map((record) => {
                                    const badge = getStatusDetails(record.status);
                                    return (
                                        <li key={record.id} className="rounded-md border border-gray-100 bg-gray-50 p-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{record.script}</p>
                                                    <p className="text-xs text-gray-500">{formatDateTime(record.finishedAt)}</p>
                                                </div>
                                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badge.badge}`}>
                                                    {badge.label}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-xs text-gray-600">
                                                {trimForPreview(record.rawOutput || record.message)}
                                            </p>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Salida del script</h2>
                        {output && (
                            <span className="text-xs text-gray-500">Ultima actualizacion: {formatDateTime(Date.now())}</span>
                        )}
                    </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-sky-200 bg-sky-50 p-4">
                            <div className="text-sm text-sky-900">
                                Revisa los productos detectados y, cuando estes conforme, abre la pantalla de migracion temporal.
                            </div>
                            <a
                                href="/migrate-products"
                                className="rounded-md border border-sky-300 bg-white px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100"
                            >
                                Ir a /migrate-products
                            </a>
                        </div>

                        {Array.isArray(detectedProducts) && detectedProducts.length > 0 && (
                            <div className="mt-4 space-y-4 rounded-md border border-gray-200 bg-gray-50 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900">Productos encontrados</h3>
                                        <p className="text-sm text-gray-600">
                                            Detectados: <strong>{detectedProducts.length}</strong>
                                            {Array.isArray(importProducts) && importProducts.length > 0 ? (
                                                <>
                                                    {' '}| Listos para migrar: <strong>{importProducts.length}</strong>
                                                </>
                                            ) : null}
                                        </p>
                                        {scriptStats && (
                                            <p className="mt-1 text-xs text-gray-500">
                                                Nuevos: {scriptStats.new ?? 0} | Actualizados: {scriptStats.updated ?? 0} | Sin cambios: {scriptStats.unchanged ?? 0}
                                            </p>
                                        )}
                                    </div>
                                    {isAdmin && Array.isArray(importProducts) && importProducts.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleImport}
                                            disabled={importLoading}
                                            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300"
                                        >
                                            {importLoading ? 'Migrando...' : 'Migrar a temporary products'}
                                        </button>
                                    )}
                                </div>

                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    {detectedProducts.map((product, index) => {
                                        const image = getProductImage(product);
                                        const productUrl = getProductUrl(product);

                                        return (
                                            <article key={`${product.title || 'product'}-${index}`} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                                                <div className="aspect-square bg-gray-100">
                                                    {image ? (
                                                        <img src={image} alt={product.title || 'Producto detectado'} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="flex h-full items-center justify-center text-sm text-gray-500">Sin imagen</div>
                                                    )}
                                                </div>
                                                <div className="space-y-3 p-4">
                                                    <div>
                                                        <h4 className="line-clamp-3 text-sm font-semibold text-gray-900">{product.title || 'Sin titulo'}</h4>
                                                        <p className="mt-2 text-lg font-bold text-gray-900">{formatProductPrice(product)}</p>
                                                        {product.original_price_text && (
                                                            <p className="text-xs text-gray-500 line-through">{product.original_price_text}</p>
                                                        )}
                                                    </div>
                                                    {Array.isArray(product.images) && product.images.length > 1 && (
                                                        <p className="text-xs text-gray-500">Imagenes detectadas: {product.images.length}</p>
                                                    )}
                                                    {productUrl && (
                                                        <a
                                                            href={productUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex text-sm font-medium text-blue-600 hover:text-blue-700"
                                                        >
                                                            Abrir producto
                                                        </a>
                                                    )}
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {isAdmin && Array.isArray(importProducts) && importProducts.length > 0 && (
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 p-4">
                            <div className="text-sm text-amber-900">
                                Hay <strong>{importProducts.length}</strong> productos listos para migrar a temporary products.
                            </div>
                            <button
                                type="button"
                                onClick={handleImport}
                                disabled={importLoading}
                                className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300"
                            >
                                {importLoading ? 'Migrando...' : 'Migrar a temporary products'}
                            </button>
                        </div>
                    )}

                    {importMessage && (
                        <p className="mt-3 text-sm text-gray-700">{importMessage}</p>
                    )}

                    {output ? (
                        <pre className="mt-4 max-h-96 overflow-auto rounded-md border border-green-200 bg-green-50 p-4 text-sm text-gray-800 whitespace-pre-wrap">
                            {output}
                        </pre>
                    ) : (
                        <p className="mt-4 text-sm text-gray-600">
                            Ejecuta un script para visualizar la salida detallada.
                        </p>
                    )}
                    {error && (
                        <pre className="mt-4 max-h-72 overflow-auto rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 whitespace-pre-wrap">
                            {error}
                        </pre>
                    )}
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900">Notas tecnicas rapidas</h2>
                    <ul className="mt-3 space-y-2 text-sm text-gray-700">
                        <li>
                            <strong className="text-gray-900">Validar entradas:</strong> evita etiquetas incompletas o scripts embebidos que puedan romper el parser.
                        </li>
                        <li>
                            <strong className="text-gray-900">Diagnostico:</strong> si un script falla revisa primero verify_env.py para asegurar que las dependencias siguen disponibles.
                        </li>
                        <li>
                            <strong className="text-gray-900">Evidencia:</strong> conserva la salida textual o exportala si necesitas compartirla con otros equipos.
                        </li>
                    </ul>
                </div>
            </section>
        </div>
        </AdminWorkspaceLayout>
    );
}
