# Error map — categorías de error sin filtrar secretos

Autor: Diego Silva — diegosilva.itsu@gmail.com

> Fase 1 · se completa **antes de usar IA y antes de tocar código**.
> Clasifico cada error según su categoría para traducirlo a HTTP de forma consistente y
> **sin filtrar** secretos ni detalles internos (`pg` puede exponer la cadena de conexión o
> el esquema interno si se reenvía crudo).

## Formato de error (se mantiene de clase 3)

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

> A diferencia del contrato ajeno anterior (solo `{code, message}`), conservo el formato de
> **mi** clase 3: `details` (opcional) y `timestamp` siempre presente.

## Categorías y su traducción HTTP

El service lanza errores **tipados** (`AppError` con `status`, `code`, `details`) y el
middleware los traduce. La base de datos apenas lanza errores crudos; la capa los captura y
**nunca** los envía al cliente.

| Categoría | Significado | HTTP | Ejemplos de `code` |
| --------- | ----------- | ---- | ------------------ |
| `contract` | La petición no tiene la forma esperada (validación de entrada). Problema del cliente. | `400` | `MISSING_TITLE`, `MISSING_DESCRIPTION`, `INVALID_PRIORITY`, `INVALID_STATUS`, `EMPTY_PATCH`, `MALFORMED_JSON` |
| `resource` | El recurso pedido no existe. | `404` | `TICKET_NOT_FOUND` |
| `domain` | La petición está bien formada pero viola una regla de negocio (depende del estado actual). | `409` | `INVALID_STATE_TRANSITION`, `TICKET_IN_TERMINAL_STATUS` |
| `persistence` | Problema al leer/escribir en la base (query, integridad) **controlado**. | `500` | `DB_ERROR` |
| `infrastructure` | La base de datos no está disponible (falla de conexión al pool). | `503` | `DATABASE_UNAVAILABLE` |
| `internal` | Error inesperado/todo lo demás. | `500` | `INTERNAL_ERROR` |

## Regla de oro: nunca filtrar secretos

* El cliente **nunca** debe recibir el mensaje crudo de `pg` (puede contener la cadena de
  conexión, el host, el rol o el esquema interno).
* Ante un error de persistencia/infraestructura respondo un `message` genérico y seguro
  (p. ej. `"La base de datos no está disponible."`), y el **detalle real se registra en la
  consola del servidor** (`console.error`) para diagnóstico, no en el cuerpo de la respuesta.
* `db:check` imprime solo el nombre de la base y la versión, nunca la URL ni la contraseña.

## Mapa código → categoría

| Código | Categoría |
| ------ | --------- |
| `MISSING_TITLE` | contract → `400` |
| `MISSING_DESCRIPTION` | contract → `400` |
| `INVALID_PRIORITY` | contract → `400` |
| `INVALID_STATUS` | contract → `400` |
| `EMPTY_PATCH` | contract → `400` |
| `MALFORMED_JSON` | contract → `400` |
| `TICKET_NOT_FOUND` | resource → `404` |
| `INVALID_STATE_TRANSITION` | domain → `409` |
| `TICKET_IN_TERMINAL_STATUS` | domain → `409` |
| `DATABASE_UNAVAILABLE` | infrastructure → `503` |
| `DB_ERROR` | persistence → `500` |
| `INTERNAL_ERROR` | internal → `500` |

> Conservo los códigos de **mi clase 3** (`TICKET_*`, `MISSING_*`, `INVALID_*`, `EMPTY_PATCH`)
> que el contrato ya publicó, y añado los de infraestructura/persistencia/interno. El
> contrato externo de los endpoints NO cambia (solo cambió la representación del `id`,
> documentado en `data-model.md`).
