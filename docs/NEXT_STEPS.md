# Limoneo — Qué falta / siguientes pasos

Este documento es la lista corta y accionable de lo que queda para completar el ciclo **dev → staging → producción**.

## 1) Staging (recomendado antes de tocar pagos live)

- Staging en VPS (ya preparado):
  - Webroot: `/var/www/limoneo-staging/current/public`
  - Nginx vhost: `/etc/nginx/sites-available/limoneo-staging` (habilitado)

Para terminar de “encenderlo”:

- Crear `staging.limoneo.com` en Cloudflare (DNS → A record a `46.224.207.157`).
- Si el navegador muestra `DNS_PROBE_FINISHED_NXDOMAIN`:
  - Confirmación rápida (Windows):
    - `Resolve-DnsName staging.limoneo.com`
  - Si no resuelve, el problema es 100% DNS (no Nginx/Laravel).
  - Crea el `A` record y espera propagación (normalmente minutos; a veces más según TTL).
- Emitir certificado (Let's Encrypt) también para `staging.*`:

  - En el VPS:
    - `certbot --nginx -d staging.limoneo.com`

- Verificar que el vhost sirve Laravel (sin redirects raros) incluso antes de tener DNS:

  - En el VPS:
    - `curl -I -H 'Host: staging.limoneo.com' http://127.0.0.1/`

  Si quieres lanzarlo desde tu máquina (Windows) sin entrar interactivo al VPS:

  - `ssh -i $env:USERPROFILE\.ssh\id_ed25519 root@46.224.207.157 "curl -I -H 'Host: staging.limoneo.com' http://127.0.0.1/"`

  Debe devolver `200/302/500` según la app, pero no un `301` “auto-redirect” al mismo host.

  Nota Windows/PowerShell: si ejecutas comandos SSH desde PowerShell y pegas configs con `$uri`, usa comillas simples para que no se expanda.

  Alternativa más segura (Windows): usar el script del repo que sube el vhost por `scp` y recarga Nginx:

  - `./scripts/vps/push-staging-nginx.ps1`

- Si staging devuelve `500`:

  - En el VPS mira el error real:
    - `tail -n 200 /var/www/limoneo-staging/current/storage/logs/laravel.log`

  - Caso típico (ya ocurrido): `password authentication failed for user ...` → el `DB_URL` de staging tiene password incorrecta o apunta al proyecto/branch equivocado en Neon.
    - Solución: copia el **connection string** correcto desde Neon (mejor una **branch** de staging) y actualiza `DB_URL` en `/var/www/limoneo-staging/current/.env`.
    - Después ejecuta (para que no queden caches viejas):
      - `cd /var/www/limoneo-staging/current`
      - `php artisan config:clear && php artisan cache:clear && php artisan route:clear && php artisan view:clear`
      - `php artisan migrate --force`
      - `php artisan config:cache && php artisan route:cache && php artisan view:cache`
      - `curl -I -H 'Host: staging.limoneo.com' http://127.0.0.1/`

- Usar DB separada:
  - Recomendado: crear una **branch** en Neon para staging.
  - Usar el endpoint **directo** (sin `-pooler`) para migraciones/DDL.
- Configurar `.env` staging con:
  - `APP_ENV=staging`, `APP_DEBUG=false`, `APP_URL=https://staging.limoneo.com`
  - Stripe test + PayPal sandbox
  - Firebase (idealmente proyecto Firebase separado o reglas controladas)

Tras poner `DB_URL` real en el `.env` de staging:

- `cd /var/www/limoneo-staging/current`
- `php artisan migrate --force`
- `php artisan db:seed --force` (si aplica)
- `php artisan config:cache && php artisan route:cache && php artisan view:cache`

## 2) Secrets que faltan en el VPS

- `storage/app/firebase/firebase_credentials.json` (service account)
- Stripe:
  - `STRIPE_KEY`
  - `STRIPE_SECRET`
- PayPal:
  - `PAYPAL_CLIENT_ID`
  - `PAYPAL_CLIENT_SECRET`

## 3) Workers/procesos (según necesidad)

- Siempre: `nginx`, `php8.3-fpm`
- Solo si `QUEUE_CONNECTION != sync`:
  - `limoneo-queue.service` (systemd) con `php artisan queue:work`
- Solo si hay tareas programadas en scheduler:
  - cron para `php artisan schedule:run`

## 4) Deploys (procedimiento base)

- Build en tu máquina/CI: `npm ci`, `npm run build`, `composer install --no-dev --optimize-autoloader`
- Subir release al servidor y activar.
- Ejecutar:
  - `php artisan migrate --force`
  - `php artisan config:cache`
  - `php artisan route:cache`
  - `php artisan view:cache`
- Recargar:
  - `systemctl reload php8.3-fpm`
  - `systemctl reload nginx`
  - reiniciar queue worker si existe

## 5) Dev (local) para pruebas

- Cambiar a entorno local:
  - `composer env:dev`
  - `php artisan key:generate`
- Tests:
  - `php artisan test`

Los tests usan SQLite en memoria (ver `phpunit.xml`) para que no dependan de tu `.env`.
