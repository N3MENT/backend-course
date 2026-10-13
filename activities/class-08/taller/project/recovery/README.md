# Guía de recuperación — Clase 08

Cuando algo se rompe, no cambio código al azar: busco mi síntoma aquí. Cada
entrada sigue el mismo formato: qué significa, qué comprobar, qué hacer, qué
NO hacer y una pregunta para comprender.

| Si el problema es de… | Abro |
| --- | --- |
| Entorno: Supabase, .env, seed, puerto, JWT | `environment.md` |
| Middleware: error handler, respuestas colgadas, headers | `middleware.md` |
| Logs: duplicados, request ID, JSON inválido | `logs.md` |
| Pruebas: no terminan, pool, dependencias, datos sin limpiar | `tests.md` |
| Refactor: suite roja, fronteras del validador, migración 005, transacción del claim | `refactor.md` |

Regla general: **reproduzco antes de corregir** y ejecuto
`npm run class-08:doctor` antes de culpar a mi código.
