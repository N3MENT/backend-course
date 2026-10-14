# System dossier

Un solo expediente para todo el análisis del taller. Regla de oro: cada
afirmación cita su evidencia (archivo y función, prueba, tabla o salida de
comando) o se declara como duda en la sección 9. "El service maneja la
lógica" sin nombres no cuenta como inventario.

## 1. How the system starts

* Arranque: `npm start` ejecuta `node src/server.js` (`package.json`, script
  `"start"`). `src/server.js:4` lee `PORT` (`process.env.PORT ?? 3000`) y
  `src/server.js:6` hace `app.listen(PORT, …)`. **Solo `src/server.js` abre
  el puerto; no conoce rutas** (comentario `src/server.js:1`).
* La aplicación la construye `src/app.js` (la exporta en la línea 43 y
  nunca escucha). El orden de middlewares está fijado en las líneas 25–41:

  ```js
  25: app.use(corsPolicy);
  26: app.use(requestId);
  27: app.use(requestLogger);
  28: app.use(express.json());
  30: app.use(healthRoutes);              // público
  34: app.use('/auth', authRoutes);
  38: app.use('/requests', authenticate, requestsRoutes);
  40: app.use(notFound);
  41: app.use(errorHandler);
  ```

* Antes de que nada de eso exista, dos imports fallan sin `.env` completo:
  `src/database/pool.js:10–12` lanza `"DATABASE_URL is required."` y
  `src/modules/auth/token.js:8–10` lanza `"JWT_SECRET is required."` —
  comprobado en vivo: `npm run doctor` hoy detiene en el check 01
  ("Environment configured FAIL") por `.env` con ambos valores vacíos.
* Qué queda escuchando: únicamente el servidor HTTP de
  `src/server.js:6`. No hay handler de `SIGTERM`/`SIGINT` ni `pool.end()`
  en el camino de arranque (búsqueda en `src/` sin resultados); solo los
  scripts y los `after()` de las pruebas cierran el pool.

## 2. Main components

