<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;

class CustomVerifyEmail extends VerifyEmail
{
    public function toMail($notifiable): MailMessage
    {
        $verificationUrl = $this->verificationUrl($notifiable);
        $expires = config('auth.verification.expire', 60);
        $displayName = trim((string) implode(' ', array_filter([
            $notifiable->name ?? null,
            $notifiable->lastname ?? null,
        ])));

        return (new MailMessage())
            ->subject('Verifica tu correo en '.config('app.name'))
            ->from(config('mail.support_address'), config('mail.from.name'))
            ->view('emails.verify-email', [
                'appName' => config('app.name'),
                'userName' => $displayName !== '' ? $displayName : ($notifiable->email ?? 'cliente'),
                'verificationUrl' => $verificationUrl,
                'expiresInMinutes' => $expires,
                'supportEmail' => config('mail.support_address'),
            ]);
    }
}