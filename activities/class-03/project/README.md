# Support Tickets API v3

API REST (Express + Node.js) que administra **tickets de soporte técnico** de una
organización. Proyecto transversal de la materia Desarrollo Backend — Entrega 03: modelo de
recurso, contrato HTTP, máquina de estados (`pending` / `in_progress` / `resolved` /
`cancelled`), `PATCH`, filtros y errores unificados con `details` y `timestamp`.

Los datos viven **en memoria**: al reiniciar el servidor se pierden. Es comportamiento
esperado y documentado; la persistencia es el problema de la clase 4.

## Requisitos

* Node.js 18 o superior.
* Instalar dependencias la primera vez (`npm install`). Solo se usa Express.

## Ejecutar

```bash
npm install
npm start
```

El servidor arranca en `http://localhost:3000`. Las rutas viven bajo
`/api/v1/support-tickets`.

## Pruebas

```bash
npm test
```

Suite funcional con `node:test` (21 casos) en `test/support-tickets.test.js`, que cubre la
matriz de `activities/class-03/test-matrix.md`.

## Estructura

```txt
project/
├── README.md
├── package.json
├── test/
│   └── support-tickets.test.js        (suite funcional 21 casos)
├── docs/
│   ├── http-contract.md               (contrato de la API)
│   └── decisions/
│       └── 001-terminal-states-instead-of-delete.md  (nota de decisión)
└── src/
    ├── app.js                         (configura la app: middlewares y rutas)
    ├── server.js                      (arranca el proceso, escucha en el puerto)
    ├── routes/
    │   └── supportTickets.routes.js   (mapea URLs a controladores)
    ├── controllers/
    │   └── supportTickets.controller.js (decide respuestas HTTP; no evalúa reglas)
    ├── services/
    │   └── supportTickets.service.js  (reglas de negocio; dispara AppError)
    ├── repositories/
    │   └── supportTickets.repository.js (acceso a datos en memoria; no conoce HTTP)
    ├── dtos/
    │   └── supportTicket.schema.js    (validación de entrada; describe el contrato)
    ├── middlewares/
    │   └── errorHandler.js            (formato unificado de errores y 404)
    ├── domain/
    │   └── ticket-status.js           (estados, transiciones y guardián de terminales)
    └── errors/
        └── app-error.js               (AppError: status + code + details)
```

## Capacidades

* Creación con `id` (UUID v4), `status` (`pending` por defecto), `priority` (`medium` por
  defecto), `createdAt` y `updatedAt` generados por el servidor; los campos que el cliente
  intenta fijar (id, status, fechas) se **ignoran**.
* `title` y `description` obligatorios y nunca vacíos.
* Consulta de colección e individual; colección con filtros `status` y `priority`
  combinables (AND). `400` para valores desconocidos; `200 []` cuando no hay coincidencias.
* Actualización parcial con `PATCH` (`title`, `description`, `priority`, `status`),
  idempotente en la práctica.
* Transiciones controladas por la máquina de estados (`domain/ticket-status.js`): `409`
  para transiciones inválidas y para tickets en estado terminal.
* Formato de error unificado:
  `{ "error": { "code": "...", "message": "...", "details?": [...], "timestamp": "..." } }`.

## Exclusiones

Sin base de datos ni persistencia en archivo, sin `DELETE` (se cancela), sin librerías de
validación externas, sin autenticación, sin frontend. La capa `repositories` es sólo
in-memory en esta entrega; su contrato está pensado para migrar a SQL en la clase 4.

## Verificación

La matriz con resultados observados está en `activities/class-03/test-matrix.md`; la
evidencia literal se registró con el servidor corriendo.

## Referencias del diseño

* `activities/class-03/resource-model.md` — modelo, invariantes y operaciones.
* `activities/class-03/transition-map.md` — máquina de estados y decisiones.
* `activities/class-03/http-contract.md` — contrato HTTP de la entrega.