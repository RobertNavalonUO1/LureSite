<?php

namespace App\Http;

use Illuminate\Foundation\Http\Kernel as HttpKernel;

class Kernel extends HttpKernel
{
    /**
     * Middleware globales (se ejecutan en cada request).
     */
    protected $middleware = [
        // \App\Http\Middleware\TrustHosts::class,
        \App\Http\Middleware\TrustProxies::class,
        \Illuminate\Http\Middleware\HandleCors::class,
        \App\Http\Middleware\PreventRequestsDuringMaintenance::class,
        \Illuminate\Foundation\Http\Middleware\ValidatePostSize::class,
        \App\Http\Middleware\TrimStrings::class,
        \Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class,
    ];

    /**
     * Grupos de middleware (si ya los usabas, puedes mantenerlos).
     * En Laravel 11 también puedes gestionarlos en bootstrap/app.php,
     * pero esto sigue siendo válido.
     */
    protected $middlewareGroups = [
        'web' => [
            \App\Http\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            \Illuminate\Session\Middleware\StartSession::class,
            \Illuminate\View\Middleware\ShareErrorsFromSession::class,
            \App\Http\Middleware\VerifyCsrfToken::class,
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ],

        'api' => [
            'throttle:api',
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ],
    ];

    /**
     * ALIASES de middleware para usar en rutas (Laravel 11).
     * ⚠️ Este bloque sustituye a $routeMiddleware de versiones anteriores.
     */
    protected $middlewareAliases = [
        'auth'              => \App\Http\Middleware\Authenticate::class,
        'verified'          => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
        'guest'             => \App\Http\Middleware\RedirectIfAuthenticated::class,
        'auth.session'      => \Illuminate\Session\Middleware\AuthenticateSession::class,
        'signed'            => \Illuminate\Routing\Middleware\ValidateSignature::class,
        'throttle'          => \Illuminate\Routing\Middleware\ThrottleRequests::class,
        'cache.headers'     => \Illuminate\Http\Middleware\SetCacheHeaders::class,
        'password.confirm'  => \Illuminate\Auth\Middleware\RequirePassword::class,
        'can'               => \Illuminate\Auth\Middleware\Authorize::class,
        'precognitive'      => \Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests::class,

        // 👉 alias de tu middleware de admin:
        'admin'             => \App\Http\Middleware\AdminMiddleware::class,
    ];
}
