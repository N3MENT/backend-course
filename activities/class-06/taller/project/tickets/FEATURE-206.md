# FEATURE-206 — Endpoint de historial de una solicitud

Autor (portafolio): Diego Silva — diegosilva.itsu@gmail.com
Solicitado por: equipo de producto
Estado: abierto

## Historia

Como usuario autenticado,
quiero leer el historial de una solicitud
para entender cómo cambió con el tiempo.

## Endpoint

```http
GET /requests/:id/history
```

## Representación de referencia

```json
[
  {
    "id": 18,
    "type": "status_changed",
    "fromStatus": "open",
    "toStatus": "in_progress",
    "createdAt": "2026-09-15T18:30:00.000Z"
  },
  {
    "id": 21,
    "type": "priority_changed",
    "fromPriority": "medium",
    "toPriority": "high",
    "createdAt": "2026-09-15T18:45:00.000Z"
  }
]
```

## Reglas

1. Requiere autenticación.
2. Un requester puede leer el historial de sus propias solicitudes.
3. Un requester no puede leer el historial ajeno: mantengo el contrato existente
   para recursos ajenos (no lo cambio en silencio).
4. Un agent puede leer cualquier historial.
5. Una solicitud inexistente responde `404`.
6. Una solicitud sin eventos responde `200` con `[]`.
7. Los eventos se ordenan del más antiguo al más nuevo, con una regla estable
   cuando dos eventos comparten timestamp.
8. La respuesta nunca expone passwords, hashes, tokens ni secretos.
9. Mantengo el formato de error y las responsabilidades existentes: no duplico
   reglas de autorización que ya existen.

## Fuera de alcance

Paginación, filtros de historial, WebSockets y auditoría avanzada.
