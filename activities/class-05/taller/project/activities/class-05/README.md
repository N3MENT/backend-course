# Actividades — Clase 05

Autor: Diego Silva — diegosilva.itsu@gmail.com

El taller empieza escribiendo, no programando. El orden importa:

1. `access-matrix.md` — quién puede hacer qué (estación 1). Antes que cualquier código.
2. `auth-contract.md` — el contrato de los endpoints de auth (estación 1).
3. `threat-cases.md` — los ataques que mi implementación deberá resistir (estación 1).
4. `decision-log.md` — cada decisión no obvia, registrada en el momento en que la tomo.
5. `validation-evidence.md` — la salida del validador por estación, sin secretos.
6. `ai-usage.md` — solo puede tener contenido después del checkpoint.
7. `reflection.md` — al cierre del taller.

## Checkpoint `class-05-access-design`

No uso IA hasta que el validador confirme que la matriz, el contrato y los casos
de amenaza están completos:

```bash
npm run validate:class-05 -- --stage access-design
```
