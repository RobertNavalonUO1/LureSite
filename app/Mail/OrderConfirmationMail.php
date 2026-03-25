<?php

namespace App\Mail;

use App\Models\Order;
use App\Support\OrderMailData;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order)
    {
        $this->order->loadMissing(['items.product']);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(
                config('mail.orders_address', config('mail.from.address')),
                config('mail.from.name')
            ),
            subject: sprintf('Pedido #%s confirmado | %s', $this->order->id, config('app.name')),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.order-confirmation',
            with: OrderMailData::build($this->order, [
                'mailTitle' => 'Pedido confirmado',
                'preheader' => sprintf('Tu pedido #%s ya esta registrado y en seguimiento.', $this->order->id),
                'introText' => sprintf('Hemos confirmado tu pedido #%s. A continuacion tienes el estado actual, el resumen de compra y el acceso al seguimiento.', $this->order->id),
            ]),
        );
    }

    public function attachments(): array
    {
        return [];
    }
}