<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        $user = auth()->user();

        Log::info('🔐 [AdminMiddleware] Intento de acceso a ruta admin', [
            'url' => $request->fullUrl(),
            'user_id' => $user?->id,
            'user_email' => $user?->email,
            'is_admin' => $user?->is_admin,
            'auth_check' => auth()->check(),
        ]);

        if (!auth()->check()) {
            Log::warning('⛔ [AdminMiddleware] Usuario no autenticado');
            abort(403, 'No autenticado');
        }

        if (!$user->is_admin) {
            Log::warning('🚫 [AdminMiddleware] Usuario autenticado pero no es admin', [
                'is_admin' => $user->is_admin,
            ]);
            abort(403, 'No tienes permisos de administrador.');
        }

        Log::info('✅ [AdminMiddleware] Acceso permitido');
        return $next($request);
    }
}
