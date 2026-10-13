# Bitácora de la Clase 06

Autor: Diego Silva — diegosilva.itsu@gmail.com

Escribo esta bitácora durante el taller, no al final, para que registre el
proceso real y no una versión idealizada.

## Entorno

¿Qué configuré? ¿Qué comando confirmó que funcionaba?

- Copié `project/.env.example` a `.env` y completé `DATABASE_URL` (Transaction
  pooler de Supabase, puerto 6543 con `?pgbouncer=true`) y `JWT_SECRET`
  generado con `npm run generate:secret`. El Session pooler (5432) reseteaba la
  conexión (`ECONNRESET`), igual que en la Clase 05.
- Corrí `npm install` + `npm run db:migrate` (idempotente: la segunda ejecución
  quedó `[SKIPPED]` en todas) + `npm run db:seed`.
- Lo confirmé con `npm run class-06:doctor` → `Environment ready.` y 10/10 PASS.

## Recorrido de una petición

¿Dónde entra la petición? ¿Dónde se comprueba la autenticación? ¿Dónde la
autorización? ¿Dónde se accede a PostgreSQL?

- Entra por `src/app.js`: CORS → `express.json()` → routers.
- `/requests` está montada en `app.js` detrás del middleware `authenticate`
  (`src/middleware/authenticate.js`), que valida el JWT y construye `req.auth`;
  sin token válido responde 401 y el router nunca corre.
- Autorización: `request.policy.js` (el agente ve todo; el requester solo lo
  propio), invocada desde `requests.service.js`. Para la nueva ruta reutilicé
  `canViewHistory` (misma política de "view").
- PostgreSQL: solo `requests.store.js` (queries parametrizadas); cada operación
  de escritura es una transacción vía `withTransaction`.

## Bug corregido

¿Qué pasaba? ¿Qué debía pasar? ¿Qué archivo modifiqué? ¿Qué prueba protege el
comportamiento?

- `GET /requests?status=closed` con un filtro válido sin coincidencias respondía
  `404 REQUEST_NOT_FOUND`.
- Debe responder `200` con `[]`: una colección filtrada vacía no es un recurso
  faltante; el `404` queda reservado para recursos individuales (Clase 03).
- Modifiqué `src/modules/requests/requests.service.js` (`listRequests`):
  eliminé el `throw` cuando no hay filas y devolví el arreglo vacío.
- Prueba de regresión: "a valid filter with zero matches answers 200 with an
  empty array (regression BUG-106)" en `test/requests.test.js`.

## Feature implementada

¿Qué hace `GET /requests/:id/history`? ¿Quién puede usarlo? ¿Cómo se ordena el
resultado?

- Devuelve el historial de cambios de una solicitud como arreglo de eventos
  (`id`, `type`, `fromStatus`/`toStatus` o `fromPriority`/`toPriority`,
  `createdAt`), usando el mapper `mapHistoryEventRow` (cada evento expone solo
  sus propios campos; `changed_by` queda interno).
- El dueño (requester) sobre solicitudes propias y cualquier agente. Un
  requester ajeno recibe el mismo `404 REQUEST_NOT_FOUND` que una solicitud
  inexistente (no revelo existencia). Sin token, `401`. Una solicitud sin
  eventos devuelve `200 []`.
- Orden: más antiguos primero, con `id` como desempate estable cuando dos
  eventos comparten timestamp (`ORDER BY created_at, id` en `findHistory`).
- Implementación: `getRequestHistory` en `requests.service.js` (reutiliza
  `canViewHistory` y `findHistory`) y ruta `GET /:id/history` en
  `requests.routes.js`, declarada antes de `GET /:id`.

## Prueba explicada

Elijo una prueba y describo qué datos prepara, qué acción ejecuta, qué comprueba
y qué regla protege.

- Elegí la prueba de regresión de BUG-106 (en `test/requests.test.js`).
- Prepara: un usuario nuevo de pruebas (email único con `runId`) y su token.
- Acción: `GET /requests?status=closed` con ese token (usuario sin solicitudes,
  filtro válido sin coincidencias).
- Comprueba: `status === 200` y cuerpo `deepEqual []`.
- Protege la regla: una colección vacía no equivale a un recurso faltante (no es
  404) y los filtros válidos nunca disparan `REQUEST_NOT_FOUND`.

## Asistencia de IA

¿Qué me ayudó a entender? ¿Qué código ayudó a producir? ¿Qué verifiqué yo?
¿Qué sugerencia fue incorrecta o incompleta?

- Me ayudó a ubicar la causa del bug en `listRequests`, a entender la distinción
  entre colección vacía y recurso faltante, y el flujo de autorización por capas
  (ruta → servicio → policy → store).
- Produjo: el cambio mínimo en `listRequests`, el servicio `getRequestHistory`,
  la ruta `GET /:id/history` y la prueba de regresión.
- Verifiqué yo mismo: reproduje el 404 con el seed (`ana`), confirmé `200 []`
  tras el fix, validé los `401`/`404` de contratos adyacentes y corrí
  `npm run validate:class-06` hasta `FINAL RESULT: PASSED`.
- Sugerencia incompleta: al principio la ruta `/:id/history` se colocó tras
  `/:id`; tuve que declararla antes para que Express no la capturara como `:id`.
  Es un matiz del orden de rutas, no de la lógica de negocio.

## Duda pendiente

¿Qué parte todavía no entiendo?

- Los matices del orden de coincidencia de Express entre rutas paramétricas
  (`/:id` frente a `/:id/history`) y cómo conviene estructurarlas en proyectos
  más grandes (agrupación con `router.use` o submódulos).
- El rol exacto del Transaction pooler en Supabase: por qué el Session pooler
  reseteaba la conexión aquí pero no en otros entornos.
