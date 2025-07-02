<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminMiddleware
{
    /**
     * Maneja la solicitud entrante.
     */
    public function handle(Request $request, Closure $next)
    {
        // Verifica si el usuario está autenticado y es administrador
        if (!Auth::check() || !Auth::user()->is_admin) {
            abort(403, 'Acceso denegado: solo administradores.');
        }

        return $next($request);
    }
}
