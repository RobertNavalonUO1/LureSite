# Auditoria forense de rutas definidas en web.php

Fecha: 2026-03-14

## Alcance y metodologia

Esta auditoria cubre las rutas definidas directamente en [routes/web.php](../routes/web.php). El objetivo no es resumir el archivo, sino auditar cada ruta por su flujo real:

- ruta y metodo HTTP
- middleware efectivos
- controlador, closure o servicio implicado
- validaciones y autorizacion
- modelos, relaciones y persistencia
- pagina Inertia y componentes React relevantes
- acciones UI y efecto real
- discrepancias entre lo que promete la interfaz y lo que hace el sistema

Notas de alcance:

- La sentencia `require __DIR__ . '/auth.php';` se menciona como importacion externa, pero sus rutas no se auditan aqui ruta por ruta porque su definicion efectiva vive en otro archivo.
- El documento prioriza problemas funcionales, de seguridad, ownership, semantica de negocio y deuda arquitectonica por encima del estilo.

---

## 1. Guardia landing-only de produccion

### Ruta
`GET /{any?}`

### Metodo HTTP
`GET`

### Middleware aplicados
`web` mas el guard condicional `app()->environment('production') && config('landing.only')`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [config/landing.php](../config/landing.php)
- [resources/js/Pages/Landing/Universe.jsx](../resources/js/Pages/Landing/Universe.jsx)

### Flujo real detectado
Si la app esta en produccion y `LANDING_ONLY=true`, Laravel registra una unica catch-all y hace `Inertia::render('Landing/Universe')`. El resto de rutas deja de registrarse porque el archivo retorna inmediatamente.

### Que se supone que hace
Servir una unica landing de mantenimiento sin borrar el resto del sitio.

### Que hace realmente
Lo hace de forma coherente y temprana. El guard corta de verdad el registro del resto de rutas.

### Problemas encontrados
1. Severidad baja. La decision vive en el propio archivo de rutas y no en middleware dedicado. No rompe el comportamiento, pero dificulta testear y aislar la feature flag.

### Impacto funcional o de seguridad
Impacto bajo de mantenibilidad. El comportamiento es correcto, pero la logica queda acoplada al bootstrap de rutas.

### Evidencia tecnica concreta
El bloque condicional en [routes/web.php](../routes/web.php) registra la catch-all y hace `return;` inmediatamente.

### Propuesta exacta de correccion
Cambio minimo: mantenerlo asi pero cubrirlo con tests de rutas en entorno `production`.

Refactor correcto: mover la decision a un route service provider o middleware de mantenimiento explicito para reducir logica en `web.php`.

---

## 2. Rutas API publicas y utilitarias

### Ruta
`GET /banners`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/Api/BannerController.php](../app/Http/Controllers/Api/BannerController.php)

### Flujo real detectado
Expone banners por un controlador API no auditado en profundidad en esta pasada porque el archivo no fue necesario para confirmar problemas mayores de `web.php`.

### Que se supone que hace
Devolver banners consumibles por frontend.

### Que hace realmente
La ruta existe y es publica, pero su comportamiento exacto depende del controlador API.

### Problemas encontrados
1. Severidad media. La ruta publica no esta versionada ni agrupada bajo prefijo API coherente. Mezcla contratos JSON en `web.php` con paginas Inertia.

### Impacto funcional o de seguridad
Impacto medio de mantenimiento y de claridad arquitectonica.

### Evidencia tecnica concreta
La ruta se registra como `Route::get('/banners', ...)` en [routes/web.php](../routes/web.php), fuera de `routes/api.php`.

### Propuesta exacta de correccion
Cambio minimo: documentar el contrato JSON y aplicar throttle.

Refactor correcto: mover endpoints JSON publicos a `routes/api.php` o prefijarlos de forma consistente.

### Ruta
`GET /api/search/suggestions`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/SearchController.php](../app/Http/Controllers/SearchController.php)

### Flujo real detectado
Valida `query` y `limit`, ejecuta busqueda por `name`, `description` y `details.specifications`, limita resultados a 10 y devuelve JSON con URL a la pagina de producto.

### Que se supone que hace
Ofrecer sugerencias rapidas de productos.

### Que hace realmente
Funciona razonablemente bien, pero usa `LIKE` sobre varios campos y `orWhereHas` sin estrategia de indexacion o full text.

### Problemas encontrados
1. Severidad media. Riesgo de degradacion por busquedas `%term%` sobre `name`, `description` y `details.specifications`.
2. Severidad baja. El endpoint cuelga de `web.php` y usa sesion/cookies aunque es un JSON publico.

### Impacto funcional o de seguridad
Impacto medio de rendimiento cuando crezca el catalogo.

### Evidencia tecnica concreta
`SearchController::suggest()` usa `where('name', 'like', $likeTerm)` y `orWhereHas('details', ...)` en [app/Http/Controllers/SearchController.php](../app/Http/Controllers/SearchController.php).

### Propuesta exacta de correccion
Cambio minimo: mantener `limit` bajo y añadir indices apropiados.

Refactor correcto: mover a busqueda full text o motor dedicado y aislar el endpoint en capa API propia.

### Ruta
`GET /api/deals-today`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/ProductController.php](../app/Http/Controllers/ProductController.php)

### Flujo real detectado
`ProductController::dealsToday()` consulta productos destacados o con descuento, toma 10 y mapea campos al formato de tarjetas promocionales.

### Que se supone que hace
Exponer ofertas del dia para UI publica.

### Que hace realmente
Devuelve datos utiles, pero la semantica de oferta es ambigua: mezcla `is_featured` con `discount > 0`.

### Problemas encontrados
1. Severidad media. La logica de negocio no distingue destacado de oferta real; un producto destacado sin descuento entra como oferta.
2. Severidad baja. La salida concatena `'% OFF'` asumiendo que `discount` es porcentaje y no importe.

### Impacto funcional o de seguridad
Impacto funcional medio: la UI puede prometer descuentos que no son descuentos reales.

### Evidencia tecnica concreta
`where('is_featured', true)->orWhere('discount', '>', 0)` en [app/Http/Controllers/ProductController.php](../app/Http/Controllers/ProductController.php).

### Propuesta exacta de correccion
Cambio minimo: limitar la ruta a productos con descuento real.

Refactor correcto: definir un criterio de promociones de dominio separado de `is_featured`.

### Ruta
`GET /api/superdeals`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/ProductController.php](../app/Http/Controllers/ProductController.php)

### Flujo real detectado
Consulta todos los productos `is_superdeal=true`, los mapea a JSON y calcula `old_price` en base a `discount`.

### Que se supone que hace
Exponer superofertas.

### Que hace realmente
La ruta existe y responde, pero no pagina y asume que `discount` es porcentaje valido.

### Problemas encontrados
1. Severidad media. Sin paginacion ni limite; carga todos los superdeals.
2. Severidad media. `old_price` se deriva con una formula que puede ser incoherente si `discount` no es un porcentaje consistente en BD.

### Impacto funcional o de seguridad
Impacto medio de rendimiento y de coherencia de precios mostrados.

### Evidencia tecnica concreta
`get()->map(...)` y `round($p->price / (1 - $p->discount / 100), 2)` en [app/Http/Controllers/ProductController.php](../app/Http/Controllers/ProductController.php).

### Propuesta exacta de correccion
Cambio minimo: aplicar `take()` o paginacion y validar semantica de `discount`.

Refactor correcto: encapsular el calculo de precio original en un servicio de pricing.

### Ruta
`GET /api/fast-shipping`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/ProductController.php](../app/Http/Controllers/ProductController.php)

### Flujo real detectado
Consulta todos los productos con `is_fast_shipping=true` y devuelve JSON plano.

### Que se supone que hace
Exponer productos con envio rapido.

### Que hace realmente
Funciona, pero sin paginacion y duplicando logica con la pagina Inertia `/fast-shipping`.

### Problemas encontrados
1. Severidad media. Duplicacion de dos flujos distintos para la misma feature: uno JSON y otro Inertia.

### Impacto funcional o de seguridad
Impacto medio de mantenimiento: dos contratos distintos para la misma idea.

### Evidencia tecnica concreta
Existe la ruta JSON y tambien una ruta pagina `GET /fast-shipping` en [routes/web.php](../routes/web.php).

### Propuesta exacta de correccion
Cambio minimo: definir cual es la fuente oficial para la pantalla.

Refactor correcto: consolidar en un unico query builder reutilizable.

### Ruta
`POST /locale`

### Metodo HTTP
`POST`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/LocaleController.php](../app/Http/Controllers/LocaleController.php)

### Flujo real detectado
Valida `locale` contra `es/en/fr`, la guarda en sesion y devuelve `back()` con cookie persistente.

### Que se supone que hace
Cambiar el idioma de la aplicacion.

### Que hace realmente
Lo hace correctamente a nivel tecnico.

### Problemas encontrados
1. Severidad baja. No tiene throttle y es una escritura publica sobre sesion.

### Impacto funcional o de seguridad
Impacto bajo. No es exfiltracion, pero permite ruido y carga innecesaria.

### Evidencia tecnica concreta
`LocaleController::update()` usa validacion estricta y escribe en sesion/cookie.

### Propuesta exacta de correccion
Cambio minimo: aplicar `throttle`.

Refactor correcto: mantenerlo en `web.php` pero centralizar la lectura del locale en middleware dedicado si no existe ya.

---

## 3. Social auth

### Ruta
`GET /auth/{provider}/redirect`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/Auth/SocialAuthController.php](../app/Http/Controllers/Auth/SocialAuthController.php)

### Flujo real detectado
Normaliza el provider, valida contra `google/facebook` y llama a `Socialite::driver($provider)->redirect()`.

### Que se supone que hace
Redirigir al proveedor OAuth soportado.

### Que hace realmente
Lo hace, pero con señalizacion imperfecta de providers invalidos.

### Problemas encontrados
1. Severidad baja. Providers no soportados terminan en 404 en lugar de respuesta semantica mas clara.

### Impacto funcional o de seguridad
Impacto bajo de claridad y trazabilidad.

### Evidencia tecnica concreta
`abort_unless(..., 404)` en [app/Http/Controllers/Auth/SocialAuthController.php](../app/Http/Controllers/Auth/SocialAuthController.php).

### Propuesta exacta de correccion
Cambio minimo: mantener whitelist y devolver 403 o redirect con error funcional.

Refactor correcto: encapsular providers habilitados en config.

### Ruta
`GET /auth/{provider}/callback`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/Auth/SocialAuthController.php](../app/Http/Controllers/Auth/SocialAuthController.php)
- [app/Models/User.php](../app/Models/User.php)

### Flujo real detectado
Recupera el usuario social, exige email, busca usuario por email o crea uno nuevo, rellena `name`, `photo_url`, `oauth_provider` y `oauth_provider_id`, guarda, hace login y regenera sesion.

### Que se supone que hace
Completar login social de forma segura y coherente con el dominio de usuarios.

### Que hace realmente
Hace login, pero deja huecos funcionales y de modelo.

### Problemas encontrados
1. Severidad media. No marca `email_verified_at` aunque el login social se usa como identidad suficiente.
2. Severidad media. Si un usuario local ya existia por email, se le ata el proveedor automaticamente sin confirmacion adicional.
3. Severidad baja. Guarda `photo_url`, pero el resto del frontend de perfil trabaja sobre `avatar` y no sobre `photo_url`.

### Impacto funcional o de seguridad
Impacto medio: mezcla identidades y deja inconsistencias entre campos de avatar.

### Evidencia tecnica concreta
`User::where('email', $email)->first()` seguido de asignacion directa de `oauth_provider` y `oauth_provider_id`; `User::$fillable` incluye `photo_url` y `avatar` a la vez en [app/Models/User.php](../app/Models/User.php).

### Propuesta exacta de correccion
Cambio minimo: setear `email_verified_at = now()` en login social y definir una politica clara para enlazar cuentas existentes.

Refactor correcto: introducir capa de account linking con consentimiento explicito y unificar `avatar`/`photo_url`.

---

## 4. Home y paginas estaticas publicas

### Ruta
`GET /`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Services/CampaignBannerResolver.php](../app/Services/CampaignBannerResolver.php)
- [app/Support/CatalogDataLocalizer.php](../app/Support/CatalogDataLocalizer.php)
- [resources/js/Pages/Shop/Home.jsx](../resources/js/Pages/Shop/Home.jsx)

### Flujo real detectado
Closure que carga categorias y productos completos con `Category::all()` y `Product::with('category')->get()`, resuelve campaign banner, lee carrito desde sesion y renderiza `Shop/Home`.

### Que se supone que hace
Servir la home de storefront con catalogo, campaign y datos de carrito.

### Que hace realmente
Entrega la home y el carrito visible, pero carga mas de lo necesario y mezcla demasiada logica en la propia ruta.

