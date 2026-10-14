# Work log

Registro del trabajo con IA durante el TALLER (la evaluación tiene su
propio historial obligatorio en assessment/). No copies conversaciones
completas aquí: registra el criterio, no el chat.

## Baseline — por comando (sesión "Primer día en el proyecto")

Secuencia de la lámina "Ejecutar antes de interpretar", en orden.
Presupuesto de entorno: 10 min.

| # | Comando | Qué esperaba | Resultado real | Bloqueo / resolución |
| --- | --- | --- | --- | --- |
| 1 | `git remote -v` | Confirmar que el remote es MI repo, no el del starter | `origin → https://github.com/N3MENT/backend-course.git` (fetch/push) | Sin bloqueo — en máquina compartida es el primer chequeo |
| 2 | `cp .env.example .env` | Archivo local con `DATABASE_URL` y `JWT_SECRET` | El `.env` existía pero AMBOS valores vacíos; el doctor lo detecta en el check 01 | Bloqueo: credenciales de mi proyecto Supabase. Proyecto en el dashboard **pausado** (plan free tras inactividad). Restauración en curso desde el dashboard; la cadena se copiará del diálogo Connect (Session pooler) sin pegarla en ningún chat |
| 3 | `npm run doctor` | 7/7 PASS ("Environment ready…") | Primera pasada: FAIL en check 01 (`.env` vacío, esperable). Tras restaurar el proyecto pausado y completar credenciales: **7/7 PASS** — "Environment ready: assessment first, then the legacy-system workshop." | El proyecto estaba **pausado** (free tras inactividad): restore desde el dashboard; el reset de contraseña tardó ~15 s en propagarse (`28P01` transitorio). Presupuesto de entorno respetado |
| 4 | `npm run db:migrate` | 001-005 todas `SKIPPED` (ledger `schema_migrations` las recuerda) | **001–005 [APPLIED]** — la base estaba vacía (sin ledger): las cinco se aplicaron y "Database schema is ready." La expectativa SKIPPED asumía el esquema de la clase 06 ya instalado; comprobar el resultado real fue lo que delató la base vacía | Sin bloqueo; el ledger ahora existe — re-ejecutar daría SKIPPED |
| 5 | `npm run db:seed && npm test` | Seed repetible (resumen de siempre) y suite completa en verde | Seed: "Seed completed successfully." (2 requesters, 1 agent, 6 requests, 15 history events, 1 claim). Suite: **64 tests · 59 pass · 0 fail · 5 todo** (los 5 `todo` = stubs de BUG-901). Dato Windows: el glob `'test/*.test.js'` entre comillas del script de `package.json` no expande en esta shell → 0 tests; corrido sin comillas (`node --test --test-concurrency=1 test/*.test.js`) con resultado verde | No es un fallo del sistema: es una diferencia de shell del curso (POSIX) vs Windows. Registrarlo es parte del work-log |
| 6 | `git add -A && git commit -m "class-09-baseline" && git push` | Commit baseline en mi repo remoto | Doctor 7/7 + suite verde confirmados ANTES del commit — checklist del checkpoint cumplido | `.env` verificado como ignorado (`git check-ignore` → starter `.gitignore`) |

Mientras el entorno estaba bloqueado (presupuesto: no gastar el taller en
Supabase) se ejecutó lo que no depende de la base:

| Comando | Qué esperaba | Resultado real |
| --- | --- | --- |
| `npm run test:policy` | Las políticas puras pasan sin `.env` | `5 pass · 3 todo · 0 fail` — los 3 `todo` son los stubs de `test/request-access-policy.test.js` (BUG-901): verde aquí NO significa que el endpoint esté protegido, lo dice el propio archivo |
| Lectura del código (`src/`, migraciones, tests, `tickets/BUG-901.md`) | Mapa real para el dossier §1–§9 | Dossier completado citando archivo+función en cada fila; §9 con 7 dudas declaradas |

## What I observed before asking AI

* `git remote -v` correcto; starter dentro de `activities/class-09/` de mi
  repo; `npm install` ya realizado (`node_modules/` presente).
* `.env` existía con las tres claves pero `DATABASE_URL=` y `JWT_SECRET=`
  vacíos. El dashboard de Supabase mostraba "N3MENT's Project · Project is
  paused" (plan free).
* Leí el README del starter (puesta en marcha, comandos, credenciales del
  seed) y `recovery/environment.md` (sección "Supabase inaccesible" y
  "'.env' faltante o incompleto").
* Ejecuté `npm run doctor` y `npm run test:policy` ANTES de pedir nada.

## What I asked

* Cómo conectar el repo con Supabase para esta actividad (respuesta: no
  hay vínculo GitHub↔Supabase; la conexión es la `DATABASE_URL` local).
