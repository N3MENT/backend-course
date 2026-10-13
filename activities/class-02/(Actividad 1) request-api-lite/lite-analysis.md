# Análisis independiente — API Lite

Analicé la API Lite original ejecutándola endpoint por endpoint, antes de corregirla. El objetivo era detectar dónde el contrato no coincidía con lo que el servidor hacía realmente.

## Tabla de análisis

| Endpoint | Intención | Entrada | Respuesta actual | Problema | Propuesta |
|----------|-----------|---------|------------------|----------|-----------|
| `GET /getRequests` | Listar todas las solicitudes | Ninguna | `200` con arreglo de solicitudes | La ruta usa un verbo (`get`) en lugar de nombrar el recurso. No es consistente con el patrón REST. | `GET /requests` → `200` con arreglo de solicitudes |
| `GET /requests/:id` (existe) | Consultar una solicitud específica | Path parameter `:id` | `200` con el objeto de la solicitud | Funciona correctamente. | `GET /requests/:id` → `200` con la solicitud |
| `GET /requests/:id` (no existe) | Consultar una solicitud que no existe | Path parameter `:id` inventado (999) | `200` con `{"error":"Request not found"}` | Devuelve estado 200 aunque el recurso no existe. El cliente no puede distinguir éxito de fracaso mirando solo el estado. | `GET /requests/:id` → `404` con mensaje de error |
| `POST /requests` (con título) | Crear una solicitud nueva | Body JSON con `title`, `description`, `priority` | `200` con la solicitud creada (id: 4) | Devuelve 200 en lugar de 201. No comunica que se creó un recurso nuevo. | `POST /requests` → `201` con la solicitud creada |
| `POST /requests` (sin título) | Crear una solicitud sin campo obligatorio | Body JSON sin `title` | `200` con solicitud creada con `title: undefined` | No valida la entrada. Acepta crear registros incompletos sin avisar. | `POST /requests` → `400` con mensaje indicando que falta el título |

## Evidencia

### Test 1: GET /getRequests
```
Request:  GET http://localhost:3000/getRequests
Response: 200 OK
Body: [{"id":1,"title":"Projector does not turn on",...},{"id":2,...},{"id":3,...}]
```

### Test 2: GET /requests (ruta inexistente)
```
Request:  GET http://localhost:3000/requests
Response: 404 Not Found
```
La ruta correcta para listar no existe. Solo funciona `/getRequests`.

### Test 3: GET /requests/1 (recurso existente)
```
Request:  GET http://localhost:3000/requests/1
Response: 200 OK
Body: {"id":1,"title":"Projector does not turn on","description":"The projector in room 204 shows no image during class.","status":"open","priority":"high"}
```

### Test 4: GET /requests/999 (recurso inexistente)
```
Request:  GET http://localhost:3000/requests/999
Response: 200 OK
Body: {"error":"Request not found"}
```
**Problema:** estado 200 con cuerpo de error. Un cliente que solo mira el estado creería que todo salió bien.

### Test 5: POST /requests (con título)
```
Request:  POST http://localhost:3000/requests
Body: {"title":"Test request","description":"Testing","priority":"low"}
Response: 200 OK
Body: {"id":4,"title":"Test request","description":"Testing","status":"open","priority":"low"}
```
**Problema:** devuelve 200 en lugar de 201. No hay distinción entre consultar y crear.

### Test 6: POST /requests (sin título)
```
Request:  POST http://localhost:3000/requests
Body: {"description":"Missing title","priority":"low"}
Response: 200 OK
Body: {"id":5,"description":"Missing title","status":"open","priority":"low"}
```
**Problema:** crea un registro con `title: undefined`. No hay validación de campos obligatorios.

## Preguntas guía

### 1. ¿Qué problema tiene la ruta de listado y por qué afecta al contrato?

La ruta `/getRequests` incluye un verbo (`get`) en el nombre. En un contrato REST la ruta nombra el **recurso** (solicitudes), no la acción; la acción la expresa el método HTTP. Si mañana alguien quiere eliminar solicitudes, ¿cómo se llamaría la ruta? `/deleteRequests`? Cada operación tendría un nombre distinto que alguien debe inventar, documentar y recordar. Con `/requests`, el mismo nombre sirve para todas las operaciones: GET para consultar, POST para crear, DELETE para eliminar.

### 2. ¿Qué observaste al ejecutar que no habrías deducido solo leyendo el código?

Al ejecutar `GET /requests/999` el servidor devuelve `200 OK` con un cuerpo que dice `"error": "Request not found"`. Leyendo el código se ve que hace `res.json(...)` sin `res.status(404)`, pero al ejecutarlo confirmo que el cliente recibe un estado de éxito con contenido de error. Esa contradicción entre estado y cuerpo es justo el problema que la clase 2 llamó "el contrato miente".

### 3. ¿Qué información comunica el método HTTP que la ruta por sí sola no comunica?

El método comunica la **intención** de la operación. `GET /requests/1` dice "quiero consultar esa solicitud"; `DELETE /requests/1` dice "quiero eliminarla". La ruta `/requests/1` por sí sola no dice nada: podría ser una consulta, una eliminación o una modificación. Sin el método, el mensaje es ambiguo.

### 4. ¿Cuándo usaste un path parameter y cuándo un query parameter, y por qué?

En esta API solo uso path parameter (`:id`) para identificar una solicitud concreta. No implementé query parameters, aunque el contrato original sugiere que `/requests?status=open` podría usarse para filtrar. El path parameter identifica un recurso específico; el query parameter modificaría cómo se presenta la colección sin cambiar cuál recurso se pide.

### 5. ¿Por qué un mismo endpoint puede responder 200 o 404 sin que ninguna sea un fallo del servidor?

Porque ambas son respuestas válidas del contrato. `200` significa "la solicitud existía y te la devuelvo"; `404`, "no encontré lo que pediste". Ninguna es un fallo del servidor: el servidor hizo exactamente lo que debía. El fallo del servidor sería un `500`, que indica algo roto internamente.

### 6. ¿Qué diferencia hay entre 200 y 201 y por qué le importa a quien consume la API?

`200` significa "la operación salió bien, aquí está lo que pediste"; `201`, "creé algo nuevo, aquí está lo que acabas de generar". Le importa al cliente porque puede decidir qué hacer después: con un `200` muestra los datos; con un `201` podría actualizar una lista, mostrar un mensaje de éxito o redirigir. Si ambos devuelven `200`, el cliente no distingue si consultó algo que ya existía o si acaba de crear algo.

### 7. ¿Qué responsabilidad cumple cada archivo del proyecto Lite y qué se perdería si los fusionaras?

El Lite solo tiene un archivo (`server.js`) que concentra configuración, rutas, datos y arranque. Si fusionara más archivos, perdería la separación de responsabilidades. En el proyecto Full esto se resuelve: `app.js` configura, `server.js` escucha, `routes/` declara endpoints y `data/` maneja el almacenamiento. Cada archivo tiene un motivo de cambio distinto.

### 8. ¿Qué partes del código son de Express y cuáles son de HTTP?

**De Express:** `express()`, `app.get()`, `app.post()`, `app.listen()`, `express.json()`, `req.params`, `req.body`, `res.json()`, `res.status()`.

**De HTTP (el contrato que existe sin framework):** el concepto de método (GET/POST), la ruta como recurso, los códigos de estado (200, 404, 201) y el Content-Type con el body en JSON. Express solo facilita escribir lo que HTTP define.
