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

class OrderShipmentUpdateMail extends Mailable
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
            subject: sprintf('Tu pedido #%s ya esta en camino | %s', $this->order->id, config('app.name')),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.order-confirmation',
            with: OrderMailData::build($this->order, [
                'mailTitle' => 'Pedido en camino',
                'preheader' => sprintf('Tu pedido #%s ya tiene seguimiento externo activo.', $this->order->id),
                'introText' => sprintf('Tu pedido #%s ha salido y ya dispone de seguimiento externo. Usa el boton inferior para consultar el estado actualizado del envio.', $this->order->id),
            ]),
        );
    }

    public function attachments(): array
    {
        return [];
    }
}