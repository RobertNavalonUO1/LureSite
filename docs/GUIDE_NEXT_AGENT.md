# Limoneo — Guía de arranque (próximo agente)

Este documento es un **handoff accionable** para implementar el siguiente bloque de trabajo sin ambigüedades.

## Decisiones ya tomadas (importante)

- Auth: migrar a **Laravel Socialite** y **eliminar Firebase** cuando esté listo.
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

### Auth actual (Firebase)

- Web:
  - Frontend obtiene `idToken` y lo envía a `POST /auth/firebase`.
  - Backend verifica token (Kreait) y crea sesión Laravel.
- Móvil:
  - `POST /api/auth/firebase-mobile` devuelve token Sanctum.
- Código:
  - `resources/js/firebase.js` y `resources/js/utils/firebaseLogin.js`
  - `app/Http/Controllers/Auth/FirebaseLoginController.php`
  - `app/Services/FirebaseAuthService.php`
  - Rutas: `routes/web.php` y `routes/api.php`

### Problema actual: acentos / mojibake

Hay literales con codificación rota (ej. `EnvÃ­o`, `direcci�n`, `protecci�n`, `??`) en ficheros PHP y React.
Esto NO se arregla con `<meta charset="utf-8">` (ya está), sino corrigiendo **la codificación real del archivo** y/o reescribiendo los textos.

Ejemplos ya detectados:
- `resources/js/Pages/Shop/Checkout.jsx`
- `app/Http/Controllers/CheckoutController.php`
- `routes/web.php`

### Productos + scrapers Python (estado)

- UI interna para scripts: `resources/js/Pages/Tools/LinkAggregator.jsx`.
- Backend ejecuta scripts: `app/Http/Controllers/PythonScriptController.php`.
- Staging de productos: `temporary_products` y `temporary_product_images`.
- Migración a producto real: pantalla/acciones en `app/Http/Controllers/ProductMigrationController.php`.

Gotchas conocidos:
- `PythonScriptController` define un binario embebido pero ejecuta `python` del PATH.
- Usa un archivo temporal fijo `storage/app/temp_input.html` (riesgo si hay concurrencia).

---

## 1) Auth: Socialite (Google/Facebook) + retirada de Firebase

### Objetivo

- Reemplazar Firebase Auth por **Socialite** para:
  - **Web**: sesión Laravel estándar.
  - **API móvil**: emitir token **Sanctum** tras login social.
- Eliminar rutas, código y configuración Firebase cuando Socialite esté estable.

### Alcance (lo mínimo)

- Google login: redirect + callback.
- Facebook login: redirect + callback.
- Unificar creación/actualización del `User`.
- Mantener experiencia SPA Inertia (sin romper navegación).

### Diseño recomendado (alto nivel)

1) **Web (sesión)**
- Rutas:
  - `GET /auth/google/redirect`
  - `GET /auth/google/callback`
  - `GET /auth/facebook/redirect`
  - `GET /auth/facebook/callback`
- En callback:
  - Buscar usuario por email.
  - Si no existe: crear.
  - Guardar `provider`, `provider_id` (recomendado añadir columnas o tabla `social_accounts`).
  - `auth()->login($user, true)` + `session()->regenerate()`.
  - Redirect a `/`.

2) **API móvil (Sanctum)**
- Evitar abrir un navegador “webview” sin control.
- Enfoque práctico (depende del cliente móvil):
  - Opción A (más simple): el móvil abre un navegador externo con callback a un esquema deep-link; el backend al completar el callback emite un **código** de un solo uso; el móvil lo intercambia por token Sanctum.
  - Opción B: usar OAuth PKCE nativo (mejor, más trabajo).

Para este repo: documenta bien qué opción eliges y deja endpoints claros.

### Checklist de implementación

- Dependencias:
  - `laravel/socialite`
- Configuración:
  - `config/services.php` (google/facebook)
  - `.env`:
    - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
    - `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `FACEBOOK_REDIRECT_URI`
- Modelo `User`:
  - Añadir campos o relación para vincular cuentas sociales.
  - Decidir qué hacer con `firebase_uid` a futuro (deprecación).
- Rutas + controlador Socialite.
- Frontend:
  - Sustituir botones Firebase por links a los redirect Socialite.
- Retirada Firebase:
  - Eliminar `POST /auth/firebase` y `POST /api/auth/firebase-mobile`.
  - Eliminar `resources/js/firebase.js` y helpers si ya no se usan.
  - Eliminar `FirebaseAuthService` si queda huérfano.

### Definition of Done

- Login Google/Facebook funciona en web y crea sesión.
- API móvil obtiene token Sanctum desde Socialite (flujo definido y documentado).
- No quedan referencias activas a Firebase en rutas/UI.

---

## 2) Multiidioma (es/en/fr) + corrección de acentos

### Objetivo

- La web permite cambiar idioma entre `es`, `en`, `fr`.
- Los acentos y caracteres especiales se ven correctamente.
- URLs no cambian (sin `/es/...`).

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

- Existe ejecución de scripts y pantalla de migración, pero falta un “pegamento” claro que convierta salida del scraper en filas `TemporaryProduct`/`TemporaryProductImage`.

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

- Crear un endpoint/admin action “Import from JSON” que:
  - Valide el JSON.
  - Cree `TemporaryProduct`.
  - Cree `TemporaryProductImage` por cada imagen extra.
  - Evite duplicados (por `product_url` si existe, o hash del título+precio).
- Ajustar `PythonScriptController` si se necesita:
  - Usar el python embebido consistentemente.
  - Evitar el archivo temporal fijo.

### Definition of Done

- El admin ejecuta scraper y termina con filas en `temporary_products`.
- La pantalla `Admin/MigrateProducts` muestra esas filas con imágenes.
- La migración crea `products` + `product_images`.
