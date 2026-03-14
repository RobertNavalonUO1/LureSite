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
	- suite focalizada principal: `composer test:critical`
	- verificación del dataset QA: `composer test:qa-dataset`

## Dataset QA local

Para preparar un entorno local con datos amplios para pruebas manuales:

- `composer qa:refresh`
  - hace `migrate:fresh` y carga el seeder `Database\\Seeders\\QaDatasetSeeder`
- `composer seed:qa`
  - reinyecta el dataset QA sobre una base ya migrada

El dataset QA está pensado para desarrollo/local y deja usuarios, direcciones, catálogo, staging temporal, cupones, banners, pedidos por estado, devoluciones y transacciones fallidas con volumen suficiente para validar flujos reales.

Detalle y credenciales: ver [docs/QA_DATASET.md](docs/QA_DATASET.md).

## Ver SQLite local en VS Code (desarrollo)

En local (dev) este proyecto usa SQLite por defecto.
El fichero es:

- `database/database.sqlite`

### Opción A (recomendada): SQLTools

1) Instala extensiones:

- `SQLTools`
- `SQLTools SQLite` (driver)

2) Crea una conexión SQLite apuntando a:

- `${workspaceFolder}/database/database.sqlite`

Nota: esto funciona bien si abres como workspace la carpeta raíz del proyecto (la que contiene `artisan`, `app/`, `database/`).

### Opción B: Database Client (ruta absoluta)

Algunas extensiones tipo “Database Client” no expanden `${workspaceFolder}` dentro del path de SQLite.
Si ves errores donde intenta abrir literalmente `${workspaceFolder}/...`, usa una ruta absoluta al archivo, por ejemplo:

- `C:\Users\<TU_USUARIO>\Desktop\webdrop\All\database\database.sqlite`
