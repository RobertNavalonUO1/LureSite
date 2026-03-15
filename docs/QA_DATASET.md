# Limoneo - Dataset QA local

Ultima actualizacion: 2026-03-15

Este documento describe el dataset de QA preparado para poblar una base local con volumen suficiente para probar storefront, perfil, admin, checkout, pedidos, devoluciones, reembolsos y el staging temporal de importacion.

## 1. Objetivo

El seeder `Database\Seeders\QaDatasetSeeder` existe para evitar dos problemas recurrentes:

- probar flujos complejos con una base demasiado vacia,
- depender de seeders legacy aleatorios que no garantizan estados concretos del negocio.

El dataset QA genera un volumen alto, repetible e idempotente para los dominios operativos clave.

## 2. Comandos disponibles

### 2.1 Refrescar toda la base local

```bash
composer qa:refresh
```

Uso recomendado:

- desarrollo local,
- demos internas,
- comprobacion manual completa despues de cambios grandes,
- verificacion visual de admin, perfil, pedidos y storefront.

Este comando ejecuta:

```bash
php artisan migrate:fresh --seed --class=Database\Seeders\QaDatasetSeeder
```

### 2.2 Reinyectar el dataset sobre una base ya migrada

```bash
composer seed:qa
```

Uso recomendado:

- cuando no quieres destruir la base,
- cuando solo necesitas rellenar un entorno local ya migrado.

### 2.3 Verificar el seeder

```bash
composer test:qa-dataset
```

Este comando ejecuta la prueba:

- `tests/Feature/QaDatasetSeederTest.php`

Tambien puedes lanzar la suite focalizada principal:

```bash
composer test:critical
```

## 3. Credenciales QA

### 3.1 Admin principal

- email: `admin@limoneo.com`
- password: `admin123`

### 3.2 Admin secundario

- email: `qa.admin@limoneo.test`
- password: `password123`

### 3.3 Usuarios cliente QA

Se generan 60 usuarios cliente con este patron:

- email: `qa.user001@limoneo.test`
- email: `qa.user002@limoneo.test`
- ...
- email: `qa.user060@limoneo.test`
- password comun: `password123`

## 4. Cobertura del dataset

El objetivo no es crear datos "bonitos", sino una base util para probar apartados reales de la app.

### 4.1 Usuarios y perfil

- 60 usuarios cliente QA
- 2 usuarios admin conocidos
- 3 direcciones por usuario cliente
- preferencias de cookies para todos los clientes QA
- avatar por defecto resuelto para cada usuario QA

### 4.2 Catalogo

- al menos 60 categorias
- 180 productos QA
- detalle para todos los productos QA
- 2 imagenes por producto QA
- flags de catalogo distribuidos:
  - `is_featured`
  - `is_superdeal`
  - `is_fast_shipping`
  - `is_new_arrival`
  - `is_seasonal`

### 4.3 Staging de importacion

- 60 `temporary_products`
- 2 imagenes por producto temporal

Esto deja preparado el bloque de herramientas internas y migracion de producto para pruebas manuales.

### 4.4 Marketing y checkout

- 60 cupones QA
- 60 banners QA con campaña `qa-dataset`

### 4.5 Pedidos y postventa

Se garantizan al menos 50 pedidos por cada uno de estos estados:

- `pendiente_pago`
- `pagado`
- `pendiente_envio`
- `enviado`
- `entregado`
- `confirmado`
- `cancelacion_pendiente`
- `cancelado`
- `fallido`
- `devolucion_solicitada`
- `devolucion_aprobada`
- `devolucion_rechazada`
- `reembolsado`

Ademas:

- cada pedido tiene lineas de pedido consistentes,
- los totales se recalculan desde `order_items`,
- los pedidos fallidos incluyen `refund_error` operativo,
- los reembolsados incluyen `payment_reference_id`, `refund_reference_id` y `refunded_at`,
- los estados de cancelacion/devolucion tienen campos auxiliares coherentes.

### 4.6 Reviews

- 240 reviews QA ligadas a usuarios y productos

## 5. Minimos garantizados

La prueba `QaDatasetSeederTest` valida que el dataset deja, como minimo:

- 60 usuarios QA cliente
- 60 categorias
- 180 productos QA
- 180 detalles de producto
- 360 imagenes de producto
- 60 productos temporales
- 120 imagenes temporales
- 180 direcciones
- 60 preferencias de cookies
- 60 cupones QA
- 60 banners QA
- 240 reviews
- 50 pedidos por cada estado operativo soportado

## 6. Rutas recomendadas para validacion manual

Despues de cargar el dataset QA, las rutas mas utiles para smoke testing manual son:

- `/`
- `/search`
- `/new-arrivals`
- `/seasonal`
- `/fast-shipping`
- `/cart`
- `/checkout`
- `/dashboard`
- `/orders`
- `/profile`
- `/admin/dashboard`
- `/admin/orders`
- `/admin/users`
- `/admin/products`
- `/migrate-products`
- `/link-aggregator`

Si quieres ejecutar el recorrido completo con orden y criterios de aprobacion, usa tambien:

- `docs/QA_MANUAL_CHECKLIST.md`

## 7. Notas operativas

- Este dataset esta pensado para desarrollo y QA local, no para produccion.
- Si quieres una base completamente limpia y alineada con este volumen, usa `composer qa:refresh`.
- Si ya tienes una base migrada y solo quieres completar o rehidratar datos QA, usa `composer seed:qa`.
- El seeder esta escrito para ser repetible sobre claves QA conocidas y no depender de azar puro para los estados de negocio.