# Matriz de acceso — Request API v5

Autor: Diego Silva — diegosilva.itsu@gmail.com

Antes de escribir código fijé el modelo de acceso de la v5. Uso dos roles
exactos, `requester` y `agent`, y no existe `admin`: cualquier privilegio extra
habría que justificarlo con una necesidad real, y aquí no la había.

## Quién puede hacer qué

| Operación | Anónimo | Requester | Agent |
| --------- | ------: | --------: | ----: |
| `POST /auth/register` | Sí | Sí | Sí |
| `POST /auth/login` | Sí | Sí | Sí |
| `GET /auth/me` | No | Sí | Sí |
| `GET /requests` | No | Propias | Todas |
| `GET /requests/:id` | No | Propia | Todas |
| `GET /requests/:id/history` | No | Propia | Todas |
| `POST /requests` | No | Sí | No |
| Editar título/descripción | No | Propia y abierta | No |
| Cambiar prioridad | No | No | Sí |
| Cambiar estado | No | No | Sí |

## Campos controlados por el servidor

El cliente jamás puede enviar estos campos. Si los manda, la API responde `400`
con `error.code = "SERVER_CONTROLLED_FIELD"`.

- En `POST /auth/register`: `role`, `id`, `createdAt`, `updatedAt`,
  `createdBy`, `passwordHash`. El rol lo decide siempre el servidor y es
  `requester`.
- En `PATCH /requests/:id`: `createdBy`, `changedBy`, `id`, `createdAt`,
  `updatedAt`. Los actores salen del token autenticado, nunca del body.

## Solicitudes heredadas

Las solicitudes sin propietario (`created_by IS NULL`, creadas antes de la
migración 004) las ve solo `agent`. Un requester no puede reclamar una solicitud
que no creó, y al no tener dueño no puede demostrar acceso legítimo; el agente,
que ve todas, también cubre las heredadas.