| Componente | Archivo o recurso | Responsabilidad | Evidencia | Duda |
| --- | --- | --- | --- | --- |
| Punto de entrada | `src/server.js` | Leer `PORT` y abrir el puerto | `src/server.js:4`, `:6` | — |
| Construcción de la app | `src/app.js` | Montar middlewares y módulos en orden; exporta `app` sin escuchar | `src/app.js:23–43` | — |
| Router principal | `src/modules/requests/requests.routes.js` | 6 rutas (`GET /`, `GET /:id`, `GET /:id/history`, `POST /`, `POST /:id/claim`, `PATCH /:id`); sin SQL ni try/catch | `requests.routes.js:28–31` (`GET /:id`) | — |
| Módulos | `src/modules/requests/` y `src/modules/auth/`, `src/modules/users/` | Requests: routes+service+store+policy+mapper+status. Auth: routes+service+token+password | `ls src/modules/*` | — |
| Middleware global | `src/middleware/cors.js`, `request-id.js`, `request-logger.js`, `not-found.js`, `error-handler.js` | CORS con origen único, id trazable, log por allow-list, 404 central, traducción única de errores | `src/app.js:25–28,40–41` | — |
| Autenticación | `src/middleware/authenticate.js` + `src/modules/auth/token.js` | Verifica Bearer JWT (jose, HS256) y asigna `req.auth` | `authenticate.js:29` (`verifyToken`), `:43` (`req.auth = { userId: payload.sub, role: payload.role }`) — único punto de asignación | — |
| Autorización (policies) | `src/modules/requests/request.policy.js` | Predicados puros sobre `actor` y `request`: sin Express, sin SQL, sin imports | `request.policy.js:20–23` (`canViewRequest`), `:58–69` (`canClaimRequest`) | — |
| Services | `src/modules/requests/requests.service.js` | Casos de uso: `listRequests`, `getRequest`, `createRequest`, `patchRequest`, `getHistory`, `claimRequest` | Encabezado `requests.service.js:1–4` y exports | `getRequest` ignora `actor` (ver §3 y §8) |
| Stores / acceso a datos | `src/modules/requests/requests.store.js`, `src/modules/users/users.store.js` | Todo el SQL; identificadores solo literales, valores con `$1…$n` | `requests.store.js:50–56` (`findById`: `WHERE id = $1`); comentario `:21–22` | — |
| Conexión PostgreSQL | `src/database/pool.js`, `src/database/transaction.js` | `pg.Pool` con `connectionString`; `withTransaction(work)` con BEGIN/COMMIT/ROLLBACK | `pool.js:14–16`; `transaction.js:6–22` | `ssl` no se configura en código (depende de la URL) — §9 |
| Manejo de errores | `src/app-error.js`, `src/middleware/error-handler.js` | `AppError(category, code, message)`; un solo punto de traducción a HTTP | `app-error.js:9–15`; `error-handler.js:33–77`; forma `{ error: { code, message }, requestId }` en `errorBody` (`error-handler.js:29–31`) | — |
| Logging | `src/logging/logger.js` + `src/middleware/request-logger.js` | JSON por línea con campos en allow-list | `request-logger.js:21–35`; prueba `test/traceability.test.js:87–99` (ni token ni `Bearer` aparecen) | — |
| Health / readiness | `src/routes/health.routes.js` | `GET /health` liveness sin DB; `GET /ready` con `SELECT 1` inyectable | `health.routes.js:27–29` vs `:31–43`; montaje público `src/app.js:30` | — |
| Pruebas | `test/*.test.js` (11 archivos) | Suite serial con DB + políticas puras sin DB | `package.json:15–20` (`npm test`, `npm run test:policy`) | — |
| Scripts operativos | `scripts/migrate.js`, `scripts/seed.js`, `scripts/check-environment.js` | Migraciones con ledger `schema_migrations`; seed repetible; doctor de 7 checks | `migrate.js:20–25`; `seed.js:4–7`; `check-environment.js` | — |
| Dependencias externas | `package.json` | express `^5.1.0` (5.2.1 instalada), pg `^8.13.1`, jose `^5.9.6`, supertest `^7.0.0` | `package.json:29–37` | Express 5: los handlers `async` lanzan y el framework enruta la promesa al error handler |

## 3. Request trace

Recorrido de `GET /requests/:id`, en orden, con archivo y función:

1. Router: `src/app.js:38` monta `app.use('/requests', authenticate, requestsRoutes)` y
   `src/modules/requests/requests.routes.js:28–31` define
   `router.get('/:id', async (req, res) => { const id = parseIdParam(req.params.id); res.status(200).json(await getRequest(req.auth, id)); })`.
2. Middlewares que atraviesa: `corsPolicy` (`src/middleware/cors.js`),
   `requestId` (`src/middleware/request-id.js:12–23`),
   `requestLogger` (`src/middleware/request-logger.js`),
   `express.json()` (`src/app.js:28`), luego `authenticate`
   (`src/app.js:38`).
3. Validación del parámetro `id`: `parseIdParam` de `src/http/parse-id.js:16–22`
   (regex `^[1-9][0-9]{0,17}$`), invocado en `requests.routes.js:29`;
   lanza `AppError('contract','INVALID_REQUEST_ID', …)`.
4. Nacimiento de la identidad: `src/middleware/authenticate.js:29` llama a
   `verifyToken` (`src/modules/auth/token.js:35–42`, jose HS256 con
   issuer/audience) y `authenticate.js:43` escribe
   `req.auth = { userId: payload.sub, role: payload.role }` — la única
   fuente confiable de identidad para el resto de la petición.
