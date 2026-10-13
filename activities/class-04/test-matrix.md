# Test matrix — Entrega 04 (12 casos mínimos)

Autor: Diego Silva — diegosilva.itsu@gmail.com

> Fase 1: declaro el resultado **esperado**. Fase 6: ejecuto cada caso contra PostgreSQL
> (Supabase) y registro el resultado **observado** (línea de estado literal `HTTP/1.1 ...`).
> La evidencia confirma persistencia tras reinicio y rollback.

## Datos semilla

La base se puebla con `database/seed.sql`: cuatro tickets (uno por cada estado) con su evento
de nacimiento y dos transiciones (`pending → in_progress`, `in_progress → resolved`) para que
el historial tenga datos. Los ids los asigna PostgreSQL (`IDENTITY`), por lo que en ejecución
dependen del estado de la base; la referencia son los tickets sembrados (ids `1..4` tras el
seed) y el ticket creado en el caso 2.

| id | title | status | priority |
| -- | ----- | ------ | -------- |
| 1 | Error al exportar reporte PDF | `pending` | `medium` |
| 2 | Login con doble factor falla | `in_progress` → `resolved` (caso 10) | `high` |
| 3 | Impresora no imprime en red | `resolved` | `urgent` |
| 4 | Cuenta duplicada en el sistema | `cancelled` | `low` |
| 5 | Evidence ticket (caso 2) | `pending` | `high` |

## Resultados esperados (fase 1)

| # | Caso | Petición / acción | Resultado esperado | Resultado observado |
| - | ----- | ----------------- | ------------------- | ------------------- |
| 1 | Conectar correctamente | `npm run db:check` | Verifica conexión e imprime solo nombre de base y versión PostgreSQL, **nunca** la URL ni la contraseña | *(fase 6)* |
| 2 | Crear ticket | `POST /api/v1/support-tickets` | `201` — `id` numérico, `status:"pending"`, `priority` | *(fase 6)* |
| 3 | Persistencia tras reinicio | Reiniciar Express → `GET /api/v1/support-tickets/:id` | `200` — mismos datos tras el reinicio (el estado vive en la base) | *(fase 6)* |
| 4 | Filtrar sin resultados | `GET /api/v1/support-tickets?status=cancelled&priority=urgent` | `200 []` | *(fase 6)* |
| 5 | Transición inválida | `PATCH /api/v1/support-tickets/:id` `{"status":"resolved"}` sobre `pending` | `409 INVALID_STATE_TRANSITION` | *(fase 6)* |
| 6 | Consultar historial | `GET /api/v1/support-tickets/:id/history` | `200` — eventos en orden cronológico (`changedAt ASC`), nacimiento con `previousStatus:null` | *(fase 6)* |
| 7 | Falla del historial (rollback) | Unidad de trabajo con `insertStatusHistory` fallando | El INSERT del ticket **se revierte**; `SELECT` posterior demuestra que el ticket NO quedó creado | *(fase 6)* |
| 8 | Base no disponible | Conexión al pool con host/credencial inalcanzable | `503 DATABASE_UNAVAILABLE` con mensaje seguro (sin secretos) | *(fase 6)* |
| 9 | Crear sin título | `POST /api/v1/support-tickets` `{"description":"sin título"}` | `400 MISSING_TITLE` | *(fase 6)* |
| 10 | PATCH registra evento en historial | `PATCH /api/v1/support-tickets/:id` `{"status":"in_progress"}` | `200` — y el historial gana un evento (`pending → in_progress`) | *(fase 6)* |
| 11 | Historial de ticket inexistente | `GET /api/v1/support-tickets/999999/history` | `404 TICKET_NOT_FOUND` | *(fase 6)* |
| 12 | Filtro con valor desconocido | `GET /api/v1/support-tickets?status=reopened` | `400 INVALID_STATUS` | *(fase 6)* |

### Casos propios (justificación)

* **Caso 9** (`400 MISSING_TITLE`): la validación de contrato sobrevive al store persistente.
* **Caso 10** (historial tras PATCH): cada transición **escribe** su evento, no solo es
  legible el seed (produce los eventos del caso 6).
* **Caso 11** (`404` en history): el endpoint nuevo distingue "sin historial" de
  "ticket inexistente".
* **Caso 12** (`400 INVALID_STATUS` en filtro): mantiene la regla de contrato de clase 3.

## Evidencia obligatoria (fase 6)

*(Se llena en la fase 6 con la salida literal de `curl -i` y de la suite `node:test`:)*

* **Persistencia**: antes / reinicio / después — mismo `id` y datos tras `Ctrl+C` y nuevo
  arranque.
* **Rollback**: log de la unidad de trabajo fallida + `SELECT` posterior que muestra `0`
  filas nuevas en `support_tickets`.

## Regla de evidencia sin secretos

Ningún volcado incluye `DATABASE_URL` ni la contraseña: solo el nombre de la base, la versión
PostgreSQL y resultados de consultas. El `.env` real está en `.gitignore` y nunca se
commitea.
