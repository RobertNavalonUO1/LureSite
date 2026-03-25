<?php

namespace App\Services;

use App\Models\Banner;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class CampaignBannerResolver
{
    public function resolve(?Carbon $date = null): array
    {
        $now = $date ?? now();

        [$mode, $manualCampaign] = $this->campaignSettings();
        $autoCampaign = CampaignCalendar::resolve($now);

        $campaign = $mode === 'manual' && $manualCampaign
            ? $manualCampaign
            : ($autoCampaign ?? $manualCampaign);

        $banners = $this->queryBanners($campaign, $now);

        if ($banners->isEmpty() && $campaign !== null) {
            // fallback to default / general banners
            $banners = $this->queryBanners(null, $now);
        }

        return [
            'campaign' => $campaign,
            'mode' => $mode,
            'auto_campaign' => $autoCampaign,
            'banners' => [
                'hero' => $this->mapForPlacement($banners, 'hero'),
                'showcase' => $this->mapForPlacement($banners, 'showcase'),
                'sidebar' => $this->mapForPlacement($banners, 'sidebar'),
                'general' => $this->mapForPlacement($banners, 'general'),
            ],
        ];
    }

    protected function campaignSettings(): array
    {
        $mode = Setting::where('key', 'campaign.mode')->value('value') ?: 'auto';
        $manual = Setting::where('key', 'campaign.manual_slug')->value('value');

        return [$mode, $manual];
    }

    protected function queryBanners(?string $campaign, Carbon $now): Collection
    {
        return Banner::query()
            ->when($campaign, fn ($query) => $query->where('campaign', $campaign))
            ->when(!$campaign, fn ($query) => $query->whereNull('campaign'))
            ->where('active', true)
            ->where(function ($query) use ($now) {
                $query
                    ->whereNull('starts_at')
                    ->orWhere('starts_at', '<=', $now->toDateString());
            })
            ->where(function ($query) use ($now) {
                $query
                    ->whereNull('ends_at')
                    ->orWhere('ends_at', '>=', $now->toDateString());
            })
            ->orderByDesc('priority')
            ->orderBy('id')
            ->get();
    }

    protected function mapForPlacement(Collection $banners, string $placement): array
    {
        return $banners
            ->filter(fn (Banner $banner) => $banner->placement === $placement || $placement === 'general')
            ->map(fn (Banner $banner) => [
                'id' => $banner->id,
                'title' => $banner->title,
                'subtitle' => $banner->subtitle,
                'image' => $banner->image_path,
                'link' => $banner->link,
                'cta_label' => $banner->cta_label,
                'campaign' => $banner->campaign,
                'placement' => $banner->placement,
            ])
            ->values()
            ->all();
    }
}
