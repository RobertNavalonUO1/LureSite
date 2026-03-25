<?php

namespace App\Console\Commands;

use App\Models\Address;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Services\Mobile\MobileApiException;
use App\Services\Mobile\MobileCheckoutService;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class MobileCheckoutSandboxSmoke extends Command
{
    protected $signature = 'mobile:checkout-sandbox-smoke {--provider=* : Providers to test (stripe, paypal)}';

    protected $description = 'Creates temporary mobile checkout fixtures and requests real sandbox payment sessions.';

    public function handle(MobileCheckoutService $checkoutService): int
    {
        $providers = $this->normalizedProviders();
        $configuredProviders = $this->configuredProviders($providers);

        if ($configuredProviders === []) {
            $this->error('No configured sandbox providers were found. Set STRIPE_* and/or PAYPAL_* before running this command.');

            return self::FAILURE;
        }

        [$user, $address, $items] = $this->createFixtures();
        $mobileReturn = [
            'success_url' => 'limoneo://checkout/complete',
            'cancel_url' => 'limoneo://checkout/cancel',
            'fallback_success_url' => 'https://example.com/mobile-checkout-success',
            'fallback_cancel_url' => 'https://example.com/mobile-checkout-cancel',
        ];

        $quote = $checkoutService->quote($user, $items, $address->id, null, 'standard');

        $this->info('Temporary fixtures created for mobile checkout sandbox smoke.');
        $this->line('User: ' . $user->email);
        $this->line('Address ID: ' . $address->id);
        $this->line('Quote total: ' . $quote['quote']['total'] . ' ' . $quote['quote']['currency']);

        $exitCode = self::SUCCESS;

        foreach ($configuredProviders as $provider) {
            try {
                $result = $checkoutService->createPaymentSession(
                    $user,
                    $items,
                    $address->id,
                    null,
                    'standard',
                    $provider,
                    $mobileReturn,
                );

                $paymentSession = $result['payment_session'];

                $this->info(strtoupper($provider) . ' session created.');
                $this->line('  checkout_context_id: ' . $paymentSession['checkout_context_id']);
                $this->line('  checkout_url: ' . $paymentSession['checkout_url']);
                $this->line('  expires_at: ' . $paymentSession['expires_at']);
            } catch (MobileApiException $exception) {
                $exitCode = self::FAILURE;
                $this->error(strtoupper($provider) . ' failed with MobileApiException [' . $exception->errorCode . ']: ' . $exception->getMessage());
            } catch (\Throwable $exception) {
                $exitCode = self::FAILURE;
                $this->error(strtoupper($provider) . ' failed with ' . get_class($exception) . ': ' . $exception->getMessage());
            }
        }

        return $exitCode;
    }

    private function normalizedProviders(): array
    {
        $providers = collect($this->option('provider'))
            ->filter(fn ($provider) => is_string($provider) && trim($provider) !== '')
            ->map(fn ($provider) => strtolower(trim($provider)))
            ->values()
            ->all();

        return $providers === [] ? ['stripe', 'paypal'] : $providers;
    }

    private function configuredProviders(array $providers): array
    {
        $configured = [];

        foreach ($providers as $provider) {
            if ($provider === 'stripe'
                && filled(config('services.stripe.key'))
                && filled(config('services.stripe.secret'))) {
                $configured[] = 'stripe';
            }

            if ($provider === 'paypal'
                && filled(config('services.paypal.client_id'))
                && filled(config('services.paypal.client_secret'))
                && in_array(config('services.paypal.mode'), ['sandbox', 'live'], true)) {
                $configured[] = 'paypal';
            }
        }

        return array_values(array_unique($configured));
    }

    private function createFixtures(): array
    {
        $suffix = Str::lower(Str::random(8));

        $user = User::query()->create([
            'name' => 'Sandbox',
            'lastname' => 'Mobile',
            'email' => "mobile-sandbox-{$suffix}@example.test",
            'password' => bcrypt(Str::random(32)),
        ]);

        $category = Category::query()->create([
            'name' => 'Sandbox Mobile',
            'slug' => 'sandbox-mobile-' . $suffix,
            'description' => 'Temporary category for mobile checkout sandbox smoke tests.',
        ]);

        $product = Product::query()->create([
            'name' => 'Sandbox Checkout Product',
            'description' => 'Temporary product for mobile checkout sandbox smoke tests.',
            'price' => 19.99,
            'image_url' => '/images/sandbox-mobile.jpg',
            'stock' => 10,
            'category_id' => $category->id,
            'is_adult' => false,
            'link' => null,
            'is_featured' => false,
            'is_superdeal' => false,
            'is_fast_shipping' => true,
            'is_new_arrival' => false,
            'is_seasonal' => false,
            'discount' => 0,
        ]);

        $address = Address::query()->create([
            'user_id' => $user->id,
            'street' => 'Sandbox Street 1',
            'city' => 'Madrid',
            'province' => 'Madrid',
            'zip_code' => '28001',
            'country' => 'Spain',
        ]);

        $user->forceFill([
            'default_address_id' => $address->id,
        ])->save();

        return [$user, $address, [
            [
                'product_id' => $product->id,
                'quantity' => 2,
            ],
        ]];
    }
}
