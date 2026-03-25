# Remediacion aplicada sobre web.php y flujos asociados

Fecha: 2026-03-14

Addendum 2026-03-15:

- Como continuacion de esta remediacion, el proyecto ya incorpora:
  - `ShoppingCartService` para unificar carrito web y movil
  - persistencia de carrito autenticado en `cart_items`
  - `api/mobile/v1` como contrato movil canonico
  - `SetApiLocale` para locale stateless por header en API movil
- Este documento sigue siendo valido para la remediacion de `web.php`, pero ya no describe por si solo el estado completo del repo.

## Cambios implementados

- Se protegieron con `auth` + `admin` las rutas internas de alta, seleccion, staging y migracion de productos.
- Se exigio autenticacion para crear reviews públicas.
- Se aplicó `throttle` al formulario público de contacto.
- Se eliminó la ruta pública de guest checkout para evitar una funcionalidad parcial e inconsistente.
- Se limitó la ruta de prueba `/test` al entorno local.

## Pedidos y checkout

- `GET /orders/{order}` ahora valida ownership y deja de exponer pedidos de otros usuarios autenticados.
- El flujo de `checkout/success` dejó de confiar solo en marcadores de sesión:
  - Stripe valida el `session_id` devuelto por Checkout y exige `payment_status = paid`.
  - PayPal captura la orden aprobada antes de persistir el pedido.
- Los pagos solo aceptan `address_id` perteneciente al usuario autenticado.
- Los pedidos creados tras pago confirmado pasan a estado `pagado` en lugar de `confirmado`.
- Se ajustaron scopes y helpers del modelo `Order` para que `paid`, `shipped`, `canBeCancelled` e `isRefundable` sean coherentes con el flujo actual.
- La solicitud de devolución del usuario pasa a `devolucion_solicitada` y deja de marcar el pedido como `reembolsado` de forma inmediata.

## Perfil y direcciones

- `Profile/EditProfile` ahora consume el contrato real entregado por `ProfileController` y `ProfileService`.
- Se eliminaron del formulario de perfil los campos que no se persistían realmente.
- El CRUD de direcciones en perfil quedó alineado con la API JSON actual:
  - `POST /addresses`
  - `PATCH /addresses/{address}`
  - `PATCH /addresses/{address}/default`
  - `DELETE /addresses/{address}`
- Se añadió control explícito para marcar dirección predeterminada desde la UI.
- El modal de direcciones del checkout también quedó alineado con la API JSON y ya no depende de redirects Inertia incompatibles.

## Admin

- `toggle-admin` ahora bloquea:
  - la auto-democión del administrador actual
  - la eliminación del último administrador activo
- Las mutaciones administrativas destructivas o de cambio de estado dejaron de usar `POST` genérico y pasan a verbos más fieles al contrato:
  - `DELETE` para productos, categorías, banners, reviews y cupones
  - `PATCH` para transiciones de pedidos y cambio de privilegios admin
- Se retiró el componente admin huérfano que seguía intentando mutar pedidos con `POST` legacy fuera del flujo activo.
- Las altas admin de categorías, banners y cupones quedaron alineadas con navegación Inertia en lugar de formularios HTML raw.
- `settings/update` dejó de aceptar claves arbitrarias.
- La configuración quedó restringida a claves permitidas del dominio de campañas:
  - `campaign.mode`
  - `campaign.manual_slug`
- La UI de ajustes fue simplificada para reflejar únicamente esas claves soportadas.
- La UI de usuarios añade confirmación antes de cambiar privilegios.
- La UI administrativa de pedidos ahora expone acciones explícitas para:
  - cancelar pedidos
  - marcar envío y entrega
  - aprobar devoluciones
  - rechazar devoluciones
  - procesar reembolsos

## Devoluciones y reembolsos

- Se completó el circuito administrativo de postventa para pedidos con estado `devolucion_solicitada`.
- El flujo queda ahora así:
  - el usuario solicita la devolución desde un pedido elegible
  - admin aprueba o rechaza la devolución
  - solo una devolución aprobada puede pasar a `reembolsado`
- El reembolso administrativo ya intenta ejecutarse contra el proveedor de pago antes de marcar el pedido como `reembolsado`.
- El pedido conserva trazabilidad mínima del refund:
  - `payment_reference_id`
  - `refund_reference_id`
  - `refunded_at`
  - `refund_error`
- El refund incorpora ahora una primera capa de endurecimiento operativo:
  - idempotencia básica para no reprocesar un refund ya registrado
  - validación explícita de `PAYPAL_MODE`
  - logging de intento, éxito y fallo para soporte
- El estado `devolucion_rechazada` ya queda visible en los listados del usuario.
- La sección de pedidos pagados deja de mostrar un falso segundo paso de “solicitar reembolso” cuando la devolución ya fue aprobada: ese último paso ahora pertenece a administración.

## Contacto

- Se corrigió la importación de `ContactConfirmation` en `ContactController`, evitando el fallo runtime al enviar el formulario.

## Cobertura añadida

Se añadieron pruebas para:

- protección de rutas internas de producto/migración
- restricción de creación de reviews a usuarios autenticados
- ownership de pedidos
- API JSON de direcciones
- endurecimiento de admin settings
- bloqueo de auto-democión y último admin
- borrado administrativo mediante rutas `DELETE`
- aprobación, rechazo y reembolso del nuevo workflow de devoluciones

Resultado de la validación focalizada tras esta fase:

- `24 tests` pasando
- `104 assertions`
- warnings pendientes solo por metadata antigua de PHPUnit en tests no modificados funcionalmente

## Decisiones aún abiertas

- Endurecer la operativa del refund real: reintentos, observabilidad y validación por entorno.
- Barrer posibles pantallas o formularios admin legacy que todavía puedan hablar el contrato antiguo de `POST`.
- Convertir tests antiguos con metadata en doc-comments a atributos de PHPUnit antes de PHPUnit 12.
- La home y varias páginas promocionales siguen arrastrando deuda de consistencia de datos no abordada en esta iteración.
