# Cancelar solicitudes en vez de borrarlas

Autor: Diego Silva — diegosilva.itsu@gmail.com

## Contexto

Los requisitos de la Clase 03 incluyen "cancelar una solicitud" y "preservar el
historial de la solicitud". Una lectura ingenua mapea "cancelar" a
`DELETE /requests/:id`, removiendo físicamente el elemento del arreglo. Tuve
que decidir qué significa realmente cancelar en este sistema.

## Opciones

### Opción 1: borrar la solicitud físicamente

Ventajas:

- Es la implementación más simple posible (`array.splice`).
- La colección solo contiene elementos "vivos"; no hay que filtrar.
- Encaja con la expectativa del acrónimo CRUD.

Costos:

- El historial de la solicitud desaparece: nadie puede responder "¿qué pasó con
  la #42?".
- Funcionalidades futuras (comentarios, auditoría) guardarían referencias a una
  solicitud que ya no existe.
- Nada se puede recuperar tras un borrado accidental.
- Borrar además rompe las suposiciones sobre la secuencia de ids de cualquier
  cliente que cacheó la lista.

### Opción 2: preservarla con estado `cancelled`

Ventajas:

- La solicitud y su historial sobreviven; la auditoría y la recuperación siguen
  siendo posibles.
- Los comentarios y referencias futuras siguen siendo válidos.
- Cancelar pasa a ser parte del ciclo de vida: la máquina de estados controla
  cuándo se permite (desde `open` o `in_progress`, nunca desde `resolved` o
  `closed`).

Costos:

- Las solicitudes canceladas siguen ocupando memoria y aparecen en listados sin
  filtrar; quien solo quiere activas debe filtrar por estado.
- Aparecen reglas nuevas: ¿qué se puede hacer con una solicitud cancelada?
  (Respuesta: nada, es terminal).
- La API no tiene un `DELETE` real, lo que puede sorprender a consumidores que
  esperan CRUD completo.

## Decisión

Elijo la opción 2. No implemento `DELETE /requests/:id`. Cancelar es una
transición controlada: `PATCH /requests/:id` con `{ "status": "cancelled" }`,
permitida desde `open` y `in_progress`. `cancelled` es un estado terminal.

Es una decisión para este dominio, no una regla universal: en dominios con
requisitos legales de borrado (datos personales), el borrado físico sería
obligatorio.

## Consecuencias

Qué gano:

- Historial completo de cada solicitud, incluidas las interrumpidas.
- Una única vía de modificación (`PATCH`) protegida por la máquina de estados.

Qué complejidad aparece:

- Los listados que solo quieren solicitudes activas deben filtrar
  (`?status=open`, etc.).
- La regla de estado terminal (`409 REQUEST_IN_TERMINAL_STATUS`) existe en buena
  medida porque las canceladas se quedan.

Qué ya no se puede hacer:

- Remover una solicitud físicamente a través de la API.

Qué podría cambiar más adelante:

- Si la colección crece, quizá necesite una vista "archivada" o filtros por
  defecto.
- Si aparecen requisitos legales de borrado, necesitaré una vía de eliminación
  real con sus propias reglas, documentada como una decisión nueva que reemplace
  esta.
