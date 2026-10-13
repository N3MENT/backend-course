# Request API Full

Esta es la versión completa de la API de **solicitudes de mantenimiento**, el mismo recurso del proyecto Lite. La diferencia no está en lo que hace, sino en cómo está organizado. Partí de un andamiaje (`request-api-full-template`) cuyos tres endpoints devolvían `501 Not Implemented` y completé la lógica para que respondieran según el contrato que definí primero.

## Requisitos

- Node.js 18 o superior (`node --version`).
- Conexión a internet la primera vez, para instalar Express.

## Instalación y ejecución

```bash
cd request-api-full
npm install
node src/server.js
```

También puedo usar `npm start`. Debería ver:

```txt
Request API Full is running on http://localhost:3000
```

Compruebo que la API ya responde:

```bash
curl -i http://localhost:3000/requests
# HTTP/1.1 200 OK
# [ arreglo de solicitudes ]
```

El `501` que devolvía el andamiaje original significaba «esta ruta existe, pero todavía no hace nada»; completar los manejadores fue justamente mi trabajo.

## Estructura y responsabilidades

```txt
request-api-full/
├── README.md
├── package.json
├── docs/
│   └── http-contract.md
└── src/
    ├── app.js
    ├── server.js
    ├── routes/
    │   └── requests.routes.js
    └── data/
        └── requests.js
```

| Archivo                        | De qué se encarga                                                                 | Estado   |
| ------------------------------ | --------------------------------------------------------------------------------- | -------- |
| `src/server.js`                | Arranca el proceso y escucha en el puerto 3000. No sabe nada de rutas.            | Completo |
| `src/app.js`                   | Crea la aplicación de Express, activa `express.json()` y monta el router.         | Completo |
| `src/data/requests.js`         | Guarda las solicitudes en memoria y genera identificadores con `generateId()`.    | Completo |
| `src/routes/requests.routes.js`| Declara los tres endpoints y decide qué responde cada uno.                        | Completo |
| `docs/http-contract.md`        | El contrato HTTP de la API, escrito antes que el código.                          | Completo |

La separación importa por una razón concreta: `server.js` puede cambiar de puerto sin tocar las rutas, y `app.js` puede montarse en una prueba automática sin abrir ningún puerto.

## Qué completé

1. **`docs/http-contract.md` primero.** Definí método, ruta, entrada, respuesta de éxito y respuestas de error de los tres endpoints antes de escribir código.
2. **`src/routes/requests.routes.js`.** Reemplacé cada `501` por la implementación real:
   - `GET /requests` → `200` con el arreglo de solicitudes.
   - `GET /requests/:id` → `200` con la solicitud, o `404` si no existe.
   - `POST /requests` → `201` con la solicitud creada, o `400` si falta el `title`.
3. **Verificación.** Ejecuté los casos de prueba con `curl` y con la suite automática, y registré el resultado observado de cada uno.
4. **Registro de uso de IA.** Lo fui completando mientras trabajaba, no al final.

El router se monta en `/requests` desde `app.js`. Por eso, dentro del router, la ruta `'/'` corresponde a `/requests` y `'/:id'` corresponde a `/requests/:id`.

## Pruebas funcionales

La suite importa `src/app.js` y levanta la aplicación en un puerto efímero, sin depender del servidor real. Uso el runner nativo de Node.js (`node:test`).

```bash
npm test
```

Casos verificados (5/5):

| # | Petición | Esperado |
|---|----------|----------|
| 1 | `GET /requests` | `200` con la lista de 3 solicitudes |
| 2 | `GET /requests/1` | `200` con la solicitud `id: 1` |
| 3 | `GET /requests/999` | `404` con `{"error":"Request not found"}` |
| 4 | `POST /requests` con título | `201` con la solicitud creada (`id: 4`) |
| 5 | `POST /requests` sin título | `400` con `{"error":"Title is required"}` |

## Qué quedó explícitamente fuera

Estas exclusiones no son sugerencias: entregar algo de esta lista cuenta como no cumplir la consigna. La idea es que el contrato HTTP y la organización de archivos sean lo único que tenga que defender.

- **Sin base de datos.** Los datos viven en memoria, en `src/data/requests.js`.
- **Sin TypeScript.** JavaScript con módulos ES (`import` / `export`).
- **Sin autenticación** ni sesiones ni tokens.
- **Sin capa de controladores, servicios o repositorios.** La lógica vive en el router.
- **Sin actualizar ni eliminar solicitudes.** No hay `PUT`, `PATCH` ni `DELETE`.
- **Sin dependencias adicionales.** Solo Express.
- **Sin frontend.** La verificación es con `curl` o un cliente HTTP.

Cuando una herramienta de IA propuso algo de esta lista, rechazarlo fue parte del ejercicio y quedó anotado en el registro de uso de IA.
