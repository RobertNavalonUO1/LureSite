# Limoneo — Guía de arranque (próximo agente)

Este documento es un **handoff accionable** para implementar el siguiente bloque de trabajo sin ambigüedades.

Última actualización: 2026-03-15

## Decisiones ya tomadas (importante)

- Auth: usar **Laravel Socialite** (Google/Facebook) y **eliminar Firebase**.
- Login social: **web + API móvil** (emite tokens **Sanctum**).
- Idiomas: `es`, `en`, `fr`.
- i18n: **sin prefijo en URL** (locale en sesión/cookie).
- Productos: importación **manual** (admin ejecuta scraper → ingesta → migración a `products`).

## Estado actual (para situarte rápido)

### Dataset QA disponible

- Ya existe un seeder dedicado para poblar un entorno local con volumen alto de datos funcionales:
  - `Database\\Seeders\\QaDatasetSeeder`
- Comandos preparados en `composer.json`:
  - `composer qa:refresh`
  - `composer seed:qa`
  - `composer test:qa-dataset`
- Cobertura del dataset:
  - usuarios QA con credenciales conocidas
  - direcciones y preferencias de cookies
  - catalogo, detalles, galerias e inventario temporal
  - cupones y banners
  - pedidos en todos los estados operativos, incluyendo fallidos, devoluciones y reembolsados
- Detalle operativo y credenciales: `docs/QA_DATASET.md`
- Recorrido manual recomendado para smoke y validacion visual: `docs/QA_MANUAL_CHECKLIST.md`

### Estado funcional reciente: rutas, pedidos y admin

- Se cerró una remediación fuerte sobre `routes/web.php` y flujos asociados.
- Ya están cubiertos en código y tests:
  - ownership en `GET /orders/{order}`,
  - validación real de `checkout/success` para Stripe/PayPal,
  - direcciones alineadas con su API JSON,
  - protección de rutas internas admin/product migration,
  - `toggle-admin` endurecido,
  - mutaciones admin migradas a `DELETE` y `PATCH`,
  - workflow admin de devoluciones: aprobar, rechazar, reembolsar.
- Suite focalizada validada al cierre del bloque:
  - `24 tests`, `104 assertions`.

### Estado funcional reciente: API móvil v1 y carrito compartido

- Ya existe una API móvil canónica en `api/mobile/v1`:
  - auth (`register`, `login`, `logout`, `GET/PATCH me`)
  - home/catálogo/special/search
  - carrito (`GET/PUT /cart`, `POST/PATCH/DELETE /cart/items`)
  - checkout (`quote`, `coupon`, `shipping`, `payments/{provider}/session`, `return`, `cancel`)
  - direcciones
  - pedidos y acciones por pedido/línea
- El locale móvil ya no depende de sesión/cookie:
  - middleware `SetApiLocale`
  - header `Accept-Language`
  - respuesta con `Content-Language`
- El carrito autenticado ya no es solo de sesión:
  - web y móvil comparten `ShoppingCartService`
  - persistencia en `cart_items`
  - login, register y social login fusionan snapshot local con carrito del usuario
- Cobertura nueva:
  - `tests/Feature/MobileApiV1Test.php`
  - resultado local validado: `5 tests`, `50 assertions`
- Existe smoke command real para checkout móvil sandbox:
  - `php artisan mobile:checkout-sandbox-smoke`
  - ahora mismo depende de que el entorno tenga `STRIPE_*` y/o `PAYPAL_*`

### Estado operativo que no debe ignorarse

- El worktree local es amplio: hay trabajo vivo en admin, pedidos por línea, storefront, i18n y docs. No asumir repo limpio.
- En producción, `/var/www/limoneo/current` estaba `ahead 3` y dirty; no hacer `git pull` directo sin decidir primero estrategia de release/swap.

### Qué no está completamente cerrado todavía

