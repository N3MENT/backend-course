# AI usage

> Regla de la entrega: la IA puede proponer código, pero no puede decidir silenciosamente el
> contrato o las reglas del sistema. Solo se usa **después** de la marca `class-04-design`.
> No hace falta copiar conversaciones completas: registra lo esencial con honestidad.

## My design before using AI

El diseño quedó completo **antes** de escribir cualquier código o prompt. Se elaboró
respondiendo el cuestionario de la actividad: cada decisión de contrato y de reglas la tomó
el estudiante, no la IA.

* `data-model.md` — tablas `support_tickets` y `ticket_status_history`, id `IDENTITY`
  asignado por PostgreSQL (requerimiento del starter), 4 estados respaldados con `CHECK`,
  prioridades `{low, medium, high, urgent}` con default `medium`.
* `persistence-contract.md` — responsabilidad del store: SQL y columnas; filas sin mapear;
  errores propagados, no traducidos a HTTP.
* `query-matrix.md` — SQL parametrizado para las 6 operaciones, columnas explícitas.
* `transaction-plan.md` — `withTransaction` con un único cliente; `createTicket` y
  `patchTicket` (cambio de status) como unidades atómicas.
* `error-map.md` — categorías `contract/resource/domain/persistence/infrastructure/internal`
  y el formato de error de clase 3 con `details` y `timestamp`.
* `test-matrix.md` — 12 casos + 2 propios, con columna esperada.
* `project/docs/decisions/001-terminal-states-instead-of-delete.md` y
  `002-preserve-status-history.md` — decisiones del estudiante.

Como en clase 3, la identidad del recurso y el recurso mismo son los que diseñó el
estudiante en la entrega anterior (support tickets, máquina de estados de 4 estados); la
clase 4 solo los hace persistentes.

## What I asked the AI

*(Se completa en la fase de implementación, después de la marca `class-04-design`.)*

* Adaptar el proyecto de clase 3 al modelo persistente (pool, transacción, mapper) sin
  romper el contrato de la clase 3 (salvo el `id` documentado).
* Implementar `GET /api/v1/support-tickets/:id/history`.
* Implementación de la suite funcional y del caso de rollback controlado.

## What the AI proposed

*(Se completa tras la implementación.)*

## What I accepted

*(Se completa tras la implementación.)*

## What I rejected or changed

*(Se completa tras la implementación.)*

## How I verified the result

*(Se completa en la fase 6: `npm test` contra Supabase + evidencia literal de `curl` para
persistencia y rollback.)*

## What I still do not understand

* La diferencia práctica entre el `Session pooler` y el `Transaction pooler` de Supabase (la
  cadena del Session usa el puerto 5432; el del Transaction, el 6543) y cuándo conviene cada
  uno.
* Cómo decide PostgreSQL el orden exacto de `IDENTITY` si hay inserciones concurrentes.