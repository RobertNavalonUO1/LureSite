# Limoneo (Laravel + Inertia + React)

Última actualización: 2026-03-03 07:15

Aplicación web tipo e-commerce construida con **Laravel 11** + **Inertia.js** + **React** (Vite). El backend sirve páginas Inertia y APIs JSON, y el frontend vive en `resources/js`.

Documentación adicional:

- Guía extendida de producción y alojamiento: [docs/PRODUCTION.md](docs/PRODUCTION.md)
- Guía para alternar entornos (dev/staging/prod): [docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md)
- Checklist corto de pendientes: [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md)
- Guía de arranque (próximo bloque con otro agente): [docs/GUIDE_NEXT_AGENT.md](docs/GUIDE_NEXT_AGENT.md)
- Landing temporal “universo + limón” (modo mantenimiento): [docs/LANDING_UNIVERSE.md](docs/LANDING_UNIVERSE.md)

## Estado actual (infra / producción)

Ya se avanzó en la infraestructura base. Resumen:

- Dominio: `limoneo.com` comprado en Dynadot.
- VPS: Hetzner Cloud
    - Plan: CX23 (2 vCPU, 4GB RAM, 40GB)
    - Nombre: `limoneo-prod-1`
    - Región: Nuremberg (Alemania)
    - IPv4 pública: `46.224.207.157`
- SSH (Windows): clave generada y añadida a Hetzner.
    - Privada: `C:\Users\TZL\.ssh\id_ed25519` (NO se comparte)
    - Pública: `C:\Users\TZL\.ssh\id_ed25519.pub`
- Base de datos (Neon / Postgres): proyecto en Frankfurt (`eu-central-1`)
    - DB: `neondb`
    - Rol: `neondb_owner`
    - Endpoint directo (sin pooler, recomendado para migraciones): `ep-round-unit-alr8cr3l.c-3.eu-central-1.aws.neon.tech`
    - Pooler (opcional, útil para tráfico web): `ep-round-unit-alr8cr3l-pooler.c-3.eu-central-1.aws.neon.tech`
    - SSL: requerido (`sslmode=require`)
- Cloudflare: activo para `limoneo.com`.
- Origin (VPS): Nginx + Let's Encrypt + PHP-FPM 8.3 (Laravel) sirviendo correctamente.

Runbook detallado: [docs/PRODUCTION.md](docs/PRODUCTION.md).

## URLs / comprobación rápida

- Producción: `https://limoneo.com`
- Modo mantenimiento (solo producción): `LANDING_ONLY=true` sirve una sola página (ver [docs/LANDING_UNIVERSE.md](docs/LANDING_UNIVERSE.md)).
- Staging: `https://staging.limoneo.com`
    - Si ves `DNS_PROBE_FINISHED_NXDOMAIN`, falta crear el registro DNS en Cloudflare (ver [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md)).
    - Mientras no haya DNS, la verificación real se hace desde el VPS con `curl -I -H 'Host: staging.limoneo.com' http://127.0.0.1/`.
- Local (dev): `http://127.0.0.1:8000`
    - Activar entorno: `composer env:dev`
    - Backend: `php artisan serve --host=127.0.0.1 --port=8000`
    - Frontend: `npm run dev`

Nota Windows/PowerShell: `curl` suele ser un alias de `Invoke-WebRequest`. Si necesitas sintaxis estilo Linux (`-I`, `-H`), usa `curl.exe`.

Este README está escrito pensando en un handoff real: explica **cómo funciona** el proyecto, **cómo ejecutarlo** (desarrollo vs producción) y **dónde está cada cosa importante**.

> Nota sobre “explicar cada archivo”
>
> Este repo contiene dependencias y artefactos generados (por ejemplo `vendor/`, `node_modules/`, `public/build/`, `storage/`). Documentarlos “archivo por archivo” no aporta valor y además cambia según versiones.
> En su lugar, este README desglosa **todos los módulos propios** (rutas, controladores, servicios, modelos y componentes/páginas React) y los **archivos de configuración** que gobiernan el comportamiento.

