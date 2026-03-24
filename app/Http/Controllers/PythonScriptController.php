<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Illuminate\Http\Request;

class PythonScriptController extends Controller
{
    private function extractJsonPayload(string $text): ?string
    {
        $firstObject = strpos($text, '{');
        $firstArray = strpos($text, '[');

        if ($firstObject === false && $firstArray === false) {
            return null;
        }

        if ($firstObject === false) {
            $first = $firstArray;
        } elseif ($firstArray === false) {
            $first = $firstObject;
        } else {
            $first = min($firstObject, $firstArray);
        }

        $lastObject = strrpos($text, '}');
        $lastArray = strrpos($text, ']');

        if ($lastObject === false && $lastArray === false) {
            return null;
        }

        if ($lastObject === false) {
            $last = $lastArray;
        } elseif ($lastArray === false) {
            $last = $lastObject;
        } else {
            $last = max($lastObject, $lastArray);
        }

        if ($last === false || $last <= $first) {
            return null;
        }

        return trim(substr($text, $first, $last - $first + 1));
    }

    private function decodeScriptPayload(string $output): array|null
    {
        $candidates = [trim($output)];
        $embedded = $this->extractJsonPayload($output);
        if ($embedded && $embedded !== trim($output)) {
            $candidates[] = $embedded;
        }

        foreach ($candidates as $candidate) {
            if ($candidate === '') {
                continue;
            }

            try {
                $decoded = json_decode($candidate, true, 512, JSON_THROW_ON_ERROR);
                if (is_array($decoded)) {
                    return $decoded;
                }
            } catch (\JsonException) {
            }
        }

        return null;
    }

    private function normalizePrice(mixed $value): ?float
    {
        if (is_int($value) || is_float($value)) {
            return (float) $value;
        }

        if (!is_string($value)) {
            return null;
        }

        $text = trim($value);
        if ($text === '') {
            return null;
        }

        $text = preg_replace('/[^0-9,\.\-]/', '', $text);
        if ($text === null || $text === '') {
            return null;
        }

        if (str_contains($text, ',') && str_contains($text, '.')) {
            $text = str_replace('.', '', $text);
            $text = str_replace(',', '.', $text);
        } elseif (str_contains($text, ',')) {
            $text = str_replace(',', '.', $text);
        }

        return is_numeric($text) ? (float) $text : null;
    }

    private function normalizeImportProducts(array $items): array
    {
        $normalized = [];

        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }

            $title = trim((string) ($item['title'] ?? $item['titulo'] ?? ''));
            $imageUrl = trim((string) ($item['image_url'] ?? $item['imagen'] ?? ''));
            $price = $this->normalizePrice($item['price'] ?? $item['precio'] ?? null);
            $images = collect($item['images'] ?? $item['imagenes'] ?? [])
                ->filter(fn ($image) => is_string($image) && trim($image) !== '')
                ->map(fn ($image) => trim($image))
                ->values()
                ->all();

            if ($imageUrl === '' && !empty($images)) {
                $imageUrl = $images[0];
            }

            if ($title === '' || $price === null || $imageUrl === '') {
                continue;
            }

