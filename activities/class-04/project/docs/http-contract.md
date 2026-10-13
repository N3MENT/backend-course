# HTTP contract — Support Tickets API v4

Autor: Diego Silva — diegosilva.itsu@gmail.com

Contrato vigente de la API. Hereda el contrato de clase 3 (los endpoints existentes no
cambian en intención) y añade la consulta de historial
(`GET /api/v1/support-tickets/:id/history`). Ver también la máquina de estados en
`src/domain/ticket-status.js` y el mapa de errores en `activities/class-04/error-map.md`.

## Cambio documentado respecto a clase 3

* **`id` pasa de string (UUID v4) a número** generado por PostgreSQL
  (`BIGINT GENERATED ALWAYS AS IDENTITY`), conforme al requerimiento de la clase 4
  (starter oficial del curso: la identidad la asigna la base). Todo lo demás del contrato se
  conserva.

## Formato de error (común a toda la API)

```json
{
  "error": {
    "code": "CODE_NAME",
    "message": "Human readable message",
    "details": [
      { "field": "...", "issue": "...", "code": "..." }
    ],
    "timestamp": "2026-09-22T14:42:29.174Z"
  }
}
```

**Códigos existentes (clase 3, sin cambios):**

| Código | Situación |
| ------ | --------- |
| `MISSING_TITLE` | `POST` o `PATCH` sin `title` válido |
| `MISSING_DESCRIPTION` | `POST` o `PATCH` sin `description` válida |
| `INVALID_PRIORITY` | `priority` con valor desconocido (body o query) |
| `INVALID_STATUS` | `status` con valor desconocido (body o query) |
| `EMPTY_PATCH` | `PATCH` sin campos modificables |
| `MALFORMED_JSON` | body que no es JSON válido |
| `TICKET_NOT_FOUND` | `GET /:id`, `GET /:id/history` o `PATCH /:id` inexistente |
| `INVALID_STATE_TRANSITION` | transición no permitida por la máquina de estados |
| `TICKET_IN_TERMINAL_STATUS` | intento de modificar un ticket en estado terminal |

**Códigos nuevos (clase 4):**

| Código | Situación | Estado |
| ------ | --------- | -----: |
| `DATABASE_UNAVAILABLE` | la base de datos no responde | `503` |
| `DB_ERROR` | error de query/integridad controlado (detalle solo en log) | `500` |
| `INTERNAL_ERROR` | error inesperado (detalle solo en log) | `500` |

> Nunca se filtran al cliente los errores crudos de `pg` ni el `DATABASE_URL`.

---

## `GET /api/v1/support-tickets`

* **Intención**: listar la colección completa de tickets, opcionalmente filtrada.
* **Path**: `/api/v1/support-tickets`
* **Query**: `status` (opcional, ∈ `{pending, in_progress, resolved, cancelled}`) y
  `priority` (opcional, ∈ `{low, medium, high, urgent}`). Ambos son combinables (AND).
* **Body**: ninguno.
* **Respuesta exitosa**: `200` con un arreglo. Sin coincidencias, `200 []`.
* **Errores**: `400` con `INVALID_STATUS` o `INVALID_PRIORITY` si el valor de un filtro no
  pertenece al conjunto conocido.

**Ejemplo (filtrado combinado)**

```http
GET /api/v1/support-tickets?status=pending&priority=urgent

HTTP/1.1 200 OK
[
  {
    "id": 1,
    "title": "Error al exportar reporte PDF",
    "description": "Al hacer clic en \"Exportar\", la pantalla se queda congelada.",
    "priority": "urgent",
    "status": "pending",
    "createdAt": "2026-09-22T08:00:00.000Z",
    "updatedAt": "2026-09-22T08:00:00.000Z"
  }
]
```

---

## `GET /api/v1/support-tickets/:id`

* **Intención**: obtener un ticket concreto por su identificador.
* **Path**: `/api/v1/support-tickets/:id`
* **Respuesta exitosa**: `200` con el recurso completo.
* **Errores**: `404` con `TICKET_NOT_FOUND` si no existe ese id.

**Ejemplo (inexistente)**

```http
GET /api/v1/support-tickets/999

HTTP/1.1 404 Not Found
{
  "error": {
    "code": "TICKET_NOT_FOUND",
    "message": "No existe un ticket con id 999.",
    "details": [
      { "field": "id", "issue": "No se encontró el ticket 999.", "code": "TICKET_NOT_FOUND" }
    ],
    "timestamp": "2026-09-22T14:42:29.174Z"
  }
}
```

---

## `GET /api/v1/support-tickets/:id/history`