### Problemas encontrados
1. Severidad media. Carga todos los productos y categorias sin paginacion ni segmentacion para home.
2. Severidad baja. La logica de presentacion vive en closure en vez de controlador.

### Impacto funcional o de seguridad
Impacto medio de rendimiento y mantenibilidad.

### Evidencia tecnica concreta
La propia closure en [routes/web.php](../routes/web.php) usa `Category::all()` y `Product::with('category')->get()`.

### Propuesta exacta de correccion
Cambio minimo: mover la closure a un controlador y limitar datasets.

Refactor correcto: crear un home query service que entregue solo bloques necesarios para la portada.

### Ruta
`GET /about`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [resources/js/Pages/Static/About.jsx](../resources/js/Pages/Static/About.jsx)

### Flujo real detectado
Render estatico por Inertia.

### Que se supone que hace
Mostrar pagina informativa.

### Que hace realmente
Es una pagina estatica sin persistencia.

### Problemas encontrados
1. Sin hallazgos graves. Severidad baja por depender de pagina estatica aislada y no de un layout documental comun si el proyecto quisiera CMS futuro.

### Impacto funcional o de seguridad
Bajo.

### Evidencia tecnica concreta
La ruta es una closure `Inertia::render('Static/About')`.

### Propuesta exacta de correccion
Mantener si el contenido es realmente estatico.

### Ruta
`GET /contact`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [resources/js/Pages/Static/Contact.jsx](../resources/js/Pages/Static/Contact.jsx)

### Flujo real detectado
Renderiza un formulario Inertia con `useForm`, feedback flash y layout storefront.

### Que se supone que hace
Permitir al usuario escribir a soporte.

### Que hace realmente
La UI esta bien cableada al `POST /contact`, pero depende de un backend con un fallo importante.

### Problemas encontrados
1. Severidad alta. La interfaz promete envio con copia al usuario, pero el backend referencia `ContactConfirmation` sin import en el controlador, lo que rompe la accion en runtime.

### Impacto funcional o de seguridad
Impacto alto: la pantalla promete una funcionalidad que no se completa.

### Evidencia tecnica concreta
En [app/Http/Controllers/ContactController.php](../app/Http/Controllers/ContactController.php) se instancia `new ContactConfirmation($validated)` sin `use App\Mail\ContactConfirmation;`.

### Propuesta exacta de correccion
Cambio minimo: importar la clase correctamente.

Refactor correcto: mover el envio a un servicio o job y cubrir el flujo con test funcional del formulario.

### Ruta
`POST /contact`

### Metodo HTTP
`POST`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/ContactController.php](../app/Http/Controllers/ContactController.php)
- [app/Mail/ContactMessage.php](../app/Mail/ContactMessage.php)
- [app/Mail/ContactConfirmation.php](../app/Mail/ContactConfirmation.php)
- [resources/js/Pages/Static/Contact.jsx](../resources/js/Pages/Static/Contact.jsx)

### Flujo real detectado
Valida `name`, `email`, `message`, envia correo al admin usando `mail.from.address`, intenta enviar copia al usuario y devuelve `back()` con flash success.

### Que se supone que hace
Enviar mensaje a soporte y copia al remitente.

### Que hace realmente
La primera mitad puede funcionar; la segunda esta rota por import ausente. Tampoco hay throttle ni cola.

### Problemas encontrados
1. Severidad alta. Falla en runtime por clase no importada.
2. Severidad media. Usa `config('mail.from.address')` como destinatario operativo de soporte, lo que mezcla remitente tecnico con buzones de negocio.
3. Severidad media. No tiene throttling ni proteccion antispam.

### Impacto funcional o de seguridad
Impacto alto funcional y medio de abuso.

### Evidencia tecnica concreta
La ruta publica llama a `Mail::to(config('mail.from.address'))` y luego a `new ContactConfirmation($validated)` en [app/Http/Controllers/ContactController.php](../app/Http/Controllers/ContactController.php).

### Propuesta exacta de correccion
Cambio minimo: importar `ContactConfirmation` y aplicar `throttle` a la ruta.

Refactor correcto: introducir direccion de soporte dedicada en config y mandar correos por queue.

### Ruta
`GET /faq`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [resources/js/Pages/Static/Faq.jsx](../resources/js/Pages/Static/Faq.jsx)

### Flujo real detectado
Render Inertia estatico.

### Que se supone que hace
Mostrar FAQ.

### Que hace realmente
Lo hace sin logica adicional.

### Problemas encontrados
Sin hallazgos graves.

### Impacto funcional o de seguridad
Bajo.

### Evidencia tecnica concreta
Closure `Inertia::render('Static/Faq')`.

### Propuesta exacta de correccion
Sin cambios prioritarios.

### Ruta
`GET /terms`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [resources/js/Pages/Static/Terms.jsx](../resources/js/Pages/Static/Terms.jsx)

### Flujo real detectado
Render Inertia estatico.

### Que se supone que hace
Mostrar terminos.

### Que hace realmente
Lo hace.

### Problemas encontrados
Sin hallazgos graves.

### Impacto funcional o de seguridad
Bajo.

### Evidencia tecnica concreta
Closure `Inertia::render('Static/Terms')`.

### Propuesta exacta de correccion
Sin cambios prioritarios.

### Ruta
`GET /privacy`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [resources/js/Pages/Static/Privacy.jsx](../resources/js/Pages/Static/Privacy.jsx)

### Flujo real detectado
Render Inertia estatico.

### Que se supone que hace
Mostrar politica de privacidad.

### Que hace realmente
Lo hace.

### Problemas encontrados
Sin hallazgos graves.

### Impacto funcional o de seguridad
Bajo.

### Evidencia tecnica concreta
Closure `Inertia::render('Static/Privacy')`.

### Propuesta exacta de correccion
Sin cambios prioritarios.

### Ruta
`GET /agregador-enlaces`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`, `auth`, `admin`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [resources/js/Pages/Tools/LinkAggregator.jsx](../resources/js/Pages/Tools/LinkAggregator.jsx)

### Flujo real detectado
Alias admin para la misma pagina Inertia de herramientas.

### Que se supone que hace
Abrir el agregador de enlaces.

### Que hace realmente
Es un alias funcional del endpoint ingles.

### Problemas encontrados
1. Severidad baja. Duplicacion de rutas para la misma UI sin naming comun.

### Impacto funcional o de seguridad
Impacto bajo de mantenibilidad.

### Evidencia tecnica concreta
Dos closures diferentes renderizan la misma pagina `Tools/LinkAggregator`.

### Propuesta exacta de correccion
Cambio minimo: mantener alias pero darles nombres de ruta si se usan desde frontend.

### Ruta
`GET /link-aggregator`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`, `auth`, `admin`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [resources/js/Pages/Tools/LinkAggregator.jsx](../resources/js/Pages/Tools/LinkAggregator.jsx)

### Flujo real detectado
Alias del agregador.

### Que se supone que hace
Lo mismo que la ruta espanola.

### Que hace realmente
Lo mismo.

### Problemas encontrados
Sin hallazgos adicionales respecto al alias anterior.

### Impacto funcional o de seguridad
Bajo.

### Evidencia tecnica concreta
Ambas closures renderizan `Tools/LinkAggregator`.

### Propuesta exacta de correccion
Unificar convencion de idioma o documentar ambos alias.

---

## 5. Paginas promocionales del storefront

### Ruta
`GET /deals/today`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [resources/js/Pages/Special/DealsToday.jsx](../resources/js/Pages/Special/DealsToday.jsx)
- [app/Http/Controllers/ProductController.php](../app/Http/Controllers/ProductController.php)

### Flujo real detectado
La ruta renderiza una pagina Inertia sin props. La pagina depende previsiblemente de consumir `/api/deals-today` en cliente.

### Que se supone que hace
Mostrar ofertas del dia.

### Que hace realmente
La ruta pagina y la ruta JSON estan separadas. Si la pagina falla al cargar cliente, la ruta no trae datos por si misma.

### Problemas encontrados
1. Severidad media. Implementacion partida en dos contratos y riesgo de pantalla vacia si el fetch cliente falla.

### Impacto funcional o de seguridad
Impacto medio de resiliencia UX.

### Evidencia tecnica concreta
`GET /deals/today` no pasa props; `GET /api/deals-today` expone los datos por separado en [routes/web.php](../routes/web.php).

### Propuesta exacta de correccion
Cambio minimo: tolerar estado de error/carga vacia en la pagina.

Refactor correcto: decidir entre SSR/Inertia con props o CSR con API dedicada, pero no mezcla implicita.

### Ruta
`GET /superdeal`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [resources/js/Pages/Special/SuperDeal.jsx](../resources/js/Pages/Special/SuperDeal.jsx)
- [app/Http/Controllers/ProductController.php](../app/Http/Controllers/ProductController.php)

### Flujo real detectado
Igual patron que la pagina de deals: pagina sin props y endpoint JSON aparte.

### Que se supone que hace
Mostrar superdeals.

### Que hace realmente
Depende de fetch cliente para poblar datos.

### Problemas encontrados
1. Severidad media. Misma duplicacion y acoplamiento debil entre UI y backend.

### Impacto funcional o de seguridad
Impacto medio UX/mantenimiento.

### Evidencia tecnica concreta
Existe `GET /superdeal` como pagina y `GET /api/superdeals` como fuente de datos.

### Propuesta exacta de correccion
Igual que en `/deals/today`.

### Ruta
`GET /new-arrivals`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [resources/js/Pages/Special/NewArrivals.jsx](../resources/js/Pages/Special/NewArrivals.jsx)

### Flujo real detectado
Pagina Inertia sin props cargadas desde ruta.

### Que se supone que hace
Mostrar novedades.

### Que hace realmente
No hay endpoint JSON asociado en `web.php`, por lo que la implementacion real depende de logica cliente interna o es decorativa.

### Problemas encontrados
1. Severidad alta. La ruta parece una feature completa, pero no hay fuente de datos visible en `web.php` que la respalde.

### Impacto funcional o de seguridad
Impacto alto de feature potencialmente incompleta o decorativa.

### Evidencia tecnica concreta
Solo existe la closure `Inertia::render('Special/NewArrivals')` en [routes/web.php](../routes/web.php); no hay endpoint dedicado equivalente a deals/superdeals.

### Propuesta exacta de correccion
Cambio minimo: verificar si la pagina tiene datos hardcodeados o consume otro endpoint; si no, marcarla como incompleta.

Refactor correcto: crear query/backend real para novedades y test funcional.

### Ruta
`GET /seasonal`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [resources/js/Pages/Special/SeasonalProducts.jsx](../resources/js/Pages/Special/SeasonalProducts.jsx)

### Flujo real detectado
Pagina Inertia sin props desde backend.

### Que se supone que hace
Mostrar productos de temporada.

### Que hace realmente
Mismo riesgo que `new-arrivals`: la ruta existe, pero la definicion de datos no esta respaldada por backend visible en `web.php`.

### Problemas encontrados
1. Severidad alta. Feature aparentemente implementada pero sin backend claro.

### Impacto funcional o de seguridad
Impacto alto funcional.

### Evidencia tecnica concreta
La ruta solo hace `Inertia::render('Special/SeasonalProducts')`.

### Propuesta exacta de correccion
Igual que en `new-arrivals`.

### Ruta
`GET /fast-shipping`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [resources/js/Pages/Special/FastShipping.jsx](../resources/js/Pages/Special/FastShipping.jsx)
- [app/Models/Product.php](../app/Models/Product.php)

### Flujo real detectado
Renderiza pagina Inertia con props `products` obtenidos por `Product::where('is_fast_shipping', true)->latest()->get()`.

### Que se supone que hace
Mostrar catalogo de envio rapido.

### Que hace realmente
Funciona mejor que el resto de especiales porque trae props desde servidor, pero duplica contrato con `GET /api/fast-shipping`.

### Problemas encontrados
1. Severidad media. Duplicacion de dos fuentes de verdad para la misma feature.
2. Severidad media. Sin paginacion.

### Impacto funcional o de seguridad
Impacto medio de mantenimiento y rendimiento.

### Evidencia tecnica concreta
La pagina recibe `products` desde closure y existe tambien la ruta JSON.

### Propuesta exacta de correccion
Cambio minimo: definir cual usa la UI de forma oficial.

Refactor correcto: unificar query en servicio o controller action reutilizable.

---

## 6. Busqueda, producto y categorias

### Ruta
`GET /search`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/SearchController.php](../app/Http/Controllers/SearchController.php)
- [resources/js/Pages/Search/Results.jsx](../resources/js/Pages/Search/Results.jsx)
- [app/Support/CatalogDataLocalizer.php](../app/Support/CatalogDataLocalizer.php)

### Flujo real detectado
Valida filtros, arma query compleja, pagina resultados, calcula rating medio con `withAvg`, localiza productos y categorias, y renderiza `Search/Results`.

### Que se supone que hace
Ofrecer busqueda y filtrado de catalogo.

