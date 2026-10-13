# Registro de decisiones — Clase 05

Autor: Diego Silva — diegosilva.itsu@gmail.com

Registro una entrada por cada decisión no obvia: qué decidí, qué alternativas
tenía y por qué elegí lo que elegí.

## D1 — La identidad confiable vive en `req.auth`, no en el body ni en el payload decodificado

El middleware `authenticate` verifica el JWT con `jose` (firma, algoritmo,
issuer, audience y expiración) y construye `req.auth = { userId, role }` como
única fuente de identidad. Decisión: `createdBy` y `changedBy` salen siempre de
ahí. Descarté confiar en campos del body (permitiría suplantar actores) y en el
payload sin verificar (decodificar permite leer, no confiar).

## D2 — Un recurso ajeno responde `404`, no `403`

`getRequest`, `getHistory` y el scope de `listRequests` tratan el recurso de
otro usuario como inexistente. Descarté responder `403` porque delata que el
recurso existe y habilita enumeración. Decisión: mismo código y mismo mensaje
`REQUEST_NOT_FOUND` para "no existe" y para "existe pero no es tuyo".

## D3 — Las solicitudes heredadas (`created_by IS NULL`) son solo de `agent`

Las filas creadas antes de la migración 004 no tienen dueño. Un requester no
puede demostrar acceso legítimo (nunca puede matchear un `NULL`), así que el
scope en SQL (`created_by = <actor>`) las excluye automáticamente; el agente ve
todas. Tomé la decisión en el diseño (estación 1) y la mantuve en la
implementación.

## D4 — Autorización todo-o-nada en `PATCH`

Antes de escribir una sola columna autorizo el lote completo de cambios: si
`title`/`description` piden `canEditContent`, `priority` pide
`canChangePriority` y `status` pide `canChangeStatus`. Un body mixto con un solo
campo prohibido responde `403 FORBIDDEN` y **no** aplica la parte permitida (sin
actualizaciones parciales inesperadas).

## D5 — Un único error genérico para todo fallo de login

Email inexistente y contraseña incorrecta producen exactamente los mismos bytes
(`401 INVALID_CREDENTIALS`), para impedir la enumeración de cuentas a través de
la respuesta.

## D6 — Campos controlados por el servidor: rechazo explícito, nunca silencio

Si el body trae `role`, `id`, `createdAt`, `updatedAt`, `createdBy`,
`passwordHash` o `changedBy` (y `status` en el POST), respondo
`400 SERVER_CONTROLLED_FIELD`. Descarté ignorarlos en silencio: acopla el
backend a clientes mentirosos y dificulta la depuración.

## D7 — Infraestructura: proyecto nuevo en Supabase, conexión vía transaction pooler

Creé un proyecto nuevo en Supabase y apliqué las migraciones 001→005 en orden.
El session pooler (5432) reseteaba la conexión (`ECONNRESET`); uso el
transaction pooler (6543, `?pgbouncer=true`), que mantiene el mismo contrato y
funciona de forma estable. La contraseña y la URL viven solo en `.env`
(gitignoreado).