* Restaurar el proyecto pausado y de dónde copiar la cadena (diálogo
  Connect → Session pooler).
* Mapear el starter para redactar el dossier con evidencia verificable.

## What the AI proposed

* Mapa del sistema: arranque (`server.js`/`app.js`), orden de middlewares,
  recorrido de `GET /requests/:id`, esquema final de las 5 migraciones,
  autenticación (jose HS256), y el hallazgo central: `getRequest`
  recibe `actor` y no lo consulta (`requests.service.js:86–93`), mientras
  `patchRequest`/`getHistory` sí consultan la policy.
* Completar el dossier §1–§9 con citas archivo:línea y dejar §8 (impacto
  de BUG-901) ANTES de tocar código.
* Restaurar el proyecto pausado desde el dashboard (5–10 min) sin crear
  proyecto nuevo ni pegar la cadena en el chat.

## Evidence I checked

* `src/app.js:25–41` — orden real de middlewares y montaje de
  `/requests` con `authenticate` por delante.
* `src/modules/requests/requests.service.js:86–93` — `getRequest` ignora
  `actor` (línea 90: comentario `TEMP(REQ-442)`); comparado con `:162`
  (`patchRequest` → `canViewRequest`) y `:224` (`getHistory` →
  `canViewHistory`).
* `src/modules/requests/request.policy.js:20–23` — `canViewRequest`
  (regla correcta, ya existente, pura).
* `src/middleware/authenticate.js:43` — único punto que escribe
  `req.auth = { userId: payload.sub, role: payload.role }`.
* `src/http/parse-id.js:16–22`, `src/middleware/error-handler.js:29–31`,
  `src/routes/health.routes.js:27–43`.
* `database/migrations/001–005` y `scripts/seed.js`/`scripts/migrate.js`
  (ledger y seed selectivo).
* `tickets/BUG-901.md` completo (reglas, decisión 404-vs-403, DoD).
* `test/request-detail.test.js:69–81` — los stubs `todo` que son la
  regresión pedida; `test/requests-history.test.js` como patrón de 404
  idéntico a ausente.
* Salidas reales de `npm run doctor` (FAIL check 01) y `npm run
  test:policy` (5 pass · 3 todo).

## What I accepted

* El mapa y las citas archivo:línea del dossier (verificados por lectura
  directa de los archivos citados, no a ciegas).
* La estrategia de "ejecutar antes de interpretar": doctor y suite antes
  de leer código, y no commitear el baseline hasta que estén verdes.
* Restaurar el proyecto pausado en lugar de crear uno nuevo (perdería el
  esquema 001–005 y el seed de la clase 06).

## What I rejected

* **Pegar la `DATABASE_URL` o el `JWT_SECRET` en el chat** para "que la
  IA los configure": el starter y el validador lo prohíben
  (`validate-class-09.js`, check "No secrets included in submissions").
* **Crear un proyecto Supabase nuevo** para "no esperar el restore":
  rompería la continuidad del mismo esquema desde la clase 06.
* **Corregir BUG-901 de una vez**: el ticket exige primero reproducción y
  análisis commiteado (`class-09-analysis`); el fix llega después, con
  el cambio mínimo. Esta sesión es baseline + dossier.
* **Completar el dossier con prosa tipo "el service maneja la lógica"**:
  sin archivo + función + prueba no cuenta como inventario.

## What I changed

* `activities/class-09/system-dossier.md` — completado §1–§9 con evidencia
  (tabla de inventario, recorrido de 10 pasos, auditoría de 15 áreas,
  impacto de BUG-901 antes de tocar código, 7 dudas en §9).
* `activities/class-09/work-log.md` — este registro.
* Nada de código fuente todavía: el fix de BUG-901 aún no empezó.

## How I verified it

* `npm run test:policy` → 5 pass · 3 todo · 0 fail (sin `.env`).
* `npm run doctor` → FAIL esperado en check 01 (evidencia del bloqueo).
* Lectura directa de cada archivo citado en el dossier (comparación
  `getRequest` vs `getHistory`/`patchRequest`, policy, authenticate,
  error handler, health, parse-id, migraciones, seed).
* `npm run validate:class-09` y la suite completa: **pendientes** hasta
  tener `DATABASE_URL` (el validador se detiene en los checks de
  entorno sin base).

## What I still cannot explain

* Para qué existe el trabajo de soporte que invoca el comentario
  `TEMP(REQ-442)` (`requests.service.js:90–91`); no hay rastro en el repo
  (va a la §9 del dossier).
* Por qué `test/request-access-policy.test.js` quedó entero en `todo`:
  pista deliberada del starter o deuda del squad anterior (§9).
* Si la ausencia de `SIGTERM`/`pool.end()` en `src/server.js` es
  simplificación docente o agujero operativo real (§9).
