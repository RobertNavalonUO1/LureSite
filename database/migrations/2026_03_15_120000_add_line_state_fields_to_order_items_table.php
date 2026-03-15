<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            if (!Schema::hasColumn('order_items', 'status')) {
                $table->string('status')->default('pendiente_pago')->after('price');
                $table->index('status');
            }

            if (!Schema::hasColumn('order_items', 'cancellation_reason')) {
                $table->text('cancellation_reason')->nullable()->after('status');
            }

            if (!Schema::hasColumn('order_items', 'cancelled_by')) {
                $table->string('cancelled_by')->nullable()->after('cancellation_reason');
            }

            if (!Schema::hasColumn('order_items', 'cancelled_at')) {
                $table->timestamp('cancelled_at')->nullable()->after('cancelled_by');
            }

            if (!Schema::hasColumn('order_items', 'return_reason')) {
                $table->text('return_reason')->nullable()->after('cancelled_at');
            }

            if (!Schema::hasColumn('order_items', 'refund_reference_id')) {
                $table->string('refund_reference_id')->nullable()->after('return_reason');
            }

            if (!Schema::hasColumn('order_items', 'refunded_at')) {
                $table->timestamp('refunded_at')->nullable()->after('refund_reference_id');
            }

            if (!Schema::hasColumn('order_items', 'refund_error')) {
                $table->text('refund_error')->nullable()->after('refunded_at');
            }
        });

        $rows = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->select([
                'order_items.id',
                'orders.status as order_status',
                'orders.cancellation_reason',
                'orders.cancelled_by',
                'orders.cancelled_at',
                'orders.refund_reference_id',
                'orders.refunded_at',
                'orders.refund_error',
            ])
            ->get();

        foreach ($rows as $row) {
            DB::table('order_items')
                ->where('id', $row->id)
                ->update([
                    'status' => $row->order_status ?: 'pendiente_pago',
                    'cancellation_reason' => in_array($row->order_status, ['cancelacion_pendiente', 'cancelado'], true)
                        ? $row->cancellation_reason
                        : null,
                    'cancelled_by' => in_array($row->order_status, ['cancelacion_pendiente', 'cancelado'], true)
                        ? $row->cancelled_by
                        : null,
                    'cancelled_at' => in_array($row->order_status, ['cancelado', 'reembolsado'], true)
                        ? $row->cancelled_at
                        : null,
                    'return_reason' => in_array($row->order_status, ['devolucion_solicitada', 'devolucion_aprobada', 'devolucion_rechazada', 'reembolsado'], true)
                        ? $row->cancellation_reason
                        : null,
                    'refund_reference_id' => $row->order_status === 'reembolsado' ? $row->refund_reference_id : null,
                    'refunded_at' => $row->order_status === 'reembolsado' ? $row->refunded_at : null,
                    'refund_error' => in_array($row->order_status, ['devolucion_aprobada', 'devolucion_rechazada', 'reembolsado'], true)
                        ? $row->refund_error
                        : null,
                ]);
        }
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $columns = [
                'status',
                'cancellation_reason',
                'cancelled_by',
                'cancelled_at',
                'return_reason',
                'refund_reference_id',
                'refunded_at',
                'refund_error',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('order_items', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};