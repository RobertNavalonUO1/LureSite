# Android Agent Sync Prompt

Last updated: 2026-03-16

Use the prompt below as the canonical instruction block for the Android Studio agent that must synchronize the Android app with the real Laravel backend.

## Copy-paste prompt

```text
Quiero que audites y sincronices mi app Android con mi web ecommerce real.

Trabaja sobre el proyecto Android que tienes abierto en Android Studio. No inventes backend alternativo. La web Laravel ya tiene una API movil canonica implementada y debes adaptarte a ella.

Contexto obligatorio:
- La fuente de verdad del negocio es la web Laravel.
- La API movil canonica usa `api/mobile/v1`.
- Social login usa `POST /api/auth/social`.
- El contrato backend esta documentado en:
  - `webdrop/All/docs/MOBILE_API_ANDROID_SPEC.md`
  - `webdrop/All/docs/ANDROID_WEB_SYNC_MATRIX.md`
  - `webdrop/All/docs/ANDROID_APP_PROMPT_GUIDE.md`
- La matriz `ANDROID_WEB_SYNC_MATRIX.md` manda sobre prioridades de sincronizacion.

Reglas no negociables:
- No uses endpoints legacy `/api/mobile/*` como fuente principal.
- No inventes DTOs distintos a los del backend real.
- No inventes checkout local.
- La app nunca marca un pedido como exitoso por decision del cliente.
- El pago se hace por `checkout_url` devuelta por backend.
- El retorno del pago entra por deep link y luego la app refresca el pedido desde backend.
- El locale movil es stateless por `Accept-Language: es|en|fr`.
- No uses un modelo de direccion plano tipo `address: String` si el backend usa campos estructurados.

Tu trabajo exacto es este:

1. Audita la app Android real
- Lista todos los endpoints que usa hoy.
- Lista todos los DTOs remotos actuales.
- Lista todos los repositorios remotos actuales.
- Detecta cualquier uso de:
  - `/api/mobile/*` legacy
  - modelos fake no alineados
  - errores no mapeados
  - deep links incompletos
  - checkout local incorrecto

2. Cruza la app contra la matriz oficial
- Usa `webdrop/All/docs/ANDROID_WEB_SYNC_MATRIX.md` como checklist.
- Recorre cada fila y marca:
  - `implementado y verificado`
  - `implementado pero desalineado`
  - `faltante`
- No saltes filas P0.

3. Sincroniza la app con el backend real
- Cambia todos los endpoints remotos para usar:
  - `api/mobile/v1` para auth, catalogo, cart, checkout, orders, profile y addresses
  - `POST /api/auth/social` para social login
- Ajusta DTOs para respetar:
  - envelope `{ data, meta }`
  - errores `422 { message, errors }`
  - errores de negocio/autorizacion `4xx { message, code }`
- Ajusta idioma para:
  - enviar `Accept-Language`
  - leer `Content-Language`
- Ajusta carrito para:
  - guest cart local
  - merge guest -> auth con `PUT /api/mobile/v1/cart`
  - refresh remoto tras login
  - limpieza correcta tras logout
  - lectura de `warnings`
- Ajusta checkout para:
  - quote
  - coupon
  - shipping
  - payment session
  - launcher externo con `checkout_url`
  - deep link return
  - refresh de pedido post pago
- Ajusta orders para:
  - list
  - detail
  - cancel
  - refund
  - acciones por linea si la UI las soporta
- Ajusta profile/addresses para:
  - me
  - update profile
  - list/create/update/delete/default address

4. Valida comportamiento real
- Asegura que la app compile.
- Ejecuta el flujo minimo real:
  - session restore
  - login
  - cart sync
  - checkout quote
  - payment launch
  - deep link parsing
  - order refresh
- Si algo no puede validarse por entorno, dejalo explicitamente documentado.

5. Añade o corrige tests Android
- error mapping
- session restore
- guest cart merge
- logout/login refresh
- deep link parsing
- order refresh post payment

6. Devuelveme el resultado en este formato exacto

Seccion 1. Resumen ejecutivo
- que estaba alineado
- que estaba desalineado
- que cambiaste
- que sigue pendiente

Seccion 2. Matriz final
Una tabla con estas columnas:
- area
- pantalla/feature
- endpoint backend
- estado anterior
- cambio hecho
- estado final
- pendiente

Seccion 3. Cambios tecnicos
- archivos modificados
- repositorios/DTOs tocados
- contratos ajustados
- tests añadidos o corregidos

Seccion 4. Riesgos abiertos
- cualquier gap real que siga bloqueando el 100% de sincronizacion

Prioridad obligatoria:
1. P0 de la matriz
2. P1 de la matriz
3. refinamientos visuales o de arquitectura no bloqueantes

Si encuentras una discrepancia entre Android y backend:
- no inventes una solucion paralela
- reporta el JSON esperado por backend
- ajusta Android al backend real

Quiero trabajo ejecutado, no solo analisis. Implementa los cambios necesarios en la app Android y luego entregame la matriz final cerrada.
```
