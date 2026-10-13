# Clase 07 — Cuando el backend falla

Durante la segunda semana como desarrollador backend junior en el curso "Desarrollo Backend" (ITSU, tercer trimestre), formé parte del equipo que mantiene la API de solicitudes. Soporte reportó que algunos usuarios recibían errores al consultar y modificar solicitudes; las respuestas no eran claras y los logs actuales no permitían relacionar una petición con el error producido.

Mi tarea fue **investigar los incidentes, corregir los defectos y mejorar la capacidad del backend para explicar qué estaba ocurriendo.** Para ello, utilicé IA durante todo el proceso. No podía cambiar el contrato solo para silenciar una prueba.

> Antes de corregir un problema, debía poder reproducirlo, observarlo, formular una hipótesis y comprobar la solución.

## Los tres incidentes

| Incidente | Reporte | Brief |
| --- | --- | --- |
| INC-701 | Algunos identificadores devuelven error interno | `incidents/INC-701-invalid-request-id.md` |
| INC-702 | Actualizar ciertas prioridades produce error interno | `incidents/INC-702-invalid-priority.md` |
| OPS-703 | Los errores no se pueden rastrear en los logs | `incidents/OPS-703-untraceable-errors.md` |

## Tablero del taller

* [ ] **Baseline** — el sistema funciona antes de tocarlo
* [ ] **Reproducción** — los tres incidentes reproducidos con evidencia
* [ ] **Diagnóstico** — síntoma ≠ causa: hipótesis y comprobación
* [ ] **INC-701** — id inválido responde 400, con prueba de regresión
* [ ] **INC-702** — prioridad inválida responde 400, restricción intacta
* [ ] **Error handler** — un solo lugar traduce errores a respuestas
* [ ] **Request ID** — respuesta y log comparten identificador
* [ ] **Logs** — una línea JSON por petición, sin datos sensibles
* [ ] **Health/ready** — el proceso vive; la disponibilidad se comprueba
* [ ] **Validación** — `npm run validate:class-07` en PASSED

## Puesta en marcha (baseline)

Utilicé el **mismo proyecto de Supabase de la clase 06** — misma base, misma cadena de conexión, mismo secreto. No creé nada nuevo.

```bash
git status                  # registré desde dónde partía
cp .env.example .env        # pegué mi DATABASE_URL y JWT_SECRET de la clase 06
npm install
npm run class-07:doctor     # 7 comprobaciones -> Environment ready for incident response.
npm run db:migrate          # todas las migraciones deben decir SKIPPED
npm run db:seed             # reconstruye SOLO los datos del taller
npm test                    # verde: 20 pruebas pass, 17 todo (las escribí yo)
```

Si el baseline no funcionaba, **debía detenerme**: todavía no sabía si un fallo posterior pertenecía al ticket o al ambiente. Consulté `recovery/`.

## Comandos del taller

| Comando | Qué hace |
| --- | --- |
| `npm run class-07:doctor` | Diagnóstico del entorno (7 checks, no destructivo) |
| `npm run incidents:reproduce` | Reproduce los 3 incidentes: expected vs actual |
| `npm run db:migrate` / `db:seed` | Esquema y datos del taller (repetibles) |
| `npm test` | Suite completa (`node:test` + Supertest) |
| `npm run dev` | Servidor con recarga; aquí vería los logs |
| `npm run validate:class-07` | Validador final (12 checks) |

## Credenciales del seed (datos de demostración)

| Usuario | Email | Password | Rol |
| --- | --- | --- | --- |
| Ana | `ana.requester.seed@example.test` | `ana clave del taller 06` | requester |
| Luis | `luis.requester.seed@example.test` | `luis clave del taller 06` | requester |
| María | `maria.agent.seed@example.test` | `maria clave del taller 06` | agent |

Son datos de taller, públicos a propósito. Mi `DATABASE_URL` y mi `JWT_SECRET` sí son secretos reales: nunca los pegué en un chat, un commit o una captura.

## Reglas para trabajar con IA

La IA **puede**: explicar errores, separar síntoma de hipótesis, seguir un valor por el código, proponer hipótesis con su comprobación, sugerir cambios pequeños que yo ejecutaba y verificaba.

La IA **no decide en silencio**: el contrato HTTP, qué error es público, qué se registra en los logs, qué código se elimina, qué prueba se ignora, si una restricción de base desaparece, ni si una expectativa se cambia "para que dé verde".

> Una hipótesis no se convierte en causa porque una IA la escribió. Necesito una comprobación.

## Entrega

Completé `activities/class-07/incident-report.md` mientras trabajaba (no al final de memoria) y guardé la salida real del validador en `activities/class-07/validation-evidence.txt`. Detalles y commits sugeridos en `activities/class-07/README.md`. **Nunca incluí `.env`.**
