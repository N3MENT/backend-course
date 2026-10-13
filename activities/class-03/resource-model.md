# Resource model — Support Ticket

Autor: Diego Silva — diegosilva.itsu@gmail.com

> Fase 1 · se completa **antes de usar IA y antes de tocar código**.
> No toda palabra del requerimiento se convierte en ruta o campo: parte del trabajo es
> decidir qué entra, qué espera y qué se pregunta.

## Nombre del recurso

**Support Ticket** — una solicitud o incidencia de soporte técnico reportada por un usuario.

> "Una Support Ticket representa una incidencia reportada por un usuario que requiere
> atención técnica; avanza de forma secuencial por un flujo de atención hasta su resolución
> o cancelación, y queda inmodificable al alcanzar un estado final."

## Propiedades

| Propiedad | Tipo | Ejemplo |
| --------- | ---- | ------- |
| `id` | string (UUID v4) | `"f47ac10b-58cc-4372-a567-0e02b2c3d479"` |
| `title` | string | `"Error al exportar reporte PDF"` |
| `description` | string | `"Al hacer clic en 'Exportar', la pantalla se queda congelada."` |
| `priority` | string (enum) | `"high"` |
| `status` | string (enum) | `"pending"` |
| `createdAt` | string (ISO 8601, UTC) | `"2026-09-22T10:00:00Z"` |
| `updatedAt` | string (ISO 8601, UTC) | `"2026-09-22T10:00:00Z"` |

## Campos requeridos

* **`title`**: comunica de forma concreta qué falla; sin él no hay forma de clasificar la
  incidencia. Su ausencia se rechaza con `400`.
* **`description`**: aporta el detalle técnico o de contexto necesario para que el equipo
  intervenga. Su ausencia también se rechaza con `400`.

## Campos opcionales

* **`priority`**: el usuario sugiere la urgencia del caso. Si llega, debe ser uno de
  `{low, medium, high, urgent}`; si no llega, el servidor aplica `medium` como valor
  razonable por defecto.

## Campos generados por el servidor

* **`id`**: identificador único generado por el servidor mediante un **UUID v4**, pensado
  para que la base de datos lo gestione (clase 4) y se eviten colisiones. El cliente no lo
  elige.
* **`createdAt`** y **`updatedAt`**: sellos temporales UTC generados por el servidor. Si los
  generara el cliente, cada reloj sería la verdad y las fechas dejarían de ser confiables.
* **`status`**: el estado inicial está regido por el ciclo de vida de la aplicación, no por
  el cliente. Todo ticket nace en `pending`.

El cliente **no puede fijar** ninguno de estos campos: si los envía en el payload, el
servidor los **ignora** y aplica los valores del sistema.

## Estados permitidos

La lista cerrada de valores de `status` es:

`pending`, `in_progress`, `resolved`, `cancelled`

## Reglas

* Nunca existirá un ticket **sin título o sin descripción**.
* Nunca existirá un ticket cuyo `status` esté fuera de
  `{pending, in_progress, resolved, cancelled}`.
* Nunca existirá un ticket que cambie de estado **desde un estado terminal**
  (`resolved`, `cancelled`): terminado, inmodificable.
* Nunca existirá un ticket cuyo `id`, `createdAt`, `updatedAt` o `status` inicial hayan sido
  **fijados por el cliente**.
* Todo ticket **inicia en `pending`**.
* Nunca existirá un ticket con `priority` fuera de `{low, medium, high, urgent}`.
* Toda respuesta de error tendrá la forma
  `{ "error": { "code": "...", "message": "...", "details": [...], "timestamp": "..." } }`.

## Dudas

* ¿Quién puede **cancelar** un ticket? `pending → cancelled` lo dispara el cliente;
  `in_progress → cancelled` puede dispararlo el agente o el cliente. El requerimiento no
  define identidades todavía; en esta entrega no hay autenticación.
* Si una falla **reaparece** sobre un ticket `resolved`, el negocio pide abrir un ticket
  nuevo: ¿debería la API facilitar algún vínculo "reabierto desde"? Queda fuera de esta
  entrega.
* ¿Deben existir **paginación u ordenamiento** cuando la colección crezca? Lo dejo fuera de
  esta entrega; los filtros cubren el caso actual.
