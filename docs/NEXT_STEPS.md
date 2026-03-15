# Limoneo — Próximos pasos

Última actualización: 2026-03-15

Este documento resume el estado operativo actual del proyecto y define los siguientes pasos recomendados. Debe servir como punto de continuidad para cualquier agente o desarrollador que retome el trabajo sin necesidad de depender de la conversación previa.

La intención de este archivo no es documentar todo el proyecto, sino dejar claro:
- qué se ha cerrado recientemente,
- qué está en curso,
- qué orden conviene seguir ahora,
- qué bloques ya no deben reabrirse salvo regresión real,
- y qué pendientes externos al código siguen existiendo.

Si alguna tarea necesita más contexto o detalle arquitectónico, ampliar en:
- [docs/GUIDE_NEXT_AGENT.md](docs/GUIDE_NEXT_AGENT.md)
- [README.md](README.md)

---

## 1. Estado actual del proyecto

### 1.1. Hecho recientemente

Durante el último bloque se cerraron dos frentes relevantes del backend funcional:

- Endurecimiento real de `routes/web.php` y flujos asociados:
  - protección de rutas internas de producto/migración,
  - ownership de pedidos en `/orders/{order}`,
  - checkout/success con verificación real de Stripe y captura PayPal,
  - direcciones alineadas con su API JSON,
  - formulario de contacto con `throttle`,
  - ruta `/test` limitada a local.
- Normalización del área admin y postventa:
  - rutas destructivas migradas a `DELETE`,
  - transiciones de estado migradas a `PATCH`,
  - bloqueo de auto-democión y del último admin,
  - workflow administrativo de devoluciones completo: aprobar, rechazar y reembolsar.
- Limpieza residual del admin ya iniciada:
  - eliminado el componente huérfano `AdminOrders.jsx`,
  - formularios de alta en categorías, banners y cupones alineados con navegación Inertia.
- Cobertura de regresión ampliada y validada:
  - suite focalizada verde con `24 tests` y `104 assertions`.
- Saneado operativo complementario:
  - eliminación de BOM UTF-8 que estaba rompiendo PHP runtime en varios archivos,
  - corrección del runtime de `AddressController`.
- Completado técnico inicial del storefront público:
  - implementados `GET /api/new-arrivals` y `GET /api/seasonal-products`,
  - normalizado el payload de `deals-today`, `superdeals` y `fast-shipping`,
  - moneda visible alineada con la divisa operativa del checkout (`USD`),
  - limpieza del copy más claramente placeholder en catálogo/promociones,
  - validación focalizada adicional verde con `8 tests` y `46 assertions`.
- Preparado dataset QA dedicado para pruebas manuales de extremo a extremo:
  - seeder `Database\\Seeders\\QaDatasetSeeder`,
  - comandos `composer qa:refresh`, `composer seed:qa`, `composer test:qa-dataset`,
  - volumen suficiente en usuarios, direcciones, catálogo, pedidos por estado, devoluciones, fallos de pago y staging temporal.
- API móvil canónica y soporte Android:
  - implementado `api/mobile/v1` para auth, catálogo, carrito, checkout, direcciones y pedidos,
  - `Accept-Language` stateless mediante `SetApiLocale`,
  - carrito autenticado compartido entre web y móvil vía `ShoppingCartService` + `cart_items`,
  - test dedicado `MobileApiV1Test`,
  - smoke command `mobile:checkout-sandbox-smoke` listo a falta de secretos sandbox/live.

Esto vuelve a mover la prioridad del proyecto: la base crítica de postventa y la base móvil ya existen. El siguiente bloque debe centrarse en release/deploy limpio, validación real de pagos, copy/i18n residual y la deuda admin/refund que sigue viva.

---

## 2. Principio de trabajo para el siguiente bloque

El siguiente tramo debe consolidar lo que ya está implementado en backend antes de abrir otra ola de UI o tooling.

Orden recomendado:
1. decidir cuándo pasar producción de Stripe test / PayPal sandbox a credenciales live,
2. mantener deploy por release limpio y repetir smoke real tras cada cambio de entorno,
3. reescribir copy/i18n residual del storefront,
4. alinear cualquier pantalla admin o flujo legacy que todavía no use el contrato REST nuevo,
5. endurecer la operativa del refund real,
6. después retomar el endurecimiento de importación Python.

Importante:
- No conviene mezclar pagos/reembolsos con refactor Python en el mismo paso.
- No conviene reabrir sticky/catalog salvo síntoma visual concreto.
- No conviene dejar estados de devolución ambiguos entre UI, admin y proveedor de pago.

---

## 3. Trabajo activo

Actualmente hay seis líneas vivas, con prioridad distinta.

