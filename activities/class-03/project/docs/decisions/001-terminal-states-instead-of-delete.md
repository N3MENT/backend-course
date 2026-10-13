# Estados terminales inmutables en vez de borrado físico

Autor: Diego Silva — diegosilva.itsu@gmail.com

> Decision record · `project/docs/decisions/001-terminal-states-instead-of-delete.md`

## Contexto

El ciclo de vida de un support ticket debe poder **terminar** una incidencia (porque se
resolvió o porque fue descartada) sin vulnerar la integridad de los datos ni comprometer la
auditoría histórica. La solución obvia — borrar el registro de la colección — destruye la
trazabilidad: una vez borrado, no hay forma de saber qué se reportó, quién lo atendió o por
qué terminó una estadística de soporte.

## Opciones

### Opción 1: Borrado físico (`DELETE`)

Beneficios:

* La colección se mantiene pequeña: solo sobreviven los registros activos.
* El endpoint es trivial: eliminar el objeto del store.

Costos:

* Se pierde el historial: nadie puede auditar lo reportado, aunque nunca se atendiera.
* Se rompe la trazabilidad: un cliente que ya tenía el `id` obtiene `404` sin saber si el
  ticket existió o qué pasó con él.
* Los ids empiezan a parecer "huecos": "sin resultados" e "nunca existió" se vuelven
  indistinguibles.

### Opción 2: Conservar el registro con estados terminales inmutables (`resolved`, `cancelled`)

Beneficios:

* El historial se conserva: el ticket existe, muestra su recorrido y un estado terminal que
  explica el desenlace.
* Las referencias siguen siendo válidas: `GET /api/v1/support-tickets/:id` devuelve el
  registro en lugar de un `404` engañoso.
* Auditable: `resolved` y `cancelled` cuentan historias distintas — trabajo culminado vs.
  trabajo interrumpido — sin perder datos.
* La inmutabilidad del estado terminal es una **invariante de negocio**: cualquier `PATCH`
  contra un ticket terminal responde `409`.

Costos:

* La colección crece con registros inactivos; los filtros por `status` se vuelven la forma
  de aislar el trabajo activo.
* Un estado terminal más que proteger en la máquina de estados (dos, en realidad:
  `resolved` y `cancelled`).
* Los tickets terminales siguen ocupando espacio (aceptable en memoria para este curso; en
  la clase 4 el costo pasa a índices adecuados sobre `status` y `createdAt`).

## Decisión

Elijo la **Opción 2: estados terminales inmutables en vez de borrado físico**. La API no
expone `DELETE`; la máquina de estados define `resolved` y `cancelled` como terminales y la
regla que los protege es innegociable. Es una decisión documentada, no una regla universal:
hay sistemas donde borrar es correcto; aquí el valor del historial y de las referencias es
mayor que el costo de conservar registros inactivos.

## Consecuencias

¿Qué gano?

* Todo ticket es trazable desde su creación hasta su estado terminal.
* `resolved` y `cancelled` son distintos: resolver culmina el trabajo con solución aplicada;
  cancelar lo interrumpe sin resolverlo.
* Si algún día se necesita eliminación real, puede agregarse como decisión separada y
  documentada.

¿Qué complejidad aparece?

* `resolved` y `cancelled` deben protegerse: son terminales y cualquier `PATCH` contra ellos
  responde `409 TICKET_IN_TERMINAL_STATUS`.
* La colección crece con registros inactivos; los filtros por `status` son la herramienta
  para ver el trabajo activo.

¿Qué ya no se puede hacer?

* No existe forma de eliminar permanentemente un ticket a través de la API.

¿Qué puede cambiar más adelante?

* Cuando llegue la base de datos (clase 4), "borrar" pasa a ser una decisión de capa de
  persistencia (soft vs. hard delete) y esta nota es el punto de partida para revisarla.
  También aparece el costo de almacenamiento e índices para mantener listados rápidos.