### Que hace realmente
Es una de las rutas mas completas del archivo, pero tiene un coste oculto.

### Problemas encontrados
1. Severidad media. Dentro del `through()` ejecuta `reviews()->count()` por producto, generando riesgo N+1 sobre la coleccion paginada.
2. Severidad baja. `relevance` por defecto no es relevancia real; ordena por `average_rating` y `created_at`.

### Impacto funcional o de seguridad
Impacto medio de rendimiento y de semantica enganosa del sort.

### Evidencia tecnica concreta
`'reviews_count' => $product->reviews()->count()` dentro del transformador en [app/Http/Controllers/SearchController.php](../app/Http/Controllers/SearchController.php).

### Propuesta exacta de correccion
Cambio minimo: usar `withCount('reviews')`.

Refactor correcto: separar claramente sort por rating de sort por relevancia textual.

### Ruta
`GET /product/{id}`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [resources/js/Pages/Layouts/ProductPageLayout.jsx](../resources/js/Pages/Layouts/ProductPageLayout.jsx)
- [app/Models/Product.php](../app/Models/Product.php)

### Flujo real detectado
La ruta usa una closure, carga un producto con `category`, `details`, `reviews` y ademas todos los productos con categoria. Renderiza `Layouts/ProductPageLayout`.

### Que se supone que hace
Mostrar detalle de producto.

### Que hace realmente
Funciona, pero usa una closure distinta a `ProductController::show()`, que tambien implementa un detalle de producto diferente y nunca se usa desde `web.php`.

### Problemas encontrados
1. Severidad alta. Existen dos flujos de detalle de producto en backend con payloads distintos: la closure de `web.php` y `ProductController::show()`.
2. Severidad media. La ruta carga todos los productos del sistema para una pagina de detalle.
3. Severidad media. `ProductController::show()` parece codigo muerto desde la perspectiva de `web.php`.

### Impacto funcional o de seguridad
Impacto alto de inconsistencia backend/frontend y medio de rendimiento.

### Evidencia tecnica concreta
`Route::get('/product/{id}', fn ($id) => Inertia::render('Layouts/ProductPageLayout', ...))` en [routes/web.php](../routes/web.php), mientras [app/Http/Controllers/ProductController.php](../app/Http/Controllers/ProductController.php) define otro `show($id)` no referenciado por esta ruta.

### Propuesta exacta de correccion
Cambio minimo: elegir una unica implementacion de detalle.

Refactor correcto: mover la ruta a controller y eliminar el flujo duplicado muerto.

### Ruta
`GET /category/{id}`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/CategoryController.php](../app/Http/Controllers/CategoryController.php)
- [resources/js/Pages/Shop/CategoryPage.jsx](../resources/js/Pages/Shop/CategoryPage.jsx)

### Flujo real detectado
Busca categoria por id con `products`, carga categorias para sidebar y renderiza `Shop/CategoryPage`.

### Que se supone que hace
Mostrar una categoria por id.

### Que hace realmente
Lo hace, pero con eager loading incompleto y un path paralelo por slug con payload diferente.

### Problemas encontrados
1. Severidad media. `Category::with('products')` y despues `products->load('category')` es una secuencia menos clara de lo necesario.
2. Severidad media. La pagina por id no envia `banners`, mientras la pagina por slug si los envia, aunque vacios.

### Impacto funcional o de seguridad
Impacto medio de incoherencia de props entre dos rutas de la misma pantalla.

### Evidencia tecnica concreta
`show()` y `showBySlug()` en [app/Http/Controllers/CategoryController.php](../app/Http/Controllers/CategoryController.php) no construyen el mismo payload.

### Propuesta exacta de correccion
Cambio minimo: igualar contrato de props entre ambas rutas.

Refactor correcto: resolver ambos endpoints con una sola accion parametrizada.

### Ruta
`GET /categoria/{slug}`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/CategoryController.php](../app/Http/Controllers/CategoryController.php)
- [resources/js/Pages/Shop/CategoryPage.jsx](../resources/js/Pages/Shop/CategoryPage.jsx)

### Flujo real detectado
Busca categoria por slug, consulta productos latest, arma banners vacios hardcodeados y renderiza la misma pagina.

### Que se supone que hace
Mostrar la categoria principal indexable por slug.

### Que hace realmente
Muestra la categoria, pero los banners son una promesa vacia y el payload no es consistente con la ruta por id.

### Problemas encontrados
1. Severidad media. `banners` existe pero esta hardcodeado a arrays vacios, lo que delata feature incompleta o decorativa.
2. Severidad baja. Duplica logica con la ruta por id.

### Impacto funcional o de seguridad
Impacto medio de UX enganosa y deuda tecnica.

### Evidencia tecnica concreta
`$banners = ['category' => [], 'default' => []];` en [app/Http/Controllers/CategoryController.php](../app/Http/Controllers/CategoryController.php).

### Propuesta exacta de correccion
Cambio minimo: quitar props `banners` si no existen.

Refactor correcto: implementar banners reales por categoria o eliminar la feature del layout.

---

## 7. Alta, staging y migracion de productos

### Ruta
`GET /products/add`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/AddProdukController.php](../app/Http/Controllers/AddProdukController.php)
- [resources/js/Pages/Admin/AddProduct.jsx](../resources/js/Pages/Admin/AddProduct.jsx)

### Flujo real detectado
Renderiza una pantalla de administracion con temporales y categorias, pero la ruta es publica en `web.php`.

### Que se supone que hace
Ofrecer alta de productos.

### Que hace realmente
Expone una pantalla administrativa sin middleware `auth/admin` en la propia ruta.

### Problemas encontrados
1. Severidad critica. Ruta administrativa publica.

### Impacto funcional o de seguridad
Impacto critico: un invitado puede abrir el formulario de alta de productos y explorar staging de importacion.

### Evidencia tecnica concreta
La ruta se declara fuera de cualquier grupo `auth` o `admin` en [routes/web.php](../routes/web.php).

### Propuesta exacta de correccion
Cambio minimo: mover la ruta al grupo `auth,admin`.

Refactor correcto: separar completamente tooling administrativo de rutas publicas.

### Ruta
`POST /products/store`

### Metodo HTTP
`POST`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/AddProdukController.php](../app/Http/Controllers/AddProdukController.php)
- [app/Models/Product.php](../app/Models/Product.php)

### Flujo real detectado
Valida payload y crea producto definitivo.

### Que se supone que hace
Persistir un nuevo producto.

### Que hace realmente
Permite crear productos desde una ruta publica.

### Problemas encontrados
1. Severidad critica. Alta de producto sin auth ni admin.

### Impacto funcional o de seguridad
Impacto critico: alteracion de catalogo por cualquier visitante con CSRF valido o sesion navegador comprometida.

### Evidencia tecnica concreta
Ruta publica mas `Product::create($validated)` en [app/Http/Controllers/AddProdukController.php](../app/Http/Controllers/AddProdukController.php).

### Propuesta exacta de correccion
Cambio minimo: proteger con `auth` y `admin`.

Refactor correcto: convertir la alta en recurso admin formal con policy y auditoria.

### Ruta
`GET /select-products`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/ProductController.php](../app/Http/Controllers/ProductController.php)
- [resources/js/Pages/Admin/SelectProducts.jsx](../resources/js/Pages/Admin/SelectProducts.jsx)

### Flujo real detectado
Lista productos temporales y categorias para seleccion y migracion, de nuevo como ruta publica.

### Que se supone que hace
Herramienta interna de backoffice.

### Que hace realmente
Es publica.

### Problemas encontrados
1. Severidad critica. Exposicion publica de staging de productos.

### Impacto funcional o de seguridad
Impacto critico por fuga de informacion operativa y posible exploracion del pipeline.

### Evidencia tecnica concreta
Ruta fuera de grupos protegidos en [routes/web.php](../routes/web.php).

### Propuesta exacta de correccion
Mover al bloque admin.

### Ruta
`POST /migrate-selected-products`

### Metodo HTTP
`POST`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/ProductController.php](../app/Http/Controllers/ProductController.php)

### Flujo real detectado
Valida un array de productos temporales y crea productos definitivos en lote, borrando temporales.

### Que se supone que hace
Migrar productos seleccionados desde staging.

### Que hace realmente
Migra productos desde una ruta publica.

### Problemas encontrados
1. Severidad critica. Alteracion masiva de catalogo sin auth.
2. Severidad alta. El request valida campos como `selected_products.*.name`, pero luego usa esos datos para crear productos definitivos sin una capa de autorizacion o workflow.

### Impacto funcional o de seguridad
Impacto critico: cualquiera podria forzar migracion o contaminar catalogo.

### Evidencia tecnica concreta
La ruta publica llama a `DB::beginTransaction()` y `Product::create()` en [app/Http/Controllers/ProductController.php](../app/Http/Controllers/ProductController.php).

### Propuesta exacta de correccion
Cambio minimo: mover la ruta a `auth+admin`.

Refactor correcto: usar recursos admin y eventos de auditoria.

### Ruta
`POST /add-temporary-product`

### Metodo HTTP
`POST`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/ProductController.php](../app/Http/Controllers/ProductController.php)

### Flujo real detectado
Crea un `TemporaryProduct` desde payload validado.

### Que se supone que hace
Poblar staging manualmente.

### Que hace realmente
Lo expone a publico.

### Problemas encontrados
1. Severidad critica. Insercion en staging administrativo sin permisos.

### Impacto funcional o de seguridad
Impacto critico.

### Evidencia tecnica concreta
Ruta publica en [routes/web.php](../routes/web.php) y `TemporaryProduct::create($validated)` en [app/Http/Controllers/ProductController.php](../app/Http/Controllers/ProductController.php).

### Propuesta exacta de correccion
Proteger con middleware admin.

### Ruta
`GET /migrate-products`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/ProductMigrationController.php](../app/Http/Controllers/ProductMigrationController.php)
- [resources/js/Pages/Admin/MigrateProducts.jsx](../resources/js/Pages/Admin/MigrateProducts.jsx)

### Flujo real detectado
Lista temporales e inventario actual para migracion avanzada, crea categoria `General` si no existe y renderiza herramienta admin.

### Que se supone que hace
Ser una consola interna de migracion.

### Que hace realmente
Tambien es publica y con side effect en GET.

### Problemas encontrados
1. Severidad critica. Herramienta administrativa publica.
2. Severidad alta. El propio GET crea datos (`Category::firstOrCreate(...)`) y por tanto no es idempotente desde el punto de vista de negocio.

### Impacto funcional o de seguridad
Impacto critico de exposicion y alto de semantica HTTP rota.

### Evidencia tecnica concreta
`Category::firstOrCreate(['name' => 'General'], ...)` en `index()` de [app/Http/Controllers/ProductMigrationController.php](../app/Http/Controllers/ProductMigrationController.php).

### Propuesta exacta de correccion
Cambio minimo: proteger con admin y quitar side effects del GET.

Refactor correcto: resolver defaults en migracion o seeder, no al abrir una pantalla.

### Ruta
`POST /migrate-products/{id}`

### Metodo HTTP
`POST`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/ProductMigrationController.php](../app/Http/Controllers/ProductMigrationController.php)

### Flujo real detectado
Migra un temporal concreto a `Product`, copia imagenes y elimina el temporal en transaccion.

### Que se supone que hace
Migrar un producto temporal.

### Que hace realmente
Lo hace sin auth ni admin.

### Problemas encontrados
1. Severidad critica. Ruta destructiva y de escritura publica.

### Impacto funcional o de seguridad
Impacto critico.

### Evidencia tecnica concreta
Ruta publica y `persistProductWithImages()` crea producto y borra temporal.

### Propuesta exacta de correccion
Proteger con admin.

### Ruta
`POST /migrate-products/bulk`

### Metodo HTTP
`POST`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/ProductMigrationController.php](../app/Http/Controllers/ProductMigrationController.php)

### Flujo real detectado
Migra todos los temporales, con rollback solo si ninguno migra y errores parciales si algunos fallan.

### Que se supone que hace
Migracion masiva controlada.

### Que hace realmente
Es masiva, publica y deja estados parciales por diseno.

### Problemas encontrados
1. Severidad critica. Ruta publica de migracion masiva.
2. Severidad alta. Semantica transaccional ambigua: si algunos fallan y otros no, se hace commit parcial.

### Impacto funcional o de seguridad
Impacto critico en integridad de catalogo.

### Evidencia tecnica concreta
`if (!empty($errors) && $migratedCount === 0) { rollback } else { commit }` en [app/Http/Controllers/ProductMigrationController.php](../app/Http/Controllers/ProductMigrationController.php).

### Propuesta exacta de correccion
Cambio minimo: mover a admin y documentar commit parcial.

Refactor correcto: usar jobs por lote con auditoria y capacidad de reintento.

### Ruta
`PATCH /migrate-products/product/{product}`

