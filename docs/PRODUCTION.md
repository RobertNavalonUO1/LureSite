# Estrategia de paso a producción y despliegue (Limoneo)

Este documento describe una estrategia completa —práctica y realista— para pasar el proyecto a producción y alojarlo públicamente.

Checklist corto de pendientes: ver [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md).

## Estado actual (lo ya hecho)

Hasta ahora, ya está creada la base de infraestructura. En orden lógico:

### Dominio (Dynadot)

- Se compró `limoneo.com` en Dynadot.

### VPS (Hetzner Cloud)

- Servidor creado:
  - Plan: CX23 (Shared Resources)
  - Recursos: 2 vCPU, 4 GB RAM, 40 GB disco
  - Nombre: `limoneo-prod-1`
  - Ubicación: Nuremberg (Alemania)
  - IP pública IPv4: `46.224.207.157`

### Acceso SSH (Windows → VPS)

- Se generó una clave SSH en Windows:
  - Privada: `C:\Users\TZL\.ssh\id_ed25519` (NO se comparte)
  - Pública: `C:\Users\TZL\.ssh\id_ed25519.pub`
- Se añadió la clave pública a Hetzner (corrigiendo el formato a una sola línea).

### Base de datos (Neon / Postgres)

- Proyecto creado/configurado en Neon, región Frankfurt (`eu-central-1`).
- DB: `neondb`
- Usuario/rol: `neondb_owner`
- Endpoints (recomendación práctica):
  - **Directo (sin pooler)**: úsalo para migraciones/DDL
    - Host: `ep-round-unit-alr8cr3l.c-3.eu-central-1.aws.neon.tech`
    - SSL requerido: `sslmode=require`
  - **Pooler**: útil para tráfico web (opcional)
    - Host: `ep-round-unit-alr8cr3l-pooler.c-3.eu-central-1.aws.neon.tech`
    - SSL requerido: `sslmode=require`

Nota importante (Neon):

- Para tareas de **DDL/migraciones** (`php artisan migrate`) se ha comprobado que es más robusto usar el **endpoint directo** (sin `-pooler`).
- El pooler es útil para tráfico web, pero puede dar problemas con determinadas migraciones/alteraciones.

### Cloudflare (activo)

- Cloudflare está activo para `limoneo.com`.
- HTTPS vía Cloudflare responde sin errores.

### Origin (VPS) sirviendo HTTPS

- Nginx configurado con Let's Encrypt (certbot) en el origin.
- PHP-FPM 8.3 instalado y configurado para Laravel.

### Bitácora

- Detalle completo de comandos/problemas/resoluciones: ver [docs/DEPLOYMENT_SESSION_2026-02-21.md](docs/DEPLOYMENT_SESSION_2026-02-21.md).

---

## Lo que falta (siguiente bloque)

Pendiente (operativo) para dar por “cerrado” el ciclo dev → staging → prod:

- **Staging real**: levantar `staging.limoneo.com` (vhost + HTTPS + deploy separado) con DB separada (ideal: branch Neon).
- **Secrets definitivos en servidor**:
  - Stripe (test en staging, live en prod)
  - PayPal (sandbox en staging, live en prod)
  - Firebase service account en `storage/app/firebase/firebase_credentials.json`
- **Decidir colas/scheduler**:
  - Si `QUEUE_CONNECTION=sync` → no necesitas worker.
  - Si `QUEUE_CONNECTION=database|redis` → necesitas `queue:work` como servicio.
  - Si usas `schedule()` en Laravel → necesitas cron (Paso 16).
- **Observabilidad/backups**:
  - Rotación de logs + alertas (Sentry recomendado)
  - Backups DB (Neon) y de `storage/app` si hay ficheros.

Está escrito para este repo: **Laravel 11 + Inertia.js + React + Vite**, con:

