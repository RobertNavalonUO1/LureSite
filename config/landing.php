<?php

return [
    // If true, production only exposes a single landing page ("under construction").
    // Toggle via .env: LANDING_ONLY=true|false
    'only' => (bool) env('LANDING_ONLY', false),
];
