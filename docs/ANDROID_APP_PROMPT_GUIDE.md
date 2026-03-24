# Limoneo - Documento base para generar la app Android mediante prompts

Ultima actualizacion: 2026-03-17

## 1. Objetivo de este documento

Este documento traduce el estado real del proyecto web a una especificacion util para generar una app Android por fases usando prompts, sin inventar funcionalidades que hoy no existen o que estan parcialmente resueltas.

La idea no es describir Android en abstracto, sino dejar una base operativa para pedirle a una IA que construya una app alineada con Limoneo.

---

## 2. Que proyecto se ha analizado

Base revisada:

- Laravel 11 + Inertia + React
- Storefront ecommerce con catalogo, carrito, checkout, pedidos, perfil, direcciones, admin y promociones
- Auth web con Socialite
- API movil canonica `api/mobile/v1` con Sanctum y capa legacy parcial todavia presente
- i18n activo en `es`, `en`, `fr`

Fuentes principales revisadas:

- `README.md`
- `docs/GUIDE_NEXT_AGENT.md`
- `docs/ENVIRONMENTS.md`
- `docs/i18n.md`
- `legacy/WEB_ROUTES_FORENSIC_AUDIT.md`
- `legacy/WEB_ROUTES_REMEDIATION_2026-03-14.md`
- `routes/web.php`
- `routes/api.php`
- `app/Http/Controllers/CheckoutController.php`
- `app/Http/Controllers/CartController.php`
- `app/Http/Controllers/Api/MobileApiController.php`
- `app/Http/Controllers/Api/MobileV1/*`
- `app/Http/Controllers/Api/SocialAuthController.php`
- `app/Http/Middleware/HandleInertiaRequests.php`
- `app/Http/Middleware/SetApiLocale.php`
- `app/Services/ShoppingCartService.php`

---

## 3. Estado real del negocio digital hoy

### 3.1 Lo que la web ya tiene bien definido

- Home con categorias, productos, campañas y bloques promocionales.
- Catalogo por categorias, busqueda y paginas especiales:
  - deals today
  - superdeals
  - new arrivals
  - seasonal
  - fast shipping
- Detalle de producto.
- Carrito invitado en sesion y carrito autenticado persistente compartido entre web y movil.
- Checkout autenticado.
- Pagos con Stripe Checkout y PayPal.
- Perfil de usuario.
- CRUD de direcciones.
- Dashboard de usuario.
- Historial de pedidos.
- Flujo de cancelaciones y devoluciones.
- Cambio de idioma `es/en/fr`.

### 3.2 Lo que ya existe para movil/API

API real detectada:

- `POST /api/auth/social`
- `GET /auth/mobile/{provider}/redirect`
- `GET /auth/mobile/{provider}/callback`
- `POST /api/mobile/v1/auth/register`
- `POST /api/mobile/v1/auth/login`
- `POST /api/mobile/v1/auth/logout`
- `GET /api/mobile/v1/me`
- `PATCH /api/mobile/v1/me`
- `GET /api/mobile/v1/home`
- `GET /api/mobile/v1/search/suggestions`
- `GET /api/mobile/v1/products`
- `GET /api/mobile/v1/products/{id}`
- `GET /api/mobile/v1/categories`
- `GET /api/mobile/v1/categories/{slug}`
- `GET /api/mobile/v1/special/{collection}`
- `GET /api/mobile/v1/cart`
- `PUT /api/mobile/v1/cart`
- `POST /api/mobile/v1/cart/items`
- `PATCH /api/mobile/v1/cart/items/{lineId}`
- `DELETE /api/mobile/v1/cart/items/{lineId}`
- `GET /api/mobile/v1/addresses`
- `POST /api/mobile/v1/addresses`
- `PATCH /api/mobile/v1/addresses/{id}`
- `PATCH /api/mobile/v1/addresses/{id}/default`
- `DELETE /api/mobile/v1/addresses/{id}`
- `POST /api/mobile/v1/checkout/quote`
- `POST /api/mobile/v1/checkout/coupon`
- `POST /api/mobile/v1/checkout/shipping`
- `POST /api/mobile/v1/checkout/payments/{provider}/session`
- `GET /api/mobile/v1/orders`
- `GET /api/mobile/v1/orders/{id}`
- `POST /api/mobile/v1/orders/{id}/cancel`
- `POST /api/mobile/v1/orders/{id}/refund`
- `POST /api/mobile/v1/orders/{id}/items/{itemId}/cancel`
- `POST /api/mobile/v1/orders/{id}/items/{itemId}/refund`

