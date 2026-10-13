# AI usage

Autor: Diego Silva — diegosilva.itsu@gmail.com

> Regla de la entrega: la IA puede proponer código, pero no decide en silencio el contrato ni
> las reglas del sistema. La uso **después** de la marca `class-03-design`. No hace falta
> pegar conversaciones completas: registro lo esencial con honestidad.

## Mi diseño antes de usar IA

Completé el diseño **antes** de escribir código o lanzar el primer prompt. Lo armé
respondiendo el cuestionario de la actividad, de modo que cada decisión de contrato y de
reglas la tomé yo, no la IA.

* `resource-model.md` — recurso **Support Ticket**, campos requeridos (`title`,
  `description`), opcionales (`priority`, con `urgent` y default `medium`) y generados
  (`id` UUID v4, `status`, `createdAt`, `updatedAt`).
* `http-contract.md` — base `/api/v1/support-tickets`, 4 endpoints (`POST`, `GET`,
  `GET /:id`, `PATCH`), sin `DELETE`, filtros `status`+`priority` en AND, formato de error
  `{ error: { code, message, details?, timestamp } }` y códigos `400/404/409/500`.
* `transition-map.md` — 4 estados (`pending`, `in_progress`, `resolved`, `cancelled`),
  4 transiciones y 2 terminales (`resolved`, `cancelled`).
* `test-matrix.md` — 12 casos de la clase + 4 propios, con columna esperada.
* `project/docs/decisions/001-terminal-states-instead-of-delete.md` — mi decisión (terminales
  en lugar de borrado físico).

Estas decisiones de contrato y reglas **no las cambió la IA** durante la implementación.

## Qué le pedí a la IA

Después de la marca de diseño, para la fase de implementación:

* Refactorizar el proyecto a las capas acordadas:
  `controllers/services/repositories/routes/dtos/middlewares` + `domain/ticket-status.js`.
* Reemplazar los estados y las urls anteriores (`open/closed`, `/requests`) por el contrato
  propio (4 estados, `/api/v1/support-tickets`).
* Implementar `PATCH` según el contrato (campos modificables, `409` para transición inválida
  y para estado terminal), filtros AND, UUID v4 con `node:crypto` y el formato de error con
  `details` y `timestamp`.
* Escribir una suite funcional `node:test` que cubra la matriz de casos.

## Qué propuso la IA

* La separación concreta de responsabilidades por archivo y el módulo de dominio
  `ticket-status.js` (estados, prioridades, transiciones y guardián de terminales derivado
  de la ausencia de transiciones).
* El orden de validación en `PATCH`: 404 → `EMPTY_PATCH` → valores inválidos →
  estado terminal → transición.
* Derivar el estado inicial y la prioridad por defecto de constantes del dominio
  (`INITIAL_STATUS`, `DEFAULT_PRIORITY`) en vez de repetir literales.
* Cubrir el caso "campos que el cliente no controla" como `EMPTY_PATCH`.

## Qué acepté

* La estructura de capas y la separación de responsabilidades.
* Que `POST` ignore los campos que el servidor controla (`id`, `status`, fechas) y use
  `medium` como prioridad por defecto.
* Que el guardián de estados terminales proteja **cualquier** campo en `PATCH`, no solo
  `status` (por eso modificar la prioridad de un ticket `resolved` da `409`, como pide la
  matriz).
* El formato de error con `details` y `timestamp` en todos los códigos `400/404/409`.

## Qué rechacé o cambié

* **`DELETE`**: rechazado por diseño — la decisión `001` documenta terminales en vez de
  borrar.
* **`PUT`**: no forma parte del contrato; solo `PATCH` parcial.
* **Librerías de validación externas** (Joi/Zod): fuera del contrato; la validación es
  mínima y vive en `dtos/supportTicket.schema.js`.
* **Reutilizar la estructura o el template del repo anterior** (`modules/requests`, estados
  `open/closed`): lo descarté; el proyecto quedó con el recurso y los estados de mi diseño, y
  la semilla con 4 tickets (uno por estado) bajo las urls `/api/v1/support-tickets`.

## Cómo verifiqué el resultado

* Suite funcional `npm test` (21 casos en `test/support-tickets.test.js`) que cubre la
  matriz completa: pasa **21/21**.
* Smoke test con el servidor corriendo (`npm start`): `GET /api/v1/support-tickets`
  responde `200` con la semilla.
* Evidencia literal de los casos protegidos (`409 INVALID_STATE_TRANSITION` y
  `409 TICKET_IN_TERMINAL_STATUS`) registrada en `test-matrix.md`.

## Qué todavía no entiendo del todo

* Cómo registra Express internamente las rutas de un `Router()` en la aplicación principal;
  lo uso, pero no sabría defender el mecanismo interno sin mirar la documentación.
* El costo real de la colección en memoria cuando crezca (índices, particionado por estado)
  y cómo se pagará con la migración a SQL de la clase 4.
