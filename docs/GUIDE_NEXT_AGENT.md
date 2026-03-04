# Limoneo — Guía de arranque (próximo agente)

Este documento es un **handoff accionable** para implementar el siguiente bloque de trabajo sin ambigüedades.

Última actualización: 2026-03-03 07:09

## Decisiones ya tomadas (importante)

- Auth: usar **Laravel Socialite** (Google/Facebook) y **eliminar Firebase**.
- Login social: **web + API móvil** (emite tokens **Sanctum**).
- Idiomas: `es`, `en`, `fr`.
- i18n: **sin prefijo en URL** (locale en sesión/cookie).
- Productos: importación **manual** (admin ejecuta scraper → ingesta → migración a `products`).

## Estado actual (para situarte rápido)

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

Hay literales con codificación rota (ej. `EnvÃ­o`, `direcci�n`, `protecci�n`, `??`) en ficheros PHP y React.
Esto NO se arregla con `<meta charset="utf-8">` (ya está), sino corrigiendo **la codificación real del archivo** y/o reescribiendo los textos.

Ejemplos ya detectados:
- `resources/js/Pages/Shop/Checkout.jsx`
- `app/Http/Controllers/CheckoutController.php`
- `routes/web.php`

### Problemas UI actuales: Home / Header / Banners

- Header: en algunos casos entra en bucle (sube/baja) cuando cambia su altura y el estado “compacto” oscila.
  - Revisar: histéresis (umbral de entrada/salida), cómo se calcula/propaga `--header-sticky-height` y los listeners de scroll.
  - Código principal: `resources/js/Components/navigation/Header.jsx`.
- Aside/Banners: en ciertos breakpoints un banner derecho puede tapar contenido.
  - Revisar: contenedores `relative/absolute`, stacking context, `z-index` y anchos.
  - Componente: `resources/js/Components/marketing/SidebarBanners.jsx`.
  - Snippet asociado (overlay/shimmer en hover): `absolute -left-1/2 ... group-hover:translate-x-[260%] ...`.

### Productos + scrapers Python (estado)

- UI interna para scripts: `resources/js/Pages/Tools/LinkAggregator.jsx`.
- Backend ejecuta scripts: `app/Http/Controllers/PythonScriptController.php`.
- Staging de productos: `temporary_products` y `temporary_product_images`.
- Migración a producto real: pantalla/acciones en `app/Http/Controllers/ProductMigrationController.php`.

Gotchas conocidos:
- `PythonScriptController` define un binario embebido pero ejecuta `python` del PATH.
- Usa un archivo temporal fijo `storage/app/temp_input.html` (riesgo si hay concurrencia).

---

## 1) Auth: Socialite (Google/Facebook)

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

## 2) Multiidioma (es/en/fr) + corrección de acentos

### Objetivo

- La web permite cambiar idioma entre `es`, `en`, `fr`.
- Los acentos y caracteres especiales se ven correctamente.
- URLs no cambian (sin `/es/...`).

Estado actual:

- Locale `es/en/fr` ya se guarda por cookie/sesión y hay selector en header (desktop y mobile).
- Si hace falta traducción real de strings en React, todavía hay textos hardcodeados pendientes de migrar a un diccionario.

### Paso 0 — Arreglar mojibake (imprescindible antes de i18n)

1) Asegura que los archivos se guardan como **UTF-8**.
2) Reescribe los literales corruptos (no “arreglar en runtime”).
3) Haz una búsqueda global por patrones típicos:
   - `Ã`, `Â`, `�`, `??`

### i18n: implementación mínima sugerida

Como Inertia usa React, hay dos caminos típicos:

- Opción A (recomendada para MVP):
  - Diccionarios JSON en `resources/js/i18n/{es,en,fr}.json`.
  - Un `t(key)` muy simple.
  - Locale en cookie/localStorage.
  - Backend expone el locale actual en shared props (Inertia).

- Opción B:
  - Laravel lang files (`resources/lang/...`) + endpoint para enviar traducciones al frontend.

Elige una opción y documenta el patrón en un README corto dentro de `resources/js/i18n/`.

### Definition of Done

- Selector de idioma visible (donde decida el equipo).
- `Checkout` y textos de UI muestran acentos bien.
- Locale persiste al navegar.

---

## 3) Productos: scrapers Python → TemporaryProduct → migración a Product (manual)

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

### Definition of Done

- El admin ejecuta scraper y termina con filas en `temporary_products`.
- La pantalla `Admin/MigrateProducts` muestra esas filas con imágenes.
- La migración crea `products` + `product_images`.
