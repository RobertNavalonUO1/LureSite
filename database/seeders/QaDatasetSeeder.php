<?php

namespace Database\Seeders;

use App\Models\Address;
use App\Models\Banner;
use App\Models\Category;
use App\Models\CookiePreference;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductDetail;
use App\Models\ProductImage;
use App\Models\Review;
use App\Models\TemporaryProduct;
use App\Models\TemporaryProductImage;
use App\Models\User;
use App\Support\ProfileAvatar;
use Faker\Factory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class QaDatasetSeeder extends Seeder
{
    private const REGULAR_USER_COUNT = 60;
    private const CATEGORY_COUNT = 60;
    private const PRODUCT_COUNT = 180;
    private const TEMPORARY_PRODUCT_COUNT = 60;
    private const ADDRESSES_PER_USER = 3;
    private const COUPON_COUNT = 60;
    private const BANNER_COUNT = 60;
    private const REVIEWS_COUNT = 240;
    private const ORDERS_PER_STATUS = 50;

    public const ORDER_STATUSES = [
        'pendiente_pago',
        'pagado',
        'pendiente_envio',
        'enviado',
        'entregado',
        'confirmado',
        'cancelacion_pendiente',
        'cancelado',
        'fallido',
        'devolucion_solicitada',
        'devolucion_aprobada',
        'devolucion_rechazada',
        'reembolsado',
    ];

    private const BASE_CATEGORIES = [
        'Electronica',
        'Moda y Ropa',
        'Hogar y Jardin',
        'Juguetes y Juegos',
        'Deportes y Aire Libre',
        'Belleza y Salud',
        'Automoviles y Motos',
        'Telefonia y Accesorios',
        'Computadoras y Oficina',
        'Camaras y Fotografia',
        'Relojes y Joyas',
        'Bolsas y Calzado',
        'Muebles y Decoracion',
        'Seguridad y Proteccion',
        'Electrodomesticos',
        'Herramientas e Industria',
        'Bebes y Ninos',
        'Mascotas y Animales',
        'Alimentos y Bebidas',
    ];

    private const IMAGE_POOL = [
        '/images/logo.png',
        '/images/banner1.webp',
        '/images/banner3.png',
        '/images/banner-left.jpg',
        '/images/autumn-photo-01.jpg',
        '/images/autumn-photo-02.jpg',
        '/images/autumn-photo-03.jpg',
        '/images/autumn-photo-04.jpg',
        '/images/autumn-photo-05.jpg',
        '/images/autumn-photo-06.jpg',
        '/images/autumn-market-1.jpg',
        '/images/autumn-market-2.jpg',
        '/images/autumn-market-3.jpg',
    ];

    public function run(): void
    {
        if (!class_exists(Factory::class)) {
            $this->command?->warn('Faker no esta disponible. El dataset QA no se ha generado.');
            return;
        }

        $faker = Factory::create('es_ES');

        $this->command?->info('Generando dataset QA de alto volumen...');

        $categories = $this->seedCategories();
        $products = $this->seedProducts($categories, $faker);
        $this->seedProductDetails($products, $faker);
        $this->seedProductImages($products);

        $temporaryProducts = $this->seedTemporaryProducts($faker);
        $this->seedTemporaryProductImages($temporaryProducts);

        $users = $this->seedUsers($faker);
        $addressesByUser = $this->seedAddresses($users, $faker);
        $this->seedCookiePreferences($users);

        $this->seedCoupons();
        $this->seedBanners();

        $orders = $this->seedOrders($users, $addressesByUser);
        $this->seedOrderItemsAndSyncTotals($orders, $products);
        $this->seedReviews($users, $products, $faker);

        $this->printSummary();
    }

    private function seedCategories(): Collection
    {
        $names = self::BASE_CATEGORIES;

        while (count($names) < self::CATEGORY_COUNT) {
            $names[] = sprintf('QA Categoria %03d', count($names) + 1);
        }

        foreach ($names as $index => $name) {
            Category::query()->updateOrCreate(
                ['slug' => Str::slug($name)],
                [
                    'name' => $name,
                    'description' => sprintf('Categoria QA %03d para pruebas funcionales y carga visual.', $index + 1),
                ]
            );
        }

        return Category::query()->orderBy('id')->get();
    }

    private function seedProducts(Collection $categories, $faker): Collection
    {
        for ($index = 1; $index <= self::PRODUCT_COUNT; $index++) {
            $category = $categories[($index - 1) % $categories->count()];
            $slug = sprintf('qa-producto-%03d', $index);
            $price = 14.5 + ($index * 2.35);
            $discount = $index % 5 === 0 ? 10 + ($index % 20) : 0;

            Product::query()->updateOrCreate(
                ['link' => '/product/' . $slug],
                [
                    'name' => sprintf('QA Producto %03d', $index),
                    'description' => sprintf('Producto QA %03d preparado para catalogo, carrito, checkout y postventa.', $index),
                    'price' => round($price, 2),
                    'image_url' => self::IMAGE_POOL[$index % count(self::IMAGE_POOL)],
                    'stock' => 20 + ($index % 90),
                    'category_id' => $category->id,
                    'is_adult' => $index % 19 === 0,
                    'is_featured' => $index % 3 === 0,
                    'is_superdeal' => $index % 4 === 0,
                    'is_fast_shipping' => $index % 3 === 1,
                    'is_new_arrival' => $index <= 70 || $index % 5 === 0,
                    'is_seasonal' => $index % 4 === 1,
                    'discount' => $discount,
                ]
            );
        }

        return Product::query()->where('name', 'like', 'QA Producto %')->orderBy('id')->get();
    }

    private function seedProductDetails(Collection $products, $faker): void
    {
        foreach ($products as $index => $product) {
            ProductDetail::query()->updateOrCreate(
                ['product_id' => $product->id],
                [
                    'description' => sprintf(
                        'Ficha QA del producto %03d. %s',
                        $index + 1,
                        $faker->paragraph(3)
                    ),
                    'specifications' => implode("\n", [
                        'Marca: Limoneo QA',
                        'SKU: QA-' . str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT),
                        'Garantia: ' . (12 + ($index % 24)) . ' meses',
                        'Color: ' . ucfirst($faker->safeColorName()),
                    ]),
                ]
            );
        }
    }

    private function seedProductImages(Collection $products): void
    {
        foreach ($products as $index => $product) {
            $imageSet = [
                self::IMAGE_POOL[$index % count(self::IMAGE_POOL)],
                self::IMAGE_POOL[($index + 3) % count(self::IMAGE_POOL)],
            ];

            ProductImage::query()
                ->where('product_id', $product->id)
                ->whereNotIn('image_url', $imageSet)
                ->delete();

            foreach ($imageSet as $position => $imageUrl) {
                ProductImage::query()->updateOrCreate(
                    [
                        'product_id' => $product->id,
                        'image_url' => $imageUrl,
                    ],
                    [
                        'position' => $position + 1,
                    ]
                );
            }
        }
    }

    private function seedTemporaryProducts($faker): Collection
    {
        for ($index = 1; $index <= self::TEMPORARY_PRODUCT_COUNT; $index++) {
            TemporaryProduct::query()->updateOrCreate(
                ['title' => sprintf('QA Temporal %03d', $index)],
                [
                    'price' => round(8 + ($index * 1.8), 2),
                    'image_url' => self::IMAGE_POOL[$index % count(self::IMAGE_POOL)],
                ]
            );
        }

        return TemporaryProduct::query()->where('title', 'like', 'QA Temporal %')->orderBy('id')->get();
    }

    private function seedTemporaryProductImages(Collection $temporaryProducts): void
    {
        foreach ($temporaryProducts as $index => $temporaryProduct) {
            $imageSet = [
                self::IMAGE_POOL[$index % count(self::IMAGE_POOL)],
                self::IMAGE_POOL[($index + 5) % count(self::IMAGE_POOL)],
            ];

            TemporaryProductImage::query()
                ->where('temporary_product_id', $temporaryProduct->id)
                ->whereNotIn('image_url', $imageSet)
                ->delete();

            foreach ($imageSet as $position => $imageUrl) {
                TemporaryProductImage::query()->updateOrCreate(
                    [
                        'temporary_product_id' => $temporaryProduct->id,
                        'image_url' => $imageUrl,
                    ],
                    [
                        'position' => $position + 1,
                    ]
                );
            }
        }
    }

    private function seedUsers($faker): Collection
    {
        $defaultPassword = Hash::make('password123');

        $admin = User::query()->firstOrNew(['email' => 'admin@limoneo.com']);
        $admin->forceFill([
            'name' => 'Administrador QA',
            'lastname' => 'Limoneo',
            'email' => 'admin@limoneo.com',
            'phone' => '+34 600 000 001',
            'password' => Hash::make('admin123'),
            'avatar' => ProfileAvatar::defaultPath(1, 'admin@limoneo.com'),
            'photo_url' => null,
            'oauth_provider' => null,
            'oauth_provider_id' => null,
            'email_verified_at' => now(),
            'is_admin' => true,
        ]);
        $admin->save();

        $supportAdmin = User::query()->firstOrNew(['email' => 'qa.admin@limoneo.test']);
        $supportAdmin->forceFill([
            'name' => 'Soporte QA',
            'lastname' => 'Limoneo',
            'email' => 'qa.admin@limoneo.test',
            'phone' => '+34 600 000 002',
            'password' => $defaultPassword,
            'avatar' => ProfileAvatar::defaultPath(2, 'qa.admin@limoneo.test'),
            'photo_url' => null,
            'oauth_provider' => null,
            'oauth_provider_id' => null,
            'email_verified_at' => now(),
            'is_admin' => true,
        ]);
        $supportAdmin->save();

        for ($index = 1; $index <= self::REGULAR_USER_COUNT; $index++) {
            $email = sprintf('qa.user%03d@limoneo.test', $index);
            $user = User::query()->firstOrNew(['email' => $email]);
            $user->forceFill([
                'name' => sprintf('Usuario QA %03d', $index),
                'lastname' => 'Cliente',
                'email' => $email,
                'phone' => sprintf('+34 600 %03d %03d', $index, $index),
                'password' => $defaultPassword,
                'avatar' => ProfileAvatar::defaultPath($index + 10, $email),
                'photo_url' => null,
                'oauth_provider' => null,
                'oauth_provider_id' => null,
                'email_verified_at' => now()->subDays($index % 30),
                'is_admin' => false,
            ]);
            $user->save();
        }

        return User::query()->where('email', 'like', 'qa.user%@limoneo.test')->orderBy('id')->get();
    }

    private function seedAddresses(Collection $users, $faker): array
    {
        $cities = [
            ['city' => 'Madrid', 'province' => 'Madrid'],
            ['city' => 'Barcelona', 'province' => 'Barcelona'],
            ['city' => 'Valencia', 'province' => 'Valencia'],
            ['city' => 'Sevilla', 'province' => 'Sevilla'],
            ['city' => 'Bilbao', 'province' => 'Bizkaia'],
        ];

        $addressesByUser = [];

        foreach ($users as $userIndex => $user) {
            $addresses = [];

            for ($index = 1; $index <= self::ADDRESSES_PER_USER; $index++) {
                $location = $cities[($userIndex + $index - 1) % count($cities)];
                $street = sprintf('Avenida QA %03d, portal %d', $userIndex + 1, $index);
                $zipCode = sprintf('%05d', 10000 + (($userIndex * 7 + $index) % 40000));

                $address = Address::query()->firstOrNew([
                    'user_id' => $user->id,
                    'street' => $street,
                    'zip_code' => $zipCode,
                ]);
                $address->fill([
                    'city' => $location['city'],
                    'province' => $location['province'],
                    'country' => 'Espana',
                ]);
                $address->save();

                $addresses[] = $address->fresh();
            }

            $user->forceFill(['default_address_id' => $addresses[0]->id])->save();
            $addressesByUser[$user->id] = $addresses;
        }

        return $addressesByUser;
    }

    private function seedCookiePreferences(Collection $users): void
    {
        foreach ($users as $index => $user) {
            CookiePreference::query()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'analytics' => $index % 2 === 0,
                    'marketing' => $index % 3 === 0,
                    'funcionales' => true,
                ]
            );
        }
    }

    private function seedCoupons(): void
    {
        for ($index = 1; $index <= self::COUPON_COUNT; $index++) {
            $isPercent = $index % 2 === 0;
            $isActive = $index % 7 !== 0;
            $expiresAt = $index % 9 === 0 ? now()->subDays(5) : now()->addDays(30 + $index);

            Coupon::query()->updateOrCreate(
                ['code' => sprintf('QA%03d', $index)],
                [
                    'description' => sprintf('Cupon QA %03d para validar checkout y reglas de descuento.', $index),
                    'discount' => $isPercent ? 5 + ($index % 20) : 3 + ($index % 25),
                    'type' => $isPercent ? 'percent' : 'fixed',
                    'min_subtotal' => $index % 4 === 0 ? 50 : 0,
                    'expires_at' => $expiresAt,
                    'usage_limit' => 100 + $index,
                    'used_count' => $index % 11,
                    'is_active' => $isActive,
                ]
            );
        }
    }

    private function seedBanners(): void
    {
        $placements = ['hero', 'showcase', 'sidebar', 'general'];

        for ($index = 1; $index <= self::BANNER_COUNT; $index++) {
            Banner::query()->updateOrCreate(
                ['link' => sprintf('/qa/banner-%03d', $index)],
                [
                    'title' => sprintf('Banner QA %03d', $index),
                    'subtitle' => 'Banner operativo para validar sliders, campañas y layout de storefront.',
                    'image_path' => self::IMAGE_POOL[$index % count(self::IMAGE_POOL)],
                    'cta_label' => 'Abrir bloque QA',
                    'campaign' => 'qa-dataset',
                    'placement' => $placements[($index - 1) % count($placements)],
                    'priority' => ($index % 10) + 1,
                    'starts_at' => now()->subDays($index % 15)->toDateString(),
                    'ends_at' => now()->addDays(45 + $index)->toDateString(),
                    'active' => $index % 8 !== 0,
                ]
            );
        }
    }

    private function seedOrders(Collection $users, array $addressesByUser): Collection
    {
        $orders = collect();
        $targetOrders = collect();

        foreach (self::ORDER_STATUSES as $statusIndex => $status) {
            foreach ($users->values() as $userIndex => $user) {
                $targetOrders->push([
                    'user' => $user,
                    'userAddresses' => $addressesByUser[$user->id],
                    'status' => $status,
                    'statusIndex' => $statusIndex,
                    'sequence' => $userIndex + 1,
                    'transaction_id' => sprintf('qa-%s-user-%03d', Str::slug($status, '-'), $userIndex + 1),
                ]);
            }

            if ($users->count() >= self::ORDERS_PER_STATUS) {
                continue;
            }

            for ($index = $users->count() + 1; $index <= self::ORDERS_PER_STATUS; $index++) {
                $user = $users[($statusIndex + $index - 1) % $users->count()];

                $targetOrders->push([
                    'user' => $user,
                    'userAddresses' => $addressesByUser[$user->id],
                    'status' => $status,
                    'statusIndex' => $statusIndex,
                    'sequence' => $index,
                    'transaction_id' => sprintf('qa-%s-extra-%03d', Str::slug($status, '-'), $index),
                ]);
            }
        }

        $targetTransactionIds = $targetOrders->pluck('transaction_id');

        $obsoleteOrders = Order::query()
            ->where('transaction_id', 'like', 'qa-%')
            ->whereNotIn('transaction_id', $targetTransactionIds)
            ->get();

        if ($obsoleteOrders->isNotEmpty()) {
            OrderItem::query()->whereIn('order_id', $obsoleteOrders->pluck('id'))->delete();
            Order::query()->whereIn('id', $obsoleteOrders->pluck('id'))->delete();
        }

        foreach ($targetOrders as $definition) {
            $orders->push($this->upsertQaOrder(
                user: $definition['user'],
                userAddresses: $definition['userAddresses'],
                status: $definition['status'],
                statusIndex: $definition['statusIndex'],
                sequence: $definition['sequence'],
                transactionId: $definition['transaction_id'],
            ));
        }

        return $orders;
    }

    private function upsertQaOrder(
        User $user,
        array $userAddresses,
        string $status,
        int $statusIndex,
        int $sequence,
        string $transactionId,
    ): Order {
        $address = $userAddresses[($statusIndex + $sequence - 1) % count($userAddresses)];
        $paymentMethod = ($statusIndex + $sequence) % 2 === 0 ? 'stripe' : 'paypal';

        return Order::query()->updateOrCreate(
            ['transaction_id' => $transactionId],
            array_merge([
                'user_id' => $user->id,
                'name' => trim($user->name . ' ' . $user->lastname),
                'email' => $user->email,
                'address' => $this->formatAddress($address),
                'payment_method' => $paymentMethod,
                'total' => 0,
                'status' => $status,
            ], $this->orderStatePayload($status, $sequence, $paymentMethod))
        )->fresh();
    }

    private function orderStatePayload(string $status, int $index, string $paymentMethod): array
    {
        $paymentReference = sprintf('qa-%s-payref-%04d', $paymentMethod, $index);

        return match ($status) {
            'pendiente_pago' => [
                'payment_reference_id' => null,
                'refund_reference_id' => null,
                'cancellation_reason' => null,
                'cancelled_by' => null,
                'cancelled_at' => null,
                'refunded_at' => null,
                'refund_error' => null,
            ],
            'cancelacion_pendiente' => [
                'payment_reference_id' => $paymentReference,
                'refund_reference_id' => null,
                'cancellation_reason' => 'Solicitud de cancelacion pendiente de revision.',
                'cancelled_by' => $index % 2 === 0 ? 'user' : 'admin',
                'cancelled_at' => now()->subDays(($index % 10) + 1),
                'refunded_at' => null,
                'refund_error' => null,
            ],
            'cancelado' => [
                'payment_reference_id' => $paymentReference,
                'refund_reference_id' => null,
                'cancellation_reason' => 'Cancelacion confirmada para pruebas de admin y usuario.',
                'cancelled_by' => $index % 2 === 0 ? 'user' : 'admin',
                'cancelled_at' => now()->subDays(($index % 12) + 2),
                'refunded_at' => null,
                'refund_error' => null,
            ],
            'fallido' => [
                'payment_reference_id' => null,
                'refund_reference_id' => null,
                'cancellation_reason' => null,
                'cancelled_by' => null,
                'cancelled_at' => null,
                'refunded_at' => null,
                'refund_error' => 'Transaccion rechazada por el proveedor de pago durante la autorizacion.',
            ],
            'devolucion_aprobada' => [
                'payment_reference_id' => $paymentReference,
                'refund_reference_id' => null,
                'cancellation_reason' => 'Devolucion aprobada pendiente de reembolso final.',
                'cancelled_by' => 'admin',
                'cancelled_at' => now()->subDays(($index % 7) + 1),
                'refunded_at' => null,
                'refund_error' => $index % 10 === 0 ? 'Intento previo no completado; listo para reintento.' : null,
            ],
            'devolucion_rechazada' => [
                'payment_reference_id' => $paymentReference,
                'refund_reference_id' => null,
                'cancellation_reason' => 'Devolucion rechazada en el flujo QA.',
                'cancelled_by' => 'admin',
                'cancelled_at' => now()->subDays(($index % 9) + 1),
                'refunded_at' => null,
                'refund_error' => null,
            ],
            'reembolsado' => [
                'payment_reference_id' => $paymentReference,
                'refund_reference_id' => sprintf('qa-refund-%04d', $index),
                'cancellation_reason' => 'Reembolso completado en dataset QA.',
                'cancelled_by' => 'admin',
                'cancelled_at' => now()->subDays(($index % 8) + 2),
                'refunded_at' => now()->subDays($index % 6),
                'refund_error' => null,
            ],
            default => [
                'payment_reference_id' => $paymentReference,
                'refund_reference_id' => null,
                'cancellation_reason' => null,
                'cancelled_by' => null,
                'cancelled_at' => null,
                'refunded_at' => null,
                'refund_error' => null,
            ],
        };
    }

    private function seedOrderItemsAndSyncTotals(Collection $orders, Collection $products): void
    {
        $productCount = $products->count();

        foreach ($orders as $orderIndex => $order) {
            $start = abs(crc32((string) $order->transaction_id)) % $productCount;
            $selectedProducts = collect([
                $products[$start],
                $products[($start + 5) % $productCount],
                $products[($start + 11) % $productCount],
            ])->unique('id')->values();

            OrderItem::query()
                ->where('order_id', $order->id)
                ->whereNotIn('product_id', $selectedProducts->pluck('id'))
                ->delete();

            $total = 0;

            foreach ($selectedProducts as $itemIndex => $product) {
                $quantity = (($orderIndex + $itemIndex) % 3) + 1;
                $unitPrice = (float) $product->price;

                OrderItem::query()->updateOrCreate(
                    [
                        'order_id' => $order->id,
                        'product_id' => $product->id,
                    ],
                    [
                        'quantity' => $quantity,
                        'price' => $unitPrice,
                        'status' => $this->lineStatusForOrder($order),
                        'cancellation_reason' => in_array($order->status, ['cancelacion_pendiente', 'cancelado'], true)
                            ? $order->cancellation_reason
                            : null,
                        'cancelled_by' => in_array($order->status, ['cancelacion_pendiente', 'cancelado', 'reembolsado'], true)
                            ? $order->cancelled_by
                            : null,
                        'cancelled_at' => in_array($order->status, ['cancelado', 'reembolsado'], true)
                            ? $order->cancelled_at
                            : null,
                        'return_reason' => in_array($order->status, ['devolucion_solicitada', 'devolucion_aprobada', 'devolucion_rechazada', 'reembolsado'], true)
                            ? $order->cancellation_reason
                            : null,
                        'refund_reference_id' => $order->status === 'reembolsado' ? $order->refund_reference_id : null,
                        'refunded_at' => $order->status === 'reembolsado' ? $order->refunded_at : null,
                        'refund_error' => in_array($order->status, ['devolucion_aprobada', 'devolucion_rechazada'], true)
                            ? $order->refund_error
                            : null,
                    ]
                );

                $total += $unitPrice * $quantity;
            }

            $order->update(['total' => round($total, 2)]);
        }
    }

    private function seedReviews(Collection $users, Collection $products, $faker): void
    {
        $reviewsPerUser = max(1, (int) ceil(self::REVIEWS_COUNT / $users->count()));
        $created = 0;

        foreach ($users as $userIndex => $user) {
            for ($slot = 0; $slot < $reviewsPerUser && $created < self::REVIEWS_COUNT; $slot++) {
                $productIndex = (($userIndex * 7) + ($slot * 17)) % $products->count();
                $product = $products[$productIndex];
                $reviewNumber = $created + 1;

                Review::query()->updateOrCreate(
                    [
                        'product_id' => $product->id,
                        'user_id' => $user->id,
                    ],
                    [
                        'author' => $user->name,
                        'rating' => (($reviewNumber - 1) % 5) + 1,
                        'comment' => sprintf(
                            'Review QA %03d para validar listados, medias y detalle de producto. %s',
                            $reviewNumber,
                            $faker->sentence()
                        ),
                    ]
                );

                $created++;
            }
        }
    }

    private function formatAddress(Address $address): string
    {
        return implode(', ', [
            $address->street,
            $address->city,
            $address->province,
            $address->zip_code,
            $address->country,
        ]);
    }

    private function lineStatusForOrder(Order $order): string
    {
        return match ($order->status) {
            'cancelacion_pendiente', 'cancelado', 'devolucion_solicitada', 'devolucion_aprobada', 'devolucion_rechazada', 'reembolsado' => $order->status,
            default => $order->status,
        };
    }

    private function printSummary(): void
    {
        $statusSummary = collect(self::ORDER_STATUSES)
            ->map(fn (string $status) => sprintf('%s=%d', $status, Order::query()->where('status', $status)->count()))
            ->implode(', ');

        $this->command?->info('Dataset QA generado correctamente.');
        $this->command?->line('Usuarios QA: ' . User::query()->where('email', 'like', 'qa.user%@limoneo.test')->count());
        $this->command?->line('Categorias totales: ' . Category::query()->count());
        $this->command?->line('Productos QA: ' . Product::query()->where('name', 'like', 'QA Producto %')->count());
        $this->command?->line('Temporales QA: ' . TemporaryProduct::query()->where('title', 'like', 'QA Temporal %')->count());
        $this->command?->line('Pedidos por estado: ' . $statusSummary);
    }
}