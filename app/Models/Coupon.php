<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    protected $fillable = [
        'code',
        'description',
        'discount',
        'type',
        'min_subtotal',
        'expires_at',
        'usage_limit',
        'used_count',
        'is_active',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
        'discount' => 'float',
        'min_subtotal' => 'float',
    ];

    public function remainingUses(): ?int
    {
        if (is_null($this->usage_limit)) {
            return null;
        }

        return max($this->usage_limit - $this->used_count, 0);
    }

    public function isExpired(): bool
    {
        return $this->expires_at instanceof CarbonInterface
            ? $this->expires_at->isPast()
            : false;
    }

    public function canBeRedeemed(float $subtotal): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if ($this->isExpired()) {
            return false;
        }

        if ($this->min_subtotal > 0 && $subtotal < $this->min_subtotal) {
            return false;
        }

        if (!is_null($this->usage_limit) && $this->used_count >= $this->usage_limit) {
            return false;
        }

        return true;
    }

    public function discountAmount(float $subtotal): float
    {
        $amount = $this->type === 'percent'
            ? $subtotal * ($this->discount / 100)
            : $this->discount;

        $amount = min($amount, $subtotal);

        return max($amount, 0.0);
    }
}
