# Entrega 01 — El viaje de una petición

## Objetivo

Entender qué ocurre detrás de una aplicación web cuando un usuario realiza una acción: desde el clic en el navegador hasta la respuesta del servidor. Para lograrlo construí un primer servidor HTTP con Node.js usando el módulo nativo `http`, con rutas, respuestas con el estado adecuado y logs básicos.

## Cómo ejecutar

1. Verifico que Node.js esté instalado:
   ```bash
   node --version
   ```
2. Me ubico en la carpeta del servidor:
   ```bash
   cd src
   ```
3. Arranco el servidor:
   ```bash
   node server.js
   ```
4. Abro el navegador en cada ruta:
   - `http://localhost:3000` — página de bienvenida
   - `http://localhost:3000/health` — estado del servidor
   - `http://localhost:3000/api/info` — información en formato JSON
   - `http://localhost:3000/ruta-inexistente` — respuesta 404
5. Para detenerlo, presiono `Ctrl + C`.

## Pruebas funcionales

Las pruebas levantan el servidor real (`src/server.js`) como proceso hijo y lanzan peticiones HTTP contra él, de modo que no modifico ni acoplo el código de producción. Uso el runner nativo de Node.js (`node:test`), sin dependencias externas.

```bash
cd activities/class-01
npm test
```

Casos verificados (4/4):

| Caso | Petición | Esperado |
|------|----------|----------|
| Bienvenida | `GET /` | `200` y el texto `Bienvenido al servidor de Desarrollo Backend` |
| Salud | `GET /health` | `200` y cuerpo `OK` |
| Información | `GET /api/info` | `200`, JSON con `materia: "Desarrollo Backend"` y `clase: 1` |
| Ruta inexistente | `GET /ruta-inexistente` | `404` con `Ruta no encontrada` |

> **Nota:** las pruebas necesitan el puerto `3000` libre, igual que el servidor en ejecución.

## Diagrama del recorrido de una petición

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Usuario  │───▶│Navegador │───▶│  Puerto  │───▶│Servidor  │
│           │    │(Frontend)│    │  3000    │    │ (Node.js)│
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                         │
                    ┌────────────────────────────────────┘
                    ▼
              ┌──────────┐    ┌──────────┐    ┌──────────┐
              │Inspecciona│───▶│ Decide   │───▶│ Responde │
              │  la URL   │    │ qué      │    │ al       │
              │           │    │ responder│    │navegador │
              └──────────┘    └──────────┘    └──────────┘
