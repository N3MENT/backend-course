# Contrato HTTP — Request API v5

Autor: Diego Silva — diegosilva.itsu@gmail.com

## Qué cambió respecto de la v4

- Aparecen tres endpoints nuevos: `POST /auth/register`, `POST /auth/login` y
  `GET /auth/me`.
- Todos los endpoints de `/requests` ahora exigen
  `Authorization: Bearer <token>`.
- La conversación de los endpoints existentes conserva su forma, pero cada
  respuesta depende de quién pregunta (rol y propiedad). Aparece `createdBy` en
  la representación y `changedBy` en el historial.
- Códigos nuevos: `401`, `403` y los códigos de contrato de auth.
- La forma de error es invariable: `{ "error": { "code", "message" } }`.

## Actores

Uso dos roles exactos: `requester` (crea y sigue sus solicitudes) y `agent`
(las atiende). El registro siempre crea `requester`; la promoción a `agent` es
una operación docente controlada por SQL, nunca un endpoint.

## Matriz de acceso (baseline fija del taller)

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

Las solicitudes heredadas sin propietario (`createdBy: null`) son visibles solo
para `agent`.

---

## `POST /auth/register` (público)

- Body permitido: `email`, `password`. Allowlist estricta: cualquier campo
  controlado por el servidor (`role`, `id`, `createdAt`, `updatedAt`,
  `createdBy`, `passwordHash`) produce `400 SERVER_CONTROLLED_FIELD`; nunca se
  ignora en silencio.
- Email: requerido, formato básico, se normaliza con trim + lowercase y es
  único.
- Password: string de 15 a 128 caracteres (code points), permite Unicode y
  espacios, sin reglas arbitrarias de composición. Jamás aparece en logs.
- `201` → `{ "id": "<uuid>", "email": "ana@example.com", "role": "requester", "createdAt": "…" }`
- `400 INVALID_EMAIL` · `400 INVALID_PASSWORD` · `409 ACCOUNT_CANNOT_BE_CREATED`
  (genérico: la respuesta no confirma que el email exista).

## `POST /auth/login` (público)

- Body: `email`, `password`.
- `200` →

```json
{ "accessToken": "<jwt>", "tokenType": "Bearer", "expiresIn": 3600 }
```

- `401 INVALID_CREDENTIALS` con mensaje idéntico para email inexistente,
  password incorrecta o cuenta no disponible. La respuesta nunca dice qué dato
  falló.

## `GET /auth/me` (protegido)

- `200` → `{ "id": "<uuid>", "email": "…", "role": "requester" }`.
- Nunca devuelve password, hash, salt ni material de firma.

## JWT del taller

Claims: `sub` (id del usuario), `role`, `iat`, `exp` (1 hora),
`iss = backend-course-api`, `aud = backend-course-client`. Firma HS256 con
`JWT_SECRET`. Verifico siempre firma, algoritmo, emisor, audiencia y expiración:
decodificar permite leer; verificar permite confiar. El token está firmado, no
cifrado, así que no lleva datos sensibles.

---

## `GET /requests` (protegido)

- `requester`: solo sus solicitudes (scoping en SQL). `agent`: todas.
- Filtros `?status=` y `?priority=` como en v4 · `400 INVALID_FILTER`.

## `GET /requests/:id` · `GET /requests/:id/history` (protegidos)

- `200` para el dueño o para `agent`.
- `404 REQUEST_NOT_FOUND` si no existe **o si es ajena**: la misma respuesta
  exacta, para no revelar existencia (decisión documentada en
  `docs/decisions/003…`).
- El historial incluye ahora `changedBy` (UUID del actor; `null` en eventos
  heredados).

## `POST /requests` (protegido, solo requester)

- Body permitido: `title`, `description`, `priority`. `createdBy`, `status`,
  `id` y fechas → `400 SERVER_CONTROLLED_FIELD`.
- `createdBy` se toma del token. La solicitud nace `open`, con historia
  `NULL → open` y `changedBy` igual al creador, dentro de una transacción.
- `403 FORBIDDEN` si un `agent` intenta crear.

## `PATCH /requests/:id` (protegido)

- Campos actualizables: `title` y `description` (dueño + `open`), `priority`,
  `status` (solo `agent`). Autorización todo-o-nada: un body mixto se rechaza
  completo (403) sin aplicar cambios parciales.
- Las reglas de la Clase 03 siguen intactas para todos los roles:
  `409 INVALID_STATUS_TRANSITION` · `409 REQUEST_IN_TERMINAL_STATUS`.
- `changedBy` en el body → `400 SERVER_CONTROLLED_FIELD`.

## Mapa de errores

| Código | Cuándo |
| ------ | ------ |
| `400` | contrato roto o campo controlado por el servidor |
| `401 AUTHENTICATION_REQUIRED` | sin esquema Bearer |
| `401 INVALID_TOKEN` | firma, emisor, audiencia o expiración inválidos |
| `401 INVALID_CREDENTIALS` | login fallido (genérico) |
| `403 FORBIDDEN` | actor identificado sin permiso para esa operación |
| `404 REQUEST_NOT_FOUND` | inexistente o ajeno (idénticos a propósito) |
| `409` | duplicado de cuenta, transición inválida, estado terminal |
| `500 INTERNAL_ERROR` | error inesperado (sin stack ni secretos) |
| `503 DATABASE_UNAVAILABLE` | base inaccesible |

Criterio: `401` cuando no hay identidad confiable; `403` cuando la identidad
existe pero la operación está prohibida; `404` cuando no conviene revelar
existencia; `409` para conflictos de estado.
