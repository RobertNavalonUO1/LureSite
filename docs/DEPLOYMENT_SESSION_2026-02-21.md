# Limoneo — bitácora de despliegue (2026-02-21)

Este documento resume **todo lo realizado**, los **comandos principales** usados y los **problemas** encontrados durante el despliegue de Limoneo.

> Nota de seguridad: se han **redactado secretos** (passwords, tokens, claves). Si necesitas el valor real, debe vivir solo en el `.env` del VPS / gestores de secretos.

## Contexto

- Dominio: `limoneo.com` (Dynadot)
- CDN/DNS: Cloudflare (proxy)
- VPS: Hetzner CX23 — `46.224.207.157` (Ubuntu 24.04)
- App: Laravel + Inertia/React + Vite
- DB: Neon Postgres (`neondb`) con SSL

## Objetivo final

- Servir `https://limoneo.com` correctamente.
- Nginx + PHP-FPM 8.3 en el origin.
- Conexión estable a Neon.
- `php artisan migrate --force` + `php artisan db:seed --force`.

## Resumen ejecutivo (estado final)

- HTTPS origin operativo con Let's Encrypt.
- Cloudflare HTTPS respondiendo `200`.
- Laravel conecta a Neon (migraciones completadas).
- La web responde `HTTP 200`.

## Línea temporal (high level)

1. Diagnóstico Cloudflare `521` (origin sin 443/cert).
2. Creación de webroot y vhost Nginx + emisión Let's Encrypt.
3. Hardening SSH (bots): UFW rate-limit + Fail2ban + ajuste `MaxStartups`.
4. Instalación PHP 8.3 FPM + configuración Nginx para Laravel.
5. Despliegue “plan B”: empaquetado local `.tgz` → subida VPS → `composer install --no-dev` + `npm ci` + `npm run build`.
6. Fixes de runtime: permisos de `storage/`, falta de `config/view.php`.
7. Fix DB Neon: `DB_URL`/credenciales/puerto y switch a endpoint directo (sin `-pooler`).
8. Fix migraciones Postgres: `enum()->change()` incompatible.

## Comandos (principales)

### DNS/HTTP/HTTPS (local)

```powershell
Resolve-DnsName limoneo.com
curl.exe -I http://limoneo.com
curl.exe -I https://limoneo.com
```

### Nginx + Let's Encrypt (VPS)

```bash
# sitio nginx
sudo mkdir -p /var/www/limoneo/current/public

# (edición de /etc/nginx/sites-available/limoneo)
sudo nginx -t
sudo systemctl reload nginx

# certbot
sudo certbot --nginx -d limoneo.com -d www.limoneo.com
sudo systemctl status nginx
```

### Hardening SSH (UFW + Fail2ban + sshd)

```bash
sudo ufw status
sudo ufw limit OpenSSH
sudo systemctl enable --now fail2ban
sudo fail2ban-client status sshd

# Ajuste recomendado (ejemplo):
sudoedit /etc/ssh/sshd_config
# MaxStartups 50:30:100
sudo systemctl reload ssh
```

En esta sesión se añadió también allow explícito para la IP de trabajo (para evitar cortes en despliegues):

```bash
sudo ufw insert 1 allow from <TU_IP_PUBLICA> to any port 22 proto tcp
sudo ufw status numbered
```

### PHP 8.3 FPM (VPS)

```bash
sudo apt update
sudo apt install -y php8.3-fpm php8.3-cli php8.3-mbstring php8.3-xml php8.3-curl php8.3-zip php8.3-pgsql
sudo systemctl enable --now php8.3-fpm
```

### Deploy app (VPS)

```bash
cd /var/www/limoneo/current

composer install --no-dev --optimize-autoloader
npm ci
npm run build

php artisan key:generate
php artisan config:cache
php artisan route:cache
php artisan view:cache

sudo chown -R www-data:www-data storage bootstrap/cache
```