```

**Descripción del recorrido:**

1. El usuario escribe una URL en el navegador.
2. El navegador arma una petición HTTP y la envía al puerto 3000.
3. El servidor de Node.js recibe la petición.
4. El programa inspecciona la URL solicitada.
5. Decide qué respuesta producir según la ruta.
6. Completa la respuesta con estado, encabezados y cuerpo.
7. El navegador recibe el resultado y lo presenta al usuario.

## Falla diagnosticada: fault-5 (asignación en lugar de comparación)

**Comportamiento observado:** cualquier ruta, incluso una inventada, devolvía el mismo contenido; el primer bloque de decisión siempre ganaba.

**Hipótesis inicial:** el servidor respondía con el mismo contenido para todas las solicitudes.

**Evidencia que revisé:**

- En la terminal veía que llegaban rutas distintas.
- En el navegador, todas las URLs mostraban la misma respuesta.
- Al inspeccionar el código encontré una asignación (`=`) donde debía haber una comparación (`===`).

**Causa encontrada:** en la condición del `if` usaba `=` (asignación) en lugar de `===` (comparación). La condición siempre resultaba verdadera y por eso se ejecutaba siempre el primer bloque, sin importar la ruta solicitada.

**Modificación realizada:** cambié el operador en la comparación de rutas:

```javascript
// Antes (incorrecto)
if (url = '/health') {

// Después (correcto)
if (url === '/health') {
```

**Resultado:** el servidor responde correctamente según cada ruta: `/` muestra la bienvenida, `/health` devuelve OK, `/api/info` devuelve JSON y las rutas inexistentes devuelven 404.

**Explicación final:** era un problema de lógica, no de sintaxis. JavaScript permite usar `=` dentro de una condición (asigna el valor y lo evalúa como verdadero), así que el programa nunca llegaba a evaluar las demás rutas. Con `===` comparo el valor de `url` con cada ruta y el programa decide correctamente en cada caso.

## Ticket de salida

### 1. ¿Qué es frontend y qué es backend? ¿Cuál es la diferencia esencial?

El frontend es lo que corre en el navegador del usuario: la interfaz, los botones, los formularios y la presentación de los datos. El backend es un programa distinto que corre en otro proceso o máquina, recibe solicitudes y decide qué responder.

La diferencia esencial está en **dónde se ejecuta el código y quién controla la decisión**. El frontend queda en manos del usuario (puede inspeccionarlo y modificarlo); el backend controla las reglas del sistema de forma segura.

### 2. ¿Por qué un servidor puede quedarse activo sin terminar?

Porque `server.listen()` deja el proceso en ejecución esperando nuevas peticiones. A diferencia de un script común, que termina al llegar al final del archivo, un servidor sigue activo mientras tenga algo pendiente por atender. Node.js detecta que hay un proceso escuchando y no cierra el programa.

### 3. ¿Cuál es el primer instrumento que mirarías si un usuario reporta que "no funciona"?

La **terminal** donde corre el servidor. Es lo primero porque responde si el proceso sigue activo, si registró la llegada de la solicitud y si hubo algún error. Si está vivo y registra la petición, el problema está en cómo se genera la respuesta. Si no está o no registra nada, el problema está antes: en la conexión, el puerto o la dirección.

### 4. ¿En qué orden ocurren los pasos del recorrido de una petición?

1. El usuario introduce una URL.
2. El navegador crea una petición.
3. La petición se dirige a un puerto.
4. El proceso de Node.js la recibe.
5. El programa inspecciona la URL.
6. El programa decide qué respuesta producir.
7. El servidor completa la respuesta.
8. El navegador recibe y presenta el resultado.

### 5. Si el servidor está activo pero el navegador no obtiene respuesta, ¿dónde está el problema?

Está en la conexión entre el navegador y el servidor. Posibles causas:

- El navegador intenta conectarse a un puerto distinto al que escucha el servidor.
- La URL es incorrecta.
- Un firewall o una configuración de red bloquea la conexión.

Si el servidor registra la solicitud en la terminal pero el navegador no recibe respuesta, el problema puede estar en que la respuesta nunca se cerró con `response.end()`.

## Profundización

**Recurso elegido:** "Differences between Node.js and the Browser".

1. **¿Qué concepto nuevo encontraste?**
   Que Node.js y el navegador son dos entornos de ejecución distintos para el mismo lenguaje (JavaScript). Aunque el código se escribe igual, cada entorno ofrece capacidades diferentes: el navegador accede al DOM, `document`, `window` y la interfaz gráfica; Node.js accede al sistema de archivos, procesos, la red a bajo nivel y módulos nativos.

2. **¿Cómo se relaciona con el servidor que construí?**
   Directamente. Para armar el servidor usé `require('http')`, un módulo nativo de Node.js que no existe en el navegador. Si intentara usar ese código en un navegador fallaría, porque `require` y `http` no están disponibles ahí. El servidor funciona porque Node.js provee las herramientas para escuchar en un puerto y manejar peticiones de red.

3. **¿Qué parte todavía no comprendes?**
   No me queda claro cómo Node.js maneja internamente varias peticiones simultáneas sin crear un hilo por cada una. Sé que funciona con un bucle de eventos, pero no entiendo del todo cómo se alternan las tareas cuando hay muchas peticiones al mismo tiempo.

4. **¿Qué evidencia o experimento podrías utilizar para investigarla?**
   Podría crear un servidor que simule una tarea lenta con `setTimeout` de varios segundos y lanzar peticiones simultáneas desde el navegador o con `curl`. Observando el comportamiento podría ver si las peticiones se atienden en paralelo o de forma secuencial, y medir los tiempos de respuesta.

## Uso de IA

- **¿Utilicé IA?** Sí.
- **¿Para qué?** Para estructurar el `README.md` con el formato correcto y revisar la explicación conceptual del diagrama y de la falla diagnosticada.
- **Sugerencia que acepté:** la estructura de los apartados del README y la forma de documentar la falla con sus siete campos.
- **Sugerencia que modifiqué o rechacé:** reescribí las respuestas del ticket de salida con mis propias palabras, según lo que entendí en clase. No copié las respuestas sugeridas por la IA.
- **¿Cómo comprobé el resultado?** Ejecuté el servidor con `node server.js` y probé cada ruta en el navegador, verificando que las respuestas fueran las esperadas y que los logs aparecieran bien en la terminal.

## Reflexión

Lo más valioso de esta clase fue entender que un servidor no es una máquina especial, sino un programa que se queda activo esperando peticiones. Antes veía el "backend" como algo abstracto; ahora entiendo que es código JavaScript corriendo en otro lugar y decidiendo en función de lo que le llega.

El laboratorio de fallas fue lo que más me ayudó a interiorizar el método de diagnóstico: observar primero, hipotetizar después y no cambiar más de una cosa a la vez. Ver que un mismo síntoma (el navegador no carga) podía tener causas distintas me hizo entender por qué conviene revisar la terminal antes de tocar el código.

También aprendí que la diferencia entre frontend y backend no es tecnológica sino de responsabilidad: lo que ejecuta el navegador no es confiable porque el usuario puede modificarlo, mientras que las reglas del servidor sí lo son porque el usuario no tiene acceso a ellas.
