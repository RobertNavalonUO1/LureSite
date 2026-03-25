<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AccountDeletionConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public array $account)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(
                config('mail.help_address', config('mail.from.address')),
                config('mail.from.name')
            ),
            subject: 'Tu cuenta de '.config('app.name').' ha sido eliminada',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.account-deleted',
            with: [
                'appName' => config('app.name'),
                'account' => $this->account,
                'supportEmail' => config('mail.support_address'),
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}