## Arquitectura (vista general)

- Backend: Laravel (rutas web + controladores + modelos Eloquent + servicios).
- Frontend: Inertia + React (páginas y componentes) empaquetado con Vite.
- Estado de carrito: **session** (server-side), compartido a Inertia.
- Auth: login web con **Laravel Socialite** (Google/Facebook) + flujo móvil con **Sanctum** (ver [docs/GUIDE_NEXT_AGENT.md](docs/GUIDE_NEXT_AGENT.md)).
- Pagos: Stripe Checkout + PayPal (SDK).
- Extra: ejecución de scripts Python desde backend (uso interno/herramientas).

## Estado actual (app)

- Responsive móvil: aplicada una primera tanda de ajustes (checkout/carrito/grids/sticky stack).
- Landing-only en producción: `LANDING_ONLY=true` sirve solo la landing (ver [docs/LANDING_UNIVERSE.md](docs/LANDING_UNIVERSE.md)).
- Importación de productos: pipeline temporal (`temporary_products`) + migración a `products` y scripts Python (ver [docs/GUIDE_NEXT_AGENT.md](docs/GUIDE_NEXT_AGENT.md)).
- Pendiente: textos con acentos/encoding (mojibake) en algunos ficheros; se corrige estandarizando UTF-8 y reescribiendo literales.

Flujo típico de una página Inertia:

1) Navegador pide una ruta web (ej. `/`).
2) Laravel responde con `Inertia::render('Shop/Home', props...)`.
3) Inertia monta React y resuelve el componente `resources/js/Pages/Shop/Home.jsx`.
4) Cambios de página posteriores se hacen con navegación Inertia (sin recarga completa).

## Mapa rápido del proyecto

### Entradas y configuración

- Frontend bootstrap: [resources/js/app.jsx](resources/js/app.jsx)
    - Monta Inertia con `createInertiaApp` y resuelve páginas con `import.meta.glob('./Pages/**/*.jsx')`.
- Vista raíz Inertia: [resources/views/app.blade.php](resources/views/app.blade.php)
    - Inyecta Ziggy (`@routes`) y los assets Vite (`@vite([...])`).
- Config Vite: [vite.config.js](vite.config.js)
    - Punto de entrada: `resources/js/app.jsx`.

### Rutas (backend)

- Rutas web + endpoints JSON: [routes/web.php](routes/web.php)
    - **Páginas públicas**: `/`, `/about`, `/contact`, `/faq`, `/terms`, `/privacy`, y páginas especiales (`/deals/today`, `/superdeal`, etc.).
    - **APIs públicas JSON**: `/api/deals-today`, `/api/superdeals`, `/api/fast-shipping`, `/api/search/suggestions`, `/banners`.
    - **Auth Socialite (web)**:
        - `GET /auth/{provider}/redirect`
        - `GET /auth/{provider}/callback`
    - **Locale**: `POST /locale` (cookie + sesión).
    - **Carrito/checkout**: `/cart/*`, `/checkout/*`.
    - **Inertia share**: comparte carrito, total, csrf, etc.

### Shared props (Inertia)

- Middleware Inertia: [app/Http/Middleware/HandleInertiaRequests.php](app/Http/Middleware/HandleInertiaRequests.php)
    - Inyecta `auth.user` (saneado) + `cartItems`, `cartCount`, `total` + mensajes flash.

## Frontend (Inertia + React)

### Cómo se resuelven páginas

Las rutas Laravel llaman a `Inertia::render('<Folder/Page>')` y se resuelve a:

- `Inertia::render('Shop/Home')` → [resources/js/Pages/Shop/Home.jsx](resources/js/Pages/Shop/Home.jsx)
- `Inertia::render('Special/DealsToday')` → [resources/js/Pages/Special/DealsToday.jsx](resources/js/Pages/Special/DealsToday.jsx)
- `Inertia::render('Special/SuperDeal')` → [resources/js/Pages/Special/SuperDeal.jsx](resources/js/Pages/Special/SuperDeal.jsx)