### Metodo HTTP
`PATCH`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/ProductMigrationController.php](../app/Http/Controllers/ProductMigrationController.php)

### Flujo real detectado
Actualiza nombre e imagen principal de un producto ya creado.

### Que se supone que hace
Corregir productos migrados.

### Que hace realmente
Expone una mutacion de catalogo sin permisos.

### Problemas encontrados
1. Severidad critica. Edicion publica de productos.

### Impacto funcional o de seguridad
Critico.

### Evidencia tecnica concreta
Ruta fuera de grupos protegidos.

### Propuesta exacta de correccion
Proteger con admin y policy de producto.

### Ruta
`POST /migrate-products/product/{product}/images`

### Metodo HTTP
`POST`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/ProductMigrationController.php](../app/Http/Controllers/ProductMigrationController.php)

### Flujo real detectado
Agrega imagenes a un producto existente deduplicando URLs.

### Que se supone que hace
Completar galeria de productos.

### Que hace realmente
Mutacion publica del catalogo.

### Problemas encontrados
1. Severidad critica. Escritura publica.

### Impacto funcional o de seguridad
Critico.

### Evidencia tecnica concreta
Ruta publica y `ProductImage::create(...)` en [app/Http/Controllers/ProductMigrationController.php](../app/Http/Controllers/ProductMigrationController.php).

### Propuesta exacta de correccion
Mover a admin.

### Ruta
`POST /bulk-migrate-products`

### Metodo HTTP
`POST`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/ProductMigrationController.php](../app/Http/Controllers/ProductMigrationController.php)

### Flujo real detectado
Alias legacy de la migracion masiva.

### Que se supone que hace
Compatibilidad con flujo antiguo.

### Que hace realmente
Duplica una operacion critica publica.

### Problemas encontrados
1. Severidad critica. Alias legacy mantiene abierta una superficie de ataque extra.

### Impacto funcional o de seguridad
Critico.

### Evidencia tecnica concreta
La ruta apunta al mismo metodo `bulkMigrate`.

### Propuesta exacta de correccion
Eliminar alias legacy o protegerlo igual que la ruta principal.

---

## 8. Reviews publicas

### Ruta
`GET /products/{product}/reviews`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/ReviewController.php](../app/Http/Controllers/ReviewController.php)

### Flujo real detectado
Recupera reviews del producto con usuario y devuelve JSON mapeado.

### Que se supone que hace
Listar reseñas.

### Que hace realmente
Lo hace razonablemente.

### Problemas encontrados
1. Severidad baja. Sin paginacion.

### Impacto funcional o de seguridad
Bajo-medio de rendimiento a gran escala.

### Evidencia tecnica concreta
`latest()->get()` sin limite en [app/Http/Controllers/ReviewController.php](../app/Http/Controllers/ReviewController.php).

### Propuesta exacta de correccion
Anadir paginacion o limite.

### Ruta
`POST /products/{product}/reviews`

### Metodo HTTP
`POST`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/ReviewController.php](../app/Http/Controllers/ReviewController.php)
- [app/Models/Review.php](../app/Models/Review.php)

### Flujo real detectado
Valida rating y comment, busca el producto, intenta actualizar review existente del usuario autenticado o crear una nueva con `Auth::id()`, recalcula media y devuelve JSON.

### Que se supone que hace
Permitir a un usuario dejar o actualizar su review.

### Que hace realmente
La ruta es publica, pero el metodo esta escrito como si requiriera usuario autenticado.

### Problemas encontrados
1. Severidad alta. No hay middleware `auth`, pero la logica se apoya en `Auth::id()`.
2. Severidad media. Si `user_id` acepta null, un invitado podria crear reseñas anonimas no contempladas; si no lo acepta, fallara en runtime o BD.
3. Severidad media. La media de producto se recalcula en cada POST sin control de concurrencia.

### Impacto funcional o de seguridad
Impacto alto: endpoint incoherente entre politica publica y logica real.

### Evidencia tecnica concreta
`where('user_id', Auth::id())` y `Review::create(['user_id' => Auth::id(), ...])` en [app/Http/Controllers/ReviewController.php](../app/Http/Controllers/ReviewController.php), sin middleware auth en [routes/web.php](../routes/web.php).

### Propuesta exacta de correccion
Cambio minimo: proteger la ruta con `auth`.

Refactor correcto: introducir politica de review por compra verificada si el dominio lo requiere.

---

## 9. Carrito y checkout publico

### Ruta
`GET /cart`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/CartController.php](../app/Http/Controllers/CartController.php)
- [resources/js/Pages/Shop/CartPage.jsx](../resources/js/Pages/Shop/CartPage.jsx)

### Flujo real detectado
Lee carrito de sesion, calcula total y cartCount, loguea acceso y renderiza `Shop/CartPage`.

### Que se supone que hace
Mostrar el carrito.

### Que hace realmente
Lo hace, con carrito puramente en sesion.

### Problemas encontrados
1. Severidad media. El carrito no persiste mas alla de la sesion y no se vincula al usuario.

### Impacto funcional o de seguridad
Impacto medio UX/negocio.

### Evidencia tecnica concreta
`session()->get('cart', [])` en [app/Http/Controllers/CartController.php](../app/Http/Controllers/CartController.php).

### Propuesta exacta de correccion
Cambio minimo: asumirlo explicitamente y documentarlo.

Refactor correcto: persistencia de carrito por usuario o merge sesion-usuario.

### Ruta
`POST /cart/{productId}/add`

### Metodo HTTP
`POST`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/CartController.php](../app/Http/Controllers/CartController.php)

### Flujo real detectado
Busca producto, lo agrega a sesion o incrementa cantidad, y responde JSON o redirect segun `expectsJson()`.

### Que se supone que hace
Agregar al carrito.

### Que hace realmente
Lo hace bien a nivel basico.

### Problemas encontrados
1. Severidad baja. No valida stock real ni disponibilidad al agregar.

### Impacto funcional o de seguridad
Impacto medio funcional: el usuario puede acumular cantidades no comprobadas contra stock.

### Evidencia tecnica concreta
No hay validacion de stock en `addToCart()`.

### Propuesta exacta de correccion
Cambio minimo: verificar stock antes de sumar.

Refactor correcto: encapsular reglas de carrito en un servicio de inventario.

### Ruta
`POST /cart/{productId}/remove`

### Metodo HTTP
`POST`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/CartController.php](../app/Http/Controllers/CartController.php)

### Flujo real detectado
Elimina item del carrito de sesion.

### Que se supone que hace
Quitar del carrito.

### Que hace realmente
Lo hace.

### Problemas encontrados
1. Severidad baja. Usa `POST` para una operacion semantica de delete.

### Impacto funcional o de seguridad
Bajo-medio de semantica y mantenibilidad.

### Evidencia tecnica concreta
La ruta esta definida como `Route::post('/{productId}/remove', ...)`.

### Propuesta exacta de correccion
Cambio minimo: mantener si el frontend ya depende de ello.

Refactor correcto: migrar a `DELETE` o endpoint REST mas limpio.

### Ruta
`POST /cart/{productId}/increment`

### Metodo HTTP
`POST`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/CartController.php](../app/Http/Controllers/CartController.php)

### Flujo real detectado
Incrementa cantidad en sesion.

### Que se supone que hace
Subir una unidad.

### Que hace realmente
Lo hace sin control de stock.

### Problemas encontrados
1. Severidad media. Puede superar stock real silenciosamente.

### Impacto funcional o de seguridad
Impacto medio funcional.

### Evidencia tecnica concreta
`$cart[$productId]['quantity']++` sin comprobar producto/stock.

### Propuesta exacta de correccion
Controlar stock disponible.

### Ruta
`POST /cart/{productId}/decrement`

### Metodo HTTP
`POST`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/CartController.php](../app/Http/Controllers/CartController.php)

### Flujo real detectado
Reduce cantidad o elimina si llega a cero.

### Que se supone que hace
Bajar una unidad.

### Que hace realmente
Lo hace.

### Problemas encontrados
1. Severidad baja. Misma observacion de semantica HTTP y falta de reglas de negocio centralizadas.

### Impacto funcional o de seguridad
Bajo.

### Evidencia tecnica concreta
La operacion cuelga de sesion pura.

### Propuesta exacta de correccion
Mantener o mover a servicio de carrito.

### Ruta
`GET /cart/summary`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/CartController.php](../app/Http/Controllers/CartController.php)

### Flujo real detectado
Devuelve snapshot JSON del carrito de sesion.

### Que se supone que hace
Sincronizar UI del carrito por AJAX.

### Que hace realmente
Lo hace.

### Problemas encontrados
1. Sin hallazgos graves.

### Impacto funcional o de seguridad
Bajo.

### Evidencia tecnica concreta
`return response()->json($this->cartSnapshot())`.

### Propuesta exacta de correccion
Sin prioridad alta.

### Ruta
`GET /checkout`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/CheckoutController.php](../app/Http/Controllers/CheckoutController.php)
- [resources/js/Pages/Shop/Checkout.jsx](../resources/js/Pages/Shop/Checkout.jsx)

### Flujo real detectado
Lee carrito de sesion, calcula totales, carga direcciones si hay usuario, y renderiza `Shop/Checkout` con items, coupon, shipping, direcciones y auth.

### Que se supone que hace
Permitir checkout a usuario autenticado o invitado segun existencia de `guest-address`.

### Que hace realmente
El backend soporta direccion de invitado, pero el frontend bloquea el checkout si no hay usuario.

### Problemas encontrados
1. Severidad alta. Incoherencia backend/frontend: existe `storeGuestAddress()`, pero `Checkout.jsx` define `const canCheckout = !isGuest && ...`, bloqueando cualquier invitado.
2. Severidad media. `stripePromise` usa `import.meta.env.VITE_STRIPE_PUBLIC_KEY`, mientras el backend devuelve `stripePublicKey` en JSON y el frontend la ignora.

### Impacto funcional o de seguridad
Impacto alto funcional: feature de guest checkout aparentemente implementada pero no usable.

### Evidencia tecnica concreta
`storeGuestAddress()` en [app/Http/Controllers/CheckoutController.php](../app/Http/Controllers/CheckoutController.php) frente a `canCheckout = !isGuest ...` en [resources/js/Pages/Shop/Checkout.jsx](../resources/js/Pages/Shop/Checkout.jsx).

### Propuesta exacta de correccion
Cambio minimo: decidir si hay guest checkout real; si no, eliminar la ruta/flujo guest.

Refactor correcto: implementar un checkout guest completo de extremo a extremo o exigir auth tambien en backend.

### Ruta
`POST /checkout/guest-address`

### Metodo HTTP
`POST`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/CheckoutController.php](../app/Http/Controllers/CheckoutController.php)

### Flujo real detectado
Valida direccion y la guarda como objeto en sesion `guest_address`, devolviendo JSON success.

### Que se supone que hace
Soportar checkout de invitado.

### Que hace realmente
Guarda la direccion, pero la UI principal no deja completar el pago a invitado.

### Problemas encontrados
1. Severidad alta. Feature parcial o decorativa por falta de continuidad en frontend.

### Impacto funcional o de seguridad
Impacto alto funcional.

### Evidencia tecnica concreta
Ruta backend existente y bloqueo frontend en checkout.

### Propuesta exacta de correccion
Igual que en `GET /checkout`.

### Ruta
`POST /checkout/coupon`

### Metodo HTTP
`POST`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/CheckoutController.php](../app/Http/Controllers/CheckoutController.php)
- [app/Models/Coupon.php](../app/Models/Coupon.php)
- [resources/js/Pages/Shop/Checkout.jsx](../resources/js/Pages/Shop/Checkout.jsx)

### Flujo real detectado
Aplica o elimina cupon en sesion checkout y responde con redirect `back()` y flash/errors.

### Que se supone que hace
Gestionar cupones del checkout.

### Que hace realmente
Lo hace de forma razonable.

### Problemas encontrados
1. Severidad media. La ruta actualiza estado de sesion pero no bloquea reuse por concurrencia ni reserva uso; `used_count` solo se incrementa al completar pedido.

### Impacto funcional o de seguridad
Impacto medio de consistencia si varios pedidos consumen el mismo cupon al mismo tiempo.

### Evidencia tecnica concreta
`used_count` solo se incrementa en `success()` de checkout.

### Propuesta exacta de correccion
Cambio minimo: aceptarlo si el negocio tolera carrera blanda.

Refactor correcto: consumo atomico o codigo de reserva.

### Ruta
`POST /checkout/shipping`

### Metodo HTTP
`POST`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/CheckoutController.php](../app/Http/Controllers/CheckoutController.php)
- [resources/js/Pages/Shop/Checkout.jsx](../resources/js/Pages/Shop/Checkout.jsx)

### Flujo real detectado
Valida `method`, la cruza con opciones disponibles para subtotal actual, guarda datos de shipping en sesion y responde con redirect `back()`.

