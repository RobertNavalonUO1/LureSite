# Limoneo - Checklist manual QA

Ultima actualizacion: 2026-03-15

Este documento convierte el dataset QA en un recorrido manual repetible. El objetivo no es "probar un poco", sino recorrer los apartados con una base poblada y registrar rapido si el flujo funciona, si rompe o si comunica un estado incorrecto.

## 1. Preparacion minima

Antes de empezar:

1. Ejecuta `composer qa:refresh` si quieres una base local limpia y totalmente alineada con el dataset QA.
2. Inicia el entorno local:
   - `php artisan serve --host=127.0.0.1 --port=8000`
   - `npm run dev`
3. Abre `http://127.0.0.1:8000`.
4. Verifica que el locale, el header y el top nav cargan sin errores visuales graves.

## 2. Credenciales recomendadas

### 2.1 Admin principal

- email: `admin@limoneo.com`
- password: `admin123`

### 2.2 Admin secundario

- email: `qa.admin@limoneo.test`
- password: `password123`

### 2.3 Usuario cliente base para smoke

- email: `qa.user001@limoneo.test`
- password: `password123`

## 3. Criterios de aprobacion rapida

Marca un bloque como correcto cuando se cumplan estas reglas:

- la pagina carga sin error 500 ni pantalla vacia,
- el contenido visible corresponde al modulo esperado,
- no hay textos rotos o llaves i18n visibles,
- las acciones principales responden con feedback coherente,
- los listados no aparecen vacios cuando el dataset deberia poblarlos,
- no hay regresiones evidentes de layout en desktop.

## 4. Smoke publico

Ejecutar sin login:

1. `/`
   - validar header, top nav, rail de categorias, grid de productos y carrito visible,
   - probar cambio de idioma `ES/EN/FR`,
   - abrir al menos una tarjeta de producto.
2. `/search`
   - buscar por una palabra comun,
   - cambiar orden,
   - activar categoria y rango de precio,
   - comprobar que el panel de filtros responde en desktop.
3. `/new-arrivals`
   - validar que hay productos marcados como novedades,
   - revisar que hay precio, badge y CTA.
4. `/seasonal`
   - validar que la pagina no esta vacia y que muestra productos de temporada.
5. `/fast-shipping`
   - comprobar que la lista muestra productos con copy y CTA coherentes.
6. `/deals/today`
   - comprobar que hay ofertas, precio actual y precio anterior cuando aplica.
7. `/superdeal`
   - validar hero, cards y carga de datos sin placeholders rotos.
8. `/about`, `/contact`, `/faq`, `/terms`, `/privacy`, `/cookies`
   - revisar copy, layout compartido y footer.

## 5. Smoke cliente autenticado

Inicia sesion con `qa.user001@limoneo.test` / `password123`.

### 5.1 Dashboard y perfil

1. `/dashboard`
   - validar resumen de pedidos,
   - comprobar accesos rapidos,
   - confirmar que el carrito o pedidos recientes no estan vacios de forma incoherente.
2. `/profile`
   - revisar avatar por defecto,
   - editar nombre o telefono y guardar,
   - abrir modal de direcciones,
   - crear, editar y marcar una direccion como predeterminada,
   - eliminar una direccion que no sea la unica restante,
   - confirmar toasts y validacion inline.

### 5.2 Pedidos y postventa

1. `/orders`
   - verificar que existe historial suficiente,
   - abrir varios pedidos con estados distintos.
2. `/orders/shipped`
   - comprobar que aparecen pedidos en transito o equivalentes al scope actual.
3. `/orders/paid`
   - validar pedidos pagados y estados posteriores coherentes.
4. `/orders/cancelled`
   - revisar cancelados, devoluciones aprobadas o reembolsados.
5. Detalle de pedido:
   - abrir un pedido `entregado` o `confirmado`,
   - revisar lineas, direccion, estado y metadatos visibles.
6. Postventa:
   - si el estado lo permite, solicitar cancelacion o devolucion,
   - comprobar feedback y cambio de estado visible.

