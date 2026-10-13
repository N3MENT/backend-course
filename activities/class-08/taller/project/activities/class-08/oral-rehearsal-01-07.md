# Repaso oral — preparación para la verificación del checkpoint 1-7

Registro de la conversación de repaso para la verificación oral recomendada
por `ai-self-evaluation-01-07.md` (`oralVerificationRecommended: true`).
Incluye la guía de estudio (preguntas con su respuesta correcta) y el quiz en
vivo: mis respuestas y las correcciones del repaso.

* Fecha: 2026-09-29
* Estudiante: diegosilva.itsu@gmail.com
* Cubre: clases 1-7 (lecciones del checkpoint) + contrato de la clase 8 (claim)
* Origen de los temas: `course-progress-evidence-01-07.md`,
  `ai-self-evaluation-01-07.md` y `ai-knowledge-exam-01-07.md`

## Parte 1 — Guía de estudio (preguntas con su respuesta correcta)

### Los 7 del checkpoint

1. **Flujo petición→respuesta y por qué el servidor sigue activo**

   El backend es un proceso Node escuchando un puerto. La petición entra por
   HTTP, recorre los middlewares en orden, el router decide, el service aplica
   la regla y el store ejecuta SQL parametrizado; la respuesta vuelve con
   status, headers y body JSON. Si el proceso muere, nadie escucha el puerto y
   el navegador recibe un error de conexión (no una respuesta HTTP). El 500 en
   cambio es una respuesta que el proceso, aún vivo, sí logró emitir.

2. **`POST /requests` como contrato (método + ruta + body + status)**

   POST expresa "crear", `/requests` identifica la colección y el body lleva
   `title` (obligatorio), `description` y `priority` (low/medium/high,
   opcional). Las violaciones dan `400 TITLE_REQUIRED`, `400 INVALID_PRIORITY`
   o `400 SERVER_CONTROLLED_FIELD` (id en el body). El éxito es `201` con el
   recurso creado y `status` siempre `open`. Sin token, `401`.

3. **Representación vs dato inválido vs transición incompatible**

   Representación es el JSON camelCase que arma el mapper (vista pública de la
   fila, no la fila interna). Dato inválido es `priority: 'urgent'` → `400`
   (se valida antes de tocar SQL). Transición incompatible es `PATCH status:
   'closed'` sobre una `open` → `409 INVALID_STATUS_TRANSITION`: el dato es
   válido y el recurso existe, pero el estado actual no permite el movimiento.
   El orden correcto es validar el contrato, luego autorizar y por último
   evaluar la transición.

4. **Migración vs seed vs transacción**

   Migración: evoluciona el esquema una sola vez y por orden
   (`database/migrations/` 001-005; la 005 agrega `assigned_to`), registrada en
   `schema_migrations` — las aplicadas no se editan jamás. Seed: datos de
   demostración reproducibles (`scripts/seed.js`, `*.seed@example.test`).
   Transacción: `withTransaction` hace commit/rollback completo de varias
   escrituras (el claim escribe asignación + evento en una sola).

5. **Autenticación vs autorización y JWT**

   401 es quién eres (falla el middleware `authenticate`); 403 es qué puedes
   hacer (lo decide la policy). Decodificar un JWT no alcanza: hay que verificar
   la firma contra `JWT_SECRET` y la expiración en cada petición. La identidad y
   el rol se derivan del token verificado (`req.auth`), nunca del body — si
   `role` llega por body, el servidor lo rechaza con `400
   SERVER_CONTROLLED_FIELD` en vez de ignorarlo.

6. **Prueba con preparación / acción / comprobación**

   Ejemplo: "the owner can read the history, oldest event first". Preparación →
   `buildScenario` crea owner + agent + una solicitud con 3 eventos; acción →
   `GET /requests/:id/history` con el token del owner; comprobación → 200 con el
   array de 3 eventos, el más viejo primero. La regresión se demuestra haciendo
   fallar la prueba (en "rojo") ANTES de corregir; en este repo los 13 stubs
   `todo` de la clase 08 se volvieron pruebas reales y la suite pasó de 39 a 52.

7. **INC-701 + health vs readiness**

   Síntoma: `GET /requests/abc` → 500. Hipótesis: el id inválido llega sin
   validar al SQL. Causa: sin `parseIdParam`, el NaN entra como parámetro y
   PostgreSQL (bigint) lanza; el error-handler responde el 500 genérico.
   Corrección: validar el id completo en la frontera HTTP → `400
   INVALID_REQUEST_ID` + `requestId`. `/health` = el proceso está vivo (200
   aunque la base caiga, liveness); `/ready` = hace un `SELECT 1` real de la
   dependencia → `200 database:available` o `503` deliberado (readiness). Los
   503 de readiness son un contrato, no un fallo.

