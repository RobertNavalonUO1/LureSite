<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\ContactMessage;
use Inertia\Inertia;

class ContactController extends Controller
{
public function send(Request $request)
{
    $validated = $request->validate([
        'name'    => 'required|string|max:255',
        'email'   => 'required|email',
        'message' => 'required|string|max:3000',
    ]);

    // Enviar al administrador
    Mail::to(config('mail.from.address'))->send(new ContactMessage($validated));

    // Enviar copia al usuario
    Mail::to($validated['email'])->send(new ContactConfirmation($validated));

    return back()->with('flash', [
        'type' => 'success',
        'message' => 'Tu mensaje ha sido enviado correctamente. Te hemos enviado una copia a tu correo.',
    ]);
}

}
