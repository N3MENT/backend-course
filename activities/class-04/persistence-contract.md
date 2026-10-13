# Persistence contract — operaciones del store

Autor: Diego Silva — diegosilva.itsu@gmail.com

> Fase 1 · se completa **antes de usar IA y antes de tocar código**.
> Defino qué puede hacer el store contra la base: entrada, consulta, salida, ausencia,
> errores, si usa transacción y el mapeo. Es la frontera entre SQL y el resto del sistema.

## Responsabilidad

`supportTickets.repository.js` es el único sitio que habla **SQL** y conoce los **nombres de
columna**. No sabe nada de HTTP (códigos de estado) ni de reglas de negocio (transiciones).
Recibe objetos simples de la capa de servicio y devuelve filas (o resultados) **sin
mapear**; el mapeo lo hace `supportTicket.mapper.js`.

## Operaciones del store

### `findAll(filters, db = pool)` → `rows[]`

* **Entrada**: `filters` = `{ status?, priority? }` (opcional). `db` = cliente/pool (default
  `pool`).
* **Consulta**: `SELECT` con columnas explícitas; filtros **parametrizados** (`$1`, `$2`)
  construidos dinámicamente **solo a partir de valores ya validados** por el servicio.
* **Ausencia**: devuelve arreglo vacío (`[]`) — "no hay resultados" no es un error.
* **Errores**: propaga; no construye mensajes HTTP.
* **Mapa**: cada fila es una representación **en bruto** (snake_case); no es la respuesta.

### `findById(id, db = pool)` → `row | null`

* **Entrada**: `id` (número, tal como lo asignó la base).
* **Consulta**: `SELECT ... WHERE id = $1` (parametrizado), con columnas explícitas.
* **Ausencia**: devuelve `null`.
* **Mapa**: fila cruda; quien llama traduce.

### `insertTicket({ title, description, priority }, db)` → `row`

* **Entrada**: campos controlados por el cliente + el `db` (en creación siempre es el cliente
  de la transacción). **Nota:** no se pasa `status` ni `id`: los define la base (`status`
  default `pending`, `id` identidad, fechas `CURRENT_TIMESTAMP`).
* **Consulta**: `INSERT INTO support_tickets (title, description, priority) VALUES ($1, $2,
  $3) RETURNING id, title, description, priority, status, created_at, updated_at`.
* **`RETURNING`**: me permite obtener la fila creada (incluido `id` y fechas que puso la base)
  sin una segunda consulta.
* **Errores**: propaga; el rollback lo decide la unidad de trabajo.
* **No transacción**: la transacción la decide el *service*, no el store.

### `updateTicket(id, changes, db)` → `row | null`

* **Entrada**: `id` + `changes` (solo campos que el servicio validó) + `db` (cliente de
  transacción en PATCH).
* **Consulta**: `UPDATE support_tickets SET <cols>, updated_at = CURRENT_TIMESTAMP WHERE
  id = $n RETURNING ...` — columnas explícitas y valores parametrizados. Siempre renuevo
  `updated_at`.
* **Ausencia**: `null` si el `WHERE` no afectó filas (id no encontrado; el servicio ya lo
  habrá validado).
* **Errores**: propaga.

### `insertStatusHistory(ticket_id, previous_status, new_status, db)` → `void`

* **Entrada**: el ticket, el estado anterior (puede ser `null` en nacimiento) y el nuevo.
* **Consulta**: `INSERT INTO ticket_status_history (ticket_id, previous_status, new_status)
  VALUES ($1, $2, $3)`.
* **Error**: propaga. Es la operación que puede fallar y disparar el `rollback`.

### `findHistory(ticket_id, db = pool)` → `rows[]`

* **Entrada**: `id` del ticket.
* **Consulta**: `SELECT previous_status, new_status, changed_at FROM ticket_status_history
  WHERE ticket_id = $1 ORDER BY changed_at ASC`.
* **Ausencia**: arreglo vacío (`[]`) si el ticket existe pero aún sin eventos — aunque por
  diseño todo ticket siempre tiene al menos su nacimiento.
* **Mapa**: filas crudas; el mapper las convierte.

## Errores

El store **no** genera respuestas HTTP ni códigos `{ error: {...} }`. Si algo falla (query,
conexión a la base no disponible), propaga el error de `pg` tal cual y la capa de
servicio/rutas lo traduce al formato de error y al código adecuado (`500` / `503
DATABASE_UNAVAILABLE`), sin filtrar secretos ni detalles internos al cliente.

## Mapeo

El store entrega **filas** (snake_case). El mapper (`supportTicket.mapper.js`) las convierte
en la **representación HTTP** (camelCase) que el contrato de clase 3 promete:

| fila (SQL) | representación (HTTP) |
| ---------- | --------------------- |
| `created_at` | `createdAt` |
| `updated_at` | `updatedAt` |
| (`previous_status`, `new_status`, `changed_at`) | (`previousStatus`, `newStatus`, `changedAt`) |

> Persistir una fila **no** la convierte automáticamente en la respuesta; esa es la tarea del
> mapper, para no romper el contrato publicado en clase 3.

## Fail-fast de conexión

El `pool.js` lanza un error claro en el arranque si falta `DATABASE_URL` ("fail early con un
mensaje accionable") en lugar de un mensaje críptico al primer query minutos después. El
`db:check` verifica la conexión **sin imprimir secretos** (solo nombre de la base y versión).