5. Policy consultada: **NO, en este endpoint.**
   `getRequest` (`src/modules/requests/requests.service.js:86–93`) recibe
   `actor` y nunca lo usa: llama a `findById` y devuelve el mapeo. Es el
   BUG-901. Contraste: `patchRequest` sí consulta `canViewRequest`
   (`requests.service.js:162`) y `getHistory` consulta `canViewHistory`
   (`requests.service.js:224`), que delega en `canViewRequest`
   (`request.policy.js:25–27`).
6. Service: `getRequest(actor, id)` — `requests.service.js:86–93`;
   `if (!row) throw notFound(id)` con `notFound` definido en `:39–41`
   (`AppError('resource','REQUEST_NOT_FOUND', …)`).
7. Store y query: `findById` — `src/modules/requests/requests.store.js:50–56`,
   `SELECT … WHERE id = $1` (parametrizada).
8. Transformación fila → JSON: `mapRequestRow`
   (`src/modules/requests/request.mapper.js`), snake_case → camelCase.
9. Respuesta y errores: éxito `res.status(200).json(...)` en
   `requests.routes.js:30`; cualquier error `AppError` cae en
   `src/middleware/error-handler.js` (`CATEGORY_STATUS` `:18–24`,
   resource→404) y responde `{ error: { code, message }, requestId }`
   (`errorBody`, `:29–31`).
10. Pruebas que cubren este recorrido: `test/request-detail.test.js`
    (sin token→401 `:19–22`; id inexistente→404 `:24–33`; owner→200 con
    congelamiento de schema `:35–52`; agent→200 `:54–67`) — el caso
    "requester ajeno→404" está como stub `{ todo: true }` (`:69–75`) y es
    la regresión que BUG-901 pide; `test/requests-history.test.js` ya
    ejemplifica el 404 idéntico a ausente para el historial.

## 4. Database inventory

Migraciones (`database/migrations/`, ledger `schema_migrations` creado por
`scripts/migrate.js:20–25`, aplicadas en transacción `:47–50`):

| Migración | Crea |
| --- | --- |
| `001_create_users.sql` | `users`: `id UUID PK DEFAULT gen_random_uuid()`, `email TEXT NOT NULL UNIQUE`, `password_hash TEXT NOT NULL`, `role TEXT DEFAULT 'requester' CHECK (role IN ('requester','agent'))`, `created_at TIMESTAMPTZ` |
| `002_create_requests.sql` | `requests`: `id BIGINT GENERATED ALWAYS AS IDENTITY PK`, `title VARCHAR(200) NOT NULL`, `description TEXT`, `priority DEFAULT 'medium'`, `status DEFAULT 'open'`, `created_by UUID NOT NULL FK → users(id) ON DELETE RESTRICT`, `created_at`/`updated_at` |
| `003_create_request_history.sql` | `request_history`: `request_id FK → requests(id)`, `type CHECK IN ('status_changed','priority_changed')`, `from_status`/`to_status`, `from_priority`/`to_priority`, `changed_by FK → users(id)` |
| `004_add_constraints_and_indexes.sql` | CHECKs `requests_priority_check` (low/medium/high) y `requests_status_check` (open/in_progress/resolved/closed/cancelled); índices `idx_requests_created_by`, `idx_requests_status`, `idx_request_history_request_order` |
| `005_add_request_assignment.sql` | `requests.assigned_to UUID NULL FK → users(id)` + `idx_requests_assigned_to`; ensancha el CHECK de `type` a `('status_changed','priority_changed','request_claimed')` |

Semilla (`scripts/seed.js`): 3 usuarios con hash scrypt real
(`ana.requester.seed@example.test`, `luis.requester.seed@example.test`,
`maria.agent.seed@example.test` — `seed.js:14–18` y `:56` usando
`hashPassword` de `src/modules/auth/password.js`) y 6 solicitudes
(`seed.js:25–39`) con eventos de historial. Repetible por diseño: solo
borra los datos de ESOS usuarios (historial primero, luego requests,
`seed.js:66–72`) antes de reinsertar, todo en una transacción — nunca
TRUNCATE.

