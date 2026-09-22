# Entrega 03 — Recursos, estado y reglas

## Objetivo

Pasar de "tres rutas que funcionan" a una API coherente: un modelo de recurso, un contrato
HTTP y reglas que protegen el sistema cuando los datos y las operaciones empiezan a crecer.
Esta entrega cubre diseño previo (sin IA), máquina de estados, `PATCH`, filtros y un formato
de error unificado.

## Estructura

```
activities/class-03/
├── README.md
├── resource-model.md        (fase 1 · diseño sin IA)
├── http-contract.md         (fase 1 · diseño sin IA)
├── transition-map.md        (fase 1 · diseño sin IA)
├── test-matrix.md           (fase 1: esperados · fase 5: observados)
├── ai-usage.md              (fase 3 · uso de IA con contrato)
└── reflection.md            (fase 5 · reflexión)
```

El proyecto transversal de esta entrega vive en `activities/class-03/project/`.

## Diseño (fase 1, elaborado con respuestas propias)

* **Recurso**: Support Ticket — incidencia técnica de un usuario.
* **Estados**: `pending` → `in_progress` → `resolved` (terminal) · `cancelled` (terminal).
  Transiciones prohibidas sin excepción: salir de un estado terminal.
* **Contrato**: base `/api/v1/support-tickets`; `POST`, `GET`, `GET /:id`, `PATCH`. Sin
  `DELETE` (decisión documentada).
* **Creación**: obligatorios `title` y `description`; `priority` opcional
  (`{low, medium, high, urgent}`, por defecto `medium`). `id` (UUID v4), `status`, fechas:
  generados por el servidor; el cliente no puede fijarlos.
* **Actualización**: `PATCH` parcial; idempotente. Errores `400`/`404`/`409` con formato
  `{ error: { code, message, details?, timestamp } }`.
* **Filtros**: `status` y `priority` combinables por query params (AND).
* **Organización objetivo**: `controllers/`, `services/`, `repositories/`, `routes/`,
  `dtos/`, `middlewares/`.
* **Decisión**: `project/docs/decisions/001-terminal-states-instead-of-delete.md` (estados
  terminales inmutables en vez de borrado físico).

## Fases

1. **Diseño sin IA** — modelo, contrato, máquina de estados y matriz completos antes de
   escribir código ni consultar IA. Se marca con el commit y tag `class-03-design`.
2. **Implementación** — refactor del proyecto al diseño de esta entrega: rutas
   `/api/v1/support-tickets`, `src/domain/ticket-status.js` con la máquina de estados
   (`pending`/`in_progress`/`resolved`/`cancelled`), `PATCH` con `409`, `id` UUID v4,
   filtros combinables y formato de error `{ error: { code, message, details?, timestamp } }`.
3. **IA con contrato** — la IA solo revisa después de la marca de diseño; no puede cambiar
   en silencio el contrato ni las reglas. Todo queda registrado en `ai-usage.md`.
4. **Decisión documentada** — `001-terminal-states-instead-of-delete.md`.
5. **Evidencia y reflexión** — matriz con resultados observados vía `curl` y las ocho
   preguntas de reflexión. Se cierra con `class-03-submission`.

## Estado

| Fase | Estado |
| ---- | ------ |
| 1 · Diseño sin IA | ✅ Documentos rediseñados (support-tickets) |
| 2 · Implementación | ✅ Refactor por capas (`controllers/services/repositories/routes/dtos/middlewares` + `domain`), suite `node:test` 21/21 |
| 3 · IA con contrato | ✅ Registrada en `ai-usage.md` |
| 4 · Decisión | ✅ `001-terminal-states-instead-of-delete.md` |
| 5 · Evidencia y reflexión | ✅ Matriz con resultados observados (16 casos vía `curl` + evidencia literal de los dos `409`) y reflexión |

## Proyecto

Desde `project/`:

```bash
npm install
npm start      # http://localhost:3000/api/v1/support-tickets
npm test       # suite funcional 21/21 (node:test)
```

El detalle estructural y operativo está en `project/README.md`.