### Los 3 riesgos que la evaluación marcó para verificación oral

8. **¿Por qué una solicitud ajena responde 404 y no 403?**

   Un 403 confirmaría que el recurso existe y que es de otro (filtra
   información). El 404-as-missing lo vuelve indistinguible de una inexistente
   → no se pueden escanear IDs. El 403 en mi API se usa cuando el actor es
   legítimo pero su rol no puede la acción (ej. requester → `PATCH status` →
   `403 FORBIDDEN`; requester → claim → `403 NOT_AGENT`).

9. **¿Qué pasa si edito la migración 002 ya aplicada?**

   Las bases divergen y `schema_migrations` queda inconsistente. La corrección
   es una migración nueva (006+), nunca reescribir lo aplicado.

10. **¿Qué responde `/health` con la BD caída y qué `/ready`?**

    `/health` → 200 (proceso vivo); `/ready` → 503 (dependencia no lista para
    tráfico). Sirve a los orquestadores: liveness evita reiniciar el contenedor
    por un problema externo; readiness saca la instancia del balance.

### Los 4 bloques que quedaron en los `.md`

11. **RESULT_CODE del checkpoint**

    `ITSU-PROGRESS|V=1.0|R=BACKEND-01-07-R1|STATUS=COMPLETE|C01=3-3-2-3|C02=3-3-2-3|C03=3-3-2-3|C04=3-3-2-3|C05=3-3-2-3|C06=3-3-3-3|C07=3-3-3-4|ACTION=NONE`

    El formato por clase es K-P-V-E: Knowledge (conocimiento), Practice
    (evidencia práctica), Verification (verificación ejecutada y guardada) y
    Explanation (explicación con consecuencias). La V quedó en 2 en las clases
    1-5 porque no había una salida ejecutada guardada (validadores
    `NOT_VERIFIED`); sube a 3 en la 6 y la 7, donde existe
    `validation-evidence.txt` con PASSED 12/12. La E sube a 4 en la clase 7 por
    el análisis del incidente.

12. **Examen de conocimiento**

    `C01=4|C02=3|C03=4|C04=3|C05=4|C06=3|C07=4|ACTION=NONE` — una pregunta por
    clase con su repregunta; el nivel 4 es sostener la repregunta mostrando
    consecuencias.

13. **Metacognición** — reconozco que la brecha no es de comprensión sino de
    evidencia guardada (faltan salidas ejecutadas de 1-5 y el `.txt` de la
    clase 7 quedó con codificación alterada por el redactor).

14. **Las 3 recomendaciones a seguir** — 1) guardar salidas reales de las
    clases 1-5, 2) regenerar en UTF-8 el `validation-evidence.txt` de la clase
    7, 3) sostener capas y códigos de error (requestId) en el claim.

## Parte 2 — Quiz en vivo (transcript P1-P7)

### P1 — GET /requests/:id/history de una solicitud AJENA

**Pregunta:** Un requester autenticado hace `GET /requests/5/history` y la
solicitud 5 pertenece a otro usuario. ¿Qué status HTTP y código responde mi
API, y por qué exactamente ese y no otro?

**Mi respuesta (primera versión):** "Respondería 403 Forbidden. El usuario ya
fue autenticado correctamente (el servidor sabe quién es), pero no posee los
permisos necesarios para acceder a los datos de otro usuario. No sería 401
porque la identidad ya está validada, ni 404 porque el recurso existe y
ocultarlo como 'no encontrado' escondería la razón real del rechazo por control
de acceso."

**Corrección del repaso (incorrecto → corregido):** En este proyecto la
respuesta correcta es **404 REQUEST_NOT_FOUND**, deliberadamente igual a una
solicitud inexistente (404-as-missing). Un 403 confirma que el recurso existe y
que es de otro (filtra información y permite escanear IDs). Distinguí bien
401/403, pero aquí el 404 es una decisión de visibilidad (docs/decisions clase
5), protegida por la prueba "a stranger requester receives the same 404 as a
nonexistent request". El 403 en mi API se reserva a acciones donde no hace
falta ocultar el rol (ej. requester → `PATCH status` → `403`; requester → claim
→ `403 NOT_AGENT`).

### P2 — Migración aplicada que necesita un cambio

**Pregunta:** El proyecto ya tiene las migraciones 001-005 aplicadas en tres
bases. Mañana detecto que la 002 necesita una constraint nueva. ¿Qué hago y qué
no debería hacer jamás?

