<?php

namespace App\Jobs;

use App\Models\TemporaryProduct;
use Illuminate\Bus\Queueable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class GenerateSeoTitles implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $productos = TemporaryProduct::whereNull('seo_title')->take(50)->get();
        $total = $productos->count();

        echo "🔁 Procesando $total productos SEO...\n";
        Log::info("🔁 Procesando $total productos SEO...");

        foreach ($productos as $index => $producto) {
            try {
                $inicio = microtime(true);

                echo "⏳ [$index] ID {$producto->id} - {$producto->title}\n";

                $promptTitle = "Mejora este título para SEO: {$producto->title}";
                $seoTitle = $this->generarDesdeSpace($promptTitle);

                $descripcionPrompt = "Crea una descripción atractiva y breve con enfoque SEO para: {$producto->title}";
                $seoDescription = $this->generarDesdeSpace($descripcionPrompt);

                $producto->seo_title = $seoTitle;
                $producto->seo_description = $seoDescription;
                $producto->save();

                $duracion = round(microtime(true) - $inicio, 2);
                echo "✅ Guardado SEO para ID {$producto->id} en {$duracion}s\n";
                Log::info("✅ SEO generado para ID {$producto->id} ({$duracion}s)");

            } catch (\Throwable $e) {
                echo "❌ Error ID {$producto->id}: {$e->getMessage()}\n";
                Log::error("❌ Error en producto ID {$producto->id}", ['exception' => $e]);
            }

            sleep(1); // breve pausa por cortesía al servidor
        }

        echo "🎉 Job completado.\n";
    }

    private function generarDesdeSpace(string $prompt): string
    {
        try {
            $response = Http::timeout(30)->post(
                'https://hf.space/embed/r0ber12/seo-title-generator/api/predict/',
                ['data' => [$prompt]]
            );

            $json = $response->json();

            return $json['data'][0] ?? '[Error de respuesta]';
        } catch (\Exception $e) {
            Log::error("❌ Fallo conexión con Space", ['error' => $e->getMessage()]);
            return '[Error de conexión]';
        }
    }
}
