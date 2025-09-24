<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UpdateOrdersStatusEnum extends Migration
{
    public function up()
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('status', [
                'pendiente_pago',      // Awaiting payment
                'pagado',              // Paid
                'pendiente_envio',     // Awaiting shipment
                'enviado',             // Shipped
                'entregado',           // Delivered
                'confirmado',          // Confirmed by user
                'cancelado',           // Cancelled
                'reembolsado',         // Refunded
                'fallido',             // Payment failed
                'devolucion_solicitada', // Return requested
                'devolucion_aprobada',   // Return approved
                'devolucion_rechazada',  // Return rejected
            ])->default('pendiente_pago')->change();
        });
    }

    public function down()
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('status')->default('pendiente_pago')->change();
        });
    }
}