- Carrito en **session**
- Auth actual con Google/Facebook vía **Firebase (frontend)** y sesión **Laravel (backend)**
- Auth objetivo: migrar a **Socialite** y retirar Firebase (ver [docs/GUIDE_NEXT_AGENT.md](docs/GUIDE_NEXT_AGENT.md))
- Checkout con **Stripe** y **PayPal**
- Endpoints JSON `/api/*` consumidos desde páginas React

Guía de arranque del siguiente bloque (features): [docs/GUIDE_NEXT_AGENT.md](docs/GUIDE_NEXT_AGENT.md).

> Alcance
>
+> - “Producción” aquí significa: `APP_ENV=production`, `APP_DEBUG=false`, assets compilados con Vite, servidor web (Nginx/Apache) apuntando a `public/`, procesos de colas/scheduler gestionados, secretos fuera de git, y observabilidad básica.
+> - Este documento no asume un proveedor concreto, pero incluye recetas listas para:
+>   - VPS (Nginx + PHP-FPM)
+>   - Laravel Forge / Ploi (sobre VPS)
+>   - PaaS tipo Render/Fly.io (con matices)

---

## 0) Resumen ejecutivo (lo que hay que hacer)

1. Crear **staging** idéntico a producción (misma clase de infraestructura).

  - Gestión de `.env` por entorno (switch rápido): ver [docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md).
2. Definir **secrets**/variables de entorno (Stripe/PayPal/Firebase/DB/etc.).
3. Montar CI/CD con pasos: **build** → **deploy** → **migrate** → **cache**.
4. Activar HTTPS, hardening básico y logging seguro.
5. Ensayar rollback.
6. Abrir producción y monitorizar.

---

## 0.1) Runbook (comandos) para crear la plataforma de producción

Los pasos abajo están pensados para un VPS Ubuntu típico en Hetzner.
Si no estás seguro de la versión, primero ejecuta:

```bash
cat /etc/os-release
```

### Paso 1 — Entrar por SSH

Desde Windows (PowerShell):

```powershell
ssh -i $env:USERPROFILE\.ssh\id_ed25519 root@46.224.207.157
```

Si te pide confirmar fingerprint, acepta una vez.

### Paso 2 — Actualizar el sistema

```bash
apt update
apt -y upgrade
apt -y install unzip git ca-certificates curl ufw
```

### Paso 3 — Firewall básico (UFW)

Permite SSH + HTTP/HTTPS:

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status
```

### Paso 4 — Crear usuario de deploy (recomendado)

```bash
adduser deploy
usermod -aG sudo deploy
```

Opcional: permitir que `deploy` use SSH (copiando authorized_keys de root):

```bash
rsync --archive --chown=deploy:deploy /root/.ssh /home/deploy/
```

### Paso 5 — Instalar Nginx + PHP-FPM + extensiones

Laravel suele necesitar estas extensiones:

```bash
apt -y install nginx
apt -y install php-fpm php-cli php-mbstring php-xml php-curl php-zip php-gd php-bcmath
apt -y install php-pgsql
systemctl enable --now nginx
systemctl enable --now php*-fpm
```

Confirma versión PHP:

```bash
php -v
```

### Paso 6 — Instalar Composer (si no está)

```bash
command -v composer || (
  curl -sS https://getcomposer.org/installer | php
  mv composer.phar /usr/local/bin/composer
)
composer --version
```

### Paso 7 — Preparar carpeta del sitio

Usaremos el path recomendado del doc:

```bash
mkdir -p /var/www/limoneo
chown -R deploy:deploy /var/www/limoneo
```

### Paso 8 — Obtener el código (2 opciones)

**Opción A (recomendada): usar GitHub Deploy Key**

1) En el VPS, como `deploy`, genera una clave:

```bash
sudo -iu deploy
ssh-keygen -t ed25519 -C "deploy@limoneo" -f ~/.ssh/id_ed25519
cat ~/.ssh/id_ed25519.pub
```

2) Añade esa pública como *Deploy key* (read-only) en GitHub.

3) Clona el repo:

```bash
cd /var/www/limoneo
git clone git@github.com:RobertNavalonUO1/LureSite.git current
cd current
git checkout main
```

**Opción B: descargar un zip release (sin git)**

- Útil si el repo es privado y no quieres configurar keys. Subes el zip y descomprimes en `/var/www/limoneo/current`.

### Paso 9 — Instalar dependencias (producción)

En el VPS (como `deploy` dentro de `/var/www/limoneo/current`):

```bash
composer install --no-dev --optimize-autoloader
```

### Paso 10 — `.env` de producción (Neon + App)

Crear `.env` (no lo subas a git):

```bash
cp .env.example .env
php artisan key:generate
```

Config mínimo recomendado (ejemplo).

Recomendación: usa `DB_URL` y el **endpoint directo** (sin `-pooler`) para ejecutar migraciones.

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://limoneo.com

DB_CONNECTION=pgsql
DB_URL=postgresql://neondb_owner:***@ep-round-unit-alr8cr3l.c-3.eu-central-1.aws.neon.tech:5432/neondb?sslmode=require
```

