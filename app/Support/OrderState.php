<?php

namespace App\Support;

use Illuminate\Support\Collection;

class OrderState
{
    public const ACTIVE_ITEM_STATUSES = [
        'pendiente_pago',
        'pagado',
        'pendiente_envio',
        'enviado',
        'entregado',
        'confirmado',
    ];

    public const CANCELLABLE_ITEM_STATUSES = [
        'pendiente_pago',
        'pagado',
        'pendiente_envio',
    ];

    public const REFUNDABLE_ITEM_STATUSES = [
        'entregado',
        'confirmado',
    ];

    public const CANCELLATION_STATUSES = [
        'cancelacion_pendiente',
        'cancelado',
    ];

    public const REFUND_STATUSES = [
        'devolucion_solicitada',
        'devolucion_aprobada',
        'devolucion_rechazada',
        'reembolsado',
    ];

    private const PROGRESSION = [
        'pendiente_pago' => 0,
        'pagado' => 1,
        'pendiente_envio' => 2,
        'enviado' => 3,
        'entregado' => 4,
        'confirmado' => 5,
    ];

    private const LABELS = [
        'pendiente_pago' => 'Pendiente de pago',
        'pagado' => 'Pagado',
        'pendiente_envio' => 'Pendiente de envio',
        'enviado' => 'Enviado',
        'entregado' => 'Entregado',
        'confirmado' => 'Confirmado',
        'cancelacion_pendiente' => 'Cancelacion en revision',
        'cancelado' => 'Cancelado',
        'fallido' => 'Pago fallido',
        'devolucion_solicitada' => 'Devolucion solicitada',
        'devolucion_aprobada' => 'Devolucion aprobada',
        'devolucion_rechazada' => 'Devolucion rechazada',
        'reembolsado' => 'Reembolsado',
        'parcialmente_cancelado' => 'Parcialmente cancelado',
        'parcialmente_reembolsado' => 'Parcialmente reembolsado',
    ];

    public static function summarize(Collection $items, ?string $fallbackStatus = null): array
    {
        $statuses = self::normalizedStatuses($items, $fallbackStatus);
        $counts = self::countsFromStatuses($statuses);

        return [
            'summary_status' => self::deriveSummaryStatusFromCounts($counts, $statuses, $fallbackStatus),
            'persistent_status' => self::derivePersistentStatusFromCounts($counts, $statuses, $fallbackStatus),
            'counts' => $counts,
            'can_cancel_order' => $counts['cancelable'] > 0,
            'can_refund_order' => $counts['refundable'] > 0,
        ];
    }

    public static function label(?string $status): string
    {
        if (!$status) {
            return 'Sin estado';
        }

        return self::LABELS[$status] ?? ucfirst(str_replace('_', ' ', $status));
    }

    public static function normalizedStatuses(Collection $items, ?string $fallbackStatus = null): Collection
    {
        $fallback = $fallbackStatus ?: 'pendiente_pago';

        return $items
            ->map(function ($item) use ($fallback) {
                if (is_array($item)) {
                    return $item['status'] ?? $fallback;
                }

                return $item->status ?? $fallback;
            })
            ->filter()
            ->values();
    }

    public static function deriveSummaryStatus(Collection $items, ?string $fallbackStatus = null): string
    {
        $statuses = self::normalizedStatuses($items, $fallbackStatus);
        $counts = self::countsFromStatuses($statuses);

        return self::deriveSummaryStatusFromCounts($counts, $statuses, $fallbackStatus);
    }

    public static function derivePersistentStatus(Collection $items, ?string $fallbackStatus = null): string
    {
        $statuses = self::normalizedStatuses($items, $fallbackStatus);
        $counts = self::countsFromStatuses($statuses);

        return self::derivePersistentStatusFromCounts($counts, $statuses, $fallbackStatus);
    }

    public static function isCancellationRelated(?string $status): bool
    {
        return in_array($status, ['cancelacion_pendiente', 'cancelado', 'parcialmente_cancelado'], true);
    }

