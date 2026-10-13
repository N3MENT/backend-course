# Class 07 incident report

Completé cada sección mientras investigaba. Separé hechos de interpretaciones: un "creo que" pertenece a Hipótesis, no a Evidencia.

Autoría: Diego Silva (diegosilva.itsu@gmail.com)

## Baseline

`npm run class-07:doctor` → **Environment ready for incident response.** Los 7 checks en PASS (entorno, conexión a la base, migraciones, seed, app, test runner, fixtures de incidentes).
`npm run db:migrate` (dos veces) → sin pendientes; las migraciones 001-004 ya estaban aplicadas de la clase 06 y el seed estaba presente (heredado del taller anterior).
`npm test` → **20 pass / 17 todo.** Los 20 existentes protegen el contrato de las clases 3-6; los 17 `todo` eran los stubs que convertí en pruebas reales mientras resolvía los incidentes.
`npm run incidents:reproduce` reprodujo los tres incidentes antes de tocar código: INC-701 → 500, INC-702 → 500, OPS-703 → header/body sin requestId.

## Incident 701

### Report

"Some request identifiers return an internal server error." Un integrador estaba armando enlaces hacia solicitudes y algunos devolvían 500; "a veces funciona y a veces no".

### Reproduction

`GET /requests/not-a-number` con token válido de cualquier usuario (`ana.requester.seed@example.test`).

### Expected result

`400` con `error.code === "INVALID_REQUEST_ID"` y mensaje "Request id must be a positive integer." Debía rechazar: texto, decimales, cero, negativos y `12abc`; un id bien formado pero inexistente debía seguir siendo `404`.

### Actual result

`500 Internal Server Error`. El terminal del servidor mostraba el error técnico de PostgreSQL: mensaje de sintaxis inválida para `bigint` al pasar `NaN` a la consulta.

### Hypotheses

1. **El `Number(...)` de la ruta convertía el id en `NaN` antes de llegar al SQL** (alta probabilidad; se veía `Number(req.params.id)`). Cómo comprobé: leyendo `requests.routes.js` y rastreando el valor en `requests.store.js`. Un `NaN` pasado con parámetro `$1::bigint` es precisamente el error de PostgreSQL observado.
2. **El tipo de columna/`::bigint` en la consulta explotaba el mal formato** (misma causa de base, otra zona del stack). Cómo comprobé: revisando las migraciones 002/004 (columna `id`) y probando `12abc` — `parseInt('12abc')` devolvería `12` y funcionaría, lo que confirmaría que el formato se validaba tarde o nunca.
3. **Había un `parseInt` caprichoso en algún punto** que "arreglaba" algunos valores. Cómo comprobé: buscando `parseInt`/`Number`/`parseFloat` en `src/` — explicaría el "a veces funciona".

### Evidence

- Salida de reproducción: `[INC-701] Actual: 500 INTERNAL_ERROR`.
- El valor llegaba a la base como `NaN`: `requests.routes.js` hacía `Number(req.params.id)` y `requests.store.js` lo pasaba directo a `WHERE id = $1`. PostgreSQL no podía comparar `bigint` con `NaN` y respondía con su error técnico.
- El texto del error técnico aparecía en el terminal (lo confirmé leyendo la salida del server).

### Confirmed cause

La conversión prematura con `Number(req.params.id)` en las rutas `GET /:id`, `GET /:id/history` y `PATCH /:id` producía `NaN` para formatos no numéricos. Ese `NaN` se enviaba como parámetro `bigint` a PostgreSQL, que respondía 500 en lugar de un 400 de contrato. La aplicación no validaba el formato antes de ejecutar SQL.

### Correction

En `src/modules/requests/requests.service.js` agregué `parseRequestId(value)` que valida la cadena COMPLETA con `/^\d+$/` y descarta el cero (`Number(value) === 0`), lanzando `AppError('contract', 'INVALID_REQUEST_ID', 'Request id must be a positive integer.')` ANTES de cualquier consulta. Las rutas ahora pasan `req.params.id` crudo al service (ya no `Number(...)`), de modo que el formato se valida como lo envió el cliente y el SQL nunca se ejecuta con un valor inválido.

