<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('banners', function (Blueprint $table) {
            $table->string('campaign')->nullable()->after('title');
            $table->string('placement')->default('general')->after('campaign');
            $table->string('subtitle')->nullable()->after('placement');
            $table->string('cta_label')->nullable()->after('link');
            $table->unsignedTinyInteger('priority')->default(0)->after('cta_label');
            $table->date('starts_at')->nullable()->after('priority');
            $table->date('ends_at')->nullable()->after('starts_at');

            $table->index(['campaign', 'placement']);
            $table->index(['starts_at', 'ends_at']);
        });
    }

    public function down(): void
    {
        Schema::table('banners', function (Blueprint $table) {
            $table->dropIndex(['campaign', 'placement']);
            $table->dropIndex(['starts_at', 'ends_at']);

            $table->dropColumn([
                'campaign',
                'placement',
                'subtitle',
                'cta_label',
                'priority',
                'starts_at',
                'ends_at',
            ]);
        });
    }
};
