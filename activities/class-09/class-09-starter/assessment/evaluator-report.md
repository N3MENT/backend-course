# Evaluator report

Guarda aquí los bloques 1, 3 y 4 de tu evaluación:

## BLOQUE 1 — RESULT_CODE

[PEGAR LA LÍNEA COMPLETA]

## BLOQUE 3 — Reporte del estudiante

[PEGAR ÍNTEGRO]

## BLOQUE 4 — Feedback para el docente

[PEGAR ÍNTEGRO]



Reporte de evaluación de conocimientos
Resultado general
La evaluación demuestra un conocimiento sólido en la estructura de arquitecturas en capas basadas en Express, la gestión de transacciones para garantizar la consistencia de datos y los principios de seguridad en autenticación. Se identifican oportunidades menores de mejora en el manejo riguroso de errores de entrada y validación de tipos.

Desempeño por pregunta
Q1 (Flujo de solicitudes): Excelente comprensión del recorrido de la petición a través de las capas de rutas, controladores, servicios y almacenamiento.

Q2 (Invariantes y transacciones): Clara noción de la consistencia transaccional y los riesgos de asimetría de datos ante fallos parciales.

Q3 (Autenticación y autorización): Identificación correcta de la distinción conceptual y los riesgos de manipulación de identificadores por parte del cliente.

Q4 (Diagnóstico y manejo de errores): Buen diagnóstico del fallo por falta de validación de entradas previas a la consulta de base de datos.

Q5 (Síntesis global): Cierre consistente de los conceptos evaluados en la arquitectura del backend.

Conceptos demostrados
Arquitectura en capas (Routes, Controllers, Services, Stores).

Necesidad de atomicidad y transacciones de base de datos para evitar estados inconsistentes.

Distinción entre autenticación (identidad) y autorización (permisos).

Riesgo de inyección o suplantación al confiar en parámetros manipulables por el cliente.

Vacíos prioritarios
Falta de automatización en la validación previa de tipos de datos en los parámetros de entrada.

Necesidad de estandarizar el mapeo entre excepciones de bases de datos y códigos de error HTTP adecuados (como 400 Bad Request).

Rectificaciones valiosas
Reconocimiento de que las peticiones que llegan con formatos incorrectos deben ser interceptadas y validadas antes de impactar las capas de persistencia para evitar errores internos de servidor (500).

Tres acciones de estudio
Repasar el diseño y manejo de middlewares de validación de parámetros en Express.

Estudiar la implementación práctica de transacciones atómicas con Node.js y bases de datos relacionales.

Reforzar el flujo de decodificación y verificación de claims en tokens JWT.

Evidencia faltante
Ninguna. La evaluación se completó de manera satisfactoria con respuestas directas en todas las secciones.

Feedback para el docente
Temas prioritarios: Validación de entradas en APIs REST, manejo de excepciones SQL, y trazabilidad de identidad mediante tokens JWT.

Pregunta con problemas: Q4 (Diagnóstico de error por tipo de dato).

Evidencia citada: "el backend no valido la solicitud antes de hacer la consulta".

Nivel de confianza: Medio-Alto.

Acción recomendada: Apoyo puntual en validación de esquemas y códigos de respuesta HTTP.

Pregunta oral sugerida: ¿Cómo se asegura que un error de sintaxis en un parámetro de tipo bigint retorne un 400 Bad Request en lugar de un 500 Internal Server Error?

Respuesta mínima esperada: Validando el formato del parámetro antes de enviarlo a la base de datos o capturando el código de error específico (ej. 22P02 de PostgreSQL) en un middleware de manejo de errores.