### Regression test

`test/errors.test.js`:
- "an alphabetic id answers 400 INVALID_REQUEST_ID, not 500".
- "decimal, zero and negative ids are rejected the same way" (`1.5`, `0`, `-3`, `12abc`).
- "a well-formed id that matches nothing still answers 404" (`999999999`) — garantiza que la corrección no convierte el 404 en 400.

Sin el fix: los tres devolvían 500 (o el tercero seguiría 500 por el `NaN`). Con el fix: 400/400/404.

## Incident 702

### Report

"Updating some priorities produces an internal server error." Un agente intentó marcar una solicitud como `critical` desde una herramienta externa y recibió 500 sin más explicación.

### Reproduction

`PATCH /requests/:id` con `{ "priority": "critical" }`, token de un agente, sobre una solicitud seed en estado `open` (p. ej. una de las que lista `GET /requests?status=open`).

### Expected result

`400` con `error.code === "INVALID_PRIORITY"` y mensaje "Priority must be low, medium or high.", tanto en `PATCH` como en `POST`. La aplicación debía validar antes del SQL (primera defensa) y la restricción `CHECK` de PostgreSQL debía conservarse intacta (segunda defensa).

### Actual result

`500 Internal Server Error`. El terminal mostraba que una restricción de PostgreSQL rechazaba el valor (`'critical'` violaba el `CHECK` de la columna `priority`).

### Hypotheses

1. **La prioridad no se validaba en la aplicación**: `createRequest` y `patchRequest` no comprobaban `priority` contra `['low','medium','high']` y dejaban que la base respondiera (alta probabilidad). Cómo comprobé: leyendo `requests.service.js` — en `createRequest` no había ningún chequeo de `priority`; en `patchRequest` había validaciones de `title` y `status` pero no de `priority`.
2. **Se había eliminado la restricción en alguna migración posterior** (improbable: las migraciones coincidían con la clase 06 y el `CHECK` estaba en `004_add_constraints_and_indexes.sql`). Cómo comprobé: inspeccionando `004` para ver que el `CHECK` seguía declarado.
3. **El cliente enviaba otro tipo (número) y la comparación fallaba** (improbable; el reporte era un string `'critical'`). Cómo comprobé: verificando el body en el contexto de la ruta.

### Evidence

- Salida de reproducción: `PATCH /requests/38 { "priority": "critical" } → 500 INTERNAL_ERROR`.
- `src/modules/requests/requests.service.js` define `PRIORITIES = ['low', 'medium', 'high']` y lo usa al LISTAR, pero ni `createRequest` ni `patchRequest` lo aplican a la prioridad enviada por el cliente.
- La migración `004_add_constraints_and_indexes.sql` declara el `CHECK` de prioridad (la segunda defensa).

### Confirmed cause

La aplicación no validaba `priority` contra el conjunto permitido antes de escribir; el valor viajaba hasta PostgreSQL y la restricción `CHECK` lo rechazaba, traduciéndose en un 500 interno en vez de un 400 de contrato. Las prioridades válidas (`low`, `medium`, `high`) existen en `PRIORITIES` desde la clase 3, pero solo se aplicaban al filtrar, no al crear/actualizar.

### Correction

En `requests.service.js`:
- En `createRequest`, tras validar `title`, validé `priority` contra `PRIORITIES` antes de abrir la transacción; si no estaba, lancé `AppError('contract', 'INVALID_PRIORITY', 'Priority must be low, medium or high.')`.
- En `patchRequest`, agregué la validación junto a las de `status`/`title`, ANTES del `withTransaction`. No toqué la migración; el `CHECK` de PostgreSQL permanece como segunda defensa.

### Regression test

`test/errors.test.js`:
- "an invalid priority answers 400 INVALID_PRIORITY before touching SQL".
- "a valid priority change still works after the fix" (`low` → `high` responde 200).
- extra: "POST with an invalid priority is rejected the same way" (`priority: 'urgent'` → 400).