El resolver está en [resources/js/app.jsx](resources/js/app.jsx).

### Navegación / Header / Sticky stack

- Header principal: [resources/js/Components/navigation/Header.jsx](resources/js/Components/navigation/Header.jsx)
    - Es `sticky top-0` y tiene **modo compacto** al scrollear.
    - Usa histéresis (umbral de entrada/salida) para evitar “parpadeo” cuando cambia la altura.
    - Publica el estado global `data-header-compact` en `<html>` y emite el evento `header:compact`.
    - Mide su altura con `ResizeObserver` y escribe `--header-sticky-height` para que otros sticky se apilen sin solaparse.

- Menú superior de secciones: [resources/js/Components/navigation/TopNavMenu.jsx](resources/js/Components/navigation/TopNavMenu.jsx)
    - También es sticky y se coloca **debajo** del header usando `top: var(--header-sticky-height)`.
    - Mide su altura y escribe `--topnav-sticky-height`.

- Hook de estado compacto: [resources/js/Components/navigation/header/useHeaderCompact.js](resources/js/Components/navigation/header/useHeaderCompact.js)
    - Lee `document.documentElement.dataset.headerCompact` y escucha `header:compact`.

**Concepto “sticky stack”**

Cuando una página necesita otra barra sticky (categorías/filtros), se posiciona con:

`top: calc(var(--header-sticky-height, 0px) + var(--topnav-sticky-height, 0px))`

Así no tapa contenido y funciona incluso si el header cambia de alto.

### Home (Shop)

- Página: [resources/js/Pages/Shop/Home.jsx](resources/js/Pages/Shop/Home.jsx)
    - Recibe `categories`, `products`, `campaign`, `auth` desde backend.
    - Filtros en cliente: búsqueda, categoría, precio min/max, orden.
    - **Swap de categorías según header**:
        - Normal: grid grande con `CategoryCards`.
        - Compacto: barra minimal con `CategoryIconBar`.
    - Aside enriquecido con banners y módulos rápidos.

- Barra de categorías compacta: [resources/js/Components/catalog/CategoryIconBar.jsx](resources/js/Components/catalog/CategoryIconBar.jsx)
    - Iconos por heurística del nombre (mapa local) + dropdowns “todas”/“más”.
    - Usa `renderDropdown` para renderizar el dropdown como overlay.

- Banners laterales (carousel): [resources/js/Components/marketing/SidebarBanners.jsx](resources/js/Components/marketing/SidebarBanners.jsx)
    - Normaliza datos (tolerante a `banners` no-array) para evitar crashes.
    - Rotación automática + dots/thumbs (sin librerías).

### Páginas especiales (Special)

- Ofertas del día: [resources/js/Pages/Special/DealsToday.jsx](resources/js/Pages/Special/DealsToday.jsx)
    - Carga datos con `fetch('/api/deals-today')`.
    - Barra sticky de acciones/filtros bajo header+topnav:
        - Recargar
        - Filtros rápidos `minDiscount` (0/20/40)
        - Búsqueda con limpiar
        - Botón “Arriba”
    - Renderiza `filteredOffers` y muestra empty state “Sin coincidencias”.

- SuperDeal: [resources/js/Pages/Special/SuperDeal.jsx](resources/js/Pages/Special/SuperDeal.jsx)
    - Carga datos con `fetch('/api/superdeals')`.
    - Misma barra sticky de acciones/filtros.
    - Separa `featured` vs `regular` a partir de los productos filtrados.

## Backend (Laravel)

### Rutas y páginas Inertia

La mayor parte del enrutado está en [routes/web.php](routes/web.php). Puntos clave:

