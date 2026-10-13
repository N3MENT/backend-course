# HTTP contract — Support Tickets API v1

Autor: Diego Silva — diegosilva.itsu@gmail.com

> Fase 1 · se completa **antes de usar IA y antes de tocar código**.
> Para cada endpoint defino intención, path, query, body, respuesta exitosa, errores y un
> ejemplo. El ejemplo me obliga a decidir los detalles que la tabla esconde.

## Base del recurso

Todas las rutas viven bajo el prefijo `/api/v1/support-tickets`.

## Formato de error (común a toda la API)

```json
{
  "error": {
    "code": "CODE_NAME",
    "message": "Mensaje legible para personas",
    "details": [
      { "field": "status", "issue": "Detalle específico del problema" }
    ],
    "timestamp": "2026-09-22T10:20:00Z"
  }
}
```

El `code` es para programas: un `if` sobre `error.code` es robusto. El `message` es para
personas. `details` es opcional y aterriza el problema en un campo concreto. `timestamp`
permite correlacionar la respuesta con los logs del servidor.

**Códigos existentes:**

| Código | Situación |
| ------ | --------- |
| `MISSING_TITLE` | `POST` sin `title` |
| `MISSING_DESCRIPTION` | `POST` sin `description` |
| `INVALID_PRIORITY` | `priority` con valor desconocido (body o query) |
| `INVALID_STATUS` | `status` con valor desconocido (body o query) |
| `EMPTY_PATCH` | `PATCH` sin campos modificables |
| `TICKET_NOT_FOUND` | `GET /api/v1/support-tickets/:id` o `PATCH .../:id` inexistente |
| `INVALID_STATE_TRANSITION` | transición no permitida por la máquina de estados |
| `TICKET_IN_TERMINAL_STATUS` | intento de modificar un ticket en estado terminal |
| `INTERNAL_ERROR` | fallo no controlado (500) |

---

## `GET /api/v1/support-tickets`

* **Intención**: listar la colección completa de tickets, opcionalmente filtrada.
* **Path**: `/api/v1/support-tickets`
* **Query**: `status` (opcional, ∈ `{pending, in_progress, resolved, cancelled}`) y
  `priority` (opcional, ∈ `{low, medium, high, urgent}`). Ambos se combinan con lógica de
  **intersección (AND)**.
* **Body**: ninguno.
* **Respuesta exitosa**: `200` con un arreglo. Sin coincidencias, la respuesta es
  honestamente `200 []` (vacío no es lo mismo que inexistente).
* **Errores**: `400` con `INVALID_STATUS` o `INVALID_PRIORITY` si el valor de un filtro no
  pertenece al conjunto conocido. "Existe pero no hay resultados" y "el filtro no significa
  nada" son cosas distintas.

**Ejemplo (filtrado combinado)**

```http
GET /api/v1/support-tickets?status=pending&priority=high

HTTP/1.1 200 OK
[
  {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "title": "Error al exportar reporte PDF",
    "description": "Al hacer clic en 'Exportar', la pantalla se queda congelada.",
    "priority": "high",
    "status": "pending",
    "createdAt": "2026-09-22T10:00:00Z",
    "updatedAt": "2026-09-22T10:00:00Z"
  }
]
```

---

## `GET /api/v1/support-tickets/:id`

* **Intención**: obtener un ticket concreto por su identificador.
* **Path**: `/api/v1/support-tickets/:id` (`:id` = UUID v4)
* **Respuesta exitosa**: `200` con el recurso completo.
* **Errores**: `404` con `TICKET_NOT_FOUND` si no existe ese id.

**Ejemplo (inexistente)**

```http
GET /api/v1/support-tickets/00000000-0000-0000-0000-000000000000

HTTP/1.1 404 Not Found
{
  "error": {
    "code": "TICKET_NOT_FOUND",
    "message": "No existe un ticket con id 00000000-0000-0000-0000-000000000000",
    "timestamp": "2026-09-22T10:20:00Z"
  }
}
```

---

## `POST /api/v1/support-tickets`