### 5.3 Carrito y checkout

1. Añadir productos desde `/` o desde una pagina especial.
2. Abrir `/cart`.
   - incrementar y decrementar cantidades,
   - eliminar una linea,
   - comprobar que el mini-cart/header se mantiene sincronizado.
3. Abrir `/checkout`.
   - verificar direccion seleccionada,
   - aplicar un cupon QA,
   - cambiar metodo de envio,
   - revisar resumen y CTA de pago.
4. No completar un pago real en smoke general si el entorno apunta a proveedores reales.

## 6. Smoke admin

Cerrar sesion e iniciar con `admin@limoneo.com` / `admin123`.

### 6.1 Dashboard y operativa general

1. `/admin/dashboard`
   - validar KPIs,
   - comprobar metricas de devolucion/reembolso si estan visibles,
   - revisar alertas o bloques de actividad.
2. `/admin/users`
   - verificar volumen de usuarios,
   - confirmar que hay admins y clientes QA,
   - no ejecutar cambios de privilegio salvo prueba controlada.
3. `/admin/products`
   - revisar listado, categoria, precio y acciones.
4. `/admin/categories`
   - validar listado con volumen alto.
5. `/admin/banners`
   - comprobar banners QA de la campaña `qa-dataset`.
6. `/admin/coupons`
   - verificar cupones QA y estructura de campos.
7. `/admin/reviews`
   - validar que el dataset ha poblado reviews.
8. `/admin/logs`
   - abrir solo para comprobar que la vista responde; no es necesaria una inspeccion exhaustiva en cada pasada.

### 6.2 Pedidos y workflow postventa

1. `/admin/orders`
   - filtrar o localizar ejemplos de estos estados:
     - `pendiente_pago`
     - `pagado`
     - `enviado`
     - `devolucion_solicitada`
     - `devolucion_aprobada`
     - `reembolsado`
     - `fallido`
2. Validar acciones de administracion segun estado:
   - cancelar un pedido cancelable,
   - marcar enviado,
   - marcar entregado,
   - aprobar una devolucion solicitada,
   - rechazar una devolucion solicitada,
   - procesar un reembolso sobre una devolucion aprobada.
3. Tras cada accion:
   - confirmar mensaje de exito o error,
   - recargar la vista,
   - revisar que el estado final es coherente.

## 7. Smoke de staging e importacion interna

Estas rutas solo tienen sentido con admin:

1. `/migrate-products`
   - validar que hay temporales cargados,
   - revisar que la vista no aparece vacia.
2. `/link-aggregator`
   - comprobar que la pagina carga,
   - revisar selector de scripts y panel de entrada/salida,
   - no ejecutar scraping real salvo prueba intencionada.

## 8. Casos a registrar como incidencia directa

Abre incidencia inmediata si aparece cualquiera de estos casos:

- una ruta protegida responde sin auth o sin rol correcto,
- un pedido de otro usuario es visible desde cuenta cliente,
- una accion admin destructiva cambia estado sin feedback,
- un refund deja el pedido en estado final incoherente,
- el checkout pierde direccion, cupon o envio al refrescar,
- el mini-cart/header deja de sincronizar con `/cart`,
- aparecen textos con mojibake o llaves i18n sin resolver,
- un bloque que el dataset promete poblar aparece vacio de forma sistematica.

## 9. Recorrido minimo recomendado por pasada

Si no hay tiempo para una verificacion completa, usar este minimo:

1. Publico: `/`, `/search`, `/new-arrivals`, `/fast-shipping`.
2. Cliente: login QA, `/dashboard`, `/profile`, `/orders`, `/checkout`.
3. Admin: login admin, `/admin/dashboard`, `/admin/orders`, `/admin/users`, `/migrate-products`.

## 10. Comandos de apoyo

Durante la validacion manual, estos comandos son los mas utiles:

```bash
composer qa:refresh
composer seed:qa
composer test:qa-dataset
composer test:critical
```

Si el objetivo es comprobar que la base local sigue alineada con la checklist, empezar por `composer qa:refresh`.