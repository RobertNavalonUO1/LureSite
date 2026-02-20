<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CampaignBannerResolver;

class BannerController extends Controller
{
    public function __construct(private readonly CampaignBannerResolver $resolver)
    {
    }

    public function index()
    {
        return response()->json($this->resolver->resolve());
    }
}
