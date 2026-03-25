<?php

namespace Database\Seeders;

use App\Models\Banner;
use App\Services\CampaignCalendar;
use Illuminate\Database\Seeder;

class BannersSeeder extends Seeder
{
    public function run(): void
    {
        if (Banner::query()->exists()) {
            return;
        }

        $general = [
            [
                'title' => 'Featured Deals',
                'subtitle' => 'Today\'s top picks',
                'image_path' => '/images/banner1.webp',
                'link' => '/deals',
                'cta_label' => 'Shop now',
                'campaign' => null,
                'placement' => 'hero',
                'priority' => 10,
                'active' => true,
            ],
            [
                'title' => 'New arrivals',
                'subtitle' => 'Fresh products every week',
                'image_path' => '/images/banner3.png',
                'link' => '/new-arrivals',
                'cta_label' => 'Explore',
                'campaign' => null,
                'placement' => 'showcase',
                'priority' => 5,
                'active' => true,
            ],
            [
                'title' => 'Fast shipping',
                'subtitle' => 'Get it sooner',
                'image_path' => '/images/banner-left.jpg',
                'link' => '/fast-shipping',
                'cta_label' => 'See options',
                'campaign' => null,
                'placement' => 'sidebar',
                'priority' => 1,
                'active' => true,
            ],
        ];

        foreach ($general as $banner) {
            Banner::create($banner);
        }

        foreach (CampaignCalendar::all() as $campaign) {
            $slug = $campaign['slug'];

            // Use the first campaign image as hero, second as showcase, third as sidebar.
            $banners = [
                [
                    'title' => $campaign['label'],
                    'subtitle' => 'Limited-time offers',
                    'image_path' => "/images/campaigns/{$slug}-01.jpg",
                    'link' => "/campaign/{$slug}",
                    'cta_label' => 'View deals',
                    'campaign' => $slug,
                    'placement' => 'hero',
                    'priority' => 10,
                    'active' => true,
                ],
                [
                    'title' => $campaign['label'],
                    'subtitle' => 'Hand-picked products',
                    'image_path' => "/images/campaigns/{$slug}-02.jpg",
                    'link' => "/campaign/{$slug}",
                    'cta_label' => 'Browse',
                    'campaign' => $slug,
                    'placement' => 'showcase',
                    'priority' => 5,
                    'active' => true,
                ],
                [
                    'title' => $campaign['label'],
                    'subtitle' => 'Don\'t miss out',
                    'image_path' => "/images/campaigns/{$slug}-03.jpg",
                    'link' => "/campaign/{$slug}",
                    'cta_label' => 'Open',
                    'campaign' => $slug,
                    'placement' => 'sidebar',
                    'priority' => 1,
                    'active' => true,
                ],
            ];

            foreach ($banners as $banner) {
                Banner::create($banner);
            }
        }
    }
}
