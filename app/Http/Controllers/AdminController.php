<?php
namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\User;
use App\Models\Product;
use App\Models\Category;
use App\Models\Banner;
use App\Models\Review;
use App\Models\Coupon;
use App\Models\OrderItem;
use App\Models\Setting;
use App\Services\OrderRefundService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Illuminate\Support\Facades\File;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    private const SETTINGS_KEYS = [
        'campaign.mode',
        'campaign.manual_slug',
    ];

    public function dashboard()
    {
        $paidStatuses = ['pagado', 'pendiente_envio', 'enviado', 'entregado', 'confirmado'];
        $monthStart = now()->copy()->startOfMonth();

        $monthlyOrders = Order::whereIn('status', $paidStatuses)
            ->where('created_at', '>=', $monthStart);

        $refundMetrics = [
            'requested' => Order::where('status', 'devolucion_solicitada')->count(),
            'approved' => Order::where('status', 'devolucion_aprobada')->count(),
            'failed' => Order::where('status', 'devolucion_aprobada')->whereNotNull('refund_error')->count(),
            'refunded' => Order::where('status', 'reembolsado')->count(),
        ];

        $recentOrders = Order::with('user')
            ->latest()
            ->take(6)
            ->get()
            ->map(fn (Order $order) => [
                'id' => $order->id,
                'code' => '#' . $order->id,
                'customer' => $order->user?->name ?? $order->name ?? 'Sin cliente',
                'status' => $order->status,
                'total' => (float) $order->total,
            ]);

        $topProducts = OrderItem::with('product:id,name')
            ->selectRaw('product_id, SUM(quantity) as units, SUM(quantity * price) as revenue')
            ->whereHas('order', fn ($query) => $query->whereIn('status', $paidStatuses))
            ->groupBy('product_id')
            ->orderByDesc('units')
            ->take(5)
            ->get()
            ->map(fn (OrderItem $item) => [
                'id' => $item->product_id,
                'name' => $item->product?->name ?? 'Producto sin nombre',
                'units' => (int) $item->units,
                'revenue' => (float) $item->revenue,
            ]);

        $alerts = collect();

        if ($refundMetrics['failed'] > 0) {
            $alerts->push([
                'id' => 'refund-failed',
                'title' => 'Reembolsos con error',
                'message' => "{$refundMetrics['failed']} pedido(s) aprobados siguen esperando un nuevo intento de reembolso.",
                'type' => 'warning',
            ]);
        }

        if ($refundMetrics['approved'] > 0) {
            $alerts->push([
                'id' => 'returns-approved',
                'title' => 'Devoluciones aprobadas pendientes',
                'message' => "{$refundMetrics['approved']} pedido(s) están listos para reembolso o revisión administrativa.",
                'type' => 'warning',
            ]);
        }

        $activity = Order::with('user')
            ->where(function ($query) {
                $query->whereIn('status', ['devolucion_solicitada', 'devolucion_aprobada', 'reembolsado', 'cancelado'])
                    ->orWhereNotNull('refund_error');
            })
            ->latest()
            ->take(6)
            ->get()
            ->map(function (Order $order) {
                if ($order->refund_error) {
                    return [
                        'id' => 'refund-error-' . $order->id,
                        'title' => "Error de reembolso en pedido #{$order->id}",
                        'description' => $order->refund_error,
                    ];
                }

                return match ($order->status) {
                    'devolucion_solicitada' => [
                        'id' => 'return-request-' . $order->id,
                        'title' => "Nueva solicitud de devolución #{$order->id}",
                        'description' => 'Pendiente de revisión por administración.',
                    ],
                    'devolucion_aprobada' => [
                        'id' => 'return-approved-' . $order->id,
                        'title' => "Devolución aprobada #{$order->id}",
                        'description' => 'Lista para intentar el reembolso con el proveedor de pago.',
                    ],
                    'reembolsado' => [
                        'id' => 'refund-complete-' . $order->id,
                        'title' => "Reembolso confirmado #{$order->id}",
                        'description' => 'El pedido ya quedó marcado como reembolsado.',
                    ],
                    'cancelado' => [
                        'id' => 'order-cancelled-' . $order->id,
                        'title' => "Pedido cancelado #{$order->id}",
                        'description' => $order->cancellation_reason ?: 'Cancelado desde administración o por flujo de pedido.',
                    ],
                    default => [
                        'id' => 'order-activity-' . $order->id,
                        'title' => "Actualización de pedido #{$order->id}",
                        'description' => 'Movimiento operativo reciente en pedidos.',
                    ],
                };
            });

        return Inertia::render('Admin/Dashboard', [
            'ordersCount' => Order::count(),
            'usersCount' => User::count(),
            'productsCount' => Product::count(),
            'pendingOrders' => Order::where('status', 'pendiente_pago')->count(),
            'monthlyRevenue' => (float) (clone $monthlyOrders)->sum('total'),
            'avgOrderValue' => (float) ((clone $monthlyOrders)->avg('total') ?? 0),
            'newCustomers' => User::where('created_at', '>=', $monthStart)->count(),
            'conversionRate' => Order::count() > 0
                ? round((Order::whereIn('status', $paidStatuses)->count() / Order::count()) * 100, 1)
                : 0,
            'supportTickets' => $refundMetrics['requested'] + $refundMetrics['failed'],
            'topProducts' => $topProducts,
            'recentOrders' => $recentOrders,
            'alerts' => $alerts->values(),
            'activity' => $activity,
            'lastUpdated' => now()->toIso8601String(),
            'currency' => 'USD',
            'refundMetrics' => $refundMetrics,
        ]);
    }

    public function orders()
    {
        $orders = Order::with(['user', 'items.product'])->orderByDesc('created_at')->get();
        return Inertia::render('Admin/Orders', ['orders' => $orders]);
    }

    public function cancelOrder(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        if ($order->isShipped() || $order->status === 'cancelado') {
            return back()->with('error', 'No se puede cancelar un pedido ya enviado o cancelado.');
        }

        $order->status = 'cancelado';
        $order->cancellation_reason = $validated['reason'] ?? 'Cancelado por administrador';
        $order->cancelled_by = 'admin';
        $order->cancelled_at = now();
        $order->save();

        return back()->with('success', 'Pedido cancelado por el administrador.');
    }

    public function markAsShipped(Order $order): RedirectResponse
    {
        if (in_array($order->status, ['confirmado', 'pagado', 'pendiente_envio'])) {
            $order->status = 'enviado';
            $order->save();

            return back()->with('success', 'Pedido marcado como enviado.');
        }

        return back()->with('error', 'El pedido no se puede marcar como enviado desde su estado actual.');
    }

    public function markAsDelivered(Order $order): RedirectResponse
    {
        if ($order->status === 'enviado') {
            $order->status = 'entregado';
            $order->save();

            return back()->with('success', 'Pedido marcado como entregado.');
        }

        return back()->with('error', 'Solo los pedidos enviados pueden marcarse como entregados.');
    }

    public function approveReturn(Order $order): RedirectResponse
    {
        if ($order->status !== 'devolucion_solicitada') {
            return back()->with('error', 'Solo se pueden aprobar devoluciones pendientes de revisión.');
        }

        $order->status = 'devolucion_aprobada';
        $order->save();

        return back()->with('success', 'La devolución fue aprobada.');
    }

    public function rejectReturn(Order $order): RedirectResponse
    {
        if ($order->status !== 'devolucion_solicitada') {
            return back()->with('error', 'Solo se pueden rechazar devoluciones pendientes de revisión.');
        }

        $order->status = 'devolucion_rechazada';
        $order->save();

        return back()->with('success', 'La devolución fue rechazada.');
    }

    public function processRefund(Order $order, OrderRefundService $refundService): RedirectResponse
    {
        if ($order->status !== 'devolucion_aprobada') {
            return back()->with('error', 'Solo se pueden procesar reembolsos de devoluciones aprobadas.');
        }

        if ($order->refund_reference_id && $order->refunded_at) {
            $order->status = 'reembolsado';
            $order->cancelled_by ??= 'admin';
            $order->cancelled_at ??= $order->refunded_at;
            $order->save();

            return back()->with('success', 'El pedido ya tenía un reembolso registrado.');
        }

        try {
            $refund = $refundService->refund($order);

            Log::info('refund.order.updated', [
                'order_id' => $order->id,
                'payment_method' => $order->payment_method,
                'refund_reference_id' => $refund->referenceId,
                'provider_status' => $refund->providerStatus,
                'already_processed' => $refund->alreadyProcessed,
            ]);

            $order->status = 'reembolsado';
            $order->cancelled_by = 'admin';
            $order->cancelled_at = now();
            $order->refunded_at = now();
            $order->refund_reference_id = $refund->referenceId;
            $order->refund_error = null;
            $order->save();

            return back()->with('success', 'Reembolso procesado correctamente.');
        } catch (\Throwable $exception) {
            Log::warning('refund.order.failed', [
                'order_id' => $order->id,
                'payment_method' => $order->payment_method,
                'message' => $exception->getMessage(),
            ]);

            $order->refund_error = $exception->getMessage();
            $order->save();

            return back()->with('error', 'No se pudo procesar el reembolso con el proveedor de pago.');
        }
    }

    public function users()
    {
        $users = User::orderByDesc('created_at')->get();
        return Inertia::render('Admin/Users', ['users' => $users]);
    }

    public function toggleAdmin(Request $request, User $user)
    {
        $currentUser = $request->user();

        if ((int) $currentUser->id === (int) $user->id && $user->is_admin) {
            return back()->with('error', 'No puedes retirarte tus propios permisos de administrador.');
        }

        if ($user->is_admin && User::where('is_admin', true)->count() <= 1) {
            return back()->with('error', 'Debe existir al menos un administrador activo.');
        }

        $user->is_admin = !$user->is_admin;
        $user->save();

        return back()->with('success', 'Permisos de administrador actualizados.');
    }

    public function products()
    {
        $products = Product::with('category')->orderByDesc('created_at')->get();
        return Inertia::render('Admin/Products', ['products' => $products]);
    }

    public function deleteProduct(Product $product): RedirectResponse
    {
        $product->delete();

        return back()->with('success', 'Producto eliminado correctamente.');
    }

    public function categories()
    {
        $categories = Category::orderByDesc('created_at')->get();
        return Inertia::render('Admin/Categories', ['categories' => $categories]);
    }

    public function deleteCategory(Category $category): RedirectResponse
    {
        $category->delete();

        return back()->with('success', 'Categoría eliminada correctamente.');
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

    public function deleteBanner(Banner $banner): RedirectResponse
    {
        $banner->delete();

        return back()->with('success', 'Banner eliminado correctamente.');
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

    public function deleteReview(Review $review): RedirectResponse
    {
        $review->delete();

        return back()->with('success', 'Review eliminada correctamente.');
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
        $settings = [
            'campaign' => [
                'mode' => Setting::where('key', 'campaign.mode')->value('value') ?: 'auto',
                'manual_slug' => Setting::where('key', 'campaign.manual_slug')->value('value') ?: '',
            ],
        ];

        return Inertia::render('Admin/Settings', ['settings' => $settings]);
    }

    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'campaign.mode' => ['required', Rule::in(['auto', 'manual'])],
            'campaign.manual_slug' => ['nullable', 'string', 'max:255'],
        ]);

        Setting::updateOrCreate(['key' => 'campaign.mode'], ['value' => $validated['campaign']['mode']]);
        Setting::updateOrCreate(['key' => 'campaign.manual_slug'], ['value' => $validated['campaign']['manual_slug'] ?? '']);

        return back()->with('success', 'Configuración actualizada.');
    }
}