### Que se supone que hace
Cambiar envio del checkout.

### Que hace realmente
Lo hace bien.

### Problemas encontrados
1. Sin hallazgos graves.

### Impacto funcional o de seguridad
Bajo.

### Evidencia tecnica concreta
Validacion de metodo contra `shippingOptionsForSubtotal()`.

### Propuesta exacta de correccion
Sin prioridad alta.

---

## 10. Shared props de Inertia

No es una ruta, pero afecta a muchas de ellas.

### Hallazgo
`Inertia::share()` inyecta `cartItems`, `cartCount`, `total` y `csrfToken` globalmente.

### Problemas encontrados
1. Severidad baja. Duplicacion de datos: varias rutas vuelven a pasar carrito y total manualmente ademas del shared data.

### Impacto
Bajo-medio de coherencia de props.

### Propuesta exacta de correccion
Definir una sola fuente de verdad para props globales del carrito.

---

## 11. Rutas autenticadas de usuario

### Ruta
`GET /dashboard`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`, `auth`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/DashboardController.php](../app/Http/Controllers/DashboardController.php)
- [resources/js/Pages/User/Dashboard.jsx](../resources/js/Pages/User/Dashboard.jsx)

### Flujo real detectado
Carga usuario autenticado, resumen de pedidos por status, ultimos 5 pedidos y carrito de sesion. Renderiza `User/Dashboard`.

### Que se supone que hace
Panel personal del usuario.

### Que hace realmente
Lo hace, pero sigue arrastrando decisiones discutibles del dominio de carrito en sesion.

### Problemas encontrados
1. Severidad media. El dashboard del usuario usa carrito de sesion y no carrito del usuario, por lo que la experiencia cambia por dispositivo/sesion.

### Impacto funcional o de seguridad
Impacto medio UX.

### Evidencia tecnica concreta
`$cart = session()->get('cart', [])` en [app/Http/Controllers/DashboardController.php](../app/Http/Controllers/DashboardController.php).

### Propuesta exacta de correccion
Unificar estrategia de carrito.

### Ruta
`GET /orders`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`, `auth`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/OrderController.php](../app/Http/Controllers/OrderController.php)
- [resources/js/Pages/Orders/Index.jsx](../resources/js/Pages/Orders/Index.jsx)

### Flujo real detectado
Lista todos los pedidos del usuario con items y datos transformados.

### Que se supone que hace
Mostrar historial completo.

### Que hace realmente
Lo hace razonablemente.

### Problemas encontrados
1. Severidad media. Payload incluye `product => toArray()` entero en cada item, sobredimensionando respuesta sin un uso claro.

### Impacto funcional o de seguridad
Impacto medio de peso innecesario y posible exposicion de campos no requeridos.

### Evidencia tecnica concreta
`'product' => $item->product ? $item->product->toArray() : null` en [app/Http/Controllers/OrderController.php](../app/Http/Controllers/OrderController.php).

### Propuesta exacta de correccion
Enviar solo campos consumidos por UI.

### Ruta
`GET /orders/shipped`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`, `auth`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/OrderController.php](../app/Http/Controllers/OrderController.php)
- [resources/js/Pages/Orders/ShippedOrders.jsx](../resources/js/Pages/Orders/ShippedOrders.jsx)

### Flujo real detectado
Filtra pedidos por scope `shipped()` y construye progress UI.

### Que se supone que hace
Mostrar enviados/entregados/confirmados.

### Que hace realmente
Incluye tambien `pagado` y `pendiente_envio` dentro de `scopeShipped()`.

### Problemas encontrados
1. Severidad media. El nombre de la ruta y el scope son engañosos; incluye estados no enviados.

### Impacto funcional o de seguridad
Impacto medio de semantica rota para usuario y desarrollador.

### Evidencia tecnica concreta
`scopeShipped()` en [app/Models/Order.php](../app/Models/Order.php) incluye `pagado` y `pendiente_envio`.

### Propuesta exacta de correccion
Cambio minimo: renombrar la seccion o ajustar el scope.

Refactor correcto: introducir estados agrupados por dominio con nombres veraces.

### Ruta
`GET /orders/paid`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`, `auth`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/OrderController.php](../app/Http/Controllers/OrderController.php)
- [resources/js/Pages/Orders/Paid.jsx](../resources/js/Pages/Orders/Paid.jsx)

### Flujo real detectado
Usa scope `paid()` para traer pagados y posteriores.

### Que se supone que hace
Mostrar pedidos pagados.

### Que hace realmente
Muestra casi todo salvo pendientes iniciales y cancelados puros.

### Problemas encontrados
1. Severidad media. El nombre `paid` es engañoso; el scope incluye cancelacion pendiente, enviado, entregado, confirmado, reembolsado y devolucion aprobada.

### Impacto funcional o de seguridad
Impacto medio de semantica de negocio incorrecta.

### Evidencia tecnica concreta
`scopePaid()` en [app/Models/Order.php](../app/Models/Order.php).

### Propuesta exacta de correccion
Renombrar vista/scope o ajustar criterio.

### Ruta
`GET /orders/cancelled`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`, `auth`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/OrderController.php](../app/Http/Controllers/OrderController.php)
- [resources/js/Pages/Orders/CancelledRefundedOrders.jsx](../resources/js/Pages/Orders/CancelledRefundedOrders.jsx)

### Flujo real detectado
Lista cancelacion pendiente, cancelado, devolucion aprobada y reembolsado.

### Que se supone que hace
Mostrar pedidos cancelados.

### Que hace realmente
Agrupa cancelaciones y reembolsos en la misma seccion.

### Problemas encontrados
1. Severidad baja. El nombre de la ruta no refleja que incluye reembolsos y estados intermedios.

### Impacto funcional o de seguridad
Impacto bajo-medio de claridad.

### Evidencia tecnica concreta
`whereIn('status', ['cancelacion_pendiente', 'cancelado', 'devolucion_aprobada', 'reembolsado'])`.

### Propuesta exacta de correccion
Renombrar seccion o desglosar estados.

### Ruta
`GET /orders/{order}/cancel`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`, `auth`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/OrderController.php](../app/Http/Controllers/OrderController.php)
- [resources/js/Pages/Orders/CancelConfirm.jsx](../resources/js/Pages/Orders/CancelConfirm.jsx)

### Flujo real detectado
Comprueba ownership por `user_id`, valida cancelabilidad y renderiza confirmacion.

### Que se supone que hace
Mostrar pantalla de confirmacion de cancelacion.

### Que hace realmente
Lo hace correctamente.

### Problemas encontrados
Sin hallazgos graves.

### Impacto funcional o de seguridad
Bajo.

### Evidencia tecnica concreta
`where('user_id', Auth::id())` antes de `firstOrFail()`.

### Propuesta exacta de correccion
Sin prioridad alta.

### Ruta
`POST /orders/{order}/confirm`

### Metodo HTTP
`POST`

### Middleware aplicados
`web`, `auth`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/OrderController.php](../app/Http/Controllers/OrderController.php)

### Flujo real detectado
Permite confirmar solo si el estado es `entregado`, y entonces lo cambia a `confirmado`.

### Que se supone que hace
Confirmar recepcion por el cliente.

### Que hace realmente
La ruta en si es correcta, pero se ve afectada por otros flujos que saltan estados.

### Problemas encontrados
1. Severidad alta. `CheckoutController::success()` crea pedidos ya en `confirmado`, rompiendo el flujo natural que esta ruta espera.

### Impacto funcional o de seguridad
Impacto alto funcional: la accion puede quedar inutil o incoherente en produccion.

### Evidencia tecnica concreta
`$order->status = 'confirmado';` en [app/Http/Controllers/CheckoutController.php](../app/Http/Controllers/CheckoutController.php).

### Propuesta exacta de correccion
Corregir el estado inicial del pedido tras pago.

### Ruta
`POST /orders/{order}/cancel`

### Metodo HTTP
`POST`

### Middleware aplicados
`web`, `auth`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/OrderController.php](../app/Http/Controllers/OrderController.php)

### Flujo real detectado
Comprueba ownership, valida razon opcional y marca `cancelacion_pendiente`.

### Que se supone que hace
Solicitar cancelacion del usuario.

### Que hace realmente
Lo hace bien.

### Problemas encontrados
1. Severidad baja. `cancelled_at` se resetea a null incluso cuando la solicitud ya es de cancelacion, lo que sugiere modelo de estados no suficientemente claro.

### Impacto funcional o de seguridad
Bajo.

### Evidencia tecnica concreta
`$order->cancelled_at = null;` en [app/Http/Controllers/OrderController.php](../app/Http/Controllers/OrderController.php).

### Propuesta exacta de correccion
Definir campo separado para solicitud y fecha efectiva.

### Ruta
`POST /orders/{order}/refund`

### Metodo HTTP
`POST`

### Middleware aplicados
`web`, `auth`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/OrderController.php](../app/Http/Controllers/OrderController.php)
- [app/Models/Order.php](../app/Models/Order.php)

### Flujo real detectado
Comprueba ownership, valida `isRefundable()` y cambia estado a `reembolsado`.

### Que se supone que hace
Solicitar reembolso.

### Que hace realmente
Marca el pedido como reembolsado directamente, sin una fase de solicitud ni aprobacion.

### Problemas encontrados
1. Severidad alta. La ruta promete solicitud de reembolso, pero aplica el resultado final (`reembolsado`) al instante.

### Impacto funcional o de seguridad
Impacto alto de logica de negocio defectuosa.

### Evidencia tecnica concreta
Comentario del metodo dice `Registrar la solicitud de reembolso`, pero el codigo hace `$order->status = 'reembolsado';`.

### Propuesta exacta de correccion
Cambio minimo: introducir estado `reembolso_pendiente`.

Refactor correcto: workflow completo de devolucion con aprobacion admin y evidencia de pago.

### Ruta
`GET /orders/{order}`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`, `auth`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/OrderController.php](../app/Http/Controllers/OrderController.php)
- [resources/js/Pages/Orders/Show.jsx](../resources/js/Pages/Orders/Show.jsx)

### Flujo real detectado
Carga `Order::with('items.product')->findOrFail($orderId)` y renderiza `Orders/Show`.

### Que se supone que hace
Mostrar el detalle del pedido del usuario actual.

### Que hace realmente
Muestra el detalle de cualquier pedido existente si el id es conocido.

### Problemas encontrados
1. Severidad critica. No valida ownership del pedido.

### Impacto funcional o de seguridad
Impacto critico: exposicion de datos de otros usuarios autenticados.

### Evidencia tecnica concreta
`findOrFail($orderId)` sin `where('user_id', Auth::id())` en [app/Http/Controllers/OrderController.php](../app/Http/Controllers/OrderController.php).

### Propuesta exacta de correccion
Cambio minimo: filtrar por `user_id`.

Refactor correcto: usar route model binding con policy `OrderPolicy@view`.

---

## 12. Pagos autenticados del checkout

### Ruta
`POST /checkout/stripe`

### Metodo HTTP
`POST`

### Middleware aplicados
`web`, `auth`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/CheckoutController.php](../app/Http/Controllers/CheckoutController.php)
- [resources/js/Pages/Shop/Checkout.jsx](../resources/js/Pages/Shop/Checkout.jsx)

### Flujo real detectado
Valida `address_id` con `exists:addresses,id`, busca la direccion en las direcciones del usuario cargadas en memoria, crea sesion Stripe y guarda `selected_address` en sesion.

### Que se supone que hace
Iniciar pago Stripe para la direccion elegida.

### Que hace realmente
Funciona si el `address_id` pertenece al usuario, pero la validacion no expresa ownership y el flujo mezcla backend y frontend en el uso de la public key.

### Problemas encontrados
1. Severidad alta. La validacion solo garantiza existencia de la direccion, no propiedad; la autorizacion descansa en un `firstWhere` posterior en coleccion del usuario.
2. Severidad media. El frontend ignora `stripePublicKey` devuelto por backend y usa una env var fija.

### Impacto funcional o de seguridad
Impacto alto de validacion insuficiente y medio de configuracion inconsistente.

### Evidencia tecnica concreta
`'address_id' => 'nullable|exists:addresses,id'` en [app/Http/Controllers/CheckoutController.php](../app/Http/Controllers/CheckoutController.php).

### Propuesta exacta de correccion
Cambio minimo: validar ownership explicito con regla o query personalizada.

Refactor correcto: introducir FormRequest para checkout payments y una sola fuente de config de Stripe.

### Ruta
`POST /checkout/paypal`

### Metodo HTTP
`POST`

### Middleware aplicados
`web`, `auth`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/CheckoutController.php](../app/Http/Controllers/CheckoutController.php)
- [resources/js/Pages/Shop/Checkout.jsx](../resources/js/Pages/Shop/Checkout.jsx)

### Flujo real detectado
Mismo patron que Stripe, pero crea order PayPal sandbox y devuelve `approvalLink`.

### Que se supone que hace
Iniciar checkout PayPal.

### Que hace realmente
Mismos huecos de ownership y configuracion que Stripe.

### Problemas encontrados
1. Severidad alta. Misma validacion insuficiente de direccion.
2. Severidad media. Entorno sandbox hardcoded por el tipo de cliente construido en controller, sin capa de entorno mas robusta.

### Impacto funcional o de seguridad
Impacto alto y medio respectivamente.

### Evidencia tecnica concreta
`new SandboxEnvironment(...)` dentro del controller.

### Propuesta exacta de correccion
Usar config por entorno y validar ownership real de direccion.

### Ruta
`GET /checkout/success`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`, `auth`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/CheckoutController.php](../app/Http/Controllers/CheckoutController.php)
- [app/Models/Order.php](../app/Models/Order.php)
- [app/Models/OrderItem.php](../app/Models/OrderItem.php)

