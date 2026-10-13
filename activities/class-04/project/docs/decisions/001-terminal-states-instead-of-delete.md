# Estados terminales en vez de borrar

Autor: Diego Silva — diegosilva.itsu@gmail.com

> Decision record · `project/docs/decisions/001-terminal-states-instead-of-delete.md`

## Contexto

El sistema maneja tickets de soporte con un ciclo de vida. Un ticket puede quedar sin sentido
(el usuario ya no lo necesita, se resolvió por otro canal, era un duplicado). ¿Qué hago con
ese ticket? Las opciones van de borrarlo físicamente a conservarlo con un estado que lo
marque como cerrado e inmutable.

Borrar elimina el registro: un cliente que pidió el ticket y lo volvió a pedir vería un
`404` sin poder distinguir "nunca existió" de "qué le pasó a mi ticket". Además, la clase 4
introduce el **historial de estados**: borrar el ticket rompería la historia que documenté
conservar (decisión `002`).

## Opciones

### Opción 1: Borrar físicamente (`DELETE`)

Beneficios:

* No acumula filas "muertas" en la tabla.

Costos:

* Se pierde el registro, la referencia y la auditoría.
* Rompe la historia: la FK de `ticket_status_history` apuntaría a un ticket inexistente.
* Un `404` no distingue "nunca existió" de "existe pero se borró".

### Opción 2: Estados terminales inmutables

Beneficios:

* El ticket conserva su identidad y su historial completo.
* `resolved` y `cancelled` son estados terminales: la aplicación no admite más cambios
  (`409 TICKET_IN_TERMINAL_STATUS`).
* La historia persiste y la FK nunca se rompe porque nadie borra.

Costos:

* La colección crece; se mitiga con índices sobre `status`/`created_at` (y con `cancelled`
  como forma de "descartar").
* Cuesta definir bien qué estados son terminales (es decisión de diseño, en
  `domain/ticket-status.js`).

## Decisión

Elijo la **Opción 2: estados terminales inmutables** (`resolved` y `cancelled`). No existe
`DELETE` en el contrato; el historial completo es la raíz: si nada se borra, la historia no
se rompe, y un ticket descartado queda documentado con su estado terminal en vez de
desaparecer.

## Consecuencias

* La tabla `support_tickets` nunca pierde filas; cada ticket tiene historia completa
  (`ticket_status_history`).
* El cliente distingue "no existe" (`404`) de "ya cerró" (estado terminal + `409`).
* El costo es acumular filas; los índices y, a futuro, particionado/archivo son decisión de
  escala.
