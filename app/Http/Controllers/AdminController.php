<?php
namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\User;
use App\Models\Product;
use App\Models\Category;
use App\Models\Banner;
use App\Models\Review;
use App\Models\Coupon;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\File;

class AdminController extends Controller
{
    public function dashboard()
    {
        return Inertia::render('Admin/Dashboard', [
            'ordersCount' => Order::count(),
            'usersCount' => User::count(),
            'productsCount' => Product::count(),
            'pendingOrders' => Order::where('status', 'pendiente_pago')->count(),
        ]);
    }

    public function orders()
    {
        $orders = Order::with(['user', 'items.product'])->orderByDesc('created_at')->get();
        return Inertia::render('Admin/Orders', ['orders' => $orders]);
    }

    public function cancelOrder(Request $request, $orderId)
    {
        $order = Order::findOrFail($orderId);
        if ($order->isShipped() || $order->status === 'cancelado') {
            return back()->with('error', 'No se puede cancelar un pedido ya enviado o cancelado.');
        }
        $order->status = 'cancelado';
        $order->cancellation_reason = $request->input('reason') ?: 'Cancelado por administrador';
        $order->cancelled_by = 'admin';
        $order->cancelled_at = now();
        $order->save();
        return back()->with('success', 'Pedido cancelado por el administrador.');
    }

    public function markAsShipped($orderId)
    {
        $order = Order::findOrFail($orderId);
        if (in_array($order->status, ['confirmado', 'pagado', 'pendiente_envio'])) {
            $order->status = 'enviado';
            $order->save();
        }
        return back();
    }

    public function markAsDelivered($orderId)
    {
        $order = Order::findOrFail($orderId);
        if ($order->status === 'enviado') {
            $order->status = 'entregado';
            $order->save();
        }
        return back();
    }

    public function users()
    {
        $users = User::orderByDesc('created_at')->get();
        return Inertia::render('Admin/Users', ['users' => $users]);
    }

    public function toggleAdmin($userId)
    {
        $user = User::findOrFail($userId);
        $user->is_admin = !$user->is_admin;
        $user->save();
        return back();
    }

    public function products()
    {
        $products = Product::with('category')->orderByDesc('created_at')->get();
        return Inertia::render('Admin/Products', ['products' => $products]);
    }

    public function deleteProduct($productId)
    {
        $product = Product::findOrFail($productId);
        $product->delete();
        return back();
    }

    public function categories()
    {
        $categories = Category::orderByDesc('created_at')->get();
        return Inertia::render('Admin/Categories', ['categories' => $categories]);
    }

    public function deleteCategory($categoryId)
    {
        $category = Category::findOrFail($categoryId);
        $category->delete();
        return back();
    }

    public function storeCategory(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:categories,slug',
        ]);
        Category::create($request->only('name', 'slug', 'description'));
        return back();
    }

    public function banners()
    {
        $banners = Banner::orderByDesc('created_at')->get();
        return Inertia::render('Admin/Banners', ['banners' => $banners]);
    }

    public function deleteBanner($bannerId)
    {
        $banner = Banner::findOrFail($bannerId);
        $banner->delete();
        return back();
    }

    public function storeBanner(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'image_url' => 'required|string|max:255',
        ]);
        Banner::create($request->only('title', 'image_url'));
        return back();
    }

    public function reviews()
    {
        $reviews = Review::with('product', 'user')->orderByDesc('created_at')->get();
        return Inertia::render('Admin/Reviews', ['reviews' => $reviews]);
    }

    public function deleteReview($reviewId)
    {
        $review = Review::findOrFail($reviewId);
        $review->delete();
        return back();
    }

    public function logs()
    {
        $logPath = storage_path('logs/laravel.log');
        $logs = File::exists($logPath) ? explode("\n", File::get($logPath)) : [];
        return Inertia::render('Admin/Logs', ['logs' => $logs]);
    }

    public function stats()
    {
        $orders = Order::count();
        $sales = Order::whereIn('status', ['pagado', 'enviado', 'entregado', 'confirmado'])->sum('total');
        $users = User::count();
        $products = Product::count();
        $reviews = Review::count();
        $topProducts = Product::withCount('reviews')->orderByDesc('reviews_count')->take(5)->get();
        $recentOrders = Order::with('user')->orderByDesc('created_at')->take(5)->get();

        return Inertia::render('Admin/Stats', [
            'orders' => $orders,
            'sales' => $sales,
            'users' => $users,
            'products' => $products,
            'reviews' => $reviews,
            'topProducts' => $topProducts,
            'recentOrders' => $recentOrders,
        ]);
    }

    public function coupons()
    {
        $coupons = Coupon::orderByDesc('created_at')->get();
        return Inertia::render('Admin/Coupons', ['coupons' => $coupons]);
    }

    public function storeCoupon(Request $request)
    {
        $request->validate([
            'code' => 'required|string|unique:coupons,code',
            'discount' => 'required|numeric|min:0',
            'type' => 'required|in:percent,fixed',
            'expires_at' => 'nullable|date',
            'usage_limit' => 'nullable|integer|min:1',
        ]);
        Coupon::create($request->only('code', 'discount', 'type', 'expires_at', 'usage_limit'));
        return back();
    }

    public function deleteCoupon($couponId)
    {
        $coupon = Coupon::findOrFail($couponId);
        $coupon->delete();
        return back();
    }

    public function updateCoupon(Request $request, $couponId)
    {
        $coupon = Coupon::findOrFail($couponId);
        $coupon->update($request->only('code', 'discount', 'type', 'expires_at', 'usage_limit'));
        return back()->with('success', 'Cupón actualizado.');
    }

    public function settings()
    {
        $settings = Setting::all()->pluck('value', 'key');
        return Inertia::render('Admin/Settings', ['settings' => $settings]);
    }

    public function updateSettings(Request $request)
    {
        foreach ($request->except('_token') as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }
        return back()->with('success', 'Configuración actualizada.');
    }
}
