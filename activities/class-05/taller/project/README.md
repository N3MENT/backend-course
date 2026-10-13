# Request API v5 — Proyecto del taller (Clase 05)

Autor: Diego Silva — diegosilva.itsu@gmail.com

Este repositorio es mi entrega del taller autodirigido de la Clase 05. Arranca
desde mi API de la Clase 04 y suma la infraestructura de la Clase 05 para
cerrar el contrato de la v5: registro, login, tokens, autenticación, propiedad
y permisos. El starter es el plan B garantizado; sobre él construí y validé,
estación por estación.

## Punto de partida

| Pieza | Estado |
| ----- | ------ |
| `database/migrations/001..002` | Heredadas de la Clase 04 |
| `database/migrations/003..005` | Listas — se aplican en orden (estación 0) |
| `src/database/` (pool, transaction) | Listas |
| `src/app-error.js` · `src/http/respond-error.js` | Errores tipados compartidos (401/403 ya mapeados) |
| `src/modules/auth/password.js` | Helper scrypt completo — no diseño criptografía propia |
| `src/middleware/cors.js` | Para la entrega 05A |
| `scripts/validate-class-05.js` | La especificación ejecutable del taller |
| `activities/class-05/` | Estación 1 — diseño antes de tocar código |
| `src/modules/users/` | Estación 2 (store + mapper) |
| `src/modules/auth/auth.service.js` | Estaciones 2, 3 y 4 |
| `src/modules/auth/token.js` | Estación 4 (guiada) |
| `src/middleware/authenticate.js` | Estación 5 |
| `src/modules/requests/*` | Estaciones 6 y 7 (llega como en la Clase 04, con notas de evolución) |
| `src/modules/requests/request.policy.js` | Estación 7 |

## Estación 0 — Preparar el campo

```bash
npm install
cp .env.example .env    # DATABASE_URL de tu proyecto + JWT_SECRET propio
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
                        # → pega el resultado como JWT_SECRET en .env
npm run db:check
# SQL Editor de Supabase: 003, 004 y 005, en orden
npm run validate:class-05 -- --stage setup
```

## El ciclo de cada estación

```text
leer el requisito → predecir el riesgo → decidir → implementar →
intentar el abuso → npm run validate:class-05 -- --stage <name> → corregir
```

Etapas del validador: `setup` · `access-design` · `register` · `password` ·
`login` · `authentication` · `ownership` · `authorization` (sin argumentos:
boss battle integral).

## Reglas que no se negocian

- Solo uso IA después del checkpoint `class-05-access-design`.
- `.env` es local y jamás se sube; `.env.example` solo lleva placeholders.
- Las passwords no se registran en logs ni viajan en respuestas, nunca.
- `createdBy` y `changedBy` salen del token verificado, jamás del body.
- Las reglas de estado de la Clase 03 siguen vigentes para todos los roles.

## La prueba reina

```bash
npm run validate:class-05
```

`RESULT: 12/12 · CLASS 05 COMPLETED`, con el servidor apagado y encendido de
nuevo antes, para recordar que nada vive en memoria.