### 3.1. Fase inmediata — Release limpio y pagos reales

La prioridad inmediata ya no es diseñar otra API móvil, sino cerrar la transición de pagos no-live a live cuando negocio lo autorice y mantener el release limpio ya implantado.

Pendiente revisar:
- paso planificado de Stripe test / PayPal sandbox a live,
- repetición de `php artisan mobile:checkout-sandbox-smoke` o validación equivalente cuando cambien secretos,
- verificación de `api/mobile/v1` y carrito compartido en entorno real tras cada release,
- monitorización básica post-deploy.

Ya cerrado en esta línea:
- `FAQ`, `Terms`, `Privacy` y `Contact` reescritas con contexto operativo real,
- `About` ajustada para eliminar copy demasiado genérico,
- header/footer actualizados para eliminar promociones, teléfonos, correos y redes de relleno,
- landing `Universe` con mensaje visible y CTAs coherentes en vez de quedar como una escena sin contexto.

### 3.2. Fase corta — Copy e i18n residual

Pendiente revisar:
- banners y fallbacks de marketing todavía demasiado genéricos en algunos bloques secundarios,
- texto residual de catálogo/storefront que todavía suene a demo o plantilla,
- incoherencias editoriales o de i18n en componentes revisados de forma parcial.

### 3.3. Fase corta — Limpieza de admin legacy y contrato REST

Todavía pueden quedar pantallas o acciones heredadas que no usan el contrato nuevo de `DELETE` y `PATCH`.

Pendiente revisar:
- vistas admin no principales o duplicadas,
- formularios legacy que sigan enviando `POST` a rutas ya migradas,
- consistencia de mensajes flash y confirmaciones en todas las mutaciones admin,
- posibles tests faltantes para recursos admin distintos de categorías.

### 3.4. Fase corta — Endurecimiento operativo del refund

La integración real con proveedor ya existe en la app, pero todavía conviene endurecer su operativa.

Pendiente revisar:
- política de reintento cuando Stripe/PayPal fallen temporalmente,
- validación de secretos por entorno más allá del mínimo actual,
- observabilidad y logs útiles para conciliación,
- posibilidad de exponer en admin el último error de refund o un estado de reintento.

### 3.5. Fase siguiente — Endurecimiento de herramientas de importación Python

Una vez cerrada la postventa, la mejor deuda técnica siguiente sigue siendo el bloque Python.

Fragilidades conocidas:
- `PythonScriptController` mezcla un binario embebido con `python` del PATH,
- `storage/app/temp_input.html` sigue siendo un recurso fijo compartido,
- la ejecución interna todavía depende demasiado del entorno local.

Dirección recomendada:
- criterio único para resolver Python,
- archivos temporales por ejecución,
- contrato de entrada/salida más estable para scripts e importación.

### 3.6. Vigilancia de regresión — Storefront, UTF-8 y API móvil

No es el frente principal ahora mismo, pero conviene mantener vigilancia ligera sobre:
- sticky stack y navegación real del storefront,
- regresiones de mojibake tras cambios amplios,
- coherencia visual de estados de pedido en páginas de usuario,
- consistencia de `api/mobile/v1` frente al contrato documentado.

---

## 4. Orden recomendado de ejecución

Para evitar dispersión, el siguiente agente o desarrollador debería seguir este orden.

### Bloque 1 — Completar contenido público creíble

Objetivo:
cerrar la distancia entre rutas ya funcionales y contenido todavía genérico o de plantilla.

Checklist mínimo:
- reescribir `FAQ`, `Terms`, `Privacy` y `Contact` con contexto real,
- revisar `SidebarBanners`, `AutumnShowcase` y otros fallbacks editoriales,
- mantener coherencia de tono entre catálogo, promociones y páginas estáticas.

Definition of done:
- las páginas públicas principales enlazan a contenido real y consistente,
- no quedan placeholders evidentes en la navegación principal.

### Bloque 2 — Limpieza REST/admin residual

Objetivo:
eliminar restos de semántica legacy tras la migración principal.

Checklist mínimo:
- revisar pantallas admin duplicadas o antiguas,
- buscar formularios `POST` que apunten a rutas ya migradas,
- asegurar confirmaciones y flash coherentes,
- añadir pruebas donde falte cobertura de recursos admin.

Definition of done:
- no quedan consumidores activos del contrato admin antiguo,
- las rutas y la UI hablan el mismo verbo y el mismo estado de negocio.

### Bloque 3 — Endurecimiento operativo del refund

Objetivo:
hacer más robusto el refund real ya integrado.

Checklist mínimo:
- revisar reintentos y tratamiento de fallos temporales,
- validar configuración `sandbox/live` por entorno,
- mejorar trazabilidad y mensajes operativos,
- decidir si hace falta exponer error/estado de refund en admin.

