<?php

namespace App\Console\Commands;

use App\Models\TemporaryProduct;
use App\Models\TemporaryProductImage;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;

class ImportTemporaryProductsFromJsonCommand extends Command
{
    protected $signature = 'temporary-products:import-json {--file= : Ruta al productos.json}';
    protected $description = 'Importa productos desde un JSON a temporary_products y temporary_product_images';

    public function handle(): int
    {
        $file = (string) ($this->option('file') ?: base_path('python_scripts/productos.json'));

        if (!is_file($file)) {
            $this->error("No existe el archivo JSON: {$file}");
            return self::FAILURE;
        }

        $json = file_get_contents($file);
        if ($json === false) {
            $this->error("No se pudo leer el archivo JSON: {$file}");
            return self::FAILURE;
        }

        $payload = json_decode($json, true);
        if (!is_array($payload)) {
            $this->error('El archivo JSON no contiene un array de productos válido.');
            return self::FAILURE;
        }

        $created = 0;
        $updated = 0;
        $skipped = 0;
        $imagesCreated = 0;

        try {
            DB::transaction(function () use ($payload, &$created, &$updated, &$skipped, &$imagesCreated) {
                foreach ($payload as $index => $row) {
                    if (!is_array($row)) {
                        $skipped++;
                        $this->warn("Registro #" . ($index + 1) . ' omitido: estructura inválida.');
                        continue;
                    }

                    $title = $this->normalizeText($row['title'] ?? $row['titulo'] ?? null);
                    $imageUrl = $this->normalizeText($row['image_url'] ?? $row['imagen'] ?? null);
                    $price = $this->normalizePrice($row['price'] ?? $row['precio'] ?? null);

                    if (!$title || $price === null || !$imageUrl) {
                        $skipped++;
                        $this->warn(
                            "Registro #" . ($index + 1) . ' omitido: requiere título, precio e image_url/imagen válidos.'
                        );
                        continue;
                    }

                    $seoTitle = $this->normalizeText($row['seo_title'] ?? null);
                    $seoDescription = $this->normalizeText($row['seo_description'] ?? null);

                    $temp = TemporaryProduct::where('title', $title)
                        ->where('price', $price)
                        ->where('image_url', $imageUrl)
                        ->first();

                    if (!$temp) {
                        $temp = TemporaryProduct::create([
                            'title' => $title,
                            'seo_title' => $seoTitle,
                            'seo_description' => $seoDescription,
                            'price' => $price,
                            'image_url' => $imageUrl,
                        ]);
                        $created++;
                    } else {
                        $didUpdate = false;
                        if ($seoTitle && $temp->seo_title !== $seoTitle) {
                            $temp->seo_title = $seoTitle;
                            $didUpdate = true;
                        }
                        if ($seoDescription && $temp->seo_description !== $seoDescription) {
                            $temp->seo_description = $seoDescription;
                            $didUpdate = true;
                        }
                        if ($didUpdate) {
                            $temp->save();
                            $updated++;
                        }
                    }

                    $images = $row['images'] ?? $row['imagenes'] ?? [];
                    $imageUrls = $this->extractImageUrls($images);

                    $nextPosition = ((int) ($temp->images()->max('position') ?? 0)) + 1;
                    foreach ($imageUrls as $url) {
                        $exists = TemporaryProductImage::where('temporary_product_id', $temp->id)
                            ->where('image_url', $url)
                            ->exists();

                        if ($exists) {
                            continue;
                        }

                        TemporaryProductImage::create([
                            'temporary_product_id' => $temp->id,
                            'image_url' => $url,
                            'position' => $nextPosition,
                        ]);

                        $nextPosition++;
                        $imagesCreated++;
                    }
                }
            });
        } catch (Throwable $e) {
            $this->error('Error durante la importación a base de datos temporal.');
            $this->error($e->getMessage());
            return self::FAILURE;
        }

        $this->info('Importación completada.');
        $this->line("- Productos creados: {$created}");
        $this->line("- Productos actualizados SEO: {$updated}");
        $this->line("- Imágenes agregadas: {$imagesCreated}");
        $this->line("- Registros omitidos: {$skipped}");

        return self::SUCCESS;
    }

    private function normalizeText($value): ?string
    {
        if ($value === null) {
            return null;
        }

        $text = trim((string) $value);
        return $text !== '' ? $text : null;
    }

    private function normalizePrice($value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_numeric($value)) {
            return round((float) $value, 2);
        }

        $raw = trim((string) $value);
        if ($raw === '') {
            return null;
        }

        $clean = preg_replace('/[^\d,\.\-]/', '', $raw) ?? '';
        if ($clean === '') {
            return null;
        }

        if (str_contains($clean, ',') && str_contains($clean, '.')) {
            $lastComma = strrpos($clean, ',');
            $lastDot = strrpos($clean, '.');
            if ($lastComma !== false && $lastDot !== false) {
                if ($lastComma > $lastDot) {
                    $clean = str_replace('.', '', $clean);
                    $clean = str_replace(',', '.', $clean);
                } else {
                    $clean = str_replace(',', '', $clean);
                }
            }
        } elseif (str_contains($clean, ',')) {
            $clean = str_replace(',', '.', $clean);
        }

        if (!is_numeric($clean)) {
            return null;
        }

        return round((float) $clean, 2);
    }

    private function extractImageUrls($images): array
    {
        if (!is_array($images)) {
            return [];
        }

        $out = [];
        $seen = [];

        foreach ($images as $item) {
            $url = null;
            if (is_string($item)) {
                $url = $item;
            } elseif (is_array($item)) {
                $url = $item['src'] ?? $item['image_url'] ?? null;
            }

            $normalized = $this->normalizeText($url);
            if (!$normalized) {
                continue;
            }

            if (isset($seen[$normalized])) {
                continue;
            }

            $seen[$normalized] = true;
            $out[] = $normalized;
        }

        return $out;
    }
}
