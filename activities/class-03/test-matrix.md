# Test matrix — Entrega 03

Autor: Diego Silva — diegosilva.itsu@gmail.com

> Fase 1: declaro el resultado **esperado**. Fase 5: ejecuto cada caso contra el proyecto
> corriendo y registro el resultado **observado**. La columna observado se llena ejecutando,
> no copiando la esperada.

## Datos semilla para los casos

El store arranca con cuatro tickets, uno por cada estado, para que cada caso pueda
ejecutarse con un `id` estable y un estado previo claro:

| id (UUID v4) | title | status | priority |
| ------------ | ----- | ------ | -------- |
| `b1e6d2f0-1c9a-4e5d-8a3f-2c5b7d9e1a23` (ticket 1) | Error al exportar reporte PDF | `pending` | `medium` |
| `c2f7e3a1-2dab-4f6e-9b40-3d6c8eaf2b34` (ticket 2) | Login con doble factor falla | `in_progress` | `high` |
| `d3a8f4b2-3ebc-4a7f-ac51-4e7d9fb0c345` (ticket 3) | Impresora no imprime en red | `resolved` | `urgent` |
| `e4b9a5c3-4fcd-4b8a-bd62-5f8e0ac1d456` (ticket 4) | Cuenta duplicada en el sistema | `cancelled` | `low` |

> Si varios casos se ejecutan en cadena sobre el mismo ticket, reinicio el servidor (o
> reinserto la semilla) para restablecer el estado previo declarado.

## Casos

| Caso | Petición | Estado previo | Resultado esperado | Resultado observado |
| --------------------- | ------------------------------------------------------------ | ------------- | ------------------------------------------- | ------------------- |
| Crear correctamente | `POST /api/v1/support-tickets` `{"title":"...","description":"...","priority":"high"}` | — | `201 Created` — id UUID v4, `status":"pending"`, `priority":"high"`, fechas generadas | `201` — `{ "id":"50b99ad3-...","priority":"high","status":"pending",... }` |
| Crear sin título | `POST /api/v1/support-tickets` `{"description":"..."}` | — | `400 MISSING_TITLE` | `400` — code `MISSING_TITLE`, details `title` |
| Crear sin descripción | `POST /api/v1/support-tickets` `{"title":"..."}` | — | `400 MISSING_DESCRIPTION` | `400` — code `MISSING_DESCRIPTION`, details `description` |
| Crear ignorando campos de servidor | `POST /api/v1/support-tickets` `{"title":"...","description":"...","status":"resolved","priority":"urgent"}` | — | `201 Created` — `status:"pending"`, `priority:"urgent"` | `201` — `status:"pending"`, `priority:"urgent"` (id generado, `status` ignorado) |
| Listar colección | `GET /api/v1/support-tickets` | — | `200` con arreglo de 4 | `200` — arreglo con los 4 tickets de la semilla |
| Consultar inexistente | `GET /api/v1/support-tickets/00000000-0000-0000-0000-000000000000` | — | `404 TICKET_NOT_FOUND` | `404` — code `TICKET_NOT_FOUND` |
| Filtrar sin resultados | `GET /api/v1/support-tickets?status=cancelled&priority=urgent` | — | `200 []` | `200` — `[]` |
| Filtro combinado (AND) | `GET /api/v1/support-tickets?status=pending&priority=medium` | — | `200` con solo el ticket 1 | `200` — solo el ticket 1 (`b1e6d2f0-…`) |
| Cambiar prioridad | `PATCH /api/v1/support-tickets/{ticket1}` `{"priority":"low"}` | `pending` | `200` — `priority:"low"`, estado sigue `pending` | `200` — `priority:"low"`, `status:"pending"`, `updatedAt` renovado |
| Transición válida | `PATCH /api/v1/support-tickets/{ticket1}` `{"status":"in_progress"}` | `pending` | `200` — `status:"in_progress"` | `200` — `status:"in_progress"` |
| Transición inválida | `PATCH /api/v1/support-tickets/{ticket1}` `{"status":"resolved"}` | `pending` | `409 INVALID_STATE_TRANSITION` | `409` — code `INVALID_STATE_TRANSITION` |
| Modificar terminal | `PATCH /api/v1/support-tickets/{ticket3}` `{"priority":"high"}` | `resolved` | `409 TICKET_IN_TERMINAL_STATUS` | `409` — code `TICKET_IN_TERMINAL_STATUS` |

### Casos propios

| Caso | Petición | Estado previo | Resultado esperado | Resultado observado |
| ------------------------------ | ------------------------------------------------------------ | ------------- | ------------------------------------------- | ------------------- |
| Filtro con valor desconocido | `GET /api/v1/support-tickets?status=abierta` | — | `400 INVALID_STATUS` | `400` — code `INVALID_STATUS` |
| PATCH sin campos modificables | `PATCH /api/v1/support-tickets/{ticket1}` `{"id":"...","createdAt":"..."}` | `pending` | `400 EMPTY_PATCH` | `400` — code `EMPTY_PATCH` |
| Cancelación desde `in_progress` | `PATCH /api/v1/support-tickets/{ticket2}` `{"status":"cancelled"}` | `in_progress` | `200` — `status:"cancelled"` | `200` — `status:"cancelled"` |
| Prioridad desconocida | `POST /api/v1/support-tickets` `{"title":"...","description":"...","priority":"bloqueante"}` | — | `400 INVALID_PRIORITY` | `400` — code `INVALID_PRIORITY` |

> El caso de "enviar `status` al crear" (ignorado) queda cubierto por *Crear ignorando
> campos de servidor*: los campos que el servidor controla se descartan sin errores.

## Evidencia

Fase 5, salida literal de `curl -i` contra mi proyecto corriendo (`npm start`, puerto 3000)
para los dos casos que prueban que las reglas están protegidas en el servidor. Los 16 casos
de la matriz también se ejecutaron de la misma manera (servidor real, un reinicio por caso
para restablecer la semilla). Además, `npm test` corre la misma matriz como suite `node:test`
(21 aserciones, 21/21).

```http
PATCH /api/v1/support-tickets/b1e6d2f0-1c9a-4e5d-8a3f-2c5b7d9e1a23
Content-Type: application/json

{"status":"resolved"}
```

```http
HTTP/1.1 409 Conflict
Content-Type: application/json; charset=utf-8

{"error":{"code":"INVALID_STATE_TRANSITION","message":"No se puede pasar de 'pending' a 'resolved'.","timestamp":"2026-09-22T14:42:29.174Z","details":[{"field":"status","issue":"La transición 'pending' → 'resolved' no está permitida.","code":"INVALID_STATE_TRANSITION"}]}}
```

```http
PATCH /api/v1/support-tickets/d3a8f4b2-3ebc-4a7f-ac51-4e7d9fb0c345
Content-Type: application/json

{"priority":"high"}
```

```http
HTTP/1.1 409 Conflict
Content-Type: application/json; charset=utf-8

{"error":{"code":"TICKET_IN_TERMINAL_STATUS","message":"El ticket d3a8f4b2-3ebc-4a7f-ac51-4e7d9fb0c345 está en un estado terminal.","timestamp":"2026-09-22T14:42:29.211Z","details":[{"field":"status","issue":"El estado actual \"resolved\" es terminal: no admite más cambios.","code":"TICKET_IN_TERMINAL_STATUS"}]}}
```