### 3.3 Lo importante: la capa legacy sigue siendo insuficiente, pero la API canonica ya existe

La app Android no debe generarse tomando `MobileApiController` como contrato final del negocio porque ese controlador es mas simple y mas antiguo que la web actual.

Problemas reales:

- `placeOrder` crea pedidos en estado `confirmado`, mientras la web actual usa validacion real de pago y estados mas coherentes.
- Las direcciones moviles usan un campo simple `address`, mientras la web usa estructura completa:
  - `street`
  - `city`
  - `province`
  - `zip_code`
  - `country`
- Esa capa legacy tampoco refleja el locale stateless ni el carrito autenticado compartido.

Conclusion: la app Android debe apuntar a `api/mobile/v1` y tratar `/api/mobile/*` solo como compatibilidad parcial/historica.

---

## 4. Recomendacion de producto para la app Android

## 4.1 Objetivo realista de V1

Crear una app Android nativa enfocada en experiencia de compra de cliente final, no en administracion.

Scope recomendado para V1:

- onboarding ligero
- login y registro
- login social preparado para Google y Facebook
- home comercial
- categorias
- busqueda
- listado de productos
- detalle de producto
- favoritos opcional si se quiere introducir una mejora movil
- carrito local sincronizable con backend
- seleccion de direccion
- checkout
- pagos externos
- historial de pedidos
- detalle de pedido
- perfil
- gestion de direcciones
- selector de idioma

No incluir en V1:

- admin
- scrapers Python
- logs
- dashboard operativo
- importacion de productos

## 4.2 Enfoque tecnico recomendado

Para prompts de Android, la opcion mas solida es:

- Kotlin
- Jetpack Compose
- Navigation Compose
- MVVM
- Repository pattern
- Retrofit
- Kotlinx Serialization o Moshi
- Coroutines + Flow
- DataStore para token, locale y preferencias
- Coil para imagenes

Si se pide multiplataforma mas adelante, ya se valorara otro stack. Para Android puro, no conviene arrancar con React Native o Flutter solo por velocidad de prompt.

---

## 5. Arquitectura funcional recomendada para la app

## 5.1 Modulos/pantallas

1. Auth
- login
- register
- social login bridge
- persistencia de token Sanctum

2. Home
- banners
- categorias destacadas
- rails promocionales
- accesos a special pages

3. Catalogo
- listado
- filtros
- busqueda
- categoria

4. Producto
- galeria
- precio actual y precio original
- descripcion
- stock
- relacionados
- reviews si el backend se expone

5. Cart
- items
- cantidades
- subtotal
- sincronizacion con backend

6. Checkout
- seleccion o alta de direccion
- cupon
- envio
- resumen
- redireccion a Stripe/PayPal

7. Orders
- listado
- detalle
- cancelar
- solicitar devolucion

8. Profile
- datos de usuario
- direcciones
- idioma
- logout

## 5.2 Estados globales recomendados

- sesion autenticada
- token Sanctum
- locale
- carrito
- conectividad
- errores de API

---

## 6. Mapeo web -> app movil

### 6.1 Fuentes reutilizables directamente

Se pueden reutilizar conceptos y contratos de estas zonas:

- Catalogo y especiales desde `ProductController`
- Checkout real desde `CheckoutController`
- Pedidos desde `OrderController`
- Perfil y direcciones desde `ProfileController` y `AddressController`
- Auth social movil desde `Api/SocialAuthController`
- Idioma desde `LocaleController` y `HandleInertiaRequests`

### 6.2 Lo que hay que exponer como API antes o durante la app

Endpoints canonicos ya disponibles para la app:

