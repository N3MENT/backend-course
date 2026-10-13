# Comparación — Lite vs Full

## Tabla de dimensiones

| Dimensión | Lite | Full |
|-----------|------|------|
| **Contrato** | Lo reconstruí desde el código existente. Estaba implícito y con inconsistencias. | Lo definí antes de escribir código. Fue la guía de la implementación. |
| **Organización** | Todo en un solo archivo (`server.js`), sin separación de responsabilidades. | Cuatro archivos: `server.js`, `app.js`, `routes/requests.routes.js`, `data/requests.js`. Cada uno con un motivo de cambio distinto. |
| **IA** | No la usé en la fase de análisis; sí después, para las correcciones. | La usé desde el inicio, bajo restricciones: especificación primero, revisión después. |
| **Lectura** | Requería leer todo el archivo para entender el comportamiento; no había estructura que guiara la lectura. | La estructura de archivos permite leer partes aisladas sin entender todo el proyecto. |
| **Modificación** | Cualquier cambio obligaba a buscar en todo el archivo, con riesgo de romper algo no relacionado. | Cada archivo se puede modificar con menor riesgo: datos, rutas y configuración están separados. |
| **Complejidad** | Mínima: un archivo, 3 endpoints, datos en memoria. | Moderada: varios archivos, pero cada uno simple. La complejidad está en la organización, no en la lógica. |
| **Verificación** | Ejecuté los endpoints y comparé con lo observado en el análisis. | Ejecuté los endpoints y comparé con el contrato definido antes de implementar. |
| **Extensibilidad** | Difícil: agregar un recurso nuevo mezclaría todo en el mismo archivo. | Fácil: creo un nuevo archivo de rutas y lo monto en `app.js` sin tocar los existentes. |

## 14 preguntas de reflexión

### 1. ¿Qué diferencia notaste entre reconstruir un contrato ya existente y definirlo antes de escribir código?

En el Lite el contrato estaba escondido en el código y tenía contradicciones, como un `200` donde debía ir un `404`. Tuve que ejecutar cada endpoint para descubrir qué hacía en realidad. En el Full el contrato fue una referencia clara: sabía qué debía devolver cada endpoint antes de escribir una línea. Definir antes es más rápido porque no hay que adivinar ni corregir.

### 2. ¿Qué inconsistencias encontraste en el proyecto Lite y con qué evidencia las detectaste?

Encontré cuatro: (1) la ruta `/getRequests` usaba un verbo, detectada al probar `GET /requests` y recibir 404; (2) `GET /requests/999` devolvía 200 con un cuerpo de error, vista al ejecutar la petición; (3) `POST /requests` devolvía 200 en lugar de 201; (4) `POST /requests` sin título creaba registros con `title: undefined`. Todas las detecté ejecutando el servidor, no leyendo el código.

### 3. ¿Qué observaste al ejecutar que no habrías deducido solo leyendo el código?

Que `GET /requests/999` devolvía `200 OK`. Leyendo el código se ve que falta `res.status(404)`, pero al ejecutarlo se confirma que el cliente recibe un estado de éxito con un cuerpo de error. Esa contradicción es justo lo que la clase 2 llamó "el contrato miente".

### 4. ¿Qué información comunica el método HTTP que la ruta por sí sola no comunica?

El método comunica la **intención**: `GET` para consultar, `POST` para crear. La ruta `/requests` por sí sola no dice nada: podría ser una consulta, una creación o una eliminación. Sin el método, el mensaje es ambiguo.

### 5. ¿Cuándo usaste un path parameter y cuándo un query parameter, y por qué?

En esta API solo uso un path parameter (`:id`) para identificar una solicitud concreta. No implementé query parameters. El path parameter identifica un recurso específico; el query parameter modificaría cómo se presenta la colección.

### 6. ¿Por qué un mismo endpoint puede responder 200 o 404 sin que ninguna sea un fallo del servidor?

Porque ambas son respuestas válidas del contrato. `200` significa "el recurso existía y te lo devuelvo"; `404`, "no encontré lo que pediste". En los dos casos el servidor hizo lo que debía. Un fallo del servidor sería un `500`.

### 7. ¿Qué diferencia hay entre 200 y 201 y por qué le importa a quien consume la API?

`200` significa "la operación salió bien"; `201`, "creé algo nuevo". Le importa al cliente porque puede decidir qué hacer después: con un `200` muestra datos; con un `201` podría actualizar una lista o mostrar un mensaje de éxito.

### 8. ¿Qué responsabilidad cumple cada archivo del proyecto Full y qué se perdería si los fusionaras?

- `server.js`: inicia el proceso y escucha. Sin él, nada arranca.
- `app.js`: configura middlewares y monta rutas. Sin él, `server.js` tendría que saber de rutas.
- `requests.routes.js`: declara los endpoints. Sin él, `app.js` tendría toda la lógica.
- `requests.js`: maneja los datos. Sin él, las rutas no tendrían de dónde leer.

Si los fusionara, mezclaría motivos de cambio distintos y sería difícil modificar una parte sin afectar las demás.

### 9. ¿Qué partes de tu código son de Express y cuáles son de HTTP?

**De Express:** `express()`, `express.Router()`, `app.use()`, `router.get()`, `router.post()`, `req.params`, `req.body`, `res.status()`, `res.json()`.

**De HTTP:** los métodos (GET, POST), las rutas como recursos, los códigos de estado (200, 201, 400, 404), el Content-Type JSON y el body como representación. Express me facilita escribir lo que HTTP define.

### 10. ¿Qué decidiste tú antes de escribir el primer prompt y qué le pediste exactamente a la IA?

Decidí el contrato: qué endpoints habría, qué estados devolverían, qué campos serían obligatorios y cuáles opcionales. Después le pedí a la IA que implementara los 3 endpoints siguiendo ese contrato, con validación de título y códigos de estado correctos.

### 11. ¿Qué propuso la IA que estaba fuera del alcance y cómo lo detectaste?

Propuso agregar un filtro por query parameter (`?status=open`). Lo detecté porque no estaba en el contrato original y la sección de exclusiones del proyecto Full indica que no debo agregar funcionalidades no declaradas.

### 12. ¿Qué parte del código generado no podrías explicar sin volver a leerla, y qué hiciste al respecto?

El uso de `express.Router()`. Lo entiendo como un agrupador de rutas, pero no sabría explicar internamente cómo Express registra las rutas del router en la aplicación principal. Para resolverlo consulté la documentación de Express sobre routing.

### 13. ¿Qué habría pasado si le hubieras pedido el proyecto a la IA sin escribir antes la especificación?

La IA habría producido una API funcional, pero con decisiones que yo no habría tomado: probablemente habría agregado filtros, PUT, DELETE, validaciones avanzadas o incluso una base de datos. Sin la especificación no tendría contra qué contrastar lo que devolvió.

### 14. ¿Qué límite de este diseño o de HTTP aparecería si el sistema tuviera que crecer?

Aparecerían varios: (1) los datos en memoria se pierden al reiniciar; (2) no hay autenticación; (3) no hay validación de tipos en los parámetros; (4) el modelo de datos es demasiado simple para un sistema real con múltiples usuarios y permisos.

## Reflexión final

Si empezara de nuevo el proyecto Full, escribiría el contrato HTTP con más detalle antes de implementar, incluyendo ejemplos de body para cada endpoint. También documentaría las exclusiones de forma más explícita en la especificación, para que la IA no proponga funcionalidades que no corresponden.
