# Contrato de autenticación — Request API v5

Autor: Diego Silva — diegosilva.itsu@gmail.com

Definí este contrato antes de implementar. Toda respuesta de error tiene la
misma forma:

```json
{ "error": { "code": "<CODE>", "message": "<mensaje>" } }
```

## `POST /auth/register`

- Público: sí.
- Body permitido (allowlist): `email`, `password`.
- Éxito: `201` con `{ id, email, role: "requester", createdAt }`, sin hash ni
  secretos.
- Errores:
  - `400 INVALID_EMAIL` — email ausente o mal formado.
  - `400 INVALID_PASSWORD` — contraseña fuera de 15..128 caracteres.
  - `400 SERVER_CONTROLLED_FIELD` — el body trae `role`, `id`, `createdAt`,
    `updatedAt`, `createdBy` o `passwordHash`.
  - `409 ACCOUNT_CANNOT_BE_CREATED` — email ya registrado (genérico, no filtra
    cuál). El `23505` de la base se traduce a este código genérico.

## `POST /auth/login`

- Público: sí.
- Body permitido: `email`, `password`.
- Éxito: `200` con `{ accessToken, tokenType: "Bearer", expiresIn }`, donde
  `accessToken` es un JWT y `expiresIn` son los segundos de vida del token
  (3600).
- Errores:
  - `401 INVALID_CREDENTIALS` — el mismo error idéntico para email inexistente
    y para contraseña incorrecta (no filtra qué falló).
  - `400` para body malformado si aplica.

## `GET /auth/me`

- Protegido: necesita `Authorization: Bearer <token>`.
- Éxito: `200` con `{ id, email, role }` del token autenticado.
- Errores:
  - `401 AUTHENTICATION_REQUIRED` — falta el header Bearer o tiene mal formato.
  - `401 INVALID_TOKEN` — token inválido, alterado, vencido o con firma rota.

## Semántica de errores

- `401` = autenticación: no enviaste credenciales válidas (sin Bearer, Bearer
  malformado, token inválido/vencido/alterado) o el login falló
  (`INVALID_CREDENTIALS`).
- `403` = autorización: estás autenticado, pero tu rol o tu propiedad no lo
  permiten (`FORBIDDEN`). Ejemplo: un requester que intenta cambiar prioridad
  o estado.
- `404` = recurso: la solicitud no existe **o** no existe para ti. Respondo el
  mismo `404` que usaría para un requisito inexistente, para no filtrar la
  existencia de recursos ajenos; a un requester le respondo `404`, no `403`.
- `409` = conflicto de dominio: transición de estado inválida
  (`INVALID_STATUS_TRANSITION`), estado terminal inmutable
  (`REQUEST_IN_TERMINAL_STATUS`), email duplicado
  (`ACCOUNT_CANNOT_BE_CREATED`).
- `400` = contrato violado: `SERVER_CONTROLLED_FIELD`, `INVALID_EMAIL`,
  `INVALID_PASSWORD`, campos ausentes (`MISSING_*`), status o parámetro
  inválido.
- `503` = infraestructura (`DATABASE_UNAVAILABLE`); `500` = error no clasificado
  (`INTERNAL_ERROR`).
