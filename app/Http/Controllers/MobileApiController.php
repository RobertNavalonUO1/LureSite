<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{Product, Category, Order, OrderItem, User, Address};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class MobileApiController extends Controller
{
    // 🔐 Registro de usuario
    public function register(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users',
            'password' => 'required|string|min:6',
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        $token = $user->createToken('mobile')->plainTextToken;

        return response()->json(['token' => $token, 'user' => $user]);
    }

    // 🔐 Login
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json(['message' => 'Credenciales inválidas'], 401);
        }

        $token = $user->createToken('mobile')->plainTextToken;

        return response()->json(['token' => $token, 'user' => $user]);
    }

    // 📦 Listado de productos
    public function products()
    {
        return Product::with('category')->get();
    }

    // 📚 Categorías
    public function categories()
    {
        return Category::all();
    }

    // 🛒 Realizar pedido
    public function placeOrder(Request $request)
    {
        $data = $request->validate([
            'items'     => 'required|array',
            'total'     => 'required|numeric',
            'address'   => 'required|string',
        ]);

        $order = Order::create([
            'user_id' => Auth::id(),
            'total'   => $data['total'],
            'address' => $data['address'],
            'status'  => 'processing',
        ]);

        foreach ($data['items'] as $item) {
            OrderItem::create([
                'order_id'  => $order->id,
                'product_id'=> $item['product_id'],
                'quantity'  => $item['quantity'],
                'price'     => $item['price'],
            ]);
        }

        return response()->json(['message' => 'Pedido realizado', 'order_id' => $order->id]);
    }

    // 📦 Mis pedidos
    public function myOrders()
    {
        return Order::with(['items.product'])
            ->where('user_id', Auth::id())
            ->latest()->get();
    }

    // 📇 Guardar dirección
    public function saveAddress(Request $request)
    {
        $data = $request->validate([
            'address' => 'required|string|max:255'
        ]);

        $address = Address::create([
            'user_id' => Auth::id(),
            'address' => $data['address'],
        ]);

        return response()->json(['message' => 'Dirección guardada', 'address' => $address]);
    }

    // 📇 Ver direcciones del usuario
    public function getAddresses()
    {
        return Address::where('user_id', Auth::id())->get();
    }

    // 👤 Perfil del usuario autenticado
    public function me()
    {
        return Auth::user();
    }
}
