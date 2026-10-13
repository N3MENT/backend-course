# Request API Lite

Una API pequeña construida con Express que administra **solicitudes de mantenimiento**. Todo vive en un solo archivo (`server.js`) y los datos se guardan en memoria: cada vez que reinicio el servidor, la lista vuelve a su estado inicial. Esta es la versión corregida; los defectos del original están documentados en `lite-analysis.md`.

Cada solicitud tiene esta forma:

```json
{
  "id": 1,
  "title": "Projector does not turn on",
  "description": "The projector in room 204 shows no image during class.",
  "status": "open",
  "priority": "high"
}
```

## Requisitos

- Node.js 18 o superior (`node --version`).
- Conexión a internet la primera vez, para instalar Express.

## Instalación

Me ubico en la carpeta del proyecto e instalo las dependencias:

```bash
cd request-api-lite
npm install
```

Esto crea la carpeta `node_modules/` con Express dentro. Solo hace falta hacerlo una vez.

## Ejecución

```bash
node server.js
```

En la terminal debería ver:

```txt
Request API Lite is running on http://localhost:3000
```

El servidor queda escuchando en el puerto **3000**. Para detenerlo, presiono `Ctrl + C`.

## Endpoints disponibles

| Método | Ruta             | Para qué sirve                                | Respuesta |
| ------ | ---------------- | --------------------------------------------- | --------- |
| GET    | `/requests`      | Devuelve la lista completa de solicitudes.    | `200` con el arreglo |
| GET    | `/requests/:id`  | Devuelve una solicitud por su identificador.  | `200` o `404` si no existe |
| POST   | `/requests`      | Crea una nueva solicitud.                     | `201` o `400` si falta el título |

### Ejemplos con `curl`

Listar todas las solicitudes:

```bash
curl -i http://localhost:3000/requests
```

Consultar una solicitud por su `id`:

```bash
curl -i http://localhost:3000/requests/1
```

Crear una nueva solicitud:

```bash
curl -i -X POST http://localhost:3000/requests \
  -H "Content-Type: application/json" \
  -d '{"title":"Leaking faucet","description":"The faucet in the third floor bathroom leaks.","priority":"medium"}'
```

> Uso la opción `-i` para ver la línea de estado y los encabezados de la respuesta, no solo el cuerpo. Esa información es necesaria para comprobar el contrato.

## Notas

- Los datos no se guardan en ningún archivo ni base de datos: viven en un arreglo dentro de `server.js`.
- Si el puerto 3000 ya está ocupado, detengo el otro proceso antes de ejecutar este servidor.