Además `npm run incidents:reproduce` confirmó `[INC-702] RESOLVED`.

## Error flow

**Where is the error created?**
En `src/app-error.js` (`AppError`) para errores tipificados lanzados por servicios (contract, auth, forbidden, resource, domain) y errores no tipificados de dependencias (PostgreSQL, JSON parse) lanzados en cualquier punto del stack.

**How does it reach the error middleware?**
Express 5 reenvía automáticamente las promesas rechazadas y los errores lanzados. En `app.js`, `requestId` y `requestLogger` se ejecutaban primero, luego los routers (`/auth`, `/requests`, `/health`), después `notFound` y por último `errorHandler`. Un `next(error)` (`notFound`, `authenticate`) o una promesa rechazada en una ruta llegaba al único `errorHandler` registrado al final.

**What is returned to the client?**
Siempre el mismo contrato JSON `{ "error": { "code", "message" }, "requestId" }`:
- `AppError` → status según categoría (contract 400, auth 401, forbidden 403, resource 404, domain 409).
- JSON inválido en el body → `400 INVALID_JSON`.
- Base inalcanzable → `503 DATABASE_UNAVAILABLE`.
- Cualquier otra cosa → `500 INTERNAL_ERROR` genérico.

**What remains only in the server log?**
El nombre, mensaje y `stack` del error interno (`logger.error('internal_error', { name, message, stack })`), el origen de la base (`database_unavailable`) y los valores técnicos. Nunca viajaban en la respuesta.

## Request ID

**How did I prove that the response and log belong to the same request?**
Con `npm run incidents:reproduce`, la sonda OPS-703 hace `GET /requests/999999999` y compara:
1. el header `x-request-id` de la respuesta,
2. el campo `requestId` del body del error,
3. y luego imprime la línea de log que contiene ese mismo `requestId`.

Las tres coincidían, lo que demostraba que el error que llegó al cliente se correlacionaba con su línea de log. Además `test/traceability.test.js` captura la consola durante una petición y verifica que existe una línea JSON cuyo `requestId === header` de la respuesta, y que el log jamás contiene el token ni `Authorization`.

## AI assistance

**What did AI help me understand?**
Que un `Number(req.params.id)` convertía silenciosamente `'not-a-number'` en `NaN`, y que ese `NaN` solo explotaba al compararse con una columna `bigint` — por eso el cliente veía 500 sin relación con su entrada, y el error técnico quedaba expuesto en el terminal. También que Express 5 reenvía las promesas rechazadas por sí solo, así que el manejo central de errores no exigía try/catch en cada ruta.

**Which hypothesis did it propose?**
La hipótesis del `NaN`/`Number()` como punto de entrada del problema y la de que la prioridad no se validaba en la aplicación, dejando que la base validara (porque `PRIORITIES` no se aplicaba en escritura).

**How did I verify it?**
Lectura del código (`requests.routes.js`, `requests.service.js`), reproducción con el script de incidentes (que mostró el 500 real) y conversión de los stubs en pruebas de regresión que fallaban sin el fix y pasaban con él; el validador cerró con 12/12 PASS.

**What suggestion was incomplete or incorrect?**
La sugerencia inicial de "validar con parseInt y comparar > 0" habría aceptado `12abc` como `12`, contradiciendo el contrato del INC-701. Corregí esto validando la cadena COMPLETA con `/^\d+$/` y descartando el cero, tal como exigía el ticket.

## Remaining doubt

Me quedó la duda sobre por qué el error de PostgreSQL `bigint` no se convertía en un 500 genérico por el manejo actual (antes de los cambios, el mapeo de errores funcionaba para la respuesta), pero el mensaje técnico aparecía igualmente en el terminal — la distinción entre "respuesta controlada" y "detalle en consola" dependía de cada ruta; el middleware central la unifica. También queda por explorar en profundidad qué campos del body podrían filtrarse en logs si mañana alguien registra `req.body` entero en un módulo nuevo (la allowlist del `requestLogger` lo protege hoy, pero es una disciplina de equipo).