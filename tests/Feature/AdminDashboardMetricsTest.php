<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminDashboardMetricsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_dashboard_exposes_refund_metrics_and_alerts(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $customer = User::factory()->create();

        Order::create([
            'user_id' => $customer->id,
            'name' => $customer->name,
            'email' => $customer->email,
            'total' => 49.90,
            'status' => 'devolucion_solicitada',
            'address' => 'Calle Sur 9',
            'payment_method' => 'stripe',
            'transaction_id' => 'ord-ret-1',
        ]);

        Order::create([
            'user_id' => $customer->id,
            'name' => $customer->name,
            'email' => $customer->email,
            'total' => 78.20,
            'status' => 'devolucion_aprobada',
            'address' => 'Calle Sur 10',
            'payment_method' => 'paypal',
            'transaction_id' => 'ord-ret-2',
            'refund_error' => 'Proveedor no disponible',
        ]);

        Order::create([
            'user_id' => $customer->id,
            'name' => $customer->name,
            'email' => $customer->email,
            'total' => 99.00,
            'status' => 'reembolsado',
            'address' => 'Calle Sur 11',
            'payment_method' => 'stripe',
            'transaction_id' => 'ord-ret-3',
            'refund_reference_id' => 're_ok_1',
            'refunded_at' => now(),
        ]);

        $this->actingAs($admin)
            ->get('/admin/dashboard')
            ->assertOk()
            ->assertSee('Reembolsos con error')
            ->assertSee('Devoluciones aprobadas pendientes')
            ->assertSee('&quot;refundMetrics&quot;:{&quot;requested&quot;:1,&quot;approved&quot;:1,&quot;failed&quot;:1,&quot;refunded&quot;:1}', false)
            ->assertSee('&quot;supportTickets&quot;:2', false);
    }
}
