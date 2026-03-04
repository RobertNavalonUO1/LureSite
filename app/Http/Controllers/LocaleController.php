<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LocaleController
{
    /** @var string[] */
    private array $supported = ['es', 'en', 'fr'];

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'locale' => ['required', 'string', Rule::in($this->supported)],
        ]);

        $locale = $validated['locale'];

        $request->session()->put('locale', $locale);

        return back()->withCookie(cookie('locale', $locale, 60 * 24 * 365));
    }
}