**Mi respuesta (correcta):** "Jamás alteraría ni sobrescribiría el archivo de
la migración 002, porque rompería la integridad de la secuencia y fallaría en
las bases donde ya está aplicada. Lo que hago es crear una migración nueva (por
ejemplo, 006_add_constraint_to_table.sql) que contenga únicamente el `ALTER
TABLE` para aplicar la constraint. Así mantengo el historial de migraciones
inmutable y garantizo que todos los entornos se desplieguen de forma
consistente."

**Complemento:** el mecanismo es que `scripts/migrate.js` registra cada archivo
aplicado en `schema_migrations`; reescribir la 002 deja esa tabla inconsistente
y las bases divergentes.

### P3 — Contrato completo del claim

**Pregunta:** Describo el contrato completo de `POST /requests/:id/claim`
implementado hoy: quién puede llamarlo, qué condiciones debe cumplir la
solicitud, qué status/códigos devuelve en cada caso de error y qué escribe en
la base que queda consistente entre sí.

**Mi respuesta (primera versión):** "El endpoint lo ejecuta únicamente un
operador autenticado cuando la solicitud existe y está sin asignar (PENDING).
Devuelve 200 OK al asignarla, 401 sin token, 403 si no es operador, 404 si el
:id no existe, y 409 Conflict si ya la reclamó otro. En la base de datos,
dentro de una transacción atómica, se actualiza el status a IN_PROGRESS, se
asigna el operator_id y se inserta un registro en la tabla de
historial/auditoría para mantener la consistencia."

**Corrección del repaso (parcial → corregido, vocabulario del repo):**
- El rol es **agent** (no "operador"); los roles son `requester` / `agent`.
- El estado reclamable es **`open`** (no existe "pending"): `open · in_progress
  · resolved · closed · cancelled`.
- La columna de la migración 005 es **`assigned_to`** (no `operator_id`); en el
  JSON del mapper se expone como `assignedTo`.
- Hay **dos 409**: `REQUEST_ALREADY_ASSIGNED` (ya tiene agente) y
  `REQUEST_NOT_OPEN` (terminal/no-open); un estado cerrado no se reclama aunque
  no tenga agente.
- Hay un **`400 SERVER_CONTROLLED_FIELD`** si el cliente manda `assignedTo` en
  el body (la identidad sale del token).
- En la misma transacción: `assignRequest` (UPDATE `SET status='in_progress',
  assigned_to=:id` RETURNING) + `insertHistoryEvent` con el evento
  **`request_claimed`** (open→in_progress).

**Regla memo:** agente + `open` + sin asignar → 200; si una de esas tres falla
→ 403 / 409 / 409; imponer el agente por body → 400.

### P4 — /health vs /ready con la base caída

**Pregunta:** Con la base de datos de Supabase caída, ¿qué responde `GET
/health` y qué `GET /ready`? ¿Para qué sirve esa diferencia?

**Mi respuesta (correcta):** "GET /health responde 200 OK porque la aplicación
sigue viva y corriendo en el servidor. En cambio, GET /ready responde 503
Service Unavailable porque el servicio no puede procesar tráfico útil al estar
la base caída. Esta diferencia es clave para los orquestadores (como Kubernetes
o balanceadores de carga): la prueba de liveness (/health) evita reiniciar el
contenedor si el problema es externo, mientras que la de readiness (/ready) le
ordena al balanceador dejar de enviarle peticiones a esta instancia hasta que
Supabase se recupere."

**Observación:** el 503 de readiness es deliberado (un contrato, no un fallo).
Los códigos del repo: `/ready` → `database:unavailable` con 503; `/health` →
`{status:ok}` con 200.

### P5 — JWT: decodificar no basta + body con role/asignación

**Pregunta:** El payload de un JWT dice `role: "agent"`. ¿Por qué decodificarlo
no basta para confiar en ese claim? ¿Y qué pasa si el cliente manda `{ "role":
"agent" }` o `"assignedTo"` en el body del `POST /requests/:id/claim`?

**Mi respuesta (primera versión):** "Decodificar un JWT no basta porque
cualquiera puede alterar el payload en Base64; la confianza viene de verificar
la firma criptográfica con la clave secreta del servidor para confirmar que no
fue manipulado. Por otro lado, si el cliente manda el role o assignedTo en el
body del POST, esa información debe ignorarse por completo. El ID y el rol del
usuario siempre deben extraerse del token JWT validado en el backend para
evitar vulnerabilidades de suplantación de identidad."

**Corrección del repaso (correcta con 2 matices):**
- Si altero el payload, la firma ya no valida (el servidor lo rechazaría). El
  peligro real es un token **forjado completo** (payload con `role: agent` +
  firma de otra clave) que se aceptaría si el servidor solo "decodifica" y no
  verifica la firma contra `JWT_SECRET` en cada petición.
