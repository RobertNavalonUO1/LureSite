<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Jobs\GenerateSeoTitles;

class GenerateSeoCommand extends Command
{
    protected $signature = 'seo:generate';
    protected $description = 'Genera títulos y descripciones SEO usando Hugging Face Space';

    public function handle()
    {
        $this->info('🚀 Lanzando job GenerateSeoTitles...');

        dispatch(new GenerateSeoTitles());

        $this->info('✅ Job encolado correctamente. Asegúrate de tener php artisan queue:work en ejecución.');

        return 0;
    }
}
