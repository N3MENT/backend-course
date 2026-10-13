# Query matrix — cada operación con su SQL y parámetros

Autor: Diego Silva — diegosilva.itsu@gmail.com

> Fase 1 · se completa **antes de usar IA y antes de tocar código**.
> Para cada operación del store: el SQL **parametrizado** (nunca concatenado) y qué
> parámetros lleva. Columnas explícitas siempre; nunca `SELECT *`.

## Regla transversal

* **Todo query usa parámetros** (`$1`, `$2`, ...). Los valores del cliente **nunca** se
  concatenan en la cadena SQL: concatenar es el origen de la inyección SQL y de bugs.
* **Columnas explícitas** en todos los `SELECT` y todos los `INSERT`/`UPDATE`. No `SELECT *`.
* Los **identificadores** (nombres de tabla/columna) no pueden ser parámetros: por eso los
  filtros se arman en el service, que **solo** deja pasar nombres de columna fijos y valores
  ya validados contra los conjuntos cerrados.

## 1. `findAll`

```sql
SELECT id, title, description, priority, status, created_at, updated_at
FROM support_tickets
WHERE ($1::boolean IS FALSE OR status = $2)
  AND ($3::boolean IS FALSE OR priority = $4)
ORDER BY id ASC;
```

* `$1` / `$3` = booleano "hay filtro" para `status` / `priority`
* `$2` = filtrar por `status` (o `NULL` = sin filtro)
* `$4` = filtrar por `priority` (o `NULL` = sin filtro)

Los valores ya pasaron validación en el service (si vienen indefinidos → `NULL`).

## 2. `findById`

```sql
SELECT id, title, description, priority, status, created_at, updated_at
FROM support_tickets
WHERE id = $1;
```

* `$1` = el id numérico.

Devuelve `1` fila o `0`.

## 3. `insertTicket`

```sql
INSERT INTO support_tickets (title, description, priority)
VALUES ($1, $2, $3)
RETURNING id, title, description, priority, status, created_at, updated_at;
```

* `$1` = title (ya sin espacios)
* `$2` = description (obligatoria en este diseño)
* `$3` = priority (default aplicado en el service: `medium`)

No inserto `id`, `status`, `created_at` ni `updated_at`: los genera la base
(`IDENTITY`, `DEFAULT 'pending'`, `CURRENT_TIMESTAMP`). `RETURNING` entrega la fila completa.

## 4. `updateTicket`

```sql
UPDATE support_tickets
SET title = $1, description = $2, priority = $3, status = $4,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $5
RETURNING id, title, description, priority, status, created_at, updated_at;
```

> El `SET` se arma en el store **solo** con los campos que el service decidió actualizar
> (nombres de columna fijos), y **siempre** se renueva `updated_at`.

* `$1..$4` = valores de los campos a cambiar (cada uno puede repetir el valor actual si no
  cambió)
* `$5` = el id.

Devuelve la fila actualizada o `0` filas si el id no existe.

## 5. `insertStatusHistory`

```sql
INSERT INTO ticket_status_history (ticket_id, previous_status, new_status)
VALUES ($1, $2, $3);
```

* `$1` = ticket_id
* `$2` = previous_status (o `NULL` en nacimiento)
* `$3` = new_status

## 6. `findHistory`

```sql
SELECT previous_status, new_status, changed_at
FROM ticket_status_history
WHERE ticket_id = $1
ORDER BY changed_at ASC;
```

* `$1` = ticket_id.

Orden cronológico (`changed_at ASC`) para leer la historia en orden.

## Mapa operación → query

| Operación del store | Query | Parámetros |
| ------------------- | ----- | ---------- |
| `findAll(filters)` | `SELECT ... FROM support_tickets ...` | 0–2 pares (status, priority) |
| `findById(id)` | `SELECT ... WHERE id = $1` | 1 |
| `insertTicket(...)` | `INSERT ... RETURNING` | 3 |
| `updateTicket(...)` | `UPDATE ... WHERE id = $n` | 1 + #campos |
| `insertStatusHistory(...)` | `INSERT ...` | 3 |
| `findHistory(id)` | `SELECT ... WHERE ticket_id = $1` | 1 |

> El ID del ticket al insertar el historial se obtiene de la fila `RETURNING` del
> `insertTicket` (mismo cliente, misma transacción), no del cliente.