- El refund administrativo ya intenta ejecutarse contra Stripe/PayPal, guarda trazabilidad mínima (`payment_reference_id`, `refund_reference_id`, `refunded_at`, `refund_error`) y cuenta con una primera capa de idempotencia/logging.
- Aun así, falta endurecer la parte operativa: reintentos, validación por entorno más exhaustiva, observabilidad y posible UI ampliada para errores de refund.
- El residuo admin más claro (`AdminOrders.jsx`) ya fue retirado, pero todavía conviene revisar si quedan casos menores o duplicados menos evidentes.
- Los warnings de PHPUnit por metadata en doc-comments siguen pendientes en tests antiguos.
- Los secretos sandbox/live de Stripe y PayPal siguen siendo el bloqueo principal para un smoke end-to-end real de checkout móvil.
- La app Android ya puede tomar como base `docs/MOBILE_API_ANDROID_SPEC.md`; el bloqueo ya no es de contrato sino de ejecución de entorno y validación final.

### Estado funcional reciente: rutas públicas especiales y coherencia comercial

- Ya están implementadas las dos APIs públicas que faltaban para las páginas especiales:
  - `GET /api/new-arrivals`
  - `GET /api/seasonal-products`
- También se normalizó el payload de:
  - `GET /api/deals-today`
  - `GET /api/superdeals`
  - `GET /api/fast-shipping`
- Esos endpoints ahora exponen precio, precio original cuando aplica, categoría, badge y enlace real al producto.
- `fast-shipping` ya no depende de una colección cruda serializada desde la ruta; recibe un payload alineado con las demás páginas especiales.
- Catálogo, detalle y páginas especiales muestran moneda alineada con checkout (`USD`).
- Se limpió el copy más claramente placeholder en `NewArrivals`, `SeasonalProducts`, `DealsToday`, `SuperDeal`, `FastShipping`, `ProductCard` y `ProductDetails`.
- Validación focalizada nueva:
  - `php artisan test tests/Feature/AdminRestWorkflowTest.php tests/Feature/PublicCatalogApiTest.php`
  - resultado: `8 tests`, `46 assertions`.

### Qué sigue abierto en la parte pública

- `FAQ`, `Terms`, `Privacy` y `Contact` ya fueron reescritas con tono y contexto operativos.
- `Footer`, `TopBanner` y el overlay visible de `Landing/Universe` también quedaron alineados con el estado real del proyecto.
- Aun así, siguen quedando algunos fallback de marketing y bloques editoriales secundarios que conviene revisar antes de considerar completada la web pública.

### Landing-only (producción)

- Si `LANDING_ONLY=true` y `APP_ENV=production`, se sirve solo `Landing/Universe`.
- Código:
  - Toggle: `config/landing.php`
  - Guard de rutas: `routes/web.php` (bloque “Landing-only mode (production)”).

### Auth actual (Socialite)

- Web (sesión Laravel):
  - `GET /auth/{provider}/redirect`
  - `GET /auth/{provider}/callback`
- API móvil (Sanctum):
  - `POST /api/auth/social` (exchange de `access_token` → token Sanctum)
- Código:
  - `app/Http/Controllers/Auth/SocialAuthController.php`
  - `app/Http/Controllers/Api/SocialAuthController.php`
  - `config/services.php`
  - Rutas: `routes/web.php` y `routes/api.php`
