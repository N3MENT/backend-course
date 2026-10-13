# Entrega 02 — HTTP como contrato

## Objetivo

Entender HTTP como un contrato entre cliente y servidor: métodos, rutas, parámetros, códigos de estado y JSON. Para eso analicé una API existente buscando inconsistencias y construí otra API a partir de una especificación que definí primero.

## Estructura de la entrega

```
activities/class-02/
├── README.md
├── comparison.md
├── ai-usage.md
├── (Actividad 1) request-api-lite/
│   ├── server.js          (API Lite corregida)
│   ├── lite-analysis.md
│   ├── package.json
│   └── package-lock.json
├── (Actividad 2) request-api-full/
│   ├── README.md
│   ├── docs/
│   │   └── http-contract.md
│   ├── src/
│   │   ├── server.js
│   │   ├── app.js
│   │   ├── routes/
│   │   │   └── requests.routes.js
│   │   └── data/
│   │       └── requests.js
│   ├── package.json
│   └── package-lock.json
└── activity resources/
    ├── request-api-lite/     (API Lite original, sin corregir)
    └── request-api-full-template/  (Template para el Full)
```

## Cómo ejecutar

### API Lite (corregida)

```bash
cd "(Actividad 1) request-api-lite"
npm install
npm start
```

El servidor arranca en `http://localhost:3000`.

### API Full

```bash
cd "(Actividad 2) request-api-full"
npm install
npm start
```

El servidor arranca en `http://localhost:3000`.

> **Nota:** solo una puede correr a la vez en el puerto 3000. Detengo la anterior con `Ctrl + C` antes de iniciar la otra.

## Pruebas funcionales

Ambas APIs tienen una suite que verifica el comportamiento corregido y que reemplaza la evidencia manual con `curl`. Uso el runner nativo de Node.js (`node:test`): la Lite se prueba como proceso real y la Full importando `src/app.js` sin abrir puerto (por eso existe la separación `server.js` / `app.js`).

```bash
cd "(Actividad 1) request-api-lite"
npm install
npm test
```

```bash
cd "(Actividad 2) request-api-full"
npm install
npm test
```

Casos verificados en cada API (5/5):

| # | Petición | Esperado | Defecto del Lite que previene |
|---|----------|----------|-------------------------------|
| 1 | `GET /requests` | `200` y lista de 3 | (contrato de listado correcto) |
| 2 | `GET /requests/1` | `200` y el recurso con `id: 1` | (lectura correcta) |
| 3 | `GET /requests/999` | `404` y `{"error":"Request not found"}` | Recurso inexistente devolvía `200` |
| 4 | `POST /requests` con título | `201` con `id: 4` | Creación devolvía `200` |
| 5 | `POST /requests` sin título | `400` y `{"error":"Title is required"}` | Aceptaba registros sin título |

> **Nota:** la suite de la Lite vuelve a levantar el servidor en el puerto `3000` dentro del test; dejo ese puerto libre al ejecutar.

## Defectos encontrados en el Lite y correcciones

| # | Defecto | Evidencia | Corrección |
|---|---------|-----------|------------|
| 1 | La ruta de listado usa un verbo | `GET /getRequests` en lugar de `GET /requests` | Renombrada a `GET /requests` |
| 2 | Recurso inexistente devuelve 200 | `GET /requests/999` → `200` con `{"error":"Request not found"}` | Ahora devuelve `404` |
| 3 | Crear solicitud devuelve 200 | `POST /requests` → `200` | Ahora devuelve `201 Created` |
| 4 | No valida el título obligatorio | Acepta crear registros con `title: undefined` | Ahora devuelve `400` si falta el título |

## Decisiones que tomé en el Full

1. **Separación `server.js` / `app.js`:** `server.js` solo inicia el proceso y escucha; `app.js` configura la aplicación (middlewares y rutas). Así puedo usar la app sin levantar un servidor, algo útil para las pruebas.
2. **`routes/requests.routes.js`:** aislé las rutas del recurso solicitud en su propio archivo. Si mañana agrego otro recurso, creo otro archivo de rutas sin tocar este.
3. **`data/requests.js`:** dejé los datos separados del resto. Hoy es un arreglo en memoria; cuando aparezca una base de datos, solo cambio este archivo.
4. **`201` en creación:** uso `201 Created` porque se genera un recurso nuevo. Un `200` solo diría "salió bien", sin indicar que se creó algo.
5. **`400` para validación:** valido `title` antes de crear. `400` señala que el problema está en la petición del cliente, no en el servidor.
6. **Sin exclusiones implementadas:** no agregué PUT, PATCH, DELETE, base de datos, autenticación ni capas de controladores, servicios o repositorios. Cada pieza se agregará cuando exista un problema que la justifique.

## Evidencia de ejecución

### GET /requests
```
Request:  GET http://localhost:3000/requests
Response: 200 OK
Body: [{"id":1,"title":"Projector does not turn on",...},{"id":2,...},{"id":3,...}]
```

### GET /requests/1 (existe)
```
Request:  GET http://localhost:3000/requests/1
Response: 200 OK
Body: {"id":1,"title":"Projector does not turn on","description":"The projector in room 204 shows no image during class.","status":"open","priority":"high"}
```

### GET /requests/999 (no existe)
```
Request:  GET http://localhost:3000/requests/999
Response: 404 Not Found
Body: {"error":"Request not found"}
```

### POST /requests (con título)
```
Request:  POST http://localhost:3000/requests
Body: {"title":"Broken door lock","description":"The lock on room 101 does not turn properly.","priority":"high"}
Response: 201 Created
Body: {"id":4,"title":"Broken door lock","description":"The lock on room 101 does not turn properly.","status":"open","priority":"high"}
```

### POST /requests (sin título)
```
Request:  POST http://localhost:3000/requests
Body: {"description":"Missing title","priority":"low"}
Response: 400 Bad Request
Body: {"error":"Title is required"}
```
