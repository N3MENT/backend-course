# Preservar el historial de estado de las solicitudes

Autor: Diego Silva — diegosilva.itsu@gmail.com

## Contexto

Desde la Clase 03 el backlog arrastraba el requisito "preservar el historial de
la solicitud". Con la persistencia ya en pie (Clase 04), tuve que decidir si el
sistema recuerda solo el estado actual de cada solicitud o cada transición por
la que pasó.

## Opciones

### Opción 1: guardar solo el estado actual

Ventajas:

- Menos datos: una columna, sin tabla extra.
- Menos código: sin segunda escritura, sin transacción para los cambios de
  estado.
- Cada consulta se mantiene trivialmente simple.

Costos:

- "¿Cuándo pasó a `in_progress`?" y "¿quién la reabrió?" quedan sin respuesta.
- Auditar y diagnosticar un reclamo ("ya estaba resuelta la semana pasada") es
  imposible.
- La información se destruye en el momento de cada cambio y no se puede
  reconstruir después.

### Opción 2: guardar cada transición de estado

Ventajas:

- Historial completo y consultable por solicitud, incluido su nacimiento
  (`NULL → open`).
- La auditoría, el diagnóstico y futuras métricas (tiempo en cada estado) se
  vuelven posibles.
- La FK ata cada evento a su solicitud con integridad a nivel de base.

Costos:

- Una segunda tabla, una segunda escritura en cada cambio de estado y el código
  para mantenerlas alineadas.
- Aparece un problema de consistencia: un cambio de estado sin su fila de
  historial (o al revés) hace que la base mienta. Eso obliga a que el cambio
  corra dentro de una transacción.
- El almacenamiento crece con cada transición (aceptable a esta escala;
  revisar si deja de serlo).

## Decisión

Elijo la opción 2. `request_status_history` guarda una fila por transición. La
creación registra `NULL → open`; cada cambio posterior registra
`previous → new`. La actualización de estado y la inserción del historial corren
dentro de una única transacción (mismo cliente, `BEGIN`/`COMMIT`/`ROLLBACK`)
para que ocurran ambas o ninguna.

## Consecuencias

Qué gano:

- `GET /requests/:id/history` y respuestas honestas sobre el pasado.
- Auditabilidad que sobrevive a los reinicios y alcanza a cada instancia.

Qué datos y código adicionales aparecen:

- La migración 002, `insertStatusHistory` en el store y la unidad transaccional
  en el servicio.

Qué problema de consistencia debo manejar:

- Dos escrituras que forman una unidad lógica — resuelto con
  `withTransaction`: si falla cualquiera de las dos, ambas se revierten.

Qué consultas se vuelven posibles:

- La línea de tiempo completa por solicitud; más adelante, métricas de tiempo
  por estado o conteos de solicitudes reabiertas.

Qué podría cambiar más adelante:

- Si el historial crece mucho, un índice sobre
  `request_status_history(request_id)` justificado por la consulta de historial,
  o una política de archivado, cada uno como su propia decisión documentada.