Notas:

- Neon exige SSL. Mantén `sslmode=require`.
- En producción, evita `SESSION_DRIVER=database`. Recomendación: Redis (Upstash u otro).

### Paso 11 — Permisos Laravel

```bash
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

### Paso 12 — Nginx server block

Crear `/etc/nginx/sites-available/limoneo`:

```nginx
server {
  listen 80;
  server_name limoneo.com www.limoneo.com;

  root /var/www/limoneo/current/public;
  index index.php;

  location / {
    try_files $uri $uri/ /index.php?$query_string;
  }

  location ~ \.php$ {
    include snippets/fastcgi-php.conf;
    fastcgi_pass unix:/run/php/php8.3-fpm.sock;
  }
}
```

Habilitar y recargar:

```bash
ln -s /etc/nginx/sites-available/limoneo /etc/nginx/sites-enabled/limoneo
nginx -t
systemctl reload nginx
```

Si tu socket PHP-FPM no coincide, ajústalo con `ls /run/php/`.

### Paso 13 — Migraciones + caches

```bash
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Paso 14 — SSL (cuando DNS ya apunte al VPS)

**Let’s Encrypt (certbot)**:

```bash
apt -y install certbot python3-certbot-nginx
certbot --nginx -d limoneo.com -d www.limoneo.com
```

En Cloudflare:

- SSL/TLS mode: `Full (strict)`

### Paso 15 — Queue worker (systemd)

Crear `/etc/systemd/system/limoneo-queue.service`:

