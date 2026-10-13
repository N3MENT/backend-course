# Uso de IA — Clase 05

Autor: Diego Silva — diegosilva.itsu@gmail.com

Este archivo refleja una regla del taller: solo puedo usarlo después del
checkpoint `class-05-access-design`, es decir, cuando la matriz, el contrato y
las amenazas ya estaban completos. Lo que sigue es el registro honesto de qué
hizo la IA y qué hice yo.

## Mi diseño antes de la IA

Completé la estación 1 por mi cuenta: `access-matrix.md` (roles, campos
controlados, heredadas), `auth-contract.md` (endpoints y semántica de errores)
y `threat-cases.md` (12 casos adversariales). Validé el checkpoint con
`npm run validate:class-05 -- --stage access-design` → 3/3. A partir de ahí la
IA quedó habilitada.

## Qué le pedí

1. Terminar el backend de las estaciones 4-8 sobre el starter: login con JWT,
   middleware de autenticación, propiedad (`createdBy`/`changedBy`) y permisos
   por rol, respetando el contrato fijo de `validate-class-05.js`.
2. Elegir dónde ejecutar las migraciones (Supabase) y diagnosticar la conexión.
3. Documentar la evidencia de validación y las decisiones.

## Qué propuso la IA

- `token.js`: `issueToken` con `jose` (`HS256`, claims `sub/role/iat/exp/iss/aud`)
  y `verifyToken` con `jwtVerify` (firma, algoritmo, issuer, audience, expiración).
- `login()` con un único `AppError('auth','INVALID_CREDENTIALS')` para todo fallo.
- Middleware `authenticate`: esquema Bearer estricto, `req.auth = { userId, role }`.
- Requests: scope de colección en SQL por `created_by`, recursos ajenos → 404
  idéntico, autorización todo-o-nada en `PATCH` vía `request.policy.js`.
- Conexión a Supabase por el transaction pooler (6543) cuando el session pooler
  (5432) fallaba con `ECONNRESET`.

## Qué acepté

Todo lo anterior, después de leerlo y ejecutarlo: cada stage del validador pasó.

## Qué rechacé

- Diseñar criptografía propia en lugar del helper `password.js` del starter.
- Exponer `createdBy` desde el body en `POST /requests` (se tomó del token).
- Devolver `403` para recursos ajenos (elegí `404` para no filtrar existencia).
- Ignorar en silencio los campos controlados por el servidor (se rechazan con 400).

## Errores de seguridad que detecté

- El session pooler de Supabase tiraba `ECONNRESET`: no era SSL ni credenciales
  (el transaction pooler conectaba), así que cambié de punto de conexión.
- Verificar (no decodificar) el JWT: un payload editado con `role: agent` debe
  responder `401 INVALID_TOKEN` (lo comprueba el validador).
- `/auth/me` no debe devolver ni hash ni `createdAt` extra: respuesta mínima
  `{ id, email, role }`.

## Cómo verifiqué la implementación

- `npm run validate:class-05` por stage: setup 5/5, access-design 3/3, register 2/2,
  password 1/1, login 2/2, authentication 2/2, ownership 2/2, authorization 2/2.
- Boss battle integral: 12/12 → CLASS 05 COMPLETED (evidencia en
  `validation-evidence.md`).

## Qué todavía no domino

No tengo cerrado cómo se resolvería la revocación de tokens y el refresh: hoy
un token vive 3600 segundos y no hay forma de invalidarlo antes de que expire,
así que si se filtra queda útil hasta su vencimiento. También me queda pendiente
imaginar cómo escalaría la autorización si aparecieran más de dos roles sin que
la matriz de acceso se vuelva inmanejable.