## 5. Authentication and authorization

* JWT: `src/modules/auth/token.js` — HS256 con `jose`
  (`SignJWT`/`jwtVerify`, `token.js:4`), claims `sub` (id de usuario),
  `role`, `iss`, `aud`, `exp` (`token.js:21–31`); verificación en
  `token.js:35–42` exige algoritmo, issuer y audience.
* `req.auth`: lo asigna únicamente `src/middleware/authenticate.js:43`
  (`{ userId, role }`) tras validar `payload.sub` y `payload.role ∈
  {requester, agent}` (`:37`). Sin token o token inválido →
  `AppError('auth', …)` (`:18, :33`) que el error handler traduce a 401.
* Dónde viven las reglas: `src/modules/requests/request.policy.js` —
  funciones puras (cero imports). Ejemplo de regla, `canViewRequest`
  (`:20–23`):

  ```js
  export function canViewRequest(actor, request) {
    if (actor.role === 'agent') return true;
    return request.createdBy === actor.userId;
  }
  ```

* Su prueba: `test/request-access-policy.test.js` la importa y la ejercita
  con objetos planos (sin Express ni base), pero los tres casos están como
  stub `{ todo: true }` (`:19, :24, :29`) — hoy pasan sin probar nada
  (comentario del archivo `:7–9`). En cambio `canClaimRequest` sí tiene
  5 pruebas activas en `test/request-policy.test.js` (`:16–52`), también
  puras. `npm run test:policy` ejecutado hoy: 5 pass, 3 todo, 0 fail.
* Registro siempre crea `requester`: `role` está en la lista de campos
  rechazados (`SERVER_CONTROLLED_FIELD`) en el registro
  (`src/modules/auth/auth.service.js`, rechazo de campos controlados por
  el servidor) y el store de usuarios no lo toma como parámetro.

## 6. Errors, logs and operational checks

* Formato de error: único punto de traducción
  `src/middleware/error-handler.js`. Cuerpo
  `{ error: { code, message }, requestId }` (`errorBody`, `:29–31`);
  categorías→status en `CATEGORY_STATUS` (`:18–24`): contract 400, auth
  41, forbidden 403, resource 404, domain 409. JSON inválido → 400
  `INVALID_JSON` (`:51–55`); códigos de infraestructura
  (`ECONNREFUSED`, `ENOTFOUND`, `ETIMEDOUT`, `EAI_AGAIN`, `57P03`) → 503
  `DATABASE_UNAVAILABLE` sin exponer la cadena de conexión (`:27, :57–63`);
  lo inesperado → 500 `INTERNAL_ERROR` con mensaje genérico y el detalle
  SOLO al log (`:68–76`).
* requestId: `src/middleware/request-id.js:12–23` — acepta
  `X-Request-Id` entrante solo si cumple `^[A-Za-z0-9._-]{1,64}$`, si no
  genera `req_${randomUUID()}`; se ecoa en la respuesta (`:21`) y viaja al
  cuerpo de error y a cada línea de log (`error-handler.js:40`,
  `request-logger.js:22`). Propiedad verificada por
  `test/traceability.test.js`.
* Logs: allow-list explícita en `request-logger.js:21–35` —
  `requestId`, `method`, `path` (no la query), `status`, `durationMs`,
  `userId` solo si existe `req.auth` y `errorCode` si existe. **Nunca**
  se registran headers, bodies, tokens ni contraseñas: lo demuestra
  `test/traceability.test.js:87–99` (ninguna línea de log contiene
  `Bearer` ni el token).
* `GET /health` vs `GET /ready` (`src/routes/health.routes.js`): `/health`
  (`:27–29`) responde `{status:'ok'}` sin tocar PostgreSQL (liveness);
  `/ready` (`:31–43`) ejecuta `SELECT 1` (inyectable vía
  `createHealthRouter({checkDatabase})`, `:20`) y responde 503
  `{status:'not_ready', database:'unavailable'}` sin host ni puerto si la
  base no responde. Ambos montados públicos antes de la autenticación
  (`src/app.js:30`) y probados en `test/health.test.js`.

