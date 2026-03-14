<?php

namespace App\Support;

class ProfileAvatar
{
    public const DEFAULT_COUNT = 15;

    public static function defaultPath(?int $userId = null, ?string $seed = null): string
    {
        $index = self::defaultIndex($userId, $seed);

        return sprintf('/avatars/defaults/avatar-%02d.svg', $index);
    }

    public static function resolve(?string $avatar = null, ?int $userId = null, ?string $seed = null, ?string $photoUrl = null): string
    {
        return self::normalize($avatar)
            ?? self::normalize($photoUrl)
            ?? self::defaultPath($userId, $seed);
    }

    public static function isDefaultPreset(?string $path): bool
    {
        if (! is_string($path)) {
            return false;
        }

        return preg_match('#^/avatars/defaults/avatar-(0[1-9]|1[0-5])\.svg$#', trim($path)) === 1;
    }

    protected static function defaultIndex(?int $userId = null, ?string $seed = null): int
    {
        $seedValue = $userId !== null
            ? abs($userId)
            : abs(crc32($seed ?: 'guest'));

        return ($seedValue % self::DEFAULT_COUNT) + 1;
    }

    protected static function normalize(?string $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        if ($trimmed === '') {
            return null;
        }

        if (str_starts_with($trimmed, 'http://') || str_starts_with($trimmed, 'https://') || str_starts_with($trimmed, '/')) {
            return $trimmed;
        }

        return '/' . ltrim($trimmed, '/');
    }
}
