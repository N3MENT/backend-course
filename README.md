# Backend-Course

Repositorio único de la materia **Desarrollo Backend** (ITSU) — tercer trimestre.

**Estudiante:** Diego Silva · `diegosilva.itsu@gmail.com`

Aquí vive el progreso real del trimestre: cada actividad semanal en `activities/class-NN/`.
Nada se sube al final; una entrega que solo existe en local no está entregada.

## Descripción

Curso teórico-práctico sobre qué ocurre detrás de una aplicación web: el recorrido de una
petición, HTTP y Express, el diseño de APIs (recursos, contratos, estado y reglas) y, en las
clases siguientes, persistencia, validación, modularidad, seguridad, pruebas y arquitectura.
Stack: JavaScript · Node.js · Express · Git/GitHub.

Cada carpeta semanal incluye objetivo, instrucciones de ejecución, solución desarrollada,
evidencia reproducible, explicación conceptual, sección de uso de IA y reflexión.

## Índice de actividades

| Clase | Entrega | Contenido principal | Tag |
| ----- | ------- | ------------------- | --- |
| [01](activities/class-01/) | El viaje de una petición | Primer servidor HTTP con el módulo nativo de Node.js, ciclo petición–respuesta y una falla diagnosticada | `class-01-submission` |
| [02](activities/class-02/) | HTTP como contrato | Análisis y corrección de la API Lite; construcción de la API Full con contrato HTTP | `class-02-lite-analysis` · `class-02-submission` |
| [03](activities/class-03/) | Recursos, estado y reglas | Diseño previo sin IA, máquina de estados, `PATCH`, filtros y errores unificados | `class-03-design` · `class-03-submission` |
| [04](activities/class-04/) | De SQL al backend persistente | PostgreSQL (Supabase), historial de estados, transacciones con rollback y errores sin secretos | `class-04-design` · `class-04-submission` |
| [05](activities/class-05/) | Seguridad e identidad + frontend real | Registro, hashing scrypt, login con JWT, middleware `authenticate`, propiedad y permisos (12/12); entregas 05A (interfaz `/app`) y 05B (documentación interactiva `/learn`) | `class-05-design` · `class-05-submission` |
| [06](activities/class-06/) | Primer ticket en un backend existente | Onboarding con IA: BUG-106 (404 en colección filtrada vacía) y FEATURE-206 (`GET /requests/:id/history`); validador 12/12 | `class-06-submission` |
| [07](activities/class-07/) | Cuando el backend falla | Del REPL a las pruebas: INC-701 (id inválido → 400), INC-702 (prioridad inválida → 400) y OPS-703 (observabilidad: `requestId`, error handler central, `/health` y `/ready`); 38 pruebas y validador 12/12 | `class-07-submission` |
| [08](activities/class-08/) | Refactoring y responsabilidades | Refactor seguro de `GET /requests/:id/history` por capas y FEATURE-801 (`POST /requests/:id/claim`) con transacción y evento `request_claimed`; mapa de responsabilidades, suite 52/52 y checkpoint acumulativo 1-7 con IA | `class-08-submission` |

## Instrucciones de ejecución

Se requiere **Node.js LTS** (`node --version` para verificar). Todas las API usan el
puerto 3000: detén una antes de levantar otra.

### Clase 1 — servidor HTTP (módulo nativo)

```bash
cd activities/class-01
npm install
npm start       # o: node src/server.js
npm test        # suite funcional 4/4 (node:test)
```

Rutas: `http://localhost:3000`, `/health`, `/api/info`, cualquier otra → `404`.

### Clase 2 — API Lite corregida

```bash
cd "activities/class-02/(Actividad 1) request-api-lite"
npm install
npm start
npm test        # suite funcional 5/5 (node:test)
```

### Clase 2 — API Full

```bash
cd "activities/class-02/(Actividad 2) request-api-full"
npm install
npm start
npm test        # suite funcional 5/5 (node:test)
```

Rutas: `GET /requests`, `GET /requests/:id`, `POST /requests`.

### Clase 3 — API de tickets de soporte

