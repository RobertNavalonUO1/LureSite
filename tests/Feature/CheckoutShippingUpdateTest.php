<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutShippingUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_checkout_shipping_update_returns_json_payload_without_redirect(): void
    {
        $response = $this
            ->withSession([
                'cart' => [
                    10 => [
                        'id' => 10,
                        'title' => 'Producto de prueba',
                        'price' => 25.00,
                        'quantity' => 2,
                        'image_url' => '/default-image.jpg',
                    ],
                ],
            ])
            ->postJson(route('checkout.shipping'), [
                'method' => 'express',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Método de envío actualizado.')
            ->assertJsonPath('shipping.method', 'express')
            ->assertJsonPath('shipping.label', 'Envío exprés')
            ->assertJsonPath('totals.subtotal', 50)
            ->assertJsonPath('totals.shipping', 9.99)
            ->assertJsonPath('totals.total', 59.99)
            ->assertJsonCount(3, 'shippingOptions');

        $this->assertSame('express', session('checkout.shipping_method'));
        $this->assertSame('Envío exprés', session('checkout.shipping_label'));
    }
}