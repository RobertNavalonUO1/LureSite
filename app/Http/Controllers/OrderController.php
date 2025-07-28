<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OrderController extends Controller
{
    /**
     * Mostrar todos los pedidos del usuario autenticado.
     */
    public function index()
    {
        $orders = Order::where('user_id', Auth::id())
            ->with('items.product')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($order) => $this->transform($order));

        return Inertia::render('Orders/Index', ['orders' => $orders]);
    }

    /**
     * Mostrar pedidos que han sido enviados, entregados o confirmados.
     */
    public function shipped()
    {
        $orders = Order::where('user_id', Auth::id())
            ->whereIn('status', ['enviado', 'entregado', 'confirmado'])
            ->with('items.product')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($order) => array_merge(
                $this->transform($order),
                ['estimated_delivery' => $order->created_at->addDays(3)->format('Y-m-d')]
            ));

        return Inertia::render('Orders/Shipped', ['orders' => $orders]);
    }

    /**
     * Mostrar pedidos pagados (puedes ajustar según tu lógica de negocio).
     */
    public function paid()
    {
        $orders = Order::where('user_id', Auth::id())
            ->whereIn('status', ['pagado', 'enviado', 'entregado', 'confirmado']) // puedes ajustar esto
            ->with('items.product')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($order) => $this->transform($order));

        return Inertia::render('Orders/Paid', ['orders' => $orders]);
    }

    /**
     * Confirmar que el pedido fue recibido por el cliente.
     */
    public function confirm($orderId)
    {
        $order = Order::where('id', $orderId)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        if ($order->status === 'entregado') {
            $order->status = 'confirmado';
            $order->save();

            return back()->with('success', 'Has confirmado la entrega del pedido.');
        }

        return back()->with('error', 'Este pedido no puede ser confirmado todavía.');
    }

    /**
     * Panel de administración: mostrar todos los pedidos.
     */
    public function adminIndex()
    {
        $orders = Order::with('items.product')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($order) => [
                'id' => $order->id,
                'user' => $order->name,
                'email' => $order->email,
                'total' => number_format($order->total, 2),
                'status' => $order->status,
                'date' => $order->created_at->format('Y-m-d'),
                'address' => $order->address,
                'items' => $order->items->map(fn($item) => [
                    'product' => $item->product->name ?? 'Eliminado',
                    'quantity' => $item->quantity,
                    'price' => $item->price,
                ]),
            ]);

        return Inertia::render('AdminOrders', ['orders' => $orders]);
    }

    /**
     * Marcar un pedido como enviado (admin).
     */
    public function markAsShipped(Order $order)
    {
        if ($order->status === 'pagado' || $order->status === 'pendiente_envio') {
            $order->status = 'enviado';
            $order->save();

            return back()->with('success', 'Pedido marcado como enviado.');
        }

        return back()->with('error', 'No se puede marcar como enviado en este estado.');
    }
public function cancelled()
{
    $orders = Order::where('user_id', Auth::id())
        ->whereIn('status', ['cancelado', 'reembolso_pendiente'])
        ->with('items.product')
        ->latest()
        ->get()
        ->map(fn($order) => $this->transform($order));

    return Inertia::render('Orders/CancelledRefundedOrders', ['orders' => $orders]);
}

    /**
     * Marcar un pedido como entregado (admin).
     */
    public function markAsDelivered(Order $order)
    {
        if ($order->status === 'enviado') {
            $order->status = 'entregado';
            $order->save();

            return back()->with('success', 'Pedido marcado como entregado.');
        }

        return back()->with('error', 'No se puede marcar como entregado en este estado.');
    }

    /**
     * Formatear y mapear un pedido.
     */
    private function transform(Order $order)
    {
        return [
            'id' => $order->id,
            'date' => $order->created_at->format('Y-m-d'),
            'total' => number_format($order->total, 2),
            'status' => $order->status,
            'address' => $order->address,
            'items' => $order->items->map(fn($item) => [
                'id' => $item->product->id ?? null,
                'name' => $item->product->name ?? 'Producto eliminado',
                'image' => $item->product->image ?? null,
                'quantity' => $item->quantity,
                'price' => $item->price,
            ]),
        ];
    }
}