```ini
[Unit]
Description=Limoneo Queue Worker
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/limoneo/current
ExecStart=/usr/bin/php artisan queue:work --tries=1
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Activar:

```bash
systemctl daemon-reload
systemctl enable --now limoneo-queue
systemctl status limoneo-queue --no-pager
```

### Paso 16 — Scheduler (cron)

```bash
crontab -u www-data -e
```

Añadir:

```cron
* * * * * cd /var/www/limoneo/current && /usr/bin/php artisan schedule:run >> /dev/null 2>&1
```

---

## 0.2) Cloudflare: DNS mínimo recomendado

Con Cloudflare activo, el DNS mínimo recomendado es:

- `A` @ → `46.224.207.157`
- `A` www → `46.224.207.157`

Opcional:

- En Cloudflare, proxied (nube naranja) para `@` y `www`.
- Ajustar TTL a auto.

---

## 1) Arquitectura objetivo

### 1.1 Componentes

- **Reverse proxy / web server**: Nginx (recomendado) o Apache.
- **PHP runtime**: PHP-FPM (con Nginx) o Apache + PHP.
- **App**: Laravel (código del repo).
- **Assets**: Vite compila a `public/build/`.
- **DB**: MySQL o PostgreSQL recomendados en prod.
- **Cache/Queue**: Redis recomendado.
- **Storage**: `storage/` con permisos; `public/storage` vía `storage:link`.

### 1.2 Flujo de petición

- **Páginas Inertia**: servidor responde `Inertia::render(...)` → frontend React se resuelve por Vite.
- **APIs JSON**: `/api/*` se consumen desde páginas Special y otros módulos.
- **Auth Firebase**:
  - El frontend obtiene un `id_token` (Firebase JS SDK).
  - Backend valida token con `FirebaseAuthService` y crea sesión Laravel.

---

## 2) Requisitos de producción (checklist)

### 2.1 Variables críticas `.env`

Asegura:

- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL=https://tudominio.com`
- `APP_KEY=...` (generada una vez; secreto)
- (Opcional) `LANDING_ONLY=true` para servir solo una página “en construcción” (ver [docs/LANDING_UNIVERSE.md](docs/LANDING_UNIVERSE.md)).

**DB** (recomendado: MySQL/Postgres):

- `DB_CONNECTION=mysql` (o `pgsql`)
- Para Neon, se recomienda usar `DB_URL` (incluye `sslmode=require`).
- Alternativa válida: `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`.

Nota Neon: para migraciones/DDL suele ser mejor el endpoint directo (sin `-pooler`).

---

## Deploys: cómo actualizar staging/prod

Procedimiento recomendado (misma idea para staging y producción):

1) Build en tu máquina/CI:

```bash
npm ci
npm run build
composer install --no-dev --optimize-autoloader
```

2) Subir el release al VPS (zip/tar o git). Si usas el layout con symlink `current`:

- Descomprimir en `releases/<timestamp>`
- Apuntar `current` al nuevo release

3) En el VPS, dentro del nuevo `current`:

```bash
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

4) Reiniciar procesos (según aplique):

```bash
systemctl reload php8.3-fpm
systemctl reload nginx
systemctl restart limoneo-queue || true
```

Si no usas queue worker, no necesitas el `limoneo-queue`.

---

## Workers/procesos: qué necesitas realmente

- **Siempre**: `nginx` + `php8.3-fpm`
- **Solo si usas colas asíncronas** (`QUEUE_CONNECTION` distinto de `sync`):
  - `php artisan queue:work` como service (systemd)
- **Solo si tu app usa scheduler** (`app/Console/Kernel.php` tiene tareas):
  - cron `* * * * * php artisan schedule:run`

**Stripe**:

- `STRIPE_KEY=...`
- `STRIPE_SECRET=...`

**PayPal**:

- `PAYPAL_CLIENT_ID=...`
- `PAYPAL_CLIENT_SECRET=...`

**Firebase Admin** (backend):

- Colocar `storage/app/firebase/firebase_credentials.json` (secreto) en el servidor.
- SSL: nunca usar `FIREBASE_HTTP_VERIFY=false` en prod.

**Sesiones/colas/cache** (recomendado):

- `SESSION_DRIVER=redis`
- `QUEUE_CONNECTION=redis`
- `CACHE_STORE=redis`

> Nota: en `.env.example` el proyecto usa `database` para sesión/colas/cache. Funciona, pero en producción Redis suele ser más robusto.

### 2.2 Permisos

- `storage/` y `bootstrap/cache/` deben ser escribibles por el usuario del proceso PHP.

### 2.3 Seguridad (mínimo)

- TLS/HTTPS con Let’s Encrypt.
- `APP_DEBUG=false`.
- Rate limiting en endpoints sensibles (login, checkout).
- No loguear tokens, sesiones completas o PII innecesaria.
- Configurar CORS solo si se sirve desde dominios diferentes.

---

## 3) Estrategia de entornos: dev → staging → prod

### 3.1 Desarrollo

- Vite en `:5173`
- Laravel en `:8000`
- `.env` local

### 3.2 Staging (obligatorio si hay pagos/auth)

Objetivo: reproducir producción lo más posible.

- Dominio: `staging.tudominio.com`
- HTTPS activo
- DB separada de prod
- Stripe/PayPal en modo **sandbox/test**
- Firebase project separado o reglas controladas

Staging en VPS (layout recomendado):

- Webroot: `/var/www/limoneo-staging/current/public`
- Nginx vhost: `/etc/nginx/sites-available/limoneo-staging`
- SSL (una vez el DNS apunte al VPS): `certbot --nginx -d staging.limoneo.com`

Ejemplo de vhost **HTTP** para staging (antes de tener DNS/SSL):

```nginx
server {
  listen 80;
  listen [::]:80;

  server_name staging.limoneo.com;

  root /var/www/limoneo-staging/current/public;
  index index.php;

  # ACME challenge (certbot)
  location ^~ /.well-known/acme-challenge/ {
    allow all;
    default_type text/plain;
    root /var/www/limoneo-staging/current/public;
  }

  location / {
    try_files $uri $uri/ /index.php?$query_string;
  }

  location ~ \.php$ {
    include snippets/fastcgi-php.conf;
    fastcgi_pass unix:/run/php/php8.3-fpm.sock;
  }

  location ~ /\. {
    deny all;
  }
}
```

Validación rápida (en el VPS, sin DNS):

```bash
nginx -t && systemctl reload nginx
curl -I -H 'Host: staging.limoneo.com' http://127.0.0.1/
```

Nota Windows/PowerShell: si envías configs por SSH pegando un heredoc desde PowerShell, **PowerShell expande** variables tipo `$uri`. Usa comillas simples alrededor del comando remoto o (más robusto) sube el archivo con `scp`/WinSCP.

En este repo hay un helper para evitar el problema de expansión y aplicar el vhost por `scp`:

```powershell
./scripts/vps/push-staging-nginx.ps1
```

Si en algún momento el SSH al VPS empieza a dar `Connection reset` / `kex_exchange_identification`, suele ser por rate-limit/ban (UFW/F2B). En ese caso, entra por consola (Hetzner) y revisa/desbanea:

```bash
fail2ban-client status
fail2ban-client status sshd
fail2ban-client set sshd unbanip <TU_IP_PUBLICA>
ufw status numbered
```

### 3.3 Producción

- Dominio final
- Configuración LIVE de pagos
- Observabilidad activa
- Backups automáticos

---

## 4) Pipeline CI/CD recomendado

### 4.1 Fases

**Fase A — Build (CI)**

1) Instalar deps PHP:

```bash
composer install --no-dev --optimize-autoloader
```

2) Instalar deps Node:

```bash
npm ci
```

3) Build Vite:

```bash
npm run build
```

4) (Opcional) Checks:

- `php artisan test`
- `npm run lint` (si lo añadís)

**Fase B — Deploy (CD)**

- Subir release a servidor
- Escribir `.env` desde secrets
- Migraciones:

```bash
php artisan migrate --force
```

- Optimización:

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

- Reinicio:
  - recarga PHP-FPM
  - (si aplica) reinicio queue workers

### 4.2 Releases y rollback

Recomendación: estrategia “releases” (tipo Capistrano / Deployer):

- `releases/<timestamp>`
- symlink `current` apunta al release activo

Rollback:

- cambiar symlink `current` al release anterior
- recargar PHP-FPM

**Importante**: las migraciones deben ser backward-compatible si quieres rollback rápido.

---

## 5) Opción 1: VPS con Nginx + PHP-FPM (receta)

### 5.1 Paquetes base (Ubuntu ejemplo)

- Nginx
- PHP 8.3 + extensiones típicas (pdo, mbstring, curl, openssl, xml, sqlite/mysql/pgsql)
- Composer
- Node (solo si compilas en el servidor; recomendado compilar en CI)
- Redis (si lo usas)

### 5.2 Config Nginx (ejemplo)

Archivo `/etc/nginx/sites-available/limoneo`:

```nginx
server {
  listen 80;
  server_name tudominio.com;

  root /var/www/limoneo/current/public;
  index index.php;

  location / {
    try_files $uri $uri/ /index.php?$query_string;
  }

  location ~ \.php$ {
    include snippets/fastcgi-php.conf;
    fastcgi_pass unix:/run/php/php8.3-fpm.sock;
  }

  location ~* \.(?:css|js|jpg|jpeg|gif|png|svg|ico|webp)$ {
    expires 30d;
    access_log off;
    add_header Cache-Control "public";
  }
}
```

Luego habilitar site y recargar:

```bash
ln -s /etc/nginx/sites-available/limoneo /etc/nginx/sites-enabled/limoneo
nginx -t
systemctl reload nginx
```

### 5.3 HTTPS

Con certbot:

```bash
certbot --nginx -d tudominio.com -d www.tudominio.com
```

---

## 6) Opción 2: Laravel Forge / Ploi

Recomendado si quieres ir rápido y mantener buenas prácticas sin montar todo a mano.

- Provisiona servidor
- Configura Nginx, PHP-FPM, SSL
- Gestiona deploy desde GitHub
- Configura queue workers

Checklist:

- Build assets en CI o en el propio Forge (preferible CI si el proyecto crece)
- Variables `.env` como secrets
- Hook post-deploy:
  - `php artisan migrate --force`
  - `php artisan optimize` (o caches por separado)

---

## 7) Opción 3: PaaS (Render/Fly.io)

Puede funcionar, pero hay que asegurar:

- Persistencia de `storage/` (volúmenes) o usar S3.
- Workers para queue.
- Scheduler (cron) o equivalente.

Para este tipo de app, Forge+VPS suele ser el camino más simple.

---

## 8) Operación: colas, scheduler, logs y backups

### 8.1 Queue worker

Ejemplo con systemd:

- Servicio `limoneo-queue.service`:

```ini
[Unit]
Description=Limoneo Queue Worker
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/limoneo/current
ExecStart=/usr/bin/php artisan queue:work --tries=1
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

### 8.2 Scheduler

Cron:

```cron
* * * * * cd /var/www/limoneo/current && /usr/bin/php artisan schedule:run >> /dev/null 2>&1
```

### 8.3 Logs

- Centralizar errores (Sentry recomendado).
- Rotación de logs.

### 8.4 Backups

- Backups DB automáticos.
- Backups de `storage/app` si hay archivos de usuario.

---

## 9) Consideraciones específicas del proyecto

### 9.1 Auth Firebase (backend)

- Asegurar el archivo:
  - `storage/app/firebase/firebase_credentials.json`

- Revisar SSL/certs:
  - No desactivar SSL en producción.

- Recomendación hardening:
  - Rate limit a `POST /auth/firebase`.
  - No registrar `id_token` en logs.

### 9.2 Checkout Stripe / PayPal

- Staging usa Stripe test + PayPal sandbox.
- Producción usa credenciales live.
- Validar callbacks/redirects (success/cancel) contra `APP_URL` correcto.

### 9.3 Session driver

- En dev puede ser `database`.
- En prod: `redis` para evitar cuellos de botella y mejorar fiabilidad.

---

## 10) Plan de migración a producción (pasos)

1) Elegir hosting (recomendado: VPS + Forge).
2) Provisionar staging (HTTPS + DB + Redis).
3) Configurar CI (build) + CD (deploy).
4) Configurar secrets `.env` y credenciales.
5) Deploy a staging.
6) QA:
   - Login Firebase
   - Home + categorías sticky
   - Special pages (DealsToday/SuperDeal)
   - Checkout Stripe/PayPal (test)
7) Deploy a producción.
8) Verificación post-release:
   - Logs de errores
   - Compra real mínima (importe pequeño)
   - Performance básico

---

## 11) Apéndice: comandos útiles

### 11.1 Modo producción local (simulación)

```bash
npm run build
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan serve
```

### 11.2 Diagnóstico

- `php artisan about`
- `php artisan env`
- `php artisan optimize:clear`

---

## 12) Próximas mejoras recomendadas (opcional)

- Añadir rate-limiting explícito para login Firebase y endpoints de checkout.
- Añadir Sentry.
- Mover assets de imágenes a S3 si se espera volumen.
- Revisar `PythonScriptController` para ejecutar el Python embebido de forma explícita.