- Configuración requerida (`.env`):
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
  - `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `FACEBOOK_REDIRECT_URI`

Links completos para obtener variables OAuth:

- Google: https://console.cloud.google.com/apis/credentials
  - Consent screen: https://console.cloud.google.com/apis/credentials/consent
- Facebook: https://developers.facebook.com/apps/

### Problema actual: acentos / mojibake

La pasada principal ya quedó hecha en `app/`, `resources/` y `routes/`.
Si reaparece texto roto, la forma de validarlo sigue siendo la misma: búsqueda global por patrones `Ã`, `Â`, `�`, reescritura del literal y guardado real en UTF-8.
No intentar “arreglarlo” en runtime.

### Estado UI actual: Home / Header / Banners

- Header: el bucle visual quedó resuelto con una fuente única de estado compacto.
  - `StorefrontLayout.jsx` calcula `isCompact` con `useScrollCompact()` y lo pasa a `Header.jsx` y `TopNavMenu.jsx`.
  - `Header.jsx` actualiza `--header-sticky-height` según la altura real activa y mantiene `z-50`.
  - `TopNavMenu.jsx` queda debajo con `z-40` y usa el `top` calculado desde esa variable.
- Aside/Banners: la invasión visual del banner derecho sigue contenida.
  - `SidebarBanners.jsx` no compite como sticky con el panel utilitario.
  - El aside derecho de Home no debe recibir `z-index` alto salvo que haya una razón concreta.
- Filtros catálogo: el sistema ya quedó unificado.
  - Componente base oficial: `resources/js/Components/catalog/CatalogFilterPanel.jsx`.
  - Resumen de filtros: `resources/js/Components/catalog/ActiveFilters.jsx`.
  - Tokens sticky compartidos: `resources/js/config/catalogLayout.js`.
  - Páginas unificadas: `resources/js/Pages/Shop/Home.jsx`, `resources/js/Pages/Search/Results.jsx`, `resources/js/Pages/Shop/CategoryPage.jsx`.
  - Regla arquitectónica: solo el filtro domina el sticky del aside; marketing/promos no deben usar el mismo anclaje sticky.

### Productos + scrapers Python (estado)

- UI interna para scripts: `resources/js/Pages/Tools/LinkAggregator.jsx`.
- Backend ejecuta scripts: `app/Http/Controllers/PythonScriptController.php`.
- Staging de productos: `temporary_products` y `temporary_product_images`.
- Migración a producto real: pantalla/acciones en `app/Http/Controllers/ProductMigrationController.php`.

Gotchas conocidos:
- `PythonScriptController` define un binario embebido pero ejecuta `python` del PATH.
- Usa un archivo temporal fijo `storage/app/temp_input.html` (riesgo si hay concurrencia).

---

## 1) Fase inmediata recomendada: estabilizar release y validar pagos reales

### Objetivo

- Cerrar el bloque operativo abierto: release limpio, secretos de pago, smoke real de checkout móvil y después volver a refund/admin residual.

### Qué revisar primero

1. Producción y sandbox:
  - desplegar por release limpio si `/var/www/limoneo/current` sigue dirty,
  - fijar secretos `STRIPE_*` y `PAYPAL_*` por entorno,
  - ejecutar `php artisan mobile:checkout-sandbox-smoke`,
  - verificar `api/mobile/v1` y carrito compartido en el entorno real.
2. Residuos legacy admin:
  - buscar pantallas duplicadas o antiguas del admin que no se hayan barrido aún,
  - revisar formularios o acciones que sigan fuera del patrón Inertia ya adoptado,
  - asegurar mensajes y confirmaciones coherentes.
3. Operativa del refund:
  - revisar `OrderRefundService`, `CheckoutController` y `AdminController`,
  - endurecer reintentos y tratamiento de fallos temporales,
  - validar configuración `PAYPAL_MODE` y secretos por entorno,
  - decidir si el admin debe ver el último error de refund.
4. Storefront e i18n residual:
  - revisar `SidebarBanners`, `AutumnShowcase`, `TopBanner` y otros bloques con copy aún irregular,
  - cerrar pendientes visibles de i18n y mojibake.
5. Cobertura:
  - ampliar tests si aparece algún recurso admin fuera de la nueva cobertura,
  - convertir a atributos las pruebas antiguas con metadata en doc-comments cuando toque limpieza de warnings.

### Definition of Done

- Producción puede desplegarse sin depender de `git pull` in-place sobre un worktree sucio.
- El smoke real de checkout móvil queda ejecutado al menos contra un proveedor sandbox.
- La app no comunica `reembolsado` sin base operativa clara.
- No quedan consumidores activos del contrato admin antiguo.
- La cobertura del bloque sigue verde.

---

## 2) Auth: Socialite (Google/Facebook)

### Objetivo

- Mantener Socialite como auth principal (web + API móvil) y asegurar que el `.env` esté configurado por entorno.

### Configuración (lo mínimo)

- Asegurar redirect URIs correctos (por dominio):
  - `GOOGLE_REDIRECT_URI=https://<dominio>/auth/google/callback`
  - `FACEBOOK_REDIRECT_URI=https://<dominio>/auth/facebook/callback`
