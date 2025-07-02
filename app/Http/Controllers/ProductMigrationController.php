<?php
namespace App\Http\Controllers;

use App\Models\TemporaryProduct;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProductMigrationController extends Controller
{
// En ProductMigrationController.php
public function index()
{
    $temporaryProducts = TemporaryProduct::all(); // Eliminar el with('category')
    $categories = Category::all();

    $defaultCategory = Category::firstOrCreate(
        ['name' => 'General'],
        ['slug' => 'general', 'is_active' => true]
    );

    return inertia('MigrateProducts', [
        'temporaryProducts' => $temporaryProducts,
        'categories' => $categories,
        'defaultStock' => 10,
        'defaultCategory' => $defaultCategory->id
    ]);
}

    public function migrate(Request $request, $id)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'stock' => 'required|integer|min:0',
            'name' => 'sometimes|string|max:255'
        ]);

        try {
            $temp = TemporaryProduct::findOrFail($id);

            DB::transaction(function () use ($validated, $temp) {
                Product::create([
                    'name' => $validated['name'] ?? $temp->title,
                    'description' => $temp->title,
                    'price' => $temp->price,
                    'image_url' => $temp->image_url,
                    'stock' => $validated['stock'],
                    'category_id' => $validated['category_id'],
                    'is_adult' => false,
'link' => $temp->link ?? $temp->image_url,
                ]);

                $temp->delete();
            });

            return response()->json([
                'success' => true,
                'message' => 'Producto migrado con éxito.',
                'remaining' => TemporaryProduct::count()
            ]);

        } catch (\Exception $e) {
            Log::error("Error migrating product {$id}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al migrar producto: ' . $e->getMessage()
            ], 500);
        }
    }

    public function bulkMigrate(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'stock' => 'required|integer|min:0'
        ]);

        $temporaryProducts = TemporaryProduct::all();
        $totalProducts = $temporaryProducts->count();

        if ($totalProducts === 0) {
            return response()->json([
                'success' => false,
                'message' => 'No hay productos para migrar'
            ], 400);
        }

        DB::beginTransaction();

        try {
            $migratedCount = 0;
            $errors = [];
            
            foreach ($temporaryProducts as $temp) {
                try {
                    Product::create([
                        'name' => $temp->title,
                        'description' => $temp->title,
                        'price' => $temp->price,
                        'image_url' => $temp->image_url,
                        'stock' => $validated['stock'],
                        'category_id' => $validated['category_id'],
                        'is_adult' => false,
'link' => $temp->link ?? $temp->image_url,
                    ]);

                    $temp->delete();
                    $migratedCount++;
                } catch (\Exception $e) {
                    $errors[] = "Producto ID {$temp->id}: " . $e->getMessage();
                    Log::error("Error migrating product {$temp->id}: " . $e->getMessage());
                }
            }

            if (!empty($errors) && $migratedCount === 0) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Error al migrar todos los productos',
                    'errors' => $errors
                ], 500);
            }

            DB::commit();

            $message = $migratedCount === $totalProducts 
                ? "Todos los productos ({$migratedCount}) migrados con éxito."
                : "{$migratedCount} de {$totalProducts} productos migrados con éxito.";

            if (!empty($errors)) {
                $message .= " Algunos productos no se pudieron migrar.";
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'migrated_count' => $migratedCount,
                'errors' => $errors
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Error en migración masiva: " . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Error crítico al migrar productos: ' . $e->getMessage()
            ], 500);
        }
    }
}