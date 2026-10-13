# Transaction plan — unidad de trabajo, COMMIT/ROLLBACK y cliente

Autor: Diego Silva — diegosilva.itsu@gmail.com

> Fase 1 · se completa **antes de usar IA y antes de tocar código**.
> Defino la o las unidades de trabajo, sus fallos posibles y cómo garantizo que dos
> escrituras dependientes se confirmen (o se reviertan) como una sola.

## ¿Por qué necesito una transacción?

Hay operaciones que escriben en **dos tablas a la vez** y ambas deben quedar consistentes:

* **`createTicket`**: inserta en `support_tickets` (el ticket) **y** en
  `ticket_status_history` (su evento de nacimiento). Si el historial fallara después de
  insertar el ticket, tendría un ticket sin su nacimiento: estado inconsistente.
* **`patchTicket` (cuando cambia `status`)**: actualiza `support_tickets.status` **y**
  inserta el evento en `ticket_status_history`. Si el historial fallara tras el UPDATE,
  tendría un nuevo estado sin registro: historia perdida.

La transacción hace que **ambas escrituras se confirmen juntas (COMMIT) o se reviertan
juntas (ROLLBACK)**. Nunca queda una a medias.

## La unidad de trabajo

Uso un helper `withTransaction(work)` en `src/database/transaction.js`:

```
withTransaction(work) -> Promise<resultado>
```

Secuencia:

1. Pedir **UN** cliente al pool: `const client = await pool.connect()`.
2. `BEGIN`.
3. Ejecutar `await work(client)` — **todas** las queries del bloque deben usar ese `client`.
4. `COMMIT` y devolver el resultado.
5. En cualquier error: `ROLLBACK` (revertir no es ocultar) y relanzar la excepción.
6. `finally`: `client.release()` — siempre, éxito o fallo.

## ¿Por qué el mismo cliente?

Una transacción de PostgreSQL vive en **una conexión**. Si dentro del bloque usáramos
`pool.query()` (que toma otro cliente del pool), esa segunda consulta se ejecutaría **fuera**
de la transacción y silenciosamente escaparía del `COMMIT`/`ROLLBACK` previsto. Para que
`support_tickets` y `ticket_status_history` compartan la transacción, ambas consultas deben
pasar por el mismo `client` que abrió el `BEGIN`. Por eso el store acepta un parámetro `db` y
el service le pasa el cliente de la transacción.

## Fallos posibles y qué hace la transacción

| Falla | Momento | Resultado |
| ----- | ------- | --------- |
| La base no está disponible | al pedir cliente / `BEGIN` | `503 DATABASE_UNAVAILABLE`, nada se escribe |
| `INSERT support_tickets` falla (p. ej. violación CHECK de prioridad) | dentro del `work` | `ROLLBACK`, nada queda |
| `INSERT ticket_status_history` falla | dentro del `work` | `ROLLBACK` → el ticket **no se creó** (o el UPDATE **no se aplicó**) |
| Todo sale bien | — | `COMMIT` → persisten ambas filas |

## Caso de rollback que demostraré

Para probar el rollback (caso demo de la entrega), provoco un fallo **controlado** en el
segundo INSERT de la transacción (haciendo fallar `insertStatusHistory` con un `new_status`
inválido) y observo:

1. La respuesta de error (p. ej. `500` / violación de CHECK).
2. La consulta `SELECT` posterior que demuestra que **el ticket NO quedó creado**.

Luego revierto el cambio de prueba y dejo el código correcto.

## Release del cliente

El `client.release()` está en `finally`: garantiza que el cliente regrese al pool
**siempre**, tanto si la transacción terminó en COMMIT como en ROLLBACK como si explotó
antes. Un cliente sin liberar agota el pool y el sistema deja de responder por falta de
conexiones.

## Unidades de trabajo del service

| Operación | ¿Transacción? | Qué engloba |
| --------- | ------------- | ----------- |
| `createTicket` | Sí | `insertTicket` + `insertStatusHistory` (NULL → pending) |
| `patchTicket` (cambio de status) | Sí | `findById` (validar) + `updateTicket` + `insertStatusHistory` (prev → new) |
| `listTickets` / `getTicket` / `getHistory` | No (solo lectura) | una query cada una, contra el `pool` |