### Flujo real detectado
Si hay carrito, direccion seleccionada y una marca de Stripe o PayPal en sesion, crea `Order`, crea `OrderItem`s, incrementa `used_count` del cupon, limpia sesion y redirige a dashboard con exito.

### Que se supone que hace
Persistir una compra completada correctamente.

### Que hace realmente
Guarda el pedido, pero con varios atajos de negocio y datos incompletos.

### Problemas encontrados
1. Severidad critica. Crea pedidos con estado `confirmado`, saltandose `pagado`, `pendiente_envio`, `enviado` y el flujo natural de confirmacion de entrega.
2. Severidad alta. La ruta no verifica con Stripe o PayPal que el pago haya sido efectivamente capturado; confia en IDs guardados en sesion.
3. Severidad media. `Order::$fillable` no lista `payment_method`, `transaction_id`, `name`, `email`, pero aqui se asignan manualmente; el modelo queda semanticamente incompleto.

### Impacto funcional o de seguridad
Impacto critico funcional y alto de confianza indebida en estado local de sesion.

### Evidencia tecnica concreta
`$order->status = 'confirmado';` y ausencia de comprobacion contra API de pago en [app/Http/Controllers/CheckoutController.php](../app/Http/Controllers/CheckoutController.php).

### Propuesta exacta de correccion
Cambio minimo: guardar el pedido como `pagado` o `pendiente_envio` y verificar la sesion/order remota antes de persistir.

Refactor correcto: webhook o confirmacion server-to-server como fuente de verdad del pago.

### Ruta
`GET /checkout/cancel`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`, `auth`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/CheckoutController.php](../app/Http/Controllers/CheckoutController.php)

### Flujo real detectado
Redirige a `/checkout` con flash error.

### Que se supone que hace
Volver del pago cancelado.

### Que hace realmente
Lo hace correctamente.

### Problemas encontrados
Sin hallazgos graves.

### Impacto funcional o de seguridad
Bajo.

### Evidencia tecnica concreta
`return redirect()->route('checkout')->with('error', 'El pago fue cancelado.')`.

### Propuesta exacta de correccion
Sin prioridad alta.

---

## 13. Perfil, direcciones y avatar

### Ruta
`GET /profile`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`, `auth`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/ProfileController.php](../app/Http/Controllers/ProfileController.php)
- [resources/js/Pages/Profile/EditProfile.jsx](../resources/js/Pages/Profile/EditProfile.jsx)
- [app/Models/User.php](../app/Models/User.php)

### Flujo real detectado
Carga usuario con direcciones, deduplica direcciones por `street+city+zip_code` y renderiza `Profile/EditProfile` con auth, addresses y `paymentMethods` hardcodeados.

### Que se supone que hace
Permitir editar perfil y direcciones.

### Que hace realmente
Muestra el perfil, pero la pagina React mezcla `useForm` para perfil con `fetch()` manual para direcciones y un flujo de avatar separado.

### Problemas encontrados
1. Severidad media. `paymentMethods` se envian como props y la UI permite elegir uno, pero `User::$fillable` no contiene `payment_method`; el cambio se pierde.
2. Severidad media. La deduplicacion de direcciones en backend puede ocultar registros reales distintos con mismas cadenas de calle/ciudad/codigo postal.

### Impacto funcional o de seguridad
Impacto medio funcional: el usuario cree guardar cosas que no se persisten o ve menos direcciones de las que tiene.

### Evidencia tecnica concreta
`payment_method` se valida en [app/Http/Controllers/ProfileController.php](../app/Http/Controllers/ProfileController.php), pero no esta en [app/Models/User.php](../app/Models/User.php); `EditProfile.jsx` muestra selector de metodo de pago.

### Propuesta exacta de correccion
Cambio minimo: eliminar el selector o persistir realmente el campo.

Refactor correcto: descomponer la pantalla en formularios coherentes y usar FormRequests.

### Ruta
`PATCH /profile`

### Metodo HTTP
`PATCH`

### Middleware aplicados
`web`, `auth`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/ProfileController.php](../app/Http/Controllers/ProfileController.php)
- [resources/js/Pages/Profile/EditProfile.jsx](../resources/js/Pages/Profile/EditProfile.jsx)
- [app/Models/User.php](../app/Models/User.php)

### Flujo real detectado
Valida nombre, apellido, email, telefono, avatar, payment_method y default_address_id, resetea verificacion email si cambia, hace `fill($validated)` y guarda.

### Que se supone que hace
Actualizar perfil.

### Que hace realmente
Actualiza solo una parte de lo que la UI promete.

### Problemas encontrados
1. Severidad alta. Desfase telefono: backend exige regex `+NN espacio numero`, frontend manda `phone_prefix` y `phone` separados sin combinarlos.
2. Severidad alta. `payment_method` se valida pero no se persiste.
3. Severidad media. `default_address_id` se valida contra cualquier `addresses.id`, no contra direcciones del usuario.

### Impacto funcional o de seguridad
Impacto alto funcional y medio de ownership blando.

### Evidencia tecnica concreta
Regex de telefono en [app/Http/Controllers/ProfileController.php](../app/Http/Controllers/ProfileController.php) frente a `phone_prefix` separado en [resources/js/Pages/Profile/EditProfile.jsx](../resources/js/Pages/Profile/EditProfile.jsx).

### Propuesta exacta de correccion
Cambio minimo: combinar prefijo y telefono en frontend o aceptar ambos campos en backend.

Refactor correcto: usar FormRequest y validacion de ownership de direccion predeterminada.

### Ruta
`DELETE /profile`

### Metodo HTTP
`DELETE`

### Middleware aplicados
`web`, `auth`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/ProfileController.php](../app/Http/Controllers/ProfileController.php)

### Flujo real detectado
Exige password actual, hace logout, elimina usuario, invalida sesion y redirige a `/`.

### Que se supone que hace
Eliminar la cuenta.

### Que hace realmente
Lo hace razonablemente.

### Problemas encontrados
1. Severidad media. No hay evidencia en esta pasada de tratamiento explicito de datos dependientes ni borrado seguro de relaciones.

### Impacto funcional o de seguridad
Impacto medio de integridad o compliance segun dominio.

### Evidencia tecnica concreta
El metodo elimina directamente el usuario en [app/Http/Controllers/ProfileController.php](../app/Http/Controllers/ProfileController.php).

### Propuesta exacta de correccion
Definir estrategia de soft delete o cascade controlada si el negocio lo exige.

### Ruta
`POST /addresses/store`

### Metodo HTTP
`POST`

### Middleware aplicados
`web`, `auth`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/AddressController.php](../app/Http/Controllers/AddressController.php)
- [resources/js/Pages/Profile/EditProfile.jsx](../resources/js/Pages/Profile/EditProfile.jsx)
- [resources/js/Pages/Shop/Checkout.jsx](../resources/js/Pages/Shop/Checkout.jsx)

### Flujo real detectado
Valida direccion, la crea para el usuario y devuelve `back()->with('success', ...)`.

### Que se supone que hace
Crear una direccion para perfil o checkout.

### Que hace realmente
La accion backend funciona, pero `EditProfile.jsx` la consume como si devolviera JSON con `newAddress`.

### Problemas encontrados
1. Severidad alta. Mismatch backend/frontend: el perfil espera JSON y no lo recibe.

### Impacto funcional o de seguridad
Impacto alto funcional: el modal de nueva direccion puede no actualizar la UI como promete.

### Evidencia tecnica concreta
`AddressController::store()` devuelve redirect; `EditProfile.jsx` hace `const json = await res.json(); if (json?.newAddress) ...`.

### Propuesta exacta de correccion
Cambio minimo: usar Inertia `post()` o hacer que el endpoint devuelva JSON cuando sea XHR.

Refactor correcto: unificar el flujo de direcciones en componentes/forms compartidos.

### Ruta
`PUT /addresses/{address}`

### Metodo HTTP
`PUT`

### Middleware aplicados
`web`, `auth`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/AddressController.php](../app/Http/Controllers/AddressController.php)
- [resources/js/Pages/Profile/EditProfile.jsx](../resources/js/Pages/Profile/EditProfile.jsx)

### Flujo real detectado
Autoriza por `user_id`, valida, actualiza y devuelve redirect `back()`.

### Que se supone que hace
Editar direccion.

### Que hace realmente
El backend esta bien, pero el perfil hace `fetch('/addresses/{id}', { method: 'PATCH' ... })`, no `PUT`, y tampoco procesa redirect.

### Problemas encontrados
1. Severidad alta. Mismatch de metodo HTTP y de tipo de respuesta entre UI y backend.

### Impacto funcional o de seguridad
Impacto alto funcional.

### Evidencia tecnica concreta
La ruta en [routes/web.php](../routes/web.php) es `PUT`; `EditProfile.jsx` usa `method: 'PATCH'`.

### Propuesta exacta de correccion
Cambio minimo: alinear a `PUT` y usar Inertia/Axios coherentemente.

Refactor correcto: extraer un modulo de addresses reutilizable.

### Ruta
`PUT /addresses/{address}/default`

### Metodo HTTP
`PUT`

### Middleware aplicados
`web`, `auth`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/AddressController.php](../app/Http/Controllers/AddressController.php)

### Flujo real detectado
Marca una direccion del usuario como predeterminada.

### Que se supone que hace
Cambiar direccion default.

### Que hace realmente
El backend funciona, pero en `EditProfile.jsx` no hay evidencia de una UI que llame a esta ruta.

### Problemas encontrados
1. Severidad media. Funcionalidad implementada en backend pero no conectada en la UI principal de perfil.

### Impacto funcional o de seguridad
Impacto medio funcional: feature oculta o incompleta.

### Evidencia tecnica concreta
La ruta existe en [routes/web.php](../routes/web.php); en [resources/js/Pages/Profile/EditProfile.jsx](../resources/js/Pages/Profile/EditProfile.jsx) no aparece accion equivalente.

### Propuesta exacta de correccion
Conectar la accion en UI o eliminarla del alcance visible.

### Ruta
`DELETE /addresses/{address}`

### Metodo HTTP
`DELETE`

### Middleware aplicados
`web`, `auth`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/AddressController.php](../app/Http/Controllers/AddressController.php)
- [resources/js/Pages/Profile/EditProfile.jsx](../resources/js/Pages/Profile/EditProfile.jsx)

### Flujo real detectado
Autoriza ownership, borra direccion, repara default si hacia falta y devuelve redirect con flash.

### Que se supone que hace
Eliminar direccion.

### Que hace realmente
El backend funciona, pero el perfil lo consume por fetch como si bastara filtrar estado local sin leer respuesta real.

### Problemas encontrados
1. Severidad media. La UI filtra localmente la direccion eliminada aunque no inspecciona si el backend devolvio error de ownership o fallo.

### Impacto funcional o de seguridad
Impacto medio UX/inconsistencia local.

### Evidencia tecnica concreta
`fetch(...).then(() => setLocalAddresses(...))` en [resources/js/Pages/Profile/EditProfile.jsx](../resources/js/Pages/Profile/EditProfile.jsx).

### Propuesta exacta de correccion
Usar respuesta real o Inertia reload.

### Ruta
`POST /api/avatar-upload`

### Metodo HTTP
`POST`

### Middleware aplicados
`web`, `auth`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/AvatarController.php](../app/Http/Controllers/AvatarController.php)
- [resources/js/Pages/Profile/EditProfile.jsx](../resources/js/Pages/Profile/EditProfile.jsx)
- [resources/js/Components/avatar/AvatarCreatorModal.jsx](../resources/js/Components/avatar/AvatarCreatorModal.jsx)

### Flujo real detectado
Acepta `image` base64 PNG, guarda en storage publico, actualiza `user->avatar` y devuelve JSON `url` absoluto.

### Que se supone que hace
Subir/cambiar avatar.

### Que hace realmente
Funciona como endpoint independiente, pero convive con `PATCH /profile` que tambien edita `avatar` como string.