```bash
cd activities/class-03/project
npm install
npm start       # http://localhost:3000/api/v1/support-tickets
npm test        # suite funcional 21/21 (node:test)
```

Rutas: `GET /api/v1/support-tickets` (con filtros `status` y `priority` en AND),
`GET /api/v1/support-tickets/:id`, `POST /api/v1/support-tickets` y
`PATCH /api/v1/support-tickets/:id`. Sin `DELETE`: la decisión documentada son estados
terminales. Detalles en `project/docs/http-contract.md` y verificación en
`activities/class-03/test-matrix.md`.

### Clase 4 — API de tickets con PostgreSQL

Requiere una base propia en Supabase (la identidad la asigna la base con `IDENTITY`). Pasos:

```bash
cd activities/class-04/project
npm install
copy .env.example .env   # pegar tu DATABASE_URL (Session pooler, puerto 5432)
npm run db:check         # verifica la conexión sin imprimir secretos
npm start
```

Las migraciones (`database/migrations/001_create_support_tickets.sql` y `002`) y el seed
(`database/seed.sql`) se ejecutan primero en el SQL Editor de Supabase.

Rutas: `GET /api/v1/support-tickets` (con filtros `status` y `priority`),
`GET /api/v1/support-tickets/:id`, `GET /api/v1/support-tickets/:id/history`,
`POST /api/v1/support-tickets` y `PATCH /api/v1/support-tickets/:id`. Detalles en
`project/docs/http-contract.md` y verificación en `activities/class-04/test-matrix.md`.

### Clase 5 — taller de identidad (backend)

```bash
cd activities/class-05/taller/project
npm install
copy .env.example .env   # DATABASE_URL + JWT_SECRET propios
npm run validate:class-05 -- --stage setup
npm start
```

Registro público, login con JWT y scoping por rol; validación por etapas (`register`,
`password`, `login`, `authentication`, `ownership`, `authorization`) y la prueba reina sin
argumentos: `npm run validate:class-05` (12/12).

### Clase 5 — entrega 05A (frontend `/app`)

Requisitos: backend de clase 5 corriendo en `http://localhost:3000` con
`FRONTEND_ORIGIN=http://localhost:5173`.

```bash
cd activities/class-05/week-01/request-frontend-starter
npm install
copy .env.example .env   # opcional: VITE_API_URL=http://localhost:3000
npm run dev              # abrir http://localhost:5173/app/
```

Rutas del proyecto: `/app` (05A) y `/learn` (plantilla). El token de acceso se guarda en
`sessionStorage` con su mitigación XSS documentada en `app/README.md`; el `dist/` no se
commitea.

### Clase 5 — entrega 05B (`/learn` interactivo)

```bash
cd activities/class-05/week-02
npm install
npm run dev              # redirige a http://localhost:5173/learn/
```

Documentación interactiva (proyecto Vite independiente, justificado en su `README.md`):
20 contenidos, 4 interacciones (inspector ficticio de JWT, comparador de mecanismos, quiz y
árbol de decisión) y fuentes trazables.

### Clase 06 — taller de onboarding (primer ticket en un backend existente)

```bash
cd activities/class-06/taller/project
npm install
copy .env.example .env   # pegar DATABASE_URL (Supabase, Transaction pooler 6543)
npm run db:migrate        # idempotente; la segunda vez omite
npm run db:seed           # 2 requesters + 1 agent + 6 requests + 15 history events
npm run class-06:doctor   # debe mostrar "Environment ready"
npm run validate:class-06 # debe terminar FINAL RESULT: PASSED
npm start
```

Taller autodirigido con IA sobre un repo ajeno con dos tickets: BUG-106 (una colección
filtrada vacía devolvía 404) corregido y FEATURE-206 (`GET /requests/:id/history`)
implementado. Tag final: `class-06-submission`.

### Clase 07 — cuando el backend falla (repaso y pruebas)

