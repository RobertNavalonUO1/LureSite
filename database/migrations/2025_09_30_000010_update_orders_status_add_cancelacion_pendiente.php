<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('status', [
                'pendiente_pago',
                'pagado',
                'pendiente_envio',
                'enviado',
                'entregado',
                'confirmado',
                'cancelacion_pendiente',
                'cancelado',
                'reembolsado',
                'fallido',
                'devolucion_solicitada',
                'devolucion_aprobada',
                'devolucion_rechazada',
            ])->default('pendiente_pago')->change();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('status', [
                'pendiente_pago',
                'pagado',
                'pendiente_envio',
                'enviado',
                'entregado',
                'confirmado',
                'cancelado',
                'reembolsado',
                'fallido',
                'devolucion_solicitada',
                'devolucion_aprobada',
                'devolucion_rechazada',
            ])->default('pendiente_pago')->change();
        });
    }
};