* **Intención**: registrar una nueva incidencia de soporte.
* **Path**: `/api/v1/support-tickets`
* **Body**: acepta `title` (requerido), `description` (requerido) y `priority` (opcional,
  → `medium`). El servidor **ignora** los campos que el cliente no controla (`id`,
  `status`, `createdAt`, `updatedAt` y cualquier campo desconocido): la API es tolerante con
  lo que no le corresponde decidir.
* **Respuesta exitosa**: `201 Created` con el recurso completo: `id` UUID v4 generado,
  `status` `pending` y `createdAt`/`updatedAt` generados por el servidor.
* **Errores**: `400` con `MISSING_TITLE` o `MISSING_DESCRIPTION` si faltan los obligatorios;
  `400` con `INVALID_PRIORITY` si llega una prioridad desconocida.

**Ejemplo**

```http
POST /api/v1/support-tickets
{
  "title": "Error al exportar reporte PDF",
  "description": "Al hacer clic en 'Exportar', la pantalla se queda congelada.",
  "priority": "high"
}

HTTP/1.1 201 Created
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "title": "Error al exportar reporte PDF",
  "description": "Al hacer clic en 'Exportar', la pantalla se queda congelada.",
  "priority": "high",
  "status": "pending",
  "createdAt": "2026-09-22T10:00:00Z",
  "updatedAt": "2026-09-22T10:00:00Z"
}
```

---

## `PATCH /api/v1/support-tickets/:id`

* **Intención**: actualizar parcialmente un ticket existente. Los cambios viajan como PATCH
  y no como acciones con nombre: la intención puede estar en el body, porque la máquina de
  estados protege cada transición en el servidor.
* **Body**: campos modificables `title`, `description`, `priority`, `status`. Los campos del
  servidor (`id`, `createdAt`, `updatedAt`) se **ignoran** si se envían.
* **Respuesta exitosa**: `200` con el recurso actualizado (`updatedAt` se renueva).
* **Idempotencia**: repetir el mismo `PATCH` (p. ej. subir `priority` a `urgent`) devuelve
  `200` con el mismo estado final y sin efectos secundarios adicionales.
* **Errores**:

| Situación | Estado | Código de error |
| --------- | -----: | --------------- |
| Body sin campos modificables | `400` | `EMPTY_PATCH` |
| `status` con valor desconocido | `400` | `INVALID_STATUS` |
| `priority` con valor desconocido | `400` | `INVALID_PRIORITY` |
| Recurso inexistente | `404` | `TICKET_NOT_FOUND` |
| Transición no permitida | `409` | `INVALID_STATE_TRANSITION` |
| Ticket en estado terminal | `409` | `TICKET_IN_TERMINAL_STATUS` |

La misma petición puede ser válida hoy (el ticket está `pending`) e inválida mañana (pasó a
`resolved`): la forma no cambió, el estado sí. Por eso las transiciones se rechazan con
`409` (petición bien formada, prohibida por el estado actual) y no con `400` (que es para la
forma).

**Ejemplo (éxito)**

```http
PATCH /api/v1/support-tickets/f47ac10b-58cc-4372-a567-0e02b2c3d479
{
  "status": "in_progress",
  "priority": "urgent"
}

HTTP/1.1 200 OK
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "title": "Error al exportar reporte PDF",
  "description": "Al hacer clic en 'Exportar', la pantalla se queda congelada.",
  "priority": "urgent",
  "status": "in_progress",
  "createdAt": "2026-09-22T10:00:00Z",
  "updatedAt": "2026-09-22T10:30:00Z"
}
```

**Ejemplo (transición inválida)**

```http
PATCH /api/v1/support-tickets/f47ac10b-58cc-4372-a567-0e02b2c3d479
{
  "status": "resolved"
}

HTTP/1.1 409 Conflict
{
  "error": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "No se puede pasar de 'pending' a 'resolved'.",
    "details": [
      { "field": "status", "issue": "Un ticket debe pasar por 'in_progress' antes de resolverse." }
    ],
    "timestamp": "2026-09-22T10:30:00Z"
  }
}
```