## 7. Minimum-practices audit

Clasificaciones permitidas: COMPLIES · PARTIAL · DOES_NOT_COMPLY ·
NOT_FOUND · NOT_UNDERSTOOD. Cada fila cita evidencia o reconoce duda.

| Área | Pregunta | Clasificación | Evidencia / duda |
| --- | --- | --- | --- |
| Configuración | ¿Los secretos están fuera del código? | COMPLIES | `.env` está en `.gitignore` del starter; `pool.js:10–12` y `token.js:8–10` exigen las variables; solo existe `.env.example` versionado |
| Entrada | ¿Se validan datos externos? | COMPLIES | `parseIdParam` (`src/http/parse-id.js:16–22`), `assertValidPriority` (`requests.service.js:59–64`), `isValidStatus` en PATCH y filtros (`:67, :149`), título no vacío (`:105–107, :145–147`) |
| SQL | ¿Las consultas están parametrizadas? | COMPLIES | Todos los queries de `requests.store.js` usan `$1…$n` (`findById :50–56`, `insertRequest :58–69`, `updateRequest :71–91` con whitelist de columnas `:75`) |
| Identidad | ¿El JWT se verifica? | COMPLIES | `authenticate.js:29` → `verifyToken` (`token.js:35–42`), HS256 + iss/aud; prueba `test/auth.test.js` (login 200 con token de 3 segmentos; inválido→401) |
| Permisos | ¿Existe autorización además de autenticación? | PARTIAL | Las policies existen y se aplican en list/create/patch/history/claim (`requests.service.js:78, 96, 162, 170, 173, 176, 224, 245`) pero `getRequest` NO consulta `canViewRequest` (`:86–93`) — BUG-901 |
| Ownership | ¿Se limita el acceso al propietario cuando corresponde? | PARTIAL | La colección acota en SQL (`requests.store.js:37–40` con `createdBy` forzado en `requests.service.js:78–80`) y el historial aplica la policy (`:224`); el detalle no (`:86–93`) |
| Dominio | ¿Los campos del servidor están protegidos? | COMPLIES | `SERVER_CONTROLLED_FIELDS = ['id','createdBy','createdAt','updatedAt','changedBy','assignedTo']` rechazados con 400 (`requests.service.js:35, 47–54`); `status` añadido en creación/claim (`:101, :238`) |
| Consistencia | ¿Las escrituras relacionadas usan transacción? | COMPLIES | `withTransaction` en `createRequest` (`:113`), `patchRequest` (`:157`), `claimRequest` (`:240`) — request+historial juntos o nada |
| Errores | ¿Existe un formato consistente? | COMPLIES | `errorBody` único (`error-handler.js:29–31`); `AppError` con categorías (`src/app-error.js:9–15`); forma congelada por `test/errors.test.js` |
| Logs | ¿Ayudan a investigar sin exponer secretos? | COMPLIES | Allow-list en `request-logger.js:21–35`; `requestId` correlaciona respuesta y log; `test/traceability.test.js:87–99` |
| Pruebas | ¿Existen casos positivos y negativos? | PARTIAL | La suite cubre 401/403/404/409/500 (11 archivos), pero el caso exacto del BUG-901 ("ajeno→404" en detalle) está como stub `todo` (`test/request-detail.test.js:69–75`) y `test/request-access-policy.test.js` entero es `todo` — el hueco pasó desapercibido |
| Migraciones | ¿El esquema está versionado? | COMPLIES | `database/migrations/001…005` + ledger `schema_migrations` (`scripts/migrate.js:20–32`); aplicadas en transacción |
| Seed | ¿Puede repetirse de forma controlada? | COMPLIES | `scripts/seed.js:66–72` borra SOLO datos de los usuarios seed (historial→requests) y reinserta en una transacción; usuarios por upsert (`:50–62`) |
| Arquitectura | ¿HTTP, reglas y SQL están separados razonablemente? | COMPLIES | route → service → store; policy pura sin imports (`request.policy.js`); sin capa de controllers innecesaria; Express 5 propaga errores `async` al handler central |
| Operación | ¿Health y readiness tienen propósitos distintos? | COMPLIES | `/health` sin DB vs `/ready` con `SELECT 1` y 503 sin detalles (`src/routes/health.routes.js:27–29` vs `:31–43`; `test/health.test.js`) |