- En mi API el campo del body **no se ignora: se rechaza** con `400
  SERVER_CONTROLLED_FIELD` (`rejectServerControlledFields(body,
  ['assignedTo'])`), antes de tocar la lógica.

### P6 — Prueba de regresión (AAA + rojo antes)

**Pregunta:** Tomo la prueba "agent can claim an open request" de
`test/requests-claim.test.js`. La separo en preparación → acción →
comprobación, y digo qué debe pasar ANTES de escribir cualquier prueba de
regresión.

**Mi respuesta (correcta):** "Preparación (Arrange): se levanta el entorno de
pruebas, se crea una solicitud en estado OPEN y se genera el token de un
usuario con rol de agente. Acción (Act): se ejecuta la petición HTTP POST
/requests/:id/claim enviando el token del agente. Comprobación (Assert): se
verifica que el status sea 200 OK, que la respuesta contenga assigned_to con el
ID del agente y que en la base de datos la solicitud haya cambiado a
IN_PROGRESS. Y lo que jamás debe faltar ANTES de escribir cualquier prueba de
regresión es reproducir y ver fallar el test (que dé 'rojo'): así confirmo que
la prueba realmente detecta el error y no da un falso positivo antes de aplicar
el fix."

**Complemento:** en este repo la verificación del estado se hace sobre la
respuesta de la API (cuerpo con `assignedTo` y `status: in_progress`) con
`supertest`, no con un query directo. Además, los 13 stubs de la clase 08
estaban como `todo`; convertirlos llevó la suite de 39 a 52 pass.

### P7 — Leer el RESULT_CODE del checkpoint

**Pregunta:** Un compañero abre `ai-self-evaluation-01-07.md` y ve
`STATUS=COMPLETE|C01=3-3-2-3|...|C07=3-3-3-4|ACTION=NONE`. Le explico qué
significa cada parte y por qué la verificación (V) de las clases 1-5 quedó en 2
mientras la de 6 y 7 quedó en 3.

**Mi respuesta (primera versión):** "STATUS=COMPLETE: indica que el proceso de
evaluación de todas las clases ya fue finalizado. C01 a C07: corresponden a los
resultados de cada clase (Clase 1 a Clase 7). Formato D-V-C-E (p. ej.,
3-3-2-3): representa las métricas de Diseño, Verificación (testing), Código y
Ejecución/Evidencia alcanzadas en esa clase. ACTION=NONE: significa que no se
requieren acciones correctivas adicionales para continuar. La Verificación (V)
quedó en 2 en las clases 1-5 porque en esa fase las pruebas eran principalmente
manuales o parciales (sin cobertura automatizada completa). Subió a 3 en las
clases 6 y 7 porque allí se integró la suite de pruebas automatizadas e
integración continua (CI), alcanzando un nivel de verificación formal sobre los
endpoints y la lógica de negocio."

**Corrección del repaso (parcial → corregido):**
- El formato es **K-P-V-E**, no D-V-C-E: Knowledge, Practice, Verification,
  Explanation. En español: Conocimiento, Práctica, Verificación, Explicación.
- La V baja no es por "pruebas manuales/CI": la V mide si hubo verificación
  ejecutada y guardada. Clases 1-5: sin salida real guardada (validadores
  `NOT_VERIFIED`); 6 y 7: `validation-evidence.txt` con PASSED 12/12.
- `STATUS=COMPLETE` = evidencia suficiente de las 7 clases (no PARTIAL ni
  INSUFFICIENT_EVIDENCE); `ACTION=NONE` = sin reparación ni verificación extra
  de fondo (la oral es recomendada, no exigida).
- La E sube a 4 solo en la clase 7 por el análisis del incidente con causa y
  consecuencias.

## Cierre del repaso

| # | Tema | Resultado |
|---|------|-----------|
| P1 | 404-vs-403 (ajena) | Incorrecto → corregido: 404-as-missing |
| P2 | Migraciones aplicadas | Correcto, sólido |
| P3 | Contrato del claim | Parcial → corregido: vocabulario del repo (agent/open/assigned_to/2×409/400) |
| P4 | health vs ready | Correcto, impecable |
| P5 | JWT + body | Correcto con 2 matices (firma, 400 en vez de "ignorar") |
| P6 | Prueba AAA + rojo antes | Correcto con matiz del repo |
| P7 | RESULT_CODE | Parcial → corregido: K-P-V-E y el motivo real de la V |

**Temas a repasar antes de la verificación con el profesor:** P1 (404 vs 403),
P3 (contrato del claim con términos del repo) y P7 (K-P-V-E y motivo de la V).
Son los mismos ítems que la evaluación marcó como `oralVerificationRecommended`,
y el contrato del claim (clase 8) es el tema del checkpoint de la próxima clase.
