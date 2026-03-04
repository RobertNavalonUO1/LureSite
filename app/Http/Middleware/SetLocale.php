<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;

class SetLocale
{
    /** @var string[] */
    private array $supported = ['es', 'en', 'fr'];

    public function handle(Request $request, Closure $next)
    {
        $locale = $request->cookie('locale')
            ?: $request->session()->get('locale')
            ?: config('app.locale');

        if (!is_string($locale) || !in_array($locale, $this->supported, true)) {
            $locale = config('app.fallback_locale', 'es');
        }

        App::setLocale($locale);

        return $next($request);
    }
}
