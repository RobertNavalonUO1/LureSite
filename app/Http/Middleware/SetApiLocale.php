<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetApiLocale
{
    /** @var string[] */
    private array $supported = ['es', 'en', 'fr'];

    public function handle(Request $request, Closure $next): Response
    {
        $locale = $this->resolveLocale($request->header('Accept-Language'));

        App::setLocale($locale);

        /** @var Response $response */
        $response = $next($request);
        $response->headers->set('Content-Language', $locale);

        return $response;
    }

    private function resolveLocale(?string $header): string
    {
        if (!is_string($header) || trim($header) === '') {
            return config('app.fallback_locale', 'es');
        }

        foreach (explode(',', $header) as $candidate) {
            $value = strtolower(trim(explode(';', $candidate)[0] ?? ''));

            if ($value === '') {
                continue;
            }

            if (in_array($value, $this->supported, true)) {
                return $value;
            }

            $language = substr($value, 0, 2);
            if (in_array($language, $this->supported, true)) {
                return $language;
            }
        }

        return config('app.fallback_locale', 'es');
    }
}