### DB Neon (VPS)

Se terminó usando endpoint directo (sin pooler) por compatibilidad con migraciones.

```dotenv
DB_CONNECTION=pgsql
DB_PORT=5432
DB_URL=postgresql://neondb_owner:<REDACTED_PASSWORD>@<NEON_HOST>:5432/neondb?sslmode=require
```

Migraciones + seed:

```bash
php artisan migrate --force
php artisan db:seed --force
```

## Problemas encontrados y soluciones

### 1) Cloudflare `521` en HTTPS

- **Síntoma**: HTTP OK, HTTPS fallaba (Cloudflare 521).
- **Causa**: el origin no escuchaba en `:443` y/o no tenía certificado.
- **Solución**: vhost Nginx + `certbot --nginx`.

### 2) SSH rechazado (`Exceeded MaxStartups` / cortes KEX)

- **Síntoma**: `kex_exchange_identification` / `banner exchange` / cierres de conexión.
- **Causa**: bots + rate-limit/ban.
- **Solución**: UFW `limit`, Fail2ban `sshd`, aumento `MaxStartups`, y allow explícito para IP de deploy.

### 3) `500` por permisos de logs

- **Síntoma**: `Permission denied` en `storage/logs/laravel.log`.
- **Solución**: `chown -R www-data:www-data storage bootstrap/cache`.

### 4) `500` por cache/views (faltaba `config/view.php`)

- **Síntoma**: `View path not found` / `Please provide a valid cache path`.
- **Causa**: faltaba archivo de config.
- **Solución**: añadir `config/view.php` al repo + redeploy + recache.

### 5) Error DB Neon (auth/URL/puerto)

- **Síntoma**: `password authentication failed`.
- **Causa**: password placeholder o mal configurado.
- **Solución**: actualizar `DB_URL` con credenciales reales.

Además se detectó un caso donde, al no tener puerto explícito, el driver acababa construyendo DSNs inválidos. Se fijó con `DB_PORT=5432` y `:5432` en el `DB_URL`.

### 6) Migración incompatible con Postgres (`enum()->change()`)

- **Síntoma**: `syntax error at or near "check"` en `2025_09_25_000000_update_orders_status_enum`.
- **Causa**: `enum()->change()` genera SQL válido para MySQL, pero no para Postgres.
- **Solución**: modificar las migraciones para `pgsql` usando `CHECK CONSTRAINT` con `DB::statement`.

Archivos ajustados:

- `database/migrations/2025_09_25_000000_update_orders_status_enum.php`
- `database/migrations/2025_09_30_000010_update_orders_status_add_cancelacion_pendiente.php`

### 7) Seeders fallando por Faker ausente en producción

- **Síntoma**: `Class "Faker\Factory" not found` y `undefined function ... fake()`.
- **Causa**: en producción se usa `composer install --no-dev` y Faker suele estar en `require-dev`.
- **Solución aplicada**: hacer seeders “prod-safe”: si Faker no existe, siembran mínimo o hacen `return`.

Seeders ajustados:

- `database/seeders/UsersTableSeeder.php`
- `database/seeders/AddressesTableSeeder.php`
- `database/seeders/ProductDetailsSeeder.php`
- `database/seeders/ReviewsSeeder.php`
- `database/seeders/OrdersTableSeeder.php`
- `database/seeders/OrderSeeder.php`

## Siguientes pasos sugeridos

Checklist actualizado de pendientes: ver [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md).

1. Subir `storage/app/firebase/firebase_credentials.json` al VPS si se quiere login con Firebase en producción.
2. Configurar variables de pago (Stripe/PayPal) en `.env`.
3. Decidir si en prod se quieren datos fake (instalar Faker en `require`) o solo seed mínimo.

## Estado actual (actualizado 2026-02-21)

