# Registro de uso de IA — Clase 02

## Qué le pedí

Durante la clase 2 usé IA para estas tareas:

1. **Análisis del Lite:** le pedí ayuda para estructurar la tabla de análisis con las columnas correctas y para redactar las respuestas a las 8 preguntas guía.
2. **Contrato HTTP:** le pedí una revisión del contrato para asegurar que los códigos de estado y las descripciones fueran coherentes con lo estudiado en clase.
3. **Implementación del Full:** le pedí ayuda para implementar los 3 endpoints en el archivo `requests.routes.js`, siguiendo el contrato que había definido.

## Qué propuso la IA

1. Para el análisis: una tabla de 6 columnas (Endpoint, Intención, Entrada, Respuesta actual, Problema, Propuesta) y respuestas detalladas a las 8 preguntas.
2. Para el contrato: una estructura completa con método, ruta, entrada, respuestas de éxito y error, y ejemplos JSON.
3. Para la implementación: código Express con las 3 rutas, validación de título y códigos de estado correctos.

## Qué acepté

- La estructura de la tabla de análisis.
- La organización del contrato HTTP con tablas y ejemplos.
- La implementación de los 3 endpoints con `res.status()`, validación y `generateId()`.

## Qué cambié o rechacé

- Reescribí las respuestas del ticket de salida con mis propias palabras, según lo que entendí en clase.
- En el contrato, ajusté las descripciones de los campos para que fueran más concisas.
- En la implementación, me aseguré de que `description` y `priority` fueran opcionales, y no obligatorios, como indica el contrato.

## Cómo lo verifiqué

- Ejecuté el servidor con `npm start` y probé cada endpoint manualmente con `Invoke-WebRequest`.
- Verifiqué que cada endpoint devolviera el código de estado correcto (200, 201, 400, 404).
- Confirmé que la validación de título funcionara al enviar un body sin `title`.
- Revisé que el contrato HTTP fuera coherente con la implementación final.

## Qué todavía no entiendo

- No me queda claro cómo Express maneja internamente el enrutamiento cuando hay varias rutas declaradas en el mismo router. Sé que funciona, pero no entiendo del todo el mecanismo de búsqueda de coincidencia.
