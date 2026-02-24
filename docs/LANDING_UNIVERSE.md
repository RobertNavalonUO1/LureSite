# Landing “universo + limón” (modo mantenimiento)

Objetivo: mientras el sitio real se termina, en **producción** (www.limoneo.com) servir **una única página** con:

- Fondo “universo” con estrellas.
- Un modelo 3D `.glb` (limón) que rota suavemente y reacciona al movimiento del ratón.
- Sin eliminar el resto del sitio: se activa/desactiva con una variable de entorno.

---

## Qué es Three.js, React Three Fiber y Drei

- **Three.js** (`three`): librería base de WebGL para renderizar 3D en el navegador.
- **React Three Fiber** (`@react-three/fiber`): un *renderer* de React para Three.js.
  - En vez de crear escenas/cámaras/luces a mano con imperativo, montas la escena como componentes React (`<Canvas>`, `<mesh>`, etc.).
  - La animación se hace con `useFrame(...)` (un “tick” por frame).
- **Drei** (`@react-three/drei`): un conjunto de componentes/utilidades “de conveniencia” para React Three Fiber.
  - Ejemplos que usamos aquí: `Stars` (campo de estrellas) y `useGLTF` (cargar modelos `.glb/.gltf`).

---

## Archivos añadidos / usados

- Página Inertia/React:
  - [resources/js/Pages/Landing/Universe.jsx](../resources/js/Pages/Landing/Universe.jsx)
- Flag de configuración:
  - [config/landing.php](../config/landing.php)
- Toggle en plantilla de producción:
  - [.env.production.example](../.env.production.example)

### Modelo 3D

Actualmente el modelo está en:

- `public/images/models/lemon.glb`

La página lo carga desde:

- `/images/models/lemon.glb`

Si decides moverlo a `public/models/lemon.glb`, cambia la constante `LEMON_GLB_URL` en `Universe.jsx`.

---

## Activar / desactivar en producción (lo más simple)

El comportamiento está en [routes/web.php](../routes/web.php):

- Si `APP_ENV=production` **y** `LANDING_ONLY=true` → **solo** se registra una ruta “catch-all” que sirve `Landing/Universe`.
- Si `LANDING_ONLY=false` → se registran todas las rutas normales del sitio.

### Activar

En el `.env` del VPS (producción):

```env
LANDING_ONLY=true
```

Luego, en el VPS (carpeta del release actual):

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Desactivar (volver al sitio normal)

```env
LANDING_ONLY=false
```

Y recache:

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## Punto 4 — Deploy (procedimiento mínimo)

1) Subir el código (release/rsync/git pull según tu flujo).
2) Instalar deps backend si cambian:

```bash
composer install --no-dev --optimize-autoloader
```

3) Instalar deps frontend y compilar (si cambian assets):

```bash
npm ci
npm run build
```

4) Activar/desactivar el modo con `LANDING_ONLY` (ver arriba).
5) Recache Laravel:

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## Punto 5 — Verificación rápida / troubleshooting

- Ver que el `.glb` se sirve:
  - `https://www.limoneo.com/images/models/lemon.glb` (debe descargar / devolver 200)

- Si ves 500 en producción:

```bash
tail -n 200 storage/logs/laravel.log
```

- Si cambia el flag y “no hace efecto”:
  - revisa que `LANDING_ONLY` esté en el `.env` correcto
  - ejecuta `php artisan config:cache` (imprescindible si tienes config cache)