- Staging:
	- Se creó y habilitó el vhost `/etc/nginx/sites-available/limoneo-staging` y se aplicó desde el repo.
	- Se detectó y eliminó un symlink fantasma `limoneo-staging\r` que provocaba un `conflicting server name` en Nginx; el script `scripts/vps/push-staging-nginx.ps1` fue parcheado para eliminar cualquier `limoneo-staging*` antes de crear el symlink (auto-fix para casos CRLF desde Windows).
	- El `DB_URL` de staging fue actualizado con la cadena proporcionada para la rama `staging`. Se hizo backup de `.env`, se limpiaron caches (`php artisan config:clear && php artisan cache:clear && php artisan route:clear && php artisan view:clear`) y se reconstruyeron caches (`php artisan config:cache && php artisan route:cache && php artisan view:cache`).
	- DB (staging): seed ejecutado con `php artisan db:seed --force` (ok). Migraciones: en esta sesión no había migraciones pendientes.
	- Salud del vhost (sin depender de DNS): desde el **VPS** el host virtual responde cuando se fuerza el header `Host`.
		- Comando en el VPS: `curl -I -H 'Host: staging.limoneo.com' http://127.0.0.1/`
		- Comando desde Windows (ejemplo): `ssh root@46.224.207.157 "curl -I -H 'Host: staging.limoneo.com' http://127.0.0.1/"`
	- Acceso público por dominio: actualmente, si tu navegador muestra `DNS_PROBE_FINISHED_NXDOMAIN` para `staging.limoneo.com`, **no es un problema de Laravel/Nginx**, sino que falta el registro DNS.
		- Pendiente en Cloudflare: crear `A` `staging` → `46.224.207.157` (opcional: inicialmente “DNS only” para emitir el cert).
		- Pendiente en el VPS: emitir certificado con `certbot --nginx -d staging.limoneo.com` una vez el DNS resuelva.
	- Recomendación Neon: usar endpoint **directo** (sin `-pooler`) para migraciones/DDL; el pooler se puede dejar para tráfico web si se desea.

- Desarrollo (local):
	- El repo incluye el switcher de entornos (`scripts/switch-env.php`) y plantillas `.env.*.example`. Puedes activar el entorno local con `composer env:dev` y los comandos de la docs; por tanto el entorno de desarrollo está habilitado y listo para uso local.

- Producción:
	- Origin (VPS) con Nginx + PHP-FPM 8.3 y Let's Encrypt está operativo; Cloudflare responde con `200` y las migraciones de producción se han ejecutado durante la sesión de despliegue según el runbook.
	- (Opcional) Modo “en construcción” (landing universo + limón 3D):
		- Se activa con `LANDING_ONLY=true` en el `.env` de producción.
		- Al activarlo, en `APP_ENV=production` la app registra **solo** una ruta que sirve la página `Landing/Universe` (sin borrar el resto del sitio).
		- Tras cambiar el flag: `php artisan config:cache && php artisan route:cache && php artisan view:cache`.
		- Documentación: ver [docs/LANDING_UNIVERSE.md](docs/LANDING_UNIVERSE.md).

Si quieres, puedo dejar preparado el `A` record de `staging` en Cloudflare (solo puedo guiarte, no tengo acceso a tu cuenta) y luego ejecutar el `certbot` en el VPS.

---

## Nota posterior (actualizado 2026-03-02)

Se ha añadido documentación de handoff para el siguiente bloque de features:

- Guía de arranque (próximo agente): [docs/GUIDE_NEXT_AGENT.md](docs/GUIDE_NEXT_AGENT.md)
- Roadmap resumido: [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md)

Pendientes funcionales destacados:

- Migración de auth: pasar de Firebase a Socialite (Google/Facebook) y definir flujo móvil con Sanctum.
- Multiidioma `es/en/fr` y corrección de acentos/mojibake (estandarizar ficheros a UTF-8 y reescribir literales corruptos).
- Importación manual de productos desde scrapers Python → `temporary_products` → migración a `products`.
