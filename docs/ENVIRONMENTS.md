# Entornos (development / staging / production)

Objetivo: que puedas cambiar rápido entre entornos sin tocar a mano `.env` ni cometer secretos en git.

Este repo incluye **plantillas**:

- `.env.development.example`
- `.env.staging.example`
- `.env.production.example`

Y un switcher cross-platform:

- `scripts/switch-env.php`

## Flujo recomendado

1) Crea tus archivos reales (con secretos) a partir de las plantillas:

- `.env.development` (local)
- `.env.staging` (preproducción)
- `.env.production` (solo si quieres simular producción localmente)

Estos archivos están ignorados por git (ver `.gitignore`).

2) Cambia el entorno activo copiando el correspondiente a `.env`:

- `composer env:dev`
- `composer env:staging`
- `composer env:prod`

El script hace backup de tu `.env` actual como `.env.backup-YYYYMMDD-HHMMSS`.

3) Arranca normalmente:

- Backend: `php artisan serve --host=127.0.0.1 --port=8000`
- Frontend: `npm run dev`

## Notas prácticas

- Laravel **solo lee** `.env` por defecto. Por eso el switcher copia al archivo `.env`.
- Tras cambiar de `.env`, conviene limpiar caches. Los comandos `composer env:*` ya ejecutan `php artisan config:clear` y `php artisan cache:clear`.

## Staging (cómo usarlo)

- En staging usa `APP_ENV=staging` y `APP_DEBUG=false`.
- Para DB (Neon): usa el **endpoint directo** (sin `-pooler`) para migraciones/DDL.
- Si quieres separar datos, lo más cómodo es crear una **branch DB** en Neon para staging (misma app, otra URL/DB).

## Vite (modo staging opcional)

Si quieres que Vite cargue variables específicas para staging con su mecanismo de `mode`:

- `npm run build:staging`
- `npm run dev:staging`

Esto hace que Vite busque `.env.staging*` (solo para variables `VITE_*`). No afecta a Laravel; Laravel sigue leyendo `.env`.

## Tests

- Ejecutar tests:
	- `php artisan test`
	- o `composer test`
