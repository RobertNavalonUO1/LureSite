<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Illuminate\Http\Request;

class PythonScriptController extends Controller
{
    public function run(Request $request)
    {
        $script = $request->input('script');
        $input = $request->input('input');
        $menuOption = $request->input('menu_option', 'listado'); // por defecto 'listado'

        if (!$script || !$input) {
            Log::warning('❌ Parámetros incompletos al ejecutar script');
            return response()->json(['success' => false, 'output' => 'Parámetros incompletos.'], 400);
        }

        $scriptPath = base_path("python_scripts/{$script}");
        if (!file_exists($scriptPath)) {
            Log::error("❌ Script no encontrado: {$scriptPath}");
            return response()->json(['success' => false, 'output' => 'Script no encontrado.'], 404);
        }

        $tempPath = storage_path('app/temp_input.html');
        file_put_contents($tempPath, $input);
        Log::info("📄 HTML guardado en: {$tempPath}");

        $pythonBinary = base_path('python_embed/python.exe');

        // Establecer entorno necesario para Python embebido
        $env = [
            'PYTHONPATH' => base_path('python_embed/site-packages'),
            'SystemRoot' => getenv('SystemRoot'),
            'PATH' => getenv('PATH'),
        ];

        $title = $request->input('title');
        $args = [
            'python',
            $scriptPath,
            $tempPath,
            $menuOption
        ];
        if ($menuOption === 'detalle' && $title) {
            $args[] = '--title';
            $args[] = $title;
        }

        $process = new Process($args);
        $process->run();

        try {
            Log::info("🚀 Ejecutando script Python: {$scriptPath}");
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
            Log::error($process->getErrorOutput());

            return response()->json([
                'success' => false,
                'output' => $process->getErrorOutput() ?: 'Error al ejecutar el script.'
            ], 500);
        } finally {
            if (file_exists($tempPath)) {
                unlink($tempPath);
                Log::info("🧹 Archivo temporal eliminado.");
            }
        }
    }
}
