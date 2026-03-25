<?php

namespace App\Services;

class RefundResult
{
    public function __construct(
        public readonly string $referenceId,
        public readonly ?string $providerStatus = null,
        public readonly array $payload = [],
        public readonly bool $alreadyProcessed = false,
    ) {
    }
}