### Problemas encontrados
1. Severidad media. Dos flujos distintos para la misma propiedad `avatar`.
2. Severidad baja. Solo acepta PNG base64, lo que puede ser correcto para el creador de avatar pero es demasiado especifico si la UI promete subida general.

### Impacto funcional o de seguridad
Impacto medio de coherencia y extensibilidad.

### Evidencia tecnica concreta
`AvatarController::store()` actualiza usuario y `EditProfile.jsx` tambien incluye `avatar` dentro del form `patch`.

### Propuesta exacta de correccion
Cambio minimo: documentar el flujo oficial y hacer que el form de perfil no reimplemente avatar.

Refactor correcto: centralizar avatar en un unico endpoint y un unico estado fuente.

---

## 14. Admin

### Middleware comun
Todas las rutas bajo `/admin` aplican `web`, `auth` y `admin`. El middleware [app/Http/Middleware/AdminMiddleware.php](../app/Http/Middleware/AdminMiddleware.php) solo comprueba `is_admin` binario; no hay policies de recurso visibles en esta pasada.

### Ruta
`GET /admin/dashboard`

### Metodo HTTP
`GET`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/AdminController.php](../app/Http/Controllers/AdminController.php)
- [resources/js/Pages/Admin/Dashboard.jsx](../resources/js/Pages/Admin/Dashboard.jsx)

### Flujo real detectado
Devuelve conteos agregados simples.

### Problemas encontrados
1. Severidad baja. KPI de `pendingOrders` solo mira `pendiente_pago`, no el resto de estados pendientes operativos.

### Propuesta exacta de correccion
Revisar definicion de pedido pendiente a nivel negocio.

### Ruta
`GET /admin/orders`

### Metodo HTTP
`GET`

### Archivos implicados
- [app/Http/Controllers/AdminController.php](../app/Http/Controllers/AdminController.php)
- [resources/js/Pages/Admin/Orders.jsx](../resources/js/Pages/Admin/Orders.jsx)

### Flujo real detectado
Lista todos los pedidos con usuario e items.product.

### Problemas encontrados
1. Severidad media. Sin paginacion.
2. Severidad media. No hay policies de recurso, solo puerta admin global.

### Ruta
`POST /admin/orders/{order}/cancel`

### Metodo HTTP
`POST`

### Archivos implicados
- [app/Http/Controllers/AdminController.php](../app/Http/Controllers/AdminController.php)

### Flujo real detectado
Cancela un pedido salvo si ya esta enviado o cancelado.

### Problemas encontrados
1. Severidad media. `reason` no se valida.
2. Severidad media. Semantica HTTP destructiva con `POST`.

### Ruta
`POST /admin/orders/{order}/mark-shipped`

### Metodo HTTP
`POST`

### Archivos implicados
- [app/Http/Controllers/AdminController.php](../app/Http/Controllers/AdminController.php)

### Flujo real detectado
Marca enviado si el estado esta en una lista fija.

### Problemas encontrados
1. Severidad media. El state machine esta hardcodeado y desacoplado de un workflow formal.

### Ruta
`POST /admin/orders/{order}/mark-delivered`

### Metodo HTTP
`POST`

### Archivos implicados
- [app/Http/Controllers/AdminController.php](../app/Http/Controllers/AdminController.php)

### Flujo real detectado
Marca entregado si venia de enviado.

### Problemas encontrados
1. Severidad media. Mismo problema de state machine artesanal.

### Ruta
`GET /admin/users`

### Metodo HTTP
`GET`

### Archivos implicados
- [app/Http/Controllers/AdminController.php](../app/Http/Controllers/AdminController.php)
- [resources/js/Pages/Admin/Users.jsx](../resources/js/Pages/Admin/Users.jsx)

### Flujo real detectado
Lista usuarios.

### Problemas encontrados
1. Severidad media. Sin paginacion y sin filtrado.
2. Severidad media. La UI usa formularios HTML sin token CSRF visible ni confirmaciones.

### Ruta
`POST /admin/users/{user}/toggle-admin`

### Metodo HTTP
`POST`

### Archivos implicados
- [app/Http/Controllers/AdminController.php](../app/Http/Controllers/AdminController.php)
- [resources/js/Pages/Admin/Users.jsx](../resources/js/Pages/Admin/Users.jsx)

### Flujo real detectado
Invierte `is_admin` del usuario objetivo y guarda.

### Que se supone que hace
Gestionar privilegios admin.

### Que hace realmente
Permite escalado o revocacion instantanea sin confirmacion, sin restricciones y sin auditoria.

### Problemas encontrados
1. Severidad critica. Cualquier admin puede promover o degradar a cualquier otro usuario con un click.
2. Severidad alta. No hay proteccion contra auto-democion accidental o contra dejar al sistema sin admins.

### Impacto funcional o de seguridad
Critico de seguridad organizativa.

### Evidencia tecnica concreta
`$user->is_admin = !$user->is_admin;` en [app/Http/Controllers/AdminController.php](../app/Http/Controllers/AdminController.php); la UI [resources/js/Pages/Admin/Users.jsx](../resources/js/Pages/Admin/Users.jsx) no pide confirmacion.

### Propuesta exacta de correccion
Cambio minimo: añadir confirmacion y prohibir auto-democion si es el ultimo admin.

Refactor correcto: policies, roles y auditoria de cambios de privilegios.

### Ruta
`GET /admin/products`

### Metodo HTTP
`GET`

### Archivos implicados
- [app/Http/Controllers/AdminController.php](../app/Http/Controllers/AdminController.php)
- [resources/js/Pages/Admin/Products.jsx](../resources/js/Pages/Admin/Products.jsx)

### Flujo real detectado
Lista productos con categoria.

### Problemas encontrados
1. Severidad media. Sin paginacion.

### Ruta
`GET /admin/products/create`

### Metodo HTTP
`GET`

### Archivos implicados
- [app/Http/Controllers/AddProdukController.php](../app/Http/Controllers/AddProdukController.php)
- [resources/js/Pages/Admin/AddProduct.jsx](../resources/js/Pages/Admin/AddProduct.jsx)

### Flujo real detectado
Misma pantalla que la publica `/products/add`, pero ahora dentro de admin.

### Problemas encontrados
1. Severidad alta. Duplica una feature publica y otra protegida con el mismo backend.

### Ruta
`POST /admin/products`

### Metodo HTTP
`POST`

### Archivos implicados
- [app/Http/Controllers/AddProdukController.php](../app/Http/Controllers/AddProdukController.php)

### Flujo real detectado
Misma creacion de producto que la publica `/products/store`.

### Problemas encontrados
1. Severidad alta. Duplicacion de endpoint protegido y endpoint publico para la misma operacion.

### Ruta
`POST /admin/products/{product}/delete`

### Metodo HTTP
`POST`

### Archivos implicados
- [app/Http/Controllers/AdminController.php](../app/Http/Controllers/AdminController.php)
- [resources/js/Pages/Admin/Products.jsx](../resources/js/Pages/Admin/Products.jsx)

### Flujo real detectado
Borra producto directamente.

### Problemas encontrados
1. Severidad alta. Delete destructivo por `POST`.
2. Severidad alta. No valida dependencias con pedidos.
3. Severidad media. La UI no pide confirmacion.

### Ruta
`GET /admin/categories`

### Metodo HTTP
`GET`

### Archivos implicados
- [app/Http/Controllers/AdminController.php](../app/Http/Controllers/AdminController.php)
- [resources/js/Pages/Admin/Categories.jsx](../resources/js/Pages/Admin/Categories.jsx)

### Flujo real detectado
Lista categorias.

### Problemas encontrados
1. Severidad baja. Sin paginacion.

### Ruta
`POST /admin/categories/{category}/delete`

### Metodo HTTP
`POST`

### Archivos implicados
- [app/Http/Controllers/AdminController.php](../app/Http/Controllers/AdminController.php)

### Flujo real detectado
Borra categoria directamente.

### Problemas encontrados
1. Severidad alta. Delete destructivo por `POST`.
2. Severidad alta. No queda claro el efecto en productos asociados.

### Ruta
`POST /admin/categories/store`

### Metodo HTTP
`POST`

### Archivos implicados
- [app/Http/Controllers/AdminController.php](../app/Http/Controllers/AdminController.php)

### Flujo real detectado
Valida `name` y `slug` y crea categoria.

### Problemas encontrados
1. Severidad media. No hay proteccion explicita frente a categorias reservadas de sistema como `general` si ya se usan operacionalmente.

### Ruta
`GET /admin/banners`

### Metodo HTTP
`GET`

### Archivos implicados
- [app/Http/Controllers/AdminController.php](../app/Http/Controllers/AdminController.php)
- [resources/js/Pages/Admin/Banners.jsx](../resources/js/Pages/Admin/Banners.jsx)

### Flujo real detectado
Lista banners.

### Problemas encontrados
Sin hallazgos graves mas alla de falta de paginacion.

### Ruta
`POST /admin/banners/{banner}/delete`

### Metodo HTTP
`POST`

### Archivos implicados
- [app/Http/Controllers/AdminController.php](../app/Http/Controllers/AdminController.php)

### Flujo real detectado
Borra banner.

### Problemas encontrados
1. Severidad media. Delete por `POST` y sin confirmacion visible.

### Ruta
`POST /admin/banners/store`

### Metodo HTTP
`POST`

### Archivos implicados
- [app/Http/Controllers/AdminController.php](../app/Http/Controllers/AdminController.php)

### Flujo real detectado
Valida `title` e `image_url` y crea banner.

### Problemas encontrados
1. Severidad baja. `image_url` se valida como string, no como URL.

### Ruta
`GET /admin/reviews`

### Metodo HTTP
`GET`

### Archivos implicados
- [app/Http/Controllers/AdminController.php](../app/Http/Controllers/AdminController.php)
- [resources/js/Pages/Admin/Reviews.jsx](../resources/js/Pages/Admin/Reviews.jsx)

### Flujo real detectado
Carga todas las reviews con producto y usuario.

### Problemas encontrados
1. Severidad media. Sin paginacion.

### Ruta
`POST /admin/reviews/{review}/delete`

### Metodo HTTP
`POST`

### Archivos implicados
- [app/Http/Controllers/AdminController.php](../app/Http/Controllers/AdminController.php)

### Flujo real detectado
Borra review.

### Problemas encontrados
1. Severidad media. Delete por `POST` y sin auditoria.

### Ruta
`POST /admin/temporary-products/import`

### Metodo HTTP
`POST`

### Archivos implicados
- [app/Http/Controllers/Admin/TemporaryProductImportController.php](../app/Http/Controllers/Admin/TemporaryProductImportController.php)

### Flujo real detectado
Valida un lote de productos scrapeados, crea `TemporaryProduct` e imagenes relacionadas dentro de una transaccion y devuelve JSON.

### Problemas encontrados
1. Severidad media. No hay deduplicacion por `product_url`, titulo u otra huella, por lo que la ingesta puede multiplicar ruido.

### Ruta
`GET /admin/logs`

### Metodo HTTP
`GET`

### Archivos implicados
- [app/Http/Controllers/AdminController.php](../app/Http/Controllers/AdminController.php)
- [resources/js/Pages/Admin/Logs.jsx](../resources/js/Pages/Admin/Logs.jsx)

### Flujo real detectado
Lee completo `storage/logs/laravel.log`, lo parte por lineas y lo renderiza.

### Problemas encontrados
1. Severidad media. Puede cargar logs grandes enteros a memoria y al navegador.
2. Severidad media. Expone datos sensibles de logs a cualquier admin sin filtrado.

### Ruta
`GET /admin/stats`

### Metodo HTTP
`GET`

### Archivos implicados
- [app/Http/Controllers/AdminController.php](../app/Http/Controllers/AdminController.php)
- [resources/js/Pages/Admin/Stats.jsx](../resources/js/Pages/Admin/Stats.jsx)

### Flujo real detectado
Calcula agregados, top products y recent orders en cada visita.

### Problemas encontrados
1. Severidad media. Sin cache ni paginacion.

### Ruta
`GET /admin/coupons`

### Metodo HTTP
`GET`

### Archivos implicados
- [app/Http/Controllers/CouponController.php](../app/Http/Controllers/CouponController.php)
- [resources/js/Pages/Admin/Coupons.jsx](../resources/js/Pages/Admin/Coupons.jsx)

### Flujo real detectado
Lista cupones y renderiza pantalla de CRUD.

### Problemas encontrados
1. Severidad media. La UI usa formularios HTML simples sin token visible ni confirmacion para deletes.

### Ruta
`GET /admin/coupons/create`

### Metodo HTTP
`GET`

### Archivos implicados
- [app/Http/Controllers/CouponController.php](../app/Http/Controllers/CouponController.php)

### Flujo real detectado
Alias que devuelve la misma lista de cupones.

### Problemas encontrados
1. Severidad baja. Naming enganoso: `create` no abre una pantalla de creacion separada, solo reutiliza index.