* **Intención**: obtener la historia de estados de un ticket en orden cronológico.
* **Path**: `/api/v1/support-tickets/:id/history`
* **Respuesta exitosa**: `200` con un arreglo de eventos. Todo ticket que existe tiene al
  menos su evento de nacimiento. Los eventos llegan ordenados de más antiguo a más reciente
  (`changedAt ASC`).
* **Errores**: `404` con `TICKET_NOT_FOUND` si no existe ese ticket.

**Ejemplo (ticket con una transición)**

```http
GET /api/v1/support-tickets/2/history

HTTP/1.1 200 OK
[
  {
    "previousStatus": null,
    "newStatus": "pending",
    "changedAt": "2026-09-22T08:05:00.000Z"
  },
  {
    "previousStatus": "pending",
    "newStatus": "in_progress",
    "changedAt": "2026-09-22T09:00:00.000Z"
  }
]
```

---

## `POST /api/v1/support-tickets`

* **Intención**: crear un nuevo ticket de soporte.
* **Body**: acepta `title` (requerido), `description` (requerida) y `priority` (opcional,
  → `medium`). El servidor **ignora** los campos que el cliente no controla (`id`, `status`,
  `createdAt`, `updatedAt` y cualquier campo desconocido).
* **Respuesta exitosa**: `201 Created` con el recurso completo: `id` generado por
  PostgreSQL (`IDENTITY`), `status` `pending`, y `createdAt`/`updatedAt` generados por la
  base (`CURRENT_TIMESTAMP`). El evento de nacimiento queda registrado en el historial
  (misma transacción).
* **Errores**: `400` con `MISSING_TITLE` si falta el título; `400` con
  `MISSING_DESCRIPTION` si falta la descripción; `400` con `INVALID_PRIORITY` si llega una
  prioridad desconocida.

**Ejemplo**

```http
POST /api/v1/support-tickets
{
  "title": "Broken door lock",
  "description": "The lock on room 101 does not turn properly.",
  "priority": "high"
}

HTTP/1.1 201 Created
{
  "id": 6,
  "title": "Broken door lock",
  "description": "The lock on room 101 does not turn properly.",
  "status": "pending",
  "priority": "high",
  "createdAt": "2026-09-22T15:30:00.000Z",
  "updatedAt": "2026-09-22T15:30:00.000Z"
}
```

---

## `PATCH /api/v1/support-tickets/:id`

* **Intención**: actualizar parcialmente un ticket existente. Si el cambio incluye `status`,
  la transición se valida contra la máquina de estados y su evento se registra en el
  historial como parte de la misma transacción.
* **Body**: campos modificables `title`, `description`, `priority`, `status`. Los campos del
  servidor (`id`, `createdAt`, `updatedAt`) se **ignoran** si se envían.
* **Respuesta exitosa**: `200` con el recurso actualizado (`updatedAt` se renueva).
* **Errores**:

| Situación | Estado | Código de error |
| --------- | -----: | --------------- |
| Body sin campos modificables | `400` | `EMPTY_PATCH` |
| `status` con valor desconocido | `400` | `INVALID_STATUS` |
| `priority` con valor desconocido | `400` | `INVALID_PRIORITY` |
| `title` vacío | `400` | `MISSING_TITLE` |
| `description` vacía | `400` | `MISSING_DESCRIPTION` |
| Recurso inexistente | `404` | `TICKET_NOT_FOUND` |
| Transición no permitida | `409` | `INVALID_STATE_TRANSITION` |
| Ticket en estado terminal | `409` | `TICKET_IN_TERMINAL_STATUS` |

La misma petición puede ser válida hoy (el ticket está `in_progress`) e inválida mañana (ya
está `resolved`): la forma no cambió, el estado sí. Por eso las transiciones se rechazan con
`409` (petición bien formada, prohibida por el estado actual) y no con `400` (que es para la
forma).

**Ejemplo (éxito, con cambio de estado)**

```http
PATCH /api/v1/support-tickets/1
{
  "status": "in_progress",
  "priority": "urgent"
}

HTTP/1.1 200 OK
{
  "id": 1,
  "title": "Error al exportar reporte PDF",
  "description": "Al hacer clic en \"Exportar\", la pantalla se queda congelada.",
  "status": "in_progress",
  "priority": "urgent",
  "createdAt": "2026-09-22T08:00:00.000Z",
  "updatedAt": "2026-09-22T15:35:00.000Z"
}
```

**Ejemplo (transición inválida)**

```http
PATCH /api/v1/support-tickets/1
{
  "status": "resolved"
}

HTTP/1.1 409 Conflict
{
  "error": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "No se puede pasar de 'pending' a 'resolved'.",
    "details": [
      { "field": "status", "issue": "La transición 'pending' → 'resolved' no está permitida.", "code": "INVALID_STATE_TRANSITION" }
    ],
    "timestamp": "2026-09-22T14:42:29.174Z"
  }
}
```
