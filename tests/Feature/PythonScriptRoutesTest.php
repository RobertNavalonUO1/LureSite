<?php

namespace Tests\Feature;

use App\Models\User;
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

        $this->actingAs($admin)
            ->get('/api/scripts')
            ->assertOk()
            ->assertJsonFragment(['test.py']);

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
    }
}