```bash
cd activities/class-07/taller/project
npm install
copy .env.example .env   # pegar DATABASE_URL (Supabase, Transaction pooler 6543)
npm run db:migrate        # idempotente; la segunda vez: SKIPPED
npm run class-07:doctor   # debe mostrar "Environment ready" (7/7)
npm test                  # suite completa de regresión
npm run incidents:reproduce   # INC-701/702/703 RESOLVED
npm run validate:class-07     # debe terminar FINAL RESULT: PASSED
npm start
```

Taller de diagnóstico del error: tres incidentes investigados con REPL y reproducidos antes
de corregir. INC-701 (id inválido → 400 `INVALID_REQUEST_ID`), INC-702 (prioridad inválida
→ 400 `INVALID_PRIORITY`) y OPS-703 (observabilidad: cabecera `X-Request-Id`, error handler
central, `/health` y `/ready`, y logs JSON en allowlist). 17 stubs convertidos en pruebas
(38 en total). Tag final: `class-07-submission`.

### Clase 08 — refactoring y responsabilidades

```bash
cd activities/class-08/taller/project
npm install
copy .env.example .env   # pegar DATABASE_URL (Supabase, Transaction pooler 6543)
npm run db:migrate        # idempotente; 005_add_request_assignment.sql ya aplicada
npm run db:seed           # v8: 2 requesters + 1 agent + 6 requests + 15 history events
npm test                  # suite completa: 52 pass / 0 fail / 0 todo
npm run validate:class-08     # debe terminar FINAL RESULT: PASSED (12/12)
npm start
```

Taller "el cambio pequeño que toca todo": un refactor con la suite como red (el handler
gordo de `GET /:id/history` desarmado en route/service/store/policy/mapper, con el contrato
intacto) y FEATURE-801 (`POST /requests/:id/claim`: solo agente, solicitud `open` y sin
asignar, transacción con evento `request_claimed` y 409 por conflicto). 13 stubs convertidos
en pruebas (suite 52/52). Tag final: `class-08-submission`.

## Estado de las entregas

| Entrega | Estatus | Observaciones |
| ------- | ------- | ------------- |
| 01 · El viaje de una petición | Entregada | Tag `class-01-submission`; suite funcional 4/4 en `activities/class-01/test/` |
| 02 · HTTP como contrato | Entregada | Tags `class-02-lite-analysis` y `class-02-submission`; suites funcionales 5/5 (Lite y Full) en `node:test` |
| 03 · Recursos, estado y reglas | Entregada | Tags `class-03-design` (marca de diseño) y `class-03-submission`; matriz verificada con `curl` |
| 04 · De SQL al backend persistente | Entregada | Tags `class-04-design` (marca de diseño) y `class-04-submission`; PostgreSQL en Supabase, matriz de 12 casos verificada con `curl` (persistencia y rollback) |
| 05A · Interfaz real de solicitudes | Entregada | Tags `class-05-design` (marca de diseño) y `class-05-submission` (entrega 05B); taller 12/12 (boss battle) y frontend `week-01` sobre la API real |
| 05B · El mundo de la autenticación | Entregada | `week-02/`: 20 contenidos, 4 interacciones significativas, fuentes trazables, todo ficticio |
| 06 · Primer ticket en backend existente | Entregada | Tag `class-06-submission`; BUG-106 + FEATURE-206; validador PASSED 12/12 en Supabase nueva |
| 07 · Cuando el backend falla | Entregada | Tag `class-07-submission`; INC-701 + INC-702 + OPS-703; validador PASSED 12/12; 38 pruebas de regresión |
| 08 · Refactoring y responsabilidades | Entregada | Tag `class-08-submission`; refactor de `GET /:id/history` + FEATURE-801 (claim); 52/52 pruebas; validador PASSED 12/12; checkpoint acumulativo 1-7 con IA (evidencia, autoevaluación y examen) |

## Reglas del curso que se respetan aquí

- Commits descriptivos y progresivos; la entrega sigue siendo distinguible por su tag.
- Las correcciones posteriores no borran la etiqueta de la entrega original.
- La IA puede proponer, pero nunca decide en silencio ni sustituye la comprensión: cada
  carpeta documenta qué se aceptó, qué se rechazó y cómo se verificó (uso de IA).
- No se reescribe el historial ni se usa `force push`.
