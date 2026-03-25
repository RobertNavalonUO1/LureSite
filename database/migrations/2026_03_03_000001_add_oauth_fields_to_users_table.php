<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'oauth_provider')) {
                $table->string('oauth_provider')->nullable()->after('photo_url');
            }
            if (!Schema::hasColumn('users', 'oauth_provider_id')) {
                $table->string('oauth_provider_id')->nullable()->after('oauth_provider');
            }

            $table->index(['oauth_provider', 'oauth_provider_id'], 'users_oauth_provider_provider_id_index');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'oauth_provider') || Schema::hasColumn('users', 'oauth_provider_id')) {
                $table->dropIndex('users_oauth_provider_provider_id_index');
            }

            if (Schema::hasColumn('users', 'oauth_provider_id')) {
                $table->dropColumn('oauth_provider_id');
            }
            if (Schema::hasColumn('users', 'oauth_provider')) {
                $table->dropColumn('oauth_provider');
            }
        });
    }
};