## 8. Change impact

Completa ANTES de modificar código. Commit: `class-09-analysis`.
Análisis del cambio que BUG-901 exige (proteger el detalle por ownership).

### Observable behavior

Cambia UN caso observable: `GET /requests/:id` con token de un `requester`
distinto del dueño pasa de `200` con el JSON completo a `404` con
`{ error: { code: "REQUEST_NOT_FOUND", message: … }, requestId }` —
indistinguible de un id inexistente (decisión explícita del sistema,
`tickets/BUG-901.md:38–44`). NO debe cambiar: owner→200, agent→200,
sin token→401, id mal formado→400, id inexistente→404, ni el schema de la
respuesta autorizada (`test/request-detail.test.js:45–46` congela las 9
claves).

### Files likely affected

* `src/modules/requests/requests.service.js` — `getRequest` (`:86–93`):
  dejar de ignorar `actor` y consultar `canViewRequest` (ya importado en
  `:20`), lanzando `notFound(id)` (`:39–41`) en caso negativo — mismo
  patrón que `getHistory` (`:219–228`).
* `test/request-detail.test.js` — activar los stubs `todo` de `:69–75`
  (ajeno→404) y `:77–81` (`?userId=` no concede acceso).
* `test/request-access-policy.test.js` — activar los 3 stubs `todo`
  (`:19, :24, :29`) que ya ejercitan `canViewRequest`.
* No se tocan: `request.policy.js` (la regla ya existe y es correcta),
  `requests.store.js`, `requests.routes.js`, migraciones, mapper.

### Rule to protect

Un `requester` solo puede ver solicitudes que él creó; un `agent` puede
ver cualquiera; la identidad proviene SOLO del token verificado —
`canViewRequest` (`src/modules/requests/request.policy.js:20–23`) +
`req.auth` (`src/middleware/authenticate.js:43`).

### Data required

`actor.userId` y `actor.role` (desde `req.auth`, ya disponibles en el
service) y `request.createdBy` (fila ya cargada por `findById` y mapeada
por `mapRequestRow`) — no se necesita ninguna consulta adicional.

### Status codes

| Caso | Código actual | Código tras el fix |
| --- | --- | --- |
| Sin token | 401 `AUTHENTICATION_REQUIRED` | 401 (sin cambio) |
| Id mal formado | 400 `INVALID_REQUEST_ID` | 400 (sin cambio) |
| Id inexistente | 404 `REQUEST_NOT_FOUND` | 404 (sin cambio) |
| Owner (requester) | 200 | 200 (sin cambio) |
| Agent | 200 | 200 (sin cambio) |
| Requester ajeno | **200 (BUG)** | **404 `REQUEST_NOT_FOUND`** |
| Ajeno con `?userId=<owner>` | 200 (BUG) | 404 (la identidad solo sale del token) |

### Tests to add or change

* Activar los 2 stubs de `test/request-detail.test.js` (ajeno→404;
  `?userId` no concede acceso) — son la regresión que falla antes del fix
  y pasa después.
* Activar los 3 stubs de `test/request-access-policy.test.js`
  (agent→true, owner→true, stranger→false sobre `canViewRequest`).
