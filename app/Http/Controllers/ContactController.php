<?php

namespace App\Http\Controllers;

use App\Mail\ContactConfirmation;
use App\Mail\ContactMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    public function send(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'message' => 'required|string|max:3000',
        ]);

        Mail::to(config('mail.from.address'))->send(new ContactMessage($validated));
        Mail::to($validated['email'])->send(new ContactConfirmation($validated));

        return back()->with('success', __('contact.sent'));
    }
}
