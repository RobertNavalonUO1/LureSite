<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\TemporaryProduct;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PythonScriptRoutesTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function guest_cannot_access_python_script_endpoints()
    {
        $this->get('/api/scripts')->assertRedirect('/login');

        $this->post('/run-script', [
            'script' => 'test.py',
            'input' => '<!-- test -->',
        ])->assertRedirect('/login');
    }

    /** @test */
    public function non_admin_cannot_access_python_script_endpoints()
    {
        $user = User::factory()->create(['is_admin' => 0]);

        $this->actingAs($user)->get('/api/scripts')->assertStatus(403);

        $this->actingAs($user)->post('/run-script', [
            'script' => 'test.py',
            'input' => '<!-- test -->',
        ])->assertStatus(403);
    }

    /** @test */
    public function admin_can_list_scripts_and_run_a_script()
    {
        $admin = User::factory()->create(['is_admin' => 1]);

        $scriptsResponse = $this->actingAs($admin)
            ->get('/api/scripts')
            ->assertOk()
            ->assertJsonFragment(['test.py']);

        $this->assertSame('scripy_web.py', $scriptsResponse->json()[0] ?? null);

        $this->actingAs($admin)
            ->post('/run-script', [
                'script' => 'test.py',
                'input' => '<!-- test -->',
            ])
            ->assertOk()
            ->assertJson([
                'success' => true,
            ]);

        $html = "<div class='card'>"
            . "<h3 class='titulo'>Producto demo</h3>"
            . "<span class='precio'>1,23€</span>"
            . "<img class='thumb' src='https://example.com/a.avif' />"
            . "</div>";

        $response = $this->actingAs($admin)
            ->post('/run-script', [
                'script' => 'scrape_import_json.py',
                'input' => $html,
                'menu_option' => 'listado',
            ])
            ->assertOk()
            ->assertJson([
                'success' => true,
            ]);

        $this->assertStringContainsString('"products"', $response->json('output') ?? '');
        $response->assertJsonPath('products.0.title', 'Producto demo');

        $listingHtml = <<<'HTML'
<div class="hm_b3 search-item-card-wrapper-gallery">
    <a class="search-card-item" href="//es.aliexpress.com/item/1005010633518282.html">
        <img class="nl_e8" src="//ae-pic-a1.aliexpress-media.com/kf/S8828b2e3e7334a8b84a68f1331d250bcN.jpg_480x480q75.jpg_.avif" alt="Boxers personalizados para hombres" />
        <div class="lw_v">
            <div class="lw_an" aria-label="Boxers personalizados para hombres" role="heading">
                <h3 class="lw_k4">Boxers personalizados para hombres</h3>
            </div>
            <div class="lw_el" aria-label="0,99€">
                <div class="lw_kt">0,99€</div>
                <div class="lw_lm"><span style="text-decoration:line-through">13,37€</span></div>
            </div>
        </div>
    </a>
</div>
HTML;

        $this->actingAs($admin)
            ->post('/run-script', [
                'script' => 'scripy_web.py',
                'input' => $listingHtml,
                'menu_option' => 'listado',
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('detectedProducts.0.title', 'Boxers personalizados para hombres')
            ->assertJsonPath('products.0.title', 'Boxers personalizados para hombres');

        $payload = $this->actingAs($admin)
            ->post('/run-script', [
                'script' => 'scripy_web.py',
                'input' => $listingHtml,
                'menu_option' => 'listado',
            ])
            ->assertOk()
            ->json('products');

        $this->actingAs($admin)
            ->postJson('/admin/temporary-products/import', [
                'products' => $payload,
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('created', 1);

        $this->assertDatabaseHas('temporary_products', [
            'title' => 'Boxers personalizados para hombres',
        ]);
    }
}
