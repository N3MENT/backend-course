# Data model — Persistencia de tickets y su historial

> Fase 1 · se completa **antes de usar IA y antes de tocar código**.
> El estado del sistema deja de pertenecer al proceso (array en memoria) y pasa a una base
> de datos compartida. Persistir no es reemplazar un array por una tabla: es decidir cómo
> representar, proteger, recuperar y coordinar el estado.

## Introducción

En la clase 3 el estado vivía en `src/repositories/supportTickets.repository.js` como un
arreglo en memoria: al reiniciar Express, todo se perdía. En esta clase el estado pasa a
**PostgreSQL** (Supabase). La tabla `support_tickets` es la forma persistente del recurso
Support Ticket de clase 3, y se añade una segunda tabla, `ticket_status_history`, para
conservar la historia de cada cambio de estado.

> **Cambio de identidad (documentado):** clase 3 generaba `id` UUID v4 con `node:crypto`.
> El requerimiento de la clase 4 (starter oficial del curso) asigna la identidad **en la
> base** con `BIGINT GENERATED ALWAYS AS IDENTITY`. La representación HTTP cambia: `id`
> pasa de string (UUID) a número. Es la única ruptura de representación que aceptamos y la
> decidimos por el requerimiento; el resto del contrato HTTP no cambia.

## Tabla `support_tickets`

Registros persistentes de cada ticket de soporte técnico.

| Columna | Tipo | Restricción | Descripción |
| ------- | ---- | ----------- | ----------- |
| `id` | `BIGINT` | `GENERATED ALWAYS AS IDENTITY PRIMARY KEY` | Identidad generada por PostgreSQL |
| `title` | `VARCHAR(200)` | `NOT NULL` | Título, obligatorio |
| `description` | `TEXT` | `NOT NULL` | Descripción, obligatoria en este diseño |
| `priority` | `VARCHAR(20)` | `NOT NULL DEFAULT 'medium'` · `CHECK` ∈ `{low, medium, high, urgent}` | Prioridad |
| `status` | `VARCHAR(30)` | `NOT NULL DEFAULT 'pending'` · `CHECK` ∈ `{pending, in_progress, resolved, cancelled}` | Estado del ciclo de vida |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Fecha de creación (la pone la base) |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Última actualización |

### Quién protege qué

| Regla | Quién la protege |
| ----- | ---------------- |
| `title` obligatorio | **Aplicación** (`MISSING_TITLE`) y la base (`NOT NULL`) |
| `description` obligatoria | **Aplicación** (`MISSING_DESCRIPTION`); la base solo exige no NULL |
| `priority` ∈ `{low, medium, high, urgent}` | **Aplicación** (`INVALID_PRIORITY`) y la base (`CHECK`) |
| `status` ∈ los cuatro estados | **Aplicación** (`INVALID_STATUS`) y la base (`CHECK`) |
| Estado inicial `pending` | **Aplicación** (default al insertar) y la base (`DEFAULT 'pending'`) |
| Identidad (`id`) no proviene del cliente | **Servidor/Base** (`IDENTITY`, nunca del body) |
| Cambio de `status` dentro de transiciones permitidas | **Aplicación** (`domain/ticket-status.js`: `canTransition`). La base solo garantiza que el valor sea válido, no la transición. |
| Modificaciones sobre estado terminal | **Aplicación** (`TICKET_IN_TERMINAL_STATUS`). La base no sabe qué es "terminal". |

> La base protege la **forma** (tipos, valores permitidos, obligatoriedad). La aplicación
> protege las **reglas de negocio** (transiciones, terminales, filtros). Son capas distintas.

## Tabla `ticket_status_history`

Historial de cada cambio de estado de un ticket. Una fila por evento de transición (o
nacimiento).

| Columna | Tipo | Restricción | Descripción |
| ------- | ---- | ----------- | ----------- |
| `id` | `BIGINT` | `GENERATED ALWAYS AS IDENTITY PRIMARY KEY` | Identidad del evento |
| `ticket_id` | `BIGINT` | `NOT NULL` · `FOREIGN KEY REFERENCES support_tickets(id)` | A qué ticket pertenece |
| `previous_status` | `VARCHAR(30)` | acepta `NULL` · `CHECK` (NULL o ∈ cuatro estados) | Estado anterior |
| `new_status` | `VARCHAR(30)` | `NOT NULL` · `CHECK` ∈ cuatro estados | Nuevo estado |
| `changed_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Cuándo ocurrió |

### ¿Por qué `previous_status` acepta NULL?

**NULL = nacimiento.** Un ticket nace directamente en `pending`; en ese momento **no hubo un
estado anterior** que registrar. El evento de nacimiento tiene `new_status = 'pending'` y
`previous_status = NULL`, porque "pending fue el primer estado" y no hay nada antes. Un valor
`NOT NULL` nos obligaría a inventar un estado previo falso que nunca existió. `NULL` es la
representación honesta de "no hay estado previo".

### ¿Por qué `new_status` NO acepta NULL?

Todo evento de historial describe **el estado al que se llegó**. No existe un evento que no
produzca ningún estado: nacimiento → `pending`, transición → el estado destino. `new_status`
sin valor no tendría significado.

### Relaciones

* `ticket_status_history.ticket_id` → `support_tickets.id` (uno a muchos: un ticket tiene
  muchos eventos). `ON DELETE` no se define porque en este sistema **no hay DELETE** (decisión
  001: estados terminales en vez de borrar).

## Restricciones totales e invariantes persistentes

* `id` siempre generado por la base; el cliente nunca lo entrega.
* `title` nunca vacío/ausente.
* `priority` y `status` siempre con valores del conjunto cerrado.
* `ticket_status_history` solo referencia tickets que existen (FK).
* El primer evento de cada ticket tiene `previous_status = NULL` (nacimiento).

## Materialización en el repositorio

El esquema vive versionado en `database/migrations/`:

```
database/
├── migrations/
│   ├── 001_create_support_tickets.sql
│   └── 002_create_ticket_status_history.sql
└── seed.sql
```

* **001** crea `support_tickets` con identidad `IDENTITY`, checks de prioridad
  (`low/medium/high/urgent`) y de estado (`pending/in_progress/resolved/cancelled`) y
  defaults.
* **002** crea `ticket_status_history`, completa los dos CHECK (previous NULL o ∈ cuatro
  estados; new ∈ cuatro estados) y el FK.
* **seed.sql** inserta cuatro tickets (uno por estado) con sus eventos de nacimiento y dos
  transiciones (`pending → in_progress` y `in_progress → resolved`) para que los casos de
  prueba tengan historia que consultar.

## Dudas

* ¿El `updated_at` se debe refrescar en cada PATCH aunque no cambie el status? Sí: cualquier
  modificación renueva la fecha de actualización.
* ¿Debe haber un límite de longitud para `description`? No se impone; es texto libre.
* ¿Queremos que `GET /api/v1/support-tickets/:id/history` devuelva eventos ordenados? Sí,
  `changed_at ASC` (cronológico) para que la historia se lea en orden.