* `npm run test:policy` debe seguir sin necesitar `.env` (la policy
  permanece pura: sin Express, sin SQL — condición que también verifica
  `validate-class-09.js`, check "Policy has no Express dependency").
* La suite completa (`npm test`) y los vecinos congelados de
  `test/regression.test.js` (colección acotada, claim→200) deben seguir
  verdes.

### Behavior that must remain unchanged

* Owner→200 con exactamente las claves `assignedTo, createdAt, createdBy,
  description, id, priority, status, title, updatedAt`
  (`test/request-detail.test.js:45–46`).
* Agent→200 sobre cualquier solicitud (`test/request-detail.test.js:54–67`).
* Colección acotada del requester (`test/regression.test.js:32–48`) y
  claim (`test/regression.test.js:50–64`).
* Historial: stranger ya recibe 404 idéntico (`test/requests-history.test.js`)
  — el patrón que el detalle debe replicar.
* Sin migración y sin capas nuevas (`tickets/BUG-901.md:30–32`).

### Risks

* Sobre-bloquear: si la comparación de `createdBy` contra `actor.userId`
  se equivoca (p. ej. comparando fila cruda snake_case `created_by`),
  el owner legítimo recibiría 404 — cubierto por la prueba de owner→200
  existente.
* Cambiar el código del actor a 403 en vez de 404: confirmaría la
  existencia de recursos ajenos (enumeración), contra la decisión
  explícita del sistema.
* Tocar `requests.store.js` o la policy "por si acaso": fuera del alcance
  mínimo que el ticket exige.
* No activar los stubs: el fix quedaría sin red de regresión (el propio
  ticket lo convierte en no-terminado).

### Unknowns

* El comentario `TEMP(REQ-442)` en `requests.service.js:90–91` justifica
  el desactivado "mientras soporte compara reportes duplicados". No
  encontré en el repositorio ningún ticket REQ-442 ni consumidor que
  dependa del detalle abierto — ver §9.

## 9. Unknowns and questions

1. **REQ-442:** ¿existe realmente el trabajo de soporte que el comentario
   `TEMP(REQ-442)` (`requests.service.js:90–91`) invoca? No hay rastro
   en el repo (ni en `tickets/`, ni en docs). Si no existe, el comentario
   es un señuelo deliberado del starter; si existe, ¿alguien depende del
   200 actual antes del fix?
2. **Apagado ordenado:** no hay handler de `SIGTERM`/`SIGINT` ni
   `pool.end()` en `src/server.js`. ¿Es una omisión intencional del
   starter (simplificación docente) o un agujero operativo real?
3. **SSL:** `pool.js:14–16` solo pasa `connectionString`, sin opción
   `ssl`. La conexión a Supabase depende por completo del parámetro
   `sslmode` dentro de la URL. ¿Es eso suficiente para el pooler de
   Session, o alguna red exigirá configuración explícita?
4. **Pruebas stub:** `test/request-access-policy.test.js` está entero en
   `{ todo: true }` con un comentario que advierte que "verde aquí no
   significa que el endpoint esté protegido". ¿Lo dejó así el squad
   anterior a propósito como pista para este día, o es deuda?
5. **Orden `express.json()` antes de `authenticate`:** una petición con
   body JSON inválido y sin token recibe 400 `INVALID_JSON` y no 401.
   ¿Es el orden deseado o un caso borde a documentar?
6. **`X-Powered-By`:** Express 5 lo sigue emitiendo (`app.js` nunca lo
   deshabilita). ¿Lo ignoramos a propósito en este curso o conviene
   `app.disable('x-powered-by')` en una futura clase?
7. **Migración parcial:** el CHECK de `request_history.type` en 003 no
   acepta `request_claimed`; solo 005 lo ensancha. Si alguien aplicara
   001–004 sin 005, el claim fallaría en runtime. ¿Hay algún guardia de
   producción para eso, o confiamos en el ledger?
