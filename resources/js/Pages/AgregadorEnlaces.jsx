import React, { useEffect, useState } from 'react';

export default function AgregadorEnlaces() {
    const [htmlInput, setHtmlInput] = useState('');
    const [script, setScript] = useState('');
    const [availableScripts, setAvailableScripts] = useState([]);
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [diagnostic, setDiagnostic] = useState('');

    useEffect(() => {
        // Cargar scripts disponibles
        fetch('/api/scripts')
            .then((res) => res.json())
            .then((data) => {
                setAvailableScripts(data);
                if (data.length > 0) setScript(data[0]);
            })
            .catch(() => setError('No se pudieron cargar los scripts disponibles.'));
    }, []);

    useEffect(() => {
        // Ejecutar script de diagnóstico al montar el componente
        fetch('/run-script', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify({
                script: 'verify_env.py',
                input: '<!-- test -->'
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setDiagnostic(data.output);
                } else {
                    setDiagnostic("❌ Error diagnóstico: " + (data.output || 'Sin mensaje'));
                }
            })
            .catch(err => setDiagnostic("❌ Error de red en diagnóstico: " + err.message));
    }, []);

    const handleRunScript = async () => {
        setLoading(true);
        setOutput('');
        setError('');

        try {
            const response = await fetch('/run-script', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify({ script, input: htmlInput })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setOutput(data.output);
            } else {
                setError(data.output || 'Error al ejecutar el script');
            }
        } catch (err) {
            setError('Error al conectarse con el servidor');
        }

        setLoading(false);
    };

    return (
        <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow rounded-lg">
            <h1 className="text-xl font-bold mb-4">Agregador de Enlaces</h1>

            <div className="mb-6 bg-gray-100 p-4 rounded text-sm font-mono whitespace-pre-wrap">
                <strong>🧪 Diagnóstico del entorno Python:</strong>
                <pre className="mt-2 text-xs">{diagnostic || 'Cargando diagnóstico...'}</pre>
            </div>

            <div className="mb-4">
                <label className="block font-medium mb-1">Seleccionar Script:</label>
                <select
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    className="w-full border rounded p-2"
                >
                    {availableScripts.map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mb-4">
                <label className="block font-medium mb-1">HTML del producto:</label>
                <textarea
                    value={htmlInput}
                    onChange={(e) => setHtmlInput(e.target.value)}
                    rows={10}
                    className="w-full border rounded p-2"
                />
            </div>

            <button
                onClick={handleRunScript}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
                {loading ? 'Ejecutando...' : 'Ejecutar Script'}
            </button>

            {output && <pre className="mt-4 p-4 bg-green-100 rounded whitespace-pre-wrap">{output}</pre>}
            {error && <pre className="mt-4 p-4 bg-red-100 rounded whitespace-pre-wrap">{error}</pre>}
        </div>
    );
}