            $normalized[] = [
                'title' => $title,
                'price' => $price,
                'image_url' => $imageUrl,
                'seo_title' => $item['seo_title'] ?? null,
                'seo_description' => $item['seo_description'] ?? null,
                'images' => $images,
                'product_url' => $item['product_url'] ?? $item['url'] ?? null,
            ];
        }

        return $normalized;
    }

    private function normalizeDetectedProducts(array $items): array
    {
        $normalized = [];

        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }

            $normalized[] = [
                'title' => trim((string) ($item['title'] ?? $item['titulo'] ?? '')),
                'price_text' => trim((string) ($item['price_text'] ?? $item['price'] ?? $item['precio'] ?? '')),
                'original_price_text' => trim((string) ($item['original_price_text'] ?? $item['precio_original'] ?? '')),
                'image_url' => trim((string) ($item['image_url'] ?? $item['imagen'] ?? '')),
                'images' => collect($item['images'] ?? $item['imagenes'] ?? [])
                    ->filter(fn ($image) => is_string($image) && trim($image) !== '')
                    ->map(fn ($image) => trim($image))
                    ->values()
                    ->all(),
                'product_url' => $item['product_url'] ?? $item['url'] ?? null,
            ];
        }

        return $normalized;
    }

    public function run(Request $request)
    {
        $script = $request->input('script');
        $input = (string) $request->input('input', '');
        $menuOption = $request->input('menu_option', 'listado'); // por defecto 'listado'

        if (!$script) {
            Log::warning('❌ Parámetros incompletos al ejecutar script');
            return response()->json(['success' => false, 'output' => 'Parámetros incompletos.'], 400);
        }

        // Evita path traversal: solo permitimos nombres de archivo (sin rutas)
        if ($script !== basename($script)) {
            Log::warning('❌ Script inválido (posible path traversal)', ['script' => $script]);
            return response()->json(['success' => false, 'output' => 'Script inválido.'], 400);
        }

        // Allowlist: solo scripts .py dentro de python_scripts
        $allowedScripts = collect(File::files(base_path('python_scripts')))
            ->filter(fn ($file) => $file->getExtension() === 'py')
            ->map(fn ($file) => $file->getFilename())
            ->values();

        if (!$allowedScripts->contains($script)) {
            Log::warning('❌ Intento de ejecutar script no permitido', ['script' => $script]);
            return response()->json(['success' => false, 'output' => 'Script no permitido.'], 403);
        }

        $scriptPath = base_path("python_scripts/{$script}");
        if (!file_exists($scriptPath)) {
            Log::error("❌ Script no encontrado: {$scriptPath}");
            return response()->json(['success' => false, 'output' => 'Script no encontrado.'], 404);
        }

        $tempDir = storage_path('app/python_runner');
        if (!is_dir($tempDir)) {
            mkdir($tempDir, 0777, true);
        }
        $stateDir = $tempDir . DIRECTORY_SEPARATOR . 'state';
        if (!is_dir($stateDir)) {
            mkdir($stateDir, 0777, true);
        }
        $tempPath = $tempDir . DIRECTORY_SEPARATOR . 'input_' . Str::uuid()->toString() . '.html';
        file_put_contents($tempPath, $input);
        Log::info("📄 HTML guardado en: {$tempPath}");

        // En Windows usamos el Python embebido si está disponible.
        // En Linux/macOS preferimos el Python del sistema (python3 / python),
        // y solo usar el ejecutable embebido si es un binario ejecutable compatible.
        $osFamily = PHP_OS_FAMILY;
        $embeddedPythonWindows = base_path('python_embed/python.exe');
        $embeddedPythonUnix = base_path('python_embed/python');

        if ($osFamily === 'Windows' && file_exists($embeddedPythonWindows) && is_executable($embeddedPythonWindows)) {
            $pythonBinary = $embeddedPythonWindows;
        } elseif ($osFamily !== 'Windows' && file_exists($embeddedPythonUnix) && is_executable($embeddedPythonUnix)) {
            $pythonBinary = $embeddedPythonUnix;
        } elseif (shell_exec('command -v python3')) {
            $pythonBinary = 'python3';
        } elseif (shell_exec('command -v python')) {
            $pythonBinary = 'python';
        } else {
            Log::error('❌ No se encontró un binario de Python disponible.');
            return response()->json(['success' => false, 'output' => 'Python no disponible en el servidor.'], 500);
        }

        // Establecer entorno solo para Python embebido
        $env = [
            'PYTHONIOENCODING' => 'utf-8',
            'PATH' => getenv('PATH'),
        ];

        if (($osFamily === 'Windows' && $pythonBinary === $embeddedPythonWindows)
            || ($osFamily !== 'Windows' && $pythonBinary === $embeddedPythonUnix)) {
            $pythonHome = base_path('python_embed');
            $pythonPathParts = [
                base_path('python_embed'),
                base_path('python_embed/Lib'),
                base_path('python_embed/Lib/site-packages'),
                base_path('python_embed/site-packages'),
            ];

            $env = array_merge($env, [
                'PYTHONHOME' => $pythonHome,
                'PYTHONPATH' => implode(PATH_SEPARATOR, array_filter($pythonPathParts)),
                'SystemRoot' => getenv('SystemRoot'),
            ]);
        }

        $title = $request->input('title');
        $args = [
            $pythonBinary,
            $scriptPath,
            $tempPath,
            $menuOption,
        ];
        if ($script === 'scripy_web.py') {
            $args[] = '--out';
            $args[] = $stateDir;
        }
        if ($menuOption === 'detalle' && $title) {
            $args[] = '--title';
            $args[] = $title;
        }

        try {
            Log::info("🚀 Ejecutando script Python: {$scriptPath}");
            $process = new Process($args, base_path(), $env);
            $process->setTimeout(120);
            $process->mustRun();

            $output = $process->getOutput();
            $parsedPayload = $this->decodeScriptPayload($output) ?? [];
            $importProducts = [];
            $detectedProducts = [];
            $stats = null;

            if (array_is_list($parsedPayload)) {
                $importProducts = $this->normalizeImportProducts($parsedPayload);
                $detectedProducts = $this->normalizeDetectedProducts($parsedPayload);
            } else {
                $importProducts = $this->normalizeImportProducts($parsedPayload['products'] ?? []);
                $detectedProducts = $this->normalizeDetectedProducts(
                    $parsedPayload['detected_products'] ?? $parsedPayload['products'] ?? []
                );
                $stats = isset($parsedPayload['stats']) && is_array($parsedPayload['stats'])
                    ? $parsedPayload['stats']
                    : null;
            }

            Log::info("✅ Script ejecutado correctamente.");

            return response()->json([
                'success' => true,
                'output' => trim($output),
                'products' => $importProducts,
                'detectedProducts' => $detectedProducts,
                'stats' => $stats,
            ]);
        } catch (ProcessFailedException $e) {
            Log::error("❌ Error en la ejecución del script:");
            Log::error($e->getMessage());
            if (isset($process)) {
                Log::error($process->getErrorOutput());
            }

            return response()->json([
                'success' => false,
                'output' => isset($process)
                    ? ($process->getErrorOutput() ?: 'Error al ejecutar el script.')
                    : 'Error al ejecutar el script.'
            ], 500);
        } finally {
            if (file_exists($tempPath)) {
                unlink($tempPath);
                Log::info("🧹 Archivo temporal eliminado.");
            }
        }
    }
}