- Páginas Inertia (`Inertia::render(...)`) para Shop/Static/Special.
- APIs JSON públicas para “deals/superdeals/fast shipping” y sugerencias de búsqueda.
- Carrito (session) y checkout.

### Modelos (datos)

- Producto: [app/Models/Product.php](app/Models/Product.php)
    - Campos fillable incluyendo flags: `is_featured`, `is_superdeal`, `is_fast_shipping`, `is_new_arrival`, `is_seasonal`, `discount`.
    - Relación `belongsTo(Category)`.
    - Accesor `image_url_full`.

- Categoría: [app/Models/Category.php](app/Models/Category.php)
    - `hasMany(Product)`.

### Carrito (session)

- Controlador: [app/Http/Controllers/CartController.php](app/Http/Controllers/CartController.php)
    - Guarda items en `session('cart')`.
    - Soporta respuestas HTML (redirect) y JSON (`expectsJson`).
    - Snapshot `cartItems`, `cartCount`, `total`.

### Checkout + Pagos (Stripe / PayPal)

- Controlador: [app/Http/Controllers/CheckoutController.php](app/Http/Controllers/CheckoutController.php)
    - Render de checkout con totales, opciones de envío y direcciones.
    - Stripe: crea una sesión de checkout usando `STRIPE_SECRET` y devuelve `sessionId` + `STRIPE_KEY`.
    - PayPal (sandbox): crea orden y devuelve `approvalLink`.
    - `success()` finaliza creando `Order` y `OrderItem` (persistencia).

Variables de entorno esperadas (resumen):

- `STRIPE_KEY`, `STRIPE_SECRET`
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`

### Auth social (Google/Facebook) (Socialite + Sanctum)

Flujo **web** (sesión Laravel):

1) El usuario pulsa “Continuar con Google/Facebook”.
2) Frontend redirige a `GET /auth/{provider}/redirect`.
3) Socialite hace el OAuth handshake.
4) Callback en `GET /auth/{provider}/callback`:
    - crea/actualiza usuario local
    - hace `auth()->login(...)` y regenera sesión
    - redirige al home.

Flujo **móvil** (token Sanctum):

1) La app móvil obtiene un `access_token` del proveedor (Google/Facebook).
2) La app llama `POST /api/auth/social` con JSON:

```json
{ "provider": "google", "access_token": "..." }
```

3) Backend valida el token con Socialite (`userFromToken`) y devuelve:
    - `token` (Sanctum)
    - `user`

Enlaces oficiales para crear credenciales OAuth:

- Google Cloud Console (Credenciales): https://console.cloud.google.com/apis/credentials
- Google (Pantalla de consentimiento OAuth): https://console.cloud.google.com/apis/credentials/consent
- Facebook Developers (Apps): https://developers.facebook.com/apps/
- Docs Facebook Login (Web): https://developers.facebook.com/docs/facebook-login/web/

### Scripts Python (herramientas)

- Endpoint JSON: [app/Http/Controllers/PythonScriptController.php](app/Http/Controllers/PythonScriptController.php)
    - Recibe `script`, `input` y opciones.
    - Crea un archivo temporal HTML en `storage/app/`.
    - Ejecuta el script con `Symfony\Component\Process\Process`.

Notas operativas:

- Hay un Python embebido en `python_embed/`.
- El controlador define `$pythonBinary`, pero actualmente ejecuta el comando `python` (depende del PATH). Si quieres forzar el embebido, habría que pasar el binario explícito (tarea futura).

## Ejecutar en desarrollo (estado actual)

### Prerrequisitos

- PHP >= 8.2
- Composer
- Node.js (recomendado 18+)

### Setup inicial

1) Instalar dependencias PHP:

`composer install`

2) Instalar dependencias Node:

`npm install`

3) Variables de entorno:

- Recomendado: activar entorno de desarrollo con el switcher:

`composer env:dev`

- Generar `APP_KEY`:

`php artisan key:generate`

4) Base de datos y tablas:

Por defecto `.env.example` usa SQLite + `SESSION_DRIVER=database` + `QUEUE_CONNECTION=database` + `CACHE_STORE=database`.

- Asegúrate de tener `database/database.sqlite`.
- Ejecuta migraciones:

`php artisan migrate`

Tip: para inspeccionar la SQLite en VS Code (tablas/datos), ver [docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md) → “Ver SQLite local en VS Code (desarrollo)”.

5) Storage link (imágenes en `storage/`):

`php artisan storage:link`

### Pruebas (tests)

- Ejecutar test suite:

`php artisan test`

o (atajo):

`composer test`

Notas:

- Los tests fuerzan `APP_ENV=testing` y DB SQLite en memoria (ver `phpunit.xml`) para que sean reproducibles.
- Si notas comportamiento raro tras cambiar `.env`, usa:

`php artisan optimize:clear`

### Arranque (2 terminales)

- Backend:

`php artisan serve --host=127.0.0.1 --port=8000`

- Frontend:

`npm run dev -- --host 127.0.0.1 --port 5173`

URLs:

- Laravel: http://127.0.0.1:8000
- Vite: http://127.0.0.1:5173

### Arranque (modo recomendado 1 comando)

`composer run dev`

Esto levanta en paralelo:

- `php artisan serve`
- `php artisan queue:listen`
- `php artisan pail`
- `npm run dev`

## Despliegue en producción (runbook)

### Compilar assets

En CI o en tu máquina de build:

- `npm ci`
- `npm run build`

Los assets generados se escriben en `public/build/` (ver plugin `laravel-vite-plugin`).

### Instalar dependencias PHP

- `composer install --no-dev --optimize-autoloader`

### Configuración de entorno

- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_KEY` configurada
- Configurar DB real (MySQL/Postgres) o SQLite con permisos correctos
- Configurar:
    - Stripe: `STRIPE_KEY`, `STRIPE_SECRET`
    - PayPal: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`
    - Socialite:
        - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
        - `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `FACEBOOK_REDIRECT_URI`