- `POST /api/auth/social`
- `POST /api/mobile/v1/auth/register`
- `POST /api/mobile/v1/auth/login`
- `POST /api/mobile/v1/auth/logout`
- `GET /api/mobile/v1/me`
- `PATCH /api/mobile/v1/me`
- `GET /api/mobile/v1/home`
- `GET /api/mobile/v1/search/suggestions`
- `GET /api/mobile/v1/products`
- `GET /api/mobile/v1/products/{id}`
- `GET /api/mobile/v1/categories`
- `GET /api/mobile/v1/categories/{slug}`
- `GET /api/mobile/v1/special/{collection}`
- `GET /api/mobile/v1/cart`
- `PUT /api/mobile/v1/cart`
- `POST /api/mobile/v1/cart/items`
- `PATCH /api/mobile/v1/cart/items/{lineId}`
- `DELETE /api/mobile/v1/cart/items/{lineId}`
- `GET /api/mobile/v1/addresses`
- `POST /api/mobile/v1/addresses`
- `PATCH /api/mobile/v1/addresses/{id}`
- `PATCH /api/mobile/v1/addresses/{id}/default`
- `DELETE /api/mobile/v1/addresses/{id}`
- `POST /api/mobile/v1/checkout/quote`
- `POST /api/mobile/v1/checkout/coupon`
- `POST /api/mobile/v1/checkout/shipping`
- `POST /api/mobile/v1/checkout/payments/{provider}/session`
- `GET /api/mobile/v1/orders`
- `GET /api/mobile/v1/orders/{id}`
- `POST /api/mobile/v1/orders/{id}/cancel`
- `POST /api/mobile/v1/orders/{id}/refund`
- `POST /api/mobile/v1/orders/{id}/items/{itemId}/cancel`
- `POST /api/mobile/v1/orders/{id}/items/{itemId}/refund`

### 6.3 Decision clave de arquitectura

No conviene que la app Android reproduzca la logica web raspando HTML o navegando WebViews como solucion principal. Debe consumir contratos JSON estables.

WebView solo tendria sentido como ultimo fallback excepcional. El flujo principal ya debe asumir hosted checkout + Custom Tabs/deep link contra la API movil canonica.

---

## 7. Gaps que debes asumir en tus prompts

Cuando generes la app, la IA debe saber esto:

1. La web actual es la fuente de verdad del negocio.
2. La API movil canonica ya existe en `api/mobile/v1`, pero la capa legacy sigue siendo parcial.
3. El checkout web y los servicios moviles actuales son mas correctos que `MobileApiController`.
4. La app no debe implementar guest checkout.
5. La app debe usar `es`, `en`, `fr`.
6. La moneda visible actual esta alineada a `EUR`.
7. El pedido no debe marcarse como confirmado sin pago verificado.
8. La app debe soportar login tradicional y social.
9. Aunque el backend ya expone la API movil, la app debe poder arrancar con mocks si el entorno objetivo aun no tiene todos los secretos/proveedores listos.

---

## 8. Prompt maestro recomendado

Usa este prompt como punto de partida cuando quieras generar la app completa o una base grande:

```text
Quiero que construyas una app Android nativa para mi ecommerce Limoneo usando Kotlin y Jetpack Compose.

Contexto del backend:
- El backend real es Laravel 11.
- La web actual es la fuente de verdad funcional.
- Hay login tradicional y login social.
- Para movil usamos Sanctum.
- Idiomas soportados: es, en, fr.
- Moneda visible actual: EUR.
- El checkout real requiere usuario autenticado.
- El pedido no debe crearse como pagado o confirmado sin validacion real del proveedor de pago.

Quiero una arquitectura limpia con:
- Jetpack Compose
- MVVM
- Navigation Compose
- Retrofit
- Coroutines + Flow
- Repository pattern
- DataStore para token y preferencias

Pantallas de V1:
- Splash
- Login
- Registro
- Home
- Categorias
- Busqueda
- Listado de productos
- Detalle de producto
- Carrito
- Checkout
- Direcciones
- Pedidos
- Detalle de pedido
- Perfil
- Ajustes de idioma

Requisitos de implementacion:
- Separa domain, data y presentation.
- Crea modelos DTO y modelos de dominio distintos.
- Usa un ApiResult tipado para exito/error.
- Implementa manejo de token Sanctum.
- Prepara interceptores para Authorization Bearer.
- Diseña el carrito para persistencia local y futura sincronizacion con backend.
- Usa strings.xml preparados para es, en y fr.
- No generes codigo de admin.
- No uses WebView salvo para fallback de pago externo.

Quiero que empieces por crear la estructura completa del proyecto Android, navegacion, temas, networking, manejo de sesion y pantallas placeholder conectadas a viewmodels.
```

---

## 9. Prompts por fase

## Fase 1 - esqueleto del proyecto

```text
Genera la base de una app Android ecommerce en Kotlin + Jetpack Compose con arquitectura MVVM, Navigation Compose, Retrofit, Coroutines y DataStore. Crea modulos o paquetes para auth, home, catalog, product, cart, checkout, orders y profile. No implementes aun UI final compleja; prioriza estructura mantenible.
```

