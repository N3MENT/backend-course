# Conservar el historial de estados

Autor: Diego Silva — diegosilva.itsu@gmail.com

> Decision record · `project/docs/decisions/002-preserve-status-history.md`

## Contexto

El modelo persistente necesita responder preguntas que el estado actual solo no puede:
cuándo se abrió un ticket, por qué estados pasó antes de resolverse o cancelarse, por qué
volvió a `in_progress`. Guardar solo la columna `status` actual (como en clase 3) dice
*dónde está* el ticket, pero no *cómo llegó ahí*. El requerimiento de la clase 4 pide
explícitamente "estado → antecedentes": conservar el historial de cada cambio de estado.

## Opciones

### Opción 1: Conservar solo el status actual

Beneficios:

* Esquema mínimo: no hay segunda tabla; `support_tickets.status` ya existe.
* Sin escrituras extra en `PATCH`: la actualización es un solo `UPDATE`.

Costos:

* La historia se pierde: después de `pending → in_progress → resolved` solo queda `resolved`.
* Sin auditoría: no se puede saber si un ticket fue cancelado tras abrirse o si una respuesta
  fue rechazada y reabierta.
* No cumple el requerimiento de la clase: el modelo quedaría incompleto.

### Opción 2: Tabla `ticket_status_history`

Beneficios:

* Cada transición (y cada nacimiento) es un evento auditable: `previous_status` +
  `new_status` + `changed_at`, por ticket.
* `GET /api/v1/support-tickets/:id/history` responde *cómo llegamos aquí* sin cambiar la
  representación del recurso.
* El status actual se mantiene como "último estado conocido", sincronizado por la misma
  transacción que escribe el evento; las lecturas siguen siendo simples.

Costos:

* Una tabla más y un insert extra en cada cambio de estado.
* El insert debe ser atómico con el update: `support_tickets` y `ticket_status_history`
  cambian juntos o no cambian (ver `transaction-plan.md`).
* El evento de nacimiento lleva `previous_status = NULL`, un NULL deliberado y documentado
  que significa "no existía estado anterior" (ver `data-model.md`).

## Decisión

Elijo la **Opción 2: `ticket_status_history`**, una tabla que registra cada nacimiento y cada
transición. `support_tickets.status` conserva el estado actual para lecturas simples, y la
tabla de historial conserva la secuencia de eventos que lo produjeron. Las dos escrituras
(update del ticket + insert del evento) van siempre dentro de una transacción
(`withTransaction`), así el historial nunca puede desincronizarse del estado actual.

## Consecuencias

Qué gano:

* Auditoría de cada cambio de estado, en orden cronológico.
* Un endpoint nuevo `GET /api/v1/support-tickets/:id/history`, solo lectura y barato.
* La capacidad de explicar *por qué* un ticket se ve como se ve (p. ej. fue cancelado
  después de abrirse; fue resuelto, revisado y reabierto).

Qué complejidad aparece:

* Cada cambio de estado escribe dos filas en dos tablas: más escrituras por `PATCH`.
* El insert del evento participa en la transacción: si falla, el update del estado revierte
  (usado como demostración de rollback en la matriz).
* El nacimiento introduce `previous_status = NULL`; cualquier consumidor de datos debe saber
  que NULL significa "nacimiento" y no "desconocido".

Qué ya no se puede hacer:

* Cambio de estado silencioso: toda transición que pasa por la API queda registrada.
* No hay ruta correctiva/eliminativa de eventos en esta clase.

Qué puede cambiar a futuro:

* Si se rastrea el responsable o comentarios por evento, el esquema deja lugar para columnas
  como `changed_by` y `note`.
