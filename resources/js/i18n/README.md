# i18n (frontend)

Implementación mínima para Inertia + React.

- Diccionarios: `resources/js/i18n/{es,en,fr}.json`
- Hook: `useI18n()` en `resources/js/i18n/index.js`

Uso:

- `const { t } = useI18n();`
- `t('nav.deals_today')`
- Con variables: `t('home.welcome_user', { name: user.name })`

Notas:

- El locale viene del backend vía Inertia props (`locale`) y se cambia con `POST /locale`.
- Fallback: si falta una key, cae a `es`, y si sigue faltando devuelve la key.