Definition of done:
- el refund real deja rastro suficiente para soporte,
- el fallo del proveedor no degrada el estado del pedido a un falso positivo.

### Bloque 4 — Refactor de importación Python

Objetivo:
eliminar ambigüedad de ejecución y riesgo de concurrencia en herramientas de importación.

Definition of done:
- criterio único para Python,
- sin fichero temporal compartido,
- flujo actual de importación mantenido.

### Bloque 5 — Vigilancia ligera de storefront/UTF-8

Objetivo:
evitar regresiones mientras avanzan backend y tooling.

Definition of done:
- sin regresiones visuales evidentes en storefront,
- sin nuevos casos reales de mojibake en código propio.

---

## 5. Qué no debería reabrirse ahora

Salvo regresión concreta, estos bloques no deberían volver a convertirse en frente principal:

### 5.1. Repetir la remediación base de `web.php`
La pasada principal ya está hecha y cubierta por una suite focalizada.
Solo reabrir si aparece un endpoint nuevo o una regresión real.

### 5.2. Sticky stack y filtros como iniciativa principal
Su validación sigue siendo útil, pero ya no es el cuello de botella principal del proyecto.

### 5.3. Saneado UTF-8 como campaña amplia
Mantenerlo como control de regresión; no volver a convertirlo en programa de trabajo salvo evidencia real.

---

## 6. Infra pendiente fuera del código

Todavía queda una pieza operativa externa que no pertenece directamente al código, pero sigue siendo relevante:

- Crear el DNS de `staging.limoneo.com` en Cloudflare si todavía no resuelve públicamente.
- Repetir smoke test externo una vez exista el registro y resuelva correctamente.

Este punto no bloquea por sí solo el trabajo del storefront local, pero sí sigue pendiente como parte de la continuidad de staging.

---

## 7. Criterio de cierre del bloque actual

Este tramo puede darse por correctamente cerrado cuando se cumpla todo lo siguiente:

- README, handoff y remediación reflejan el estado real de rutas, admin y postventa;
- el refund real contra proveedor queda definido o implementado con trazabilidad suficiente;
- las rutas especiales públicas operan con datos reales y moneda coherente;
- no quedan consumidores activos del contrato admin antiguo;
- el bloque Python queda identificado con un plan técnico claro o, idealmente, resuelto;
- el siguiente agente puede continuar solo con este documento y la documentación enlazada, sin depender de historial conversacional.

---

## 8. Riesgos conocidos a vigilar

Aunque el bloque reciente ha cerrado bastante superficie, todavía conviene vigilar tres riesgos concretos:

### 8.1. Operativa incompleta del refund
La app ya integra el refund real y registra trazas mínimas, pero aún puede faltar estrategia de reintento, conciliación y visibilidad operativa.

### 8.2. Copy público aún genérico en páginas estáticas
Las rutas especiales ya tienen datos reales, pero siguen quedando páginas públicas con tono de plantilla o demasiado genérico.

### 8.3. Restos de UI/admin legacy
Una pantalla o formulario antiguo puede seguir apuntando al contrato previo y romper la coherencia de la experiencia admin.

### 8.4. Fragilidad operativa en importación Python
Mientras siga existiendo mezcla de intérprete y fichero temporal fijo, el sistema conserva una deuda técnica real.

---

## 9. Resumen ejecutivo para el siguiente agente

Situación actual:
- backend crítico endurecido,
- admin destructivo migrado a REST semántico,
- refund real básico integrado con Stripe/PayPal, con audit trail en `orders`, idempotencia inicial y logging,
- rutas especiales públicas ya conectadas a datos reales y moneda alineada con checkout,
- suite focalizada verde,
- pendiente rematar páginas estáticas/legal/copy residual y endurecer más la operativa del refund.

Prioridad inmediata:
1. revisar copy residual en bloques secundarios del storefront y campañas menos visibles;
2. barrer pantallas/forms admin que aún puedan hablar el contrato antiguo;
3. endurecer reintentos, observabilidad y validación por entorno del refund;
4. después volver al endurecimiento de importación Python.

Evitar:
- reabrir arquitectura de filtros sin bug concreto,
- volver a convertir UTF-8 en el frente principal,
- mezclar limpieza admin/refund con refactor Python en la misma intervención.

---

## 10. Referencias útiles

- [docs/GUIDE_NEXT_AGENT.md](docs/GUIDE_NEXT_AGENT.md)
- [README.md](README.md)

Si el trabajo siguiente toca i18n, storefront o patrón de filtros, tomar siempre como base el estado actual unificado y no una implementación anterior aislada.