    public static function isRefundRelated(?string $status): bool
    {
        return in_array($status, [
            'devolucion_solicitada',
            'devolucion_aprobada',
            'devolucion_rechazada',
            'reembolsado',
            'parcialmente_reembolsado',
        ], true);
    }

    private static function countsFromStatuses(Collection $statuses): array
    {
        $total = $statuses->count();

        $count = static fn (array $expected): int => $statuses->filter(
            fn (string $status) => in_array($status, $expected, true)
        )->count();

        $active = $count(self::ACTIVE_ITEM_STATUSES);
        $cancellationRequested = $count(['cancelacion_pendiente']);
        $cancelled = $count(['cancelado']);
        $refundRequested = $count(['devolucion_solicitada']);
        $refundApproved = $count(['devolucion_aprobada']);
        $refundRejected = $count(['devolucion_rechazada']);
        $refunded = $count(['reembolsado']);

        return [
            'total' => $total,
            'active' => $active,
            'cancellation_requested' => $cancellationRequested,
            'cancelled' => $cancelled,
            'refund_requested' => $refundRequested,
            'refund_approved' => $refundApproved,
            'refund_rejected' => $refundRejected,
            'refunded' => $refunded,
            'cancelable' => $count(self::CANCELLABLE_ITEM_STATUSES),
            'refundable' => $count(self::REFUNDABLE_ITEM_STATUSES),
            'affected' => $total - $active,
        ];
    }

    private static function deriveSummaryStatusFromCounts(array $counts, Collection $statuses, ?string $fallbackStatus): string
    {
        $total = $counts['total'];
        if ($total === 0) {
            return $fallbackStatus ?: 'pendiente_pago';
        }

        if ($counts['refunded'] === $total) {
            return 'reembolsado';
        }

        if (($counts['cancellation_requested'] + $counts['cancelled']) === $total) {
            return $counts['cancellation_requested'] > 0 ? 'cancelacion_pendiente' : 'cancelado';
        }

        if ($counts['refund_approved'] === $total) {
            return 'devolucion_aprobada';
        }

        if ($counts['refund_requested'] === $total) {
            return 'devolucion_solicitada';
        }

        if ($counts['refund_rejected'] === $total) {
            return 'devolucion_rechazada';
        }

        if ($counts['affected'] > 0 && $counts['active'] > 0) {
            if (($counts['cancellation_requested'] + $counts['cancelled']) > 0) {
                return 'parcialmente_cancelado';
            }

            return 'parcialmente_reembolsado';
        }

        return self::progressStatus($statuses, $fallbackStatus);
    }

    private static function derivePersistentStatusFromCounts(array $counts, Collection $statuses, ?string $fallbackStatus): string
    {
        $total = $counts['total'];
        if ($total === 0) {
            return $fallbackStatus ?: 'pendiente_pago';
        }

        if ($counts['refunded'] === $total) {
            return 'reembolsado';
        }

        if (($counts['cancellation_requested'] + $counts['cancelled']) === $total) {
            return $counts['cancellation_requested'] > 0 ? 'cancelacion_pendiente' : 'cancelado';
        }

        if ($counts['refund_approved'] === $total) {
            return 'devolucion_aprobada';
        }

        if ($counts['refund_requested'] === $total) {
            return 'devolucion_solicitada';
        }

        if ($counts['refund_rejected'] === $total) {
            return 'devolucion_rechazada';
        }

        return self::progressStatus($statuses, $fallbackStatus);
    }

    private static function progressStatus(Collection $statuses, ?string $fallbackStatus): string
    {
        $activeStatus = $statuses
            ->filter(fn (string $status) => array_key_exists($status, self::PROGRESSION))
            ->sortBy(fn (string $status) => self::PROGRESSION[$status])
            ->last();

        return $activeStatus ?: ($fallbackStatus ?: 'pendiente_pago');
    }
}