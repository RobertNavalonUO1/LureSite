<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const ALLOWED = [
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
    ];

    private const ALLOWED_PREVIOUS = [
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
    ];

    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("UPDATE \"orders\" SET \"status\" = 'cancelacion_pendiente' WHERE \"status\" = 'cancelación_pendiente'");
            DB::statement('ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS orders_status_check');
            $values = implode(", ", array_map(fn ($v) => "'{$v}'", self::ALLOWED));
            DB::statement("ALTER TABLE \"orders\" ADD CONSTRAINT orders_status_check CHECK (\"status\" in ({$values}))");

            return;
        }

        Schema::table('orders', function (Blueprint $table) {
            $table->enum('status', self::ALLOWED)->default('pendiente_pago')->change();
        });
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS orders_status_check');
            $values = implode(", ", array_map(fn ($v) => "'{$v}'", self::ALLOWED_PREVIOUS));
            DB::statement("ALTER TABLE \"orders\" ADD CONSTRAINT orders_status_check CHECK (\"status\" in ({$values}))");

            return;
        }

        Schema::table('orders', function (Blueprint $table) {
            $table->enum('status', self::ALLOWED_PREVIOUS)->default('pendiente_pago')->change();
        });
    }
};
