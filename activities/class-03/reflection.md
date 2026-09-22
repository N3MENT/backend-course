# Reflexión — Entrega 03

> Ocho preguntas para comprobar lo esencial de la clase 3. Respuestas concretas, con
> evidencia del proyecto.

### 1. ¿Qué diferencia hay entre el recurso y su representación JSON?

El recurso es la entidad conceptual (un **ticket de soporte** con un ciclo de vida). El JSON
es **una representación** de su estado en un momento dado: la forma de comunicarlo por HTTP.
El mismo recurso puede representarse de distintas maneras (aquí, como objeto JS que Express
serializa a JSON), y la representación cambia en cada respuesta mientras el recurso sigue
siendo el mismo. Por eso el contrato (`docs/http-contract.md`) describe la representación
JSON, no el modelo interno.

### 2. ¿Qué diferencia hay entre PUT y PATCH?

Son intenciones distintas, no tamaños distintos. `PUT` reemplaza la representación
completa; `PATCH` modifica una parte y solo viajan los campos que cambian. En esta API
usamos `PATCH` para la actualización parcial, y los campos del servidor (`id`, `createdAt`,
`updatedAt`) se ignoran aunque el cliente los envíe.

### 3. ¿Qué significa que una operación sea idempotente?

Que repetirla deja el mismo estado final que ejecutarla una sola vez. En nuestro diseño,
`PATCH` lo es en la práctica: pedir `{"status":"in_progress"}` dos veces sobre un ticket
`pending` deja el mismo estado que pedirlo una vez (la segunda vez no cambia nada, y lo
probado en la suite cubre el caso "repetir el estado actual"). No se trata de que devuelva
siempre el mismo cuerpo, sino de que el estado resultante tras N ejecuciones sea idéntico al
de una ejecución.

### 4. "HTTP no recuerda nada": ¿hasta dónde llega esa afirmación?

Llega al **protocolo**: HTTP es stateless y no recuerda interacciones anteriores entre
cliente y servidor. No quiere decir que el backend no pueda guardar estado: los ticket viven
en memoria en `src/repositories/supportTickets.repository.js`, y por eso podemos consultar
mañana el ticket que creamos hoy. Recordar es trabajo del backend, no del protocolo. La
persistencia real (sobrevivir a un reinicio) es el problema de la clase 4.

### 5. ¿Por qué una transición inválida es 409 y no 400?

Porque la petición `{"status":"resolved"}` sobre un ticket `pending` es **válida en su
forma**: `resolved` pertenece al conjunto de estados. Lo que la vuelve imposible es el
**estado actual** del recurso (no hay transición `pending → resolved` en la máquina). El
`400` es para peticiones mal formadas; el `409` comunica "la petición está bien, pero el
estado actual la prohíbe" e invita al cliente a releer el estado del recurso (GET) en lugar
de reintentar a ciegas.

### 6. ¿Por qué estados terminales en vez de borrar?

Para preservar historia, referencias y auditoría. Borrar elimina el registro: un cliente con
el id desaparecido vería un `404` sin poder distinguir "nunca existió" de "qué pasó con mi
ticket". Un estado terminal (`resolved` o `cancelled`) registra el desenlace sin destruir
información y bloquea cualquier cambio posterior con `409 TICKET_IN_TERMINAL_STATUS`. Es una
decisión documentada en
`project/docs/decisions/001-terminal-states-instead-of-delete.md`, no una regla universal.

### 7. ¿Qué responsabilidad tiene cada capa?

* `routes/`: mapea URLs y métodos HTTP a controladores; no evalúa reglas.
* `controllers/`: traduce los resultados del servicio en códigos y cuerpos HTTP.
* `services/`: aplica las reglas de negocio (obligatorios, prioridad, transiciones,
  terminales) y lanza `AppError`; decide códigos de error.
* `repositories/`: accede a los datos en memoria (semilla y consultas); no conoce HTTP.
* `dtos/`: describe el contrato de entrada y valida cada cuerpo (`create` y `patch`).
* `domain/ticket-status.js`: declara estados, prioridades, transiciones y terminales; si
  cambia una transición mañana, solo se toca este archivo.
* `middlewares/errorHandler.js`: unifica el formato de error y el 404 de rutas desconocidas.

### 8. ¿Dónde viven los datos y qué se pierde al reiniciar?

En memoria, dentro del proceso Node (`src/repositories/supportTickets.repository.js`). Al
reiniciar el servidor se pierden los tickets creados y la semilla vuelve a ser los cuatro
iniciales. Es comportamiento esperado y documentado del proyecto; la persistencia es el
problema de la clase 4.