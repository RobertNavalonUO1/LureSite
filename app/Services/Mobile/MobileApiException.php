<?php

namespace App\Services\Mobile;

use RuntimeException;

class MobileApiException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly string $errorCode,
        public readonly int $statusCode,
    ) {
        parent::__construct($message);
    }
}
