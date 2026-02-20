<?php

namespace App\Services;

use Carbon\Carbon;

class CampaignCalendar
{
    public const CAMPAIGNS = [
        'cuesta-de-enero' => [
            'label' => 'Cuesta de enero',
            'resolver' => 'resolveCuestaDeEnero',
            'start_offset' => 0,
        ],
        'blue-monday' => [
            'label' => 'Blue Monday',
            'resolver' => 'resolveBlueMonday',
        ],
        'reyes-magos' => [
            'label' => 'Reyes Magos',
            'resolver' => 'resolveReyesMagos',
        ],
        'easter' => [
            'label' => 'Pascua',
            'resolver' => 'resolveEaster',
        ],
        'semana-santa' => [
            'label' => 'Semana Santa',
            'resolver' => 'resolveSemanaSanta',
        ],
        'vuelta-al-cole' => [
            'label' => 'Vuelta al cole',
            'resolver' => 'resolveVueltaAlCole',
        ],
        'verano' => [
            'label' => 'Verano',
            'resolver' => 'resolveVerano',
        ],
        'black-friday' => [
            'label' => 'Black Friday',
            'resolver' => 'resolveBlackFriday',
        ],
        'cyber-monday' => [
            'label' => 'Cyber Monday',
            'resolver' => 'resolveCyberMonday',
        ],
        'navidad' => [
            'label' => 'Navidad',
            'resolver' => 'resolveNavidad',
        ],
    ];

    public static function all(): array
    {
        return array_map(
            fn (string $slug, array $data) => [
                'slug' => $slug,
                'label' => $data['label'],
            ],
            array_keys(self::CAMPAIGNS),
            self::CAMPAIGNS
        );
    }

    public static function resolve(Carbon $date): ?string
    {
        foreach (self::CAMPAIGNS as $slug => $data) {
            $resolver = [self::class, $data['resolver']];
            if (is_callable($resolver) && call_user_func($resolver, $date)) {
                return $slug;
            }
        }

        return null;
    }

    protected static function resolveCuestaDeEnero(Carbon $date): bool
    {
        $start = Carbon::create($date->year, 1, 2)->startOfDay();
        $end = Carbon::create($date->year, 1, 31)->endOfDay();

        return $date->betweenIncluded($start, $end);
    }

    protected static function resolveBlueMonday(Carbon $date): bool
    {
        if ($date->month !== 1 || $date->dayOfWeek !== Carbon::MONDAY) {
            return false;
        }

        $firstDay = Carbon::create($date->year, 1, 1);
        $blueMonday = (clone $firstDay)->third(Carbon::MONDAY);

        return $date->isSameDay($blueMonday);
    }

    protected static function resolveReyesMagos(Carbon $date): bool
    {
        $start = Carbon::create($date->year, 1, 3)->startOfDay();
        $end = Carbon::create($date->year, 1, 6)->endOfDay();

        return $date->betweenIncluded($start, $end);
    }

    protected static function resolveEaster(Carbon $date): bool
    {
        $easter = Carbon::createFromTimestamp(easter_date($date->year));
        $start = (clone $easter)->subDays(1)->startOfDay();
        $end = (clone $easter)->addDays(1)->endOfDay();

        return $date->betweenIncluded($start, $end);
    }

    protected static function resolveSemanaSanta(Carbon $date): bool
    {
        $easter = Carbon::createFromTimestamp(easter_date($date->year));
        $start = (clone $easter)->subDays(7)->startOfDay();
        $end = (clone $easter)->subDays(1)->endOfDay();

        return $date->betweenIncluded($start, $end);
    }

    protected static function resolveVueltaAlCole(Carbon $date): bool
    {
        $start = Carbon::create($date->year, 8, 15)->startOfDay();
        $end = Carbon::create($date->year, 9, 30)->endOfDay();

        return $date->betweenIncluded($start, $end);
    }

    protected static function resolveVerano(Carbon $date): bool
    {
        $start = Carbon::create($date->year, 6, 1)->startOfDay();
        $end = Carbon::create($date->year, 8, 31)->endOfDay();

        return $date->betweenIncluded($start, $end);
    }

    protected static function resolveBlackFriday(Carbon $date): bool
    {
        if ($date->month !== 11 || $date->dayOfWeek !== Carbon::FRIDAY) {
            return false;
        }

        $blackFriday = self::resolveBlackFridayDate($date->year);

        if (!$date->isSameDay($blackFriday)) {
            return false;
        }

        $end = (clone $blackFriday)->addDays(3)->endOfDay();

        return $date->betweenIncluded($blackFriday, $end);
    }

    protected static function resolveCyberMonday(Carbon $date): bool
    {
        $blackFriday = self::resolveBlackFridayDate($date->year);
        $cyberMonday = (clone $blackFriday)->addDays(3);
        $end = (clone $cyberMonday)->addDays(2)->endOfDay();
        $start = (clone $cyberMonday)->startOfDay();

        return $date->betweenIncluded($start, $end);
    }

    protected static function resolveNavidad(Carbon $date): bool
    {
        $start = Carbon::create($date->year, 12, 1)->startOfDay();
        $end = Carbon::create($date->year, 12, 26)->endOfDay();

        return $date->betweenIncluded($start, $end);
    }

    protected static function resolveBlackFridayDate(int $year): Carbon
    {
        $firstDay = Carbon::create($year, 11, 1);
        // Find the first Friday of November
        $firstFriday = (clone $firstDay)->next(Carbon::FRIDAY);
        if ($firstDay->dayOfWeek === Carbon::FRIDAY) {
            $firstFriday = $firstDay;
        }
        // Add 3 weeks to get the fourth Friday
        return (clone $firstFriday)->addWeeks(3);
    }
}