### Migraciones y caches

- `php artisan migrate --force`
- `php artisan config:cache`
- `php artisan route:cache`
- `php artisan view:cache`

### Workers

Si usas colas:

- `php artisan queue:work --tries=1`

En producción normalmente conviene `redis` para colas/cache/sesión.

## Ficheros “clave” (referencia)

- [routes/web.php](routes/web.php): rutas web + APIs + share.
- [resources/js/app.jsx](resources/js/app.jsx): bootstrap Inertia/React.
- [resources/views/app.blade.php](resources/views/app.blade.php): root view Inertia + Vite.
- [app/Http/Middleware/HandleInertiaRequests.php](app/Http/Middleware/HandleInertiaRequests.php): shared props globales.
- [resources/js/Components/navigation/Header.jsx](resources/js/Components/navigation/Header.jsx): header sticky + compacto.
- [resources/js/Components/navigation/TopNavMenu.jsx](resources/js/Components/navigation/TopNavMenu.jsx): sticky debajo de header.
- [resources/js/Pages/Shop/Home.jsx](resources/js/Pages/Shop/Home.jsx): home + filtros + aside.
- [app/Http/Controllers/CartController.php](app/Http/Controllers/CartController.php): carrito en session.
- [app/Http/Controllers/CheckoutController.php](app/Http/Controllers/CheckoutController.php): checkout + pagos.
- [app/Http/Controllers/Auth/SocialAuthController.php](app/Http/Controllers/Auth/SocialAuthController.php): login web Socialite (redirect/callback).
- [app/Http/Controllers/Api/SocialAuthController.php](app/Http/Controllers/Api/SocialAuthController.php): exchange móvil (access_token → token Sanctum).
- [app/Http/Controllers/LocaleController.php](app/Http/Controllers/LocaleController.php): cambio de idioma (cookie + sesión).
- [app/Http/Middleware/SetLocale.php](app/Http/Middleware/SetLocale.php): aplica locale a cada request.
