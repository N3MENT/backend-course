# Clase 08 — El cambio pequeño que toca todo

Estoy en mi **tercera semana** como desarrollador backend junior. Producto
pide que un agente pueda **tomar una solicitud** para hacerse cargo de
atenderla (FEATURE-801). El pedido suena mínimo… hasta que abro el módulo y
me encuentro con un handler que mezcla HTTP, permisos, reglas de negocio,
PostgreSQL, historial y errores en un mismo bloque.

Mi trabajo: implementar el ticket y reorganizar **solo lo necesario** para
que el resultado se entienda y se pueda comprobar. Puedo apoyarme en IA —
evitando que convierta el proyecto en una colección de capas que nadie
necesita.

> Refactorizar cambia la estructura interna sin tocar el comportamiento
> observable. Si cambió la ruta, el status, el body o el permiso, ya no fue
> solamente un refactor.

## Antes que nada: el checkpoint de entrada (25 min)

La primera actividad del día no es este ticket, sino el diagnóstico
acumulativo de las clases 1 a 7: una sola ejecución y un solo reporte.

```bash
npm install
npm run progress:checkpoint
```

0. En una máquina compartida, primero hago `git clone` de mi repositorio (o
   `git remote -v` para confirmar que el clon es mío). El paquete imprime el
   remoto que detecta — lo reviso. Si git me da pelea, el laboratorio
   "Supervivencia git en máquina compartida" (sesión 1 de la clase) trae el
   ritual completo y los rescates.
1. Abro `activities/class-08/course-progress-evidence-01-07.md`, completo mi
   `studentId` y las **siete respuestas breves** (3-6 líneas cada una).
2. Copio entero el prompt de `self-evaluation/ITSU-CHECKPOINT-01-07-1.0.md`.
3. Lo pego en el modelo de IA que tenga disponible, con el paquete dentro de
   los marcadores BEGIN_EVIDENCE / END_EVIDENCE. **Una sola conversación.**
4. Guardo la salida completa (RESULT_CODE + JSON + reporte + feedback) en
   `activities/class-08/ai-self-evaluation-01-07.md`, sin editar, y respondo
   las 4 preguntas de metacognición del final.
5. **Segunda ejecución — el examen de conocimiento**: en una conversación
   NUEVA copio el prompt de `self-evaluation/ITSU-KNOWLEDGE-01-07-1.0.md`,
   escribo COMENZAR y respondo las 7 preguntas (con repreguntas) DE MEMORIA,
   sin material abierto. Guardo el transcript completo en
   `activities/class-08/ai-knowledge-exam-01-07.md`.

Si el modelo devuelve un formato inválido, conservo la respuesta, ejecuto el
prompt de reparación UNA vez (`self-evaluation/repair-prompt.md`) y, si
vuelve a fallar, marco `MODEL_FORMAT_FAILURE` y continúo al taller. No gasto
la clase peleando con la herramienta.

> El reporte forma parte de la evaluación del curso: el docente lo revisa
> junto con mi evidencia. Puedo cuestionarlo con argumentos, y `ACTION=VERIFY`
> significa que habrá una conversación corta de verificación con el docente.

## El tablero del taller

* [ ] **Checkpoint 1-7** — RESULT_CODE + JSON + reporte guardados
* [ ] **Baseline** — doctor 7/7 + migración 005 aplicada + suite verde
* [ ] **Mapa** — responsibility-map.md del handler cargado
* [ ] **Refactor** — historial separado, contrato intacto, commit
* [ ] **Contrato claim** — matriz entendida, decisión de assignedTo clara
* [ ] **Policy** — regla pura + pruebas sin HTTP
* [ ] **Service + store** — Coordinación y transacción con historial
* [ ] **Route** — POST /:id/claim delgado
* [ ] **Pruebas API** — matriz completa en verde
* [ ] **Validación** — validate:class-08 → PASSED

> El taller es **autocontenido**: si un bloque no se completa en clase, se
> termina en casa — mismo starter, mismos validadores, mismas láminas
> publicadas. Lo único con hora fija es la evaluación de entrada (se hace en
> aula) y la hora límite de entrega que fije el docente. Recuerdo que cada
> bloque termina en `git push`.

## Puesta en marcha (baseline, DESPUÉS de la evaluación y la pausa)

El mismo proyecto de Supabase de las clases anteriores — no creo una base
nueva.

```bash
git remote -v               # ¿es MI repositorio? en máquina compartida, verificarlo SIEMPRE
git status                  # registro mi punto de partida
cp .env.example .env        # misma DATABASE_URL y JWT_SECRET de siempre
npm run class-08:doctor
npm run db:migrate          # 001-004 SKIPPED · 005 APPLIED (la leo antes en database/migrations/)
npm run db:seed             # ahora incluye una solicitud YA asignada
npm test                    # verde: 39 pass, 13 todo (los todo son míos)
git add -A && git commit -m "class-08-baseline" && git push
```

Regla del laboratorio: **la máquina no es mía; mi repositorio remoto sí.**
Si esta máquina no tiene mi repo, lo clono primero (`git clone <mi-url>`) y
trabajo dentro. Cada bloque del taller termina en `git push` — lo que no está
en MI GitHub no existe para la evaluación.

## Comandos del taller

| Comando | Qué hace |
| --- | --- |
| `npm run progress:checkpoint` | Genera el paquete de evidencia 1-7 (sin secretos) |
| `npm run class-08:doctor` | Diagnóstico del entorno (7 checks) |
| `npm run db:migrate` / `db:seed` | Esquema y datos (repetibles) |
| `npm test` | Suite completa — mi red de seguridad para refactorizar |
| `npm run test:policy` | Solo las pruebas de la policy (sin base, en milisegundos) |
| `npm run validate:class-08` | Validador final (12 checks, incluye fronteras) |

## Los archivos del ticket

* `tickets/FEATURE-801.md` — el contrato completo y la matriz.
* `activities/class-08/responsibility-map.md` — mi análisis del handler cargado.
* `activities/class-08/refactor-log.md` — cada paso del refactor con su suite.
* `database/migrations/005_add_request_assignment.sql` — la leo: NULL, FK y CHECK ampliado.

## Reglas para trabajar con IA

La IA **puede**: clasificar bloques del handler, detectar acoplamiento,
proponer un plan de pasos pequeños y revisar mi refactor buscando cambios
observables accidentales.

La IA **no decide en silencio**: crear capas (domain/, repositories/,
use-cases/…), cambiar rutas/status/bodies, borrar pruebas ni "mejorar" el
contrato. Le pido siempre que elimine de su propia propuesta las separaciones
que no resuelven un problema presente.

## Credenciales del seed (datos de demostración)

Las mismas desde la clase 6: `ana.requester.seed@example.test`,
`luis.requester.seed@example.test`, `maria.agent.seed@example.test`
(passwords en el material de clase). María ya tiene una solicitud asignada —
el seed la reclama por mí para que vea el escenario completo.

Mi `DATABASE_URL` y mi `JWT_SECRET` siguen siendo secretos reales: jamás en
commits, chats ni capturas — y jamás dentro del paquete de evidencia.