- Ejecutar migraciones pendientes en el entorno:
  - `php artisan migrate`

### Definition of Done

- Login Google/Facebook funciona en web (sesión) y móvil (Sanctum).
- No existen referencias activas a Firebase en rutas/UI/dependencias.

---

## 3) Multiidioma (es/en/fr) + corrección de acentos

### Objetivo

- La web permite cambiar idioma entre `es`, `en`, `fr`.
- Los acentos y caracteres especiales se ven correctamente.
- URLs no cambian (sin `/es/...`).

Estado actual:

- Locale `es/en/fr` ya se guarda por cookie/sesión y hay selector en header (desktop y mobile).
- i18n frontend ya está implementado con diccionarios JSON + hook `useI18n()`.
  - Diccionarios: `resources/js/i18n/{es,en,fr}.json`
  - Implementación/uso: `resources/js/i18n/README.md`
- Páginas ya migradas a `t('...')` (ejemplos):
  - Legacy: `resources/js/Pages/Legacy/Welcome.jsx`, `resources/js/Pages/Legacy/HomePage.jsx`
  - Landing-only: `resources/js/Pages/Landing/Universe.jsx`
- Importante (scope actual): las pantallas de Admin se mantienen sin i18n (strings hardcodeados), aunque existan claves `admin.*` en los JSON.
- Aun así, quedan textos hardcodeados en otras vistas que pueden seguir migrándose si se desea.

### Paso 0 — Arreglar mojibake (imprescindible antes de seguir ampliando i18n)

1) Asegura que los archivos se guardan como **UTF-8**.
2) Reescribe los literales corruptos (no “arreglar en runtime”).
3) Haz una búsqueda global por patrones típicos:
   - `Ã`, `Â`, `�`, `??`

### i18n: implementación (actual)

Se está usando el enfoque “Opción A” (diccionarios JSON + `useI18n()`).

- Documentación del patrón: `resources/js/i18n/README.md`
- Nota: el locale viene del backend vía Inertia props (`locale`) y se cambia con `POST /locale`.

### Definition of Done

- Selector de idioma visible (donde decida el equipo).
- `Checkout` y textos de UI muestran acentos bien.
- Locale persiste al navegar.

---

## 4) Productos: scrapers Python → TemporaryProduct → migración a Product (manual)

### Objetivo

- Un admin puede:
  1) Ejecutar scraper.
  2) Ingerir resultados como `temporary_products` (+ imágenes).
  3) Revisar y migrar a `products` usando la UI existente.

### Estado actual

- Existe ejecución de scripts y pantalla de migración.
- Ya existe endpoint admin para importar JSON a `temporary_products` y el Link Aggregator puede ofrecer un botón de importación si el output del script devuelve un JSON con `products`.

### Diseño recomendado de salida de scraper

- Estandariza un JSON (ejemplo):

```json
{
  "products": [
    {
      "title": "...",
      "price": 12.34,
      "original_price": 19.99,
      "rating": "4.7",
      "sold_count": "1000+",
      "product_url": "https://...",
      "image_url": "https://...",
      "images": ["https://...", "https://..."]
    }
  ]
}
```

### Checklist de implementación (backend)

Pendientes opcionales (mejoras):

- Evitar duplicados en importación (por `product_url` o hash) si se detecta que el scraper repite productos.
- Revisar `PythonScriptController`:
  - Usar el python embebido consistentemente.
  - Evitar el archivo temporal fijo si hay concurrencia.

### Prioridad relativa

Este bloque ya no es la prioridad inmediata del proyecto. Debe retomarse justo después de cerrar refund real + limpieza REST/admin residual.

### Definition of Done

- El admin ejecuta scraper y termina con filas en `temporary_products`.
- La pantalla `Admin/MigrateProducts` muestra esas filas con imágenes.
- La migración crea `products` + `product_images`.
