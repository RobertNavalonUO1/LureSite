<?php

namespace App\Services;

use App\Mail\AccountDeletionConfirmationMail;
use App\Mail\OrderConfirmationMail;
use App\Mail\OrderShipmentUpdateMail;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class TransactionalEmailService
{
    public function sendOrderConfirmation(Order $order): void
    {
        $order->loadMissing(['items.product']);

        $this->sendSafely(
            fn () => Mail::to($order->email)->send(new OrderConfirmationMail($order)),
            'No se pudo enviar el correo de confirmacion del pedido.',
            ['order_id' => $order->id, 'email' => $order->email],
        );
    }

    public function sendAccountDeletionConfirmation(User $user): void
    {
        $snapshot = [
            'name' => trim((string) implode(' ', array_filter([$user->name, $user->lastname]))) ?: $user->email,
            'email' => $user->email,
            'deleted_at' => now()->format('d/m/Y H:i'),
        ];

        $this->sendSafely(
            fn () => Mail::to($user->email)->send(new AccountDeletionConfirmationMail($snapshot)),
            'No se pudo enviar el correo de borrado de cuenta.',
            ['user_id' => $user->id, 'email' => $user->email],
        );
    }

    public function sendShipmentUpdate(Order $order): void
    {
        $order->loadMissing(['items.product']);

        $this->sendSafely(
            fn () => Mail::to($order->email)->send(new OrderShipmentUpdateMail($order)),
            'No se pudo enviar el correo de seguimiento del pedido.',
            ['order_id' => $order->id, 'email' => $order->email],
        );
    }

    private function sendSafely(callable $callback, string $message, array $context = []): void
    {
        try {
            $callback();
        } catch (\Throwable $exception) {
            Log::warning($message, $context + ['exception' => $exception]);
        }
    }
}