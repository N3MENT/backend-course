# Casos adversariales — Request API v5

Autor: Diego Silva — diegosilva.itsu@gmail.com

Estos son los doce ataques que mi implementación debe resistir. Los escribí
antes de programar, en la estación 1, para que cada defensa tuviera un caso que
la justificara.

1. **Registro con `role` elegido por el cliente** — `POST /auth/register` con
   `"role": "agent"`. → `400 SERVER_CONTROLLED_FIELD`. El rol siempre lo pone el
   servidor (`requester`).

2. **Registro con campos del servidor inventados** — enviar `"createdBy"`,
   `"id"` o `"passwordHash"` en el register. → `400 SERVER_CONTROLLED_FIELD`.

3. **Email duplicado** — registrar dos veces el mismo email. → `409
   ACCOUNT_CANNOT_BE_CREATED` (mensaje genérico, no revela que el email existe).

4. **Login con email inexistente frente a contraseña incorrecta** — ambos deben
   dar la misma respuesta. → `401 INVALID_CREDENTIALS` idéntico, para no
   permitir enumeración de cuentas.

5. **Acceso sin token** — `GET /auth/me` o `GET /requests` sin header, o con un
   header que no es `Bearer`. → `401 AUTHENTICATION_REQUIRED`.

6. **Token alterado o falsificado** — modificar el `role` en el payload o la
   firma, o usar un token firmado con otra clave. → `401 INVALID_TOKEN` (la
   verificación falla; jamás se confía en el payload sin verificar).

7. **Token vencido** — usar un token con `exp` pasado. → `401 INVALID_TOKEN`.

8. **IDOR (IDs ajenos)** — un requester pide `GET /requests/:id` de una
   solicitud que no creó. → `404` (idéntico al de solicitud inexistente), no
   `403`, para no filtrar la existencia del recurso.

9. **Body mixto con actor inventado** — un requester hace `PATCH /requests/:id`
   enviando `"createdBy"` o `"changedBy"` en el body. → `400
   SERVER_CONTROLLED_FIELD`; el actor sale solo del token.

10. **Requester que intenta cambiar prioridad o estado (acción de agente)** —
    `PATCH /requests/:id` con prioridad o estado por parte de un requester. →
    `403 FORBIDDEN` (está autenticado, pero su rol no lo permite).

11. **Transición de estado inválida** — marcar una solicitud cancelada como
    `in_progress`, o saltarse estados. → `409 INVALID_TRANSITION` (aplica a
    cualquier rol autenticado).

12. **Elevación de privilegios de rol** — jugar con `role` en el token o en el
    body esperando llegar a `agent`. → la firma JWT verificada rechaza los
    tokens manipulados (`401 INVALID_TOKEN`) y el register no acepta `role`
    (`400 SERVER_CONTROLLED_FIELD`).