## Fase 2 - autenticacion

```text
Implementa autenticacion con email/password y persistencia de token Sanctum. Prepara tambien un SocialAuthRepository para enviar provider + access_token a /api/auth/social. La app debe recordar la sesion y redirigir automaticamente al usuario autenticado.
```

## Fase 3 - home y catalogo

```text
Implementa Home, categorias, busqueda y listado de productos para un ecommerce. La UI debe estar optimizada para movil, con tarjetas de producto, estados de carga, empty states y manejo de error. Prepara el codigo para consumir endpoints JSON de productos, categorias y secciones especiales.
```

## Fase 4 - detalle de producto y carrito

```text
Implementa la pantalla de detalle de producto con galeria, precio, precio anterior, descripcion, stock, categoria y productos relacionados. Implementa carrito con incremento, decremento, borrado y persistencia local. La arquitectura debe permitir sincronizacion futura con backend.
```

## Fase 5 - checkout

```text
Implementa checkout autenticado para ecommerce con seleccion de direccion, cupon, metodo de envio, resumen y lanzamiento de flujo de pago externo. No asumas guest checkout. Diseña el codigo para Stripe y PayPal como proveedores externos confirmados por backend.
```

## Fase 6 - pedidos y perfil

```text
Implementa historial de pedidos, detalle de pedido, perfil y gestion de direcciones. La app debe permitir ver estados, solicitar cancelacion o devolucion cuando corresponda y editar direcciones del usuario.
```

## Fase 7 - internacionalizacion

```text
Integra internacionalizacion real para es, en y fr en toda la app Android. No hardcodees textos en composables. Usa recursos por idioma y prepara formateo coherente de textos, fechas y moneda.
```

## Fase 8 - endurecimiento tecnico

```text
Refactoriza la app para produccion: manejo consistente de errores, retries prudentes, loading states, validaciones, tests de viewmodels, previews Compose y limpieza de dependencias innecesarias.
```

---

## 10. Prompt para generar primero la API movil que falta

Si antes de la app quieres pedirle a una IA que extienda Laravel para soportar movil correctamente, usa algo de este estilo:

```text
Quiero que adaptes mi backend Laravel ecommerce para exponer una API movil coherente con la web actual.

Condiciones:
- La web actual es la fuente de verdad funcional.
- No quiero duplicar logica de negocio.
- Reutiliza servicios y controladores existentes cuando sea posible.
- La API movil actual es parcial y hay que alinearla con checkout, pedidos, direcciones, catalogo y auth social.
- Usa Sanctum para autenticacion.
- Devuelve JSON consistente, tipado y preparado para Android.

Necesito endpoints moviles para:
- home
- productos
- detalle de producto
- categorias
- especiales/promociones
- perfil
- CRUD completo de direcciones
- pedidos y detalle de pedido
- cancelaciones y devoluciones
- checkout con cupon, envio y pagos

Importante:
- No crees pedidos finales sin pago verificado.
- No mantengas el contrato legacy simplificado de MobileApiController si entra en conflicto con la web.
- Extrae serializers/transformers o recursos API reutilizables.
- Propone tests feature para la nueva API.
```

---

## 11. Criterios de aceptacion para la app

La app Android se puede considerar bien encaminada cuando cumpla esto:

1. El usuario puede autenticarse y mantener sesion.
2. El catalogo se puede recorrer sin depender de WebViews.
3. El detalle de producto, carrito y checkout respetan la logica real del backend.
4. Las direcciones usan el mismo modelo rico que la web.
5. Los pedidos reflejan estados reales del sistema.
6. La app soporta `es`, `en`, `fr`.
7. La app esta pensada para crecer sin reescribir toda la base.

---

## 12. Recomendacion final de ejecucion

Orden recomendado:

1. definir y cerrar la API movil correcta
2. generar esqueleto Android
3. implementar auth y sesion
4. implementar catalogo y producto
5. implementar carrito
6. implementar checkout
7. implementar pedidos y perfil
8. cerrar i18n, QA y endurecimiento

Si intentas generar la app completa en un solo prompt, la IA tendera a inventar contratos o a simplificar el checkout. En este proyecto eso seria un error.

La forma correcta es generar por bloques, validando cada fase contra el backend real.