### Ruta
`POST /admin/coupons/store`

### Metodo HTTP
`POST`

### Archivos implicados
- [app/Http/Controllers/CouponController.php](../app/Http/Controllers/CouponController.php)
- [resources/js/Pages/Admin/Coupons.jsx](../resources/js/Pages/Admin/Coupons.jsx)

### Flujo real detectado
Valida y crea cupon.

### Problemas encontrados
1. Severidad media. La UI no expone todos los campos soportados por backend como `description`, `min_subtotal`, `is_active`, por lo que el CRUD visible es parcial.

### Ruta
`POST /admin/coupons/{coupon}/delete`

### Metodo HTTP
`POST`

### Archivos implicados
- [app/Http/Controllers/CouponController.php](../app/Http/Controllers/CouponController.php)
- [resources/js/Pages/Admin/Coupons.jsx](../resources/js/Pages/Admin/Coupons.jsx)

### Flujo real detectado
Borra cupon.

### Problemas encontrados
1. Severidad media. Delete por `POST`.

### Ruta
`POST /admin/coupons/{coupon}/update`

### Metodo HTTP
`POST`

### Archivos implicados
- [app/Http/Controllers/CouponController.php](../app/Http/Controllers/CouponController.php)
- [resources/js/Pages/Admin/Coupons.jsx](../resources/js/Pages/Admin/Coupons.jsx)

### Flujo real detectado
Actualiza cupon via validacion compartida.

### Problemas encontrados
1. Severidad media. La UI solo edita subconjunto de campos, dejando un backend mas rico que el formulario visible.

### Ruta
`GET /admin/settings`

### Metodo HTTP
`GET`

### Archivos implicados
- [app/Http/Controllers/AdminController.php](../app/Http/Controllers/AdminController.php)
- [resources/js/Pages/Admin/Settings.jsx](../resources/js/Pages/Admin/Settings.jsx)

### Flujo real detectado
Carga todas las settings y las pinta como formulario dinamico editable.

### Problemas encontrados
1. Severidad alta. La propia UI permite crear nuevas claves arbitrarias (`new_key`, `new_value`).

### Ruta
`POST /admin/settings/update`

### Metodo HTTP
`POST`

### Archivos implicados
- [app/Http/Controllers/AdminController.php](../app/Http/Controllers/AdminController.php)
- [resources/js/Pages/Admin/Settings.jsx](../resources/js/Pages/Admin/Settings.jsx)

### Flujo real detectado
Itera por cada campo del request salvo `_token` y hace `Setting::updateOrCreate(['key' => $key], ['value' => $value])`.

### Que se supone que hace
Actualizar configuracion global controlada.

### Que hace realmente
Permite inyectar o sobrescribir cualquier clave enviada por cliente.

### Problemas encontrados
1. Severidad critica. Sin whitelist de claves.
2. Severidad alta. La UI ya incentiva esta inyeccion con `Nuevo campo`.

### Impacto funcional o de seguridad
Impacto critico de integridad y configuracion arbitraria.

### Evidencia tecnica concreta
`foreach ($request->except('_token') as $key => $value)` en [app/Http/Controllers/AdminController.php](../app/Http/Controllers/AdminController.php) y `new_key/new_value` en [resources/js/Pages/Admin/Settings.jsx](../resources/js/Pages/Admin/Settings.jsx).

### Propuesta exacta de correccion
Cambio minimo: whitelist estricta de claves editables.

Refactor correcto: formulario tipado por grupos de settings, no KV libre.

### Ruta
`GET /admin/debug`

### Metodo HTTP
`GET`

### Archivos implicados
- [routes/web.php](../routes/web.php)

### Flujo real detectado
Devuelve JSON con `user`, `is_admin` y mensaje de acceso.

### Problemas encontrados
1. Severidad media. Endpoint debug expone datos del usuario admin autenticado y no aporta valor de negocio en produccion.

### Propuesta exacta de correccion
Eliminar en produccion o proteger por entorno.

---

## 15. Herramientas admin fuera del prefijo /admin

### Ruta
`GET /api/scripts`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`, `auth`, `admin`

### Archivos implicados
- [routes/web.php](../routes/web.php)

### Flujo real detectado
Devuelve la lista de scripts Python `.py` disponibles en `python_scripts`.

### Que se supone que hace
Alimentar la herramienta de ejecucion de scripts.

### Que hace realmente
Lo hace.

### Problemas encontrados
1. Severidad baja. Mezcla endpoint JSON admin fuera de `/admin`.

### Propuesta exacta de correccion
Unificar prefijos o mover a API interna coherente.

### Ruta
`POST /run-script`

### Metodo HTTP
`POST`

### Middleware aplicados
`web`, `auth`, `admin`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [app/Http/Controllers/PythonScriptController.php](../app/Http/Controllers/PythonScriptController.php)
- [resources/js/Pages/Tools/LinkAggregator.jsx](../resources/js/Pages/Tools/LinkAggregator.jsx)

### Flujo real detectado
Valida nombre de script contra allowlist del directorio, crea archivo temporal con UUID, resuelve binario Python embebido o `python` del sistema, ejecuta proceso y devuelve JSON de salida.

### Que se supone que hace
Permitir a admins ejecutar scrapers/herramientas Python.

### Que hace realmente
Funciona razonablemente y corrige el antiguo temp file fijo, pero aun mezcla dos estrategias de interprete.

### Problemas encontrados
1. Severidad media. Ambiguedad de interprete: usa python embebido si existe y `python` del PATH si no.
2. Severidad baja. Sin throttle ni cola; un admin puede disparar procesos pesados repetidos.

### Impacto funcional o de seguridad
Impacto medio operativo.

### Evidencia tecnica concreta
`$pythonBinary = file_exists($embeddedPython) ? $embeddedPython : 'python';` en [app/Http/Controllers/PythonScriptController.php](../app/Http/Controllers/PythonScriptController.php).

### Propuesta exacta de correccion
Cambio minimo: documentar binario oficial.

Refactor correcto: encapsular ejecucion Python en servicio con configuracion fija y rate limiting.

---

## 16. Ruta de test

### Ruta
`GET /test`

### Metodo HTTP
`GET`

### Middleware aplicados
`web`

### Archivos implicados
- [routes/web.php](../routes/web.php)
- [resources/js/Pages/Orders/ShippedOrders.jsx](../resources/js/Pages/Orders/ShippedOrders.jsx)

### Flujo real detectado
Renderiza una pagina de pedidos enviados con un prop `message` fijo `Hola Inertia!`.

### Que se supone que hace
Ruta de desarrollo.

### Que hace realmente
Queda expuesta publicamente en `web.php`.

### Problemas encontrados
1. Severidad media. Ruta de test abierta en produccion si no se limpia por entorno.

### Impacto funcional o de seguridad
Impacto medio de mantenimiento y superficie innecesaria.

### Evidencia tecnica concreta
La ruta esta al final de [routes/web.php](../routes/web.php) sin guard de entorno.

### Propuesta exacta de correccion
Cambio minimo: envolverla en `app()->environment('local')`.

Refactor correcto: eliminarla del archivo compartido.

---

## Resumen ejecutivo

La auditoria de [routes/web.php](../routes/web.php) revela tres fallos de primer orden:

1. Hay un bloque entero de rutas de importacion, alta y migracion de productos expuesto publicamente sin `auth` ni `admin`. Esto es el problema mas grave del archivo.
2. El dominio de pedidos y checkout esta semanticamente roto. El detalle de pedido no valida ownership, el checkout confirma pedidos demasiado pronto y el flujo de guest checkout esta implementado solo a medias.
3. El area de perfil y varias UIs admin prometen mas de lo que realmente ejecutan. Hay formularios desalineados con el backend, acciones que esperan JSON y reciben redirects, y settings admin capaces de persistir claves arbitrarias.

En conjunto, el sistema no esta principalmente fallando por sintaxis, sino por coherencia de negocio, permisos insuficientes y duplicacion de flujos que parecen equivalentes pero no lo son.

## Top 10 problemas mas graves

1. Rutas publicas de alta y migracion de productos (`/products/add`, `/products/store`, `/select-products`, `/migrate-selected-products`, `/add-temporary-product`, `/migrate-products*`, `/bulk-migrate-products`). Severidad critica.
2. `GET /orders/{order}` expone pedidos ajenos al no validar ownership. Severidad critica.
3. `POST /admin/settings/update` permite persistir claves arbitrarias. Severidad critica.
4. `GET /migrate-products` produce side effects en un GET creando la categoria `General`. Severidad alta.
5. `GET /checkout` y `POST /checkout/guest-address` venden un guest checkout que el frontend bloquea. Severidad alta.
6. `GET /contact` + `POST /contact` prometen envio correcto pero el backend referencia `ContactConfirmation` sin import y rompe el flujo. Severidad alta.
7. `PATCH /profile` valida `payment_method` pero no lo persiste y rompe telefono por mismatch de formato. Severidad alta.
8. `PUT /addresses/{address}` y `POST /addresses/store` no coinciden con lo que espera `EditProfile.jsx`. Severidad alta.
9. `GET /product/{id}` convive con un `ProductController::show()` distinto y no usado, generando dos contratos de detalle de producto. Severidad alta.
10. `GET /checkout/success` da por valido el pago usando estado en sesion y crea pedidos en `confirmado`, saltandose el workflow. Severidad critica/alta.

## Funcionalidades aparentemente no implementadas

1. Guest checkout real. Hay ruta para guardar direccion de invitado, pero la UI no permite finalizar el pago sin login.
2. Banners por categoria. `showBySlug()` envia `banners` vacios hardcodeados.
3. Nuevos productos y seasonal products como feature con backend real. Las paginas existen, pero no hay fuente de datos visible en `web.php` equivalente a la de otras promociones.
4. Establecer direccion por defecto desde la UI de perfil. El backend existe; la pantalla principal no muestra una accion clara conectada.
5. CRUD completo de cupones en UI. Backend soporta mas campos de los que la pantalla deja editar/crear.

## Incoherencias backend/frontend

1. `EditProfile.jsx` usa `fetch` y espera JSON para direcciones, mientras `AddressController` responde redirects.
2. `EditProfile.jsx` hace `PATCH` a `/addresses/{id}`, pero la ruta definida es `PUT`.
3. `Checkout.jsx` bloquea invitado aunque `CheckoutController` soporta `guest_address`.
4. `Checkout.jsx` usa `VITE_STRIPE_PUBLIC_KEY`; el backend devuelve `stripePublicKey` pero el cliente la ignora.
5. `ProfileController` valida `payment_method`; `User` no lo persiste.
6. `SocialAuthController` rellena `photo_url`; el perfil principal trabaja sobre `avatar`.
7. `GET /product/{id}` usa closure con un payload; `ProductController::show()` define otro diferente y no es el utilizado.

## Riesgos de seguridad

1. Escrituras de catalogo expuestas publicamente en rutas de migracion/alta.
2. Exposicion de pedidos de otros usuarios en `GET /orders/{order}`.
3. Inyeccion de claves arbitrarias en settings admin.
4. Escalada o degradacion admin sin controles en `POST /admin/users/{user}/toggle-admin`.
5. Ruta de test publica y endpoint debug admin innecesario.

## Riesgos de mantenimiento

1. Duplicacion de flujos de producto, avatar, promociones y admin/public para la misma operacion.
2. Muchas closures en `web.php` cargando logica que deberia vivir en controllers o services.
3. Contratos de props incoherentes entre rutas hermanas, por ejemplo categoria por id vs categoria por slug.
4. State machine de pedidos modelada en ifs dispersos en controllers y scopes con nombres enganoso.
5. Ausencia visible de policies de recurso; el proyecto depende demasiado de checks inline o binarios.

## Recomendaciones prioritarias ordenadas por impacto

1. Mover inmediatamente todas las rutas de alta/importacion/migracion de productos al grupo `auth,admin` y eliminar aliases legacy innecesarios.
2. Corregir `GET /orders/{order}` para validar ownership y cubrirlo con test.
3. Bloquear `POST /admin/settings/update` con whitelist estricta y eliminar `new_key/new_value` de la UI.
4. Reparar el workflow de checkout: validar pagos contra proveedor, usar estado inicial correcto del pedido y decidir de forma explicita si existe guest checkout real.
5. Unificar el flujo de perfil/direcciones/avatar para que UI y backend usen el mismo protocolo y los mismos campos.
6. Eliminar duplicidades de detalle de producto y promociones, dejando una unica fuente de verdad por feature.
7. Introducir policies para pedidos, productos, categorias, cupones, reviews y usuarios admin.
8. Convertir deletes destructivos de admin a metodos semanticos correctos y anadir confirmaciones/auditoria.
9. Sacar rutas de test/debug de `web.php` productivo.
10. Reducir payloads y N+1 en search, orders, logs y listas admin.
