<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Banner;

class BannerController extends Controller
{
    public function index()
    {
        return Banner::where('active', true)
            ->orderBy('id')
            ->get(['title', 'image_path', 'link']);
    }
}

