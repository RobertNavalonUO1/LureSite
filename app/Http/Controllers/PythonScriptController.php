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
        $tempPath = $tempDir . DIRECTORY_SEPARATOR . 'input_' . Str::uuid()->toString() . '.html';
        file_put_contents($tempPath, $input);
        Log::info("📄 HTML guardado en: {$tempPath}");

        $embeddedPython = base_path('python_embed/python.exe');
        $pythonBinary = file_exists($embeddedPython) ? $embeddedPython : 'python';

        // Establecer entorno necesario para Python embebido
        $pythonHome = base_path('python_embed');
        $pythonPathParts = [
            base_path('python_embed'),
            base_path('python_embed/Lib'),
            base_path('python_embed/Lib/site-packages'),
            base_path('python_embed/site-packages'),
        ];
        $env = [
            'PYTHONHOME' => $pythonHome,
            'PYTHONPATH' => implode(PATH_SEPARATOR, array_filter($pythonPathParts)),
            'PYTHONIOENCODING' => 'utf-8',
            'SystemRoot' => getenv('SystemRoot'),
            'PATH' => getenv('PATH'),
        ];

        $title = $request->input('title');
        $args = [
            $pythonBinary,
            $scriptPath,
            $tempPath,
            $menuOption
        ];
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
            Log::info("✅ Script ejecutado correctamente.");

            return response()->json([
                'success' => true,
                'output' => trim($output)
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
