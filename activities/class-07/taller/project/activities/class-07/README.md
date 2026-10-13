# Entrega 07 — Diagnóstico y errores observables

## Qué entregué

* El proyecto con los tres incidentes resueltos y el validador en PASSED.
* `incident-report.md` — mi reporte de incidentes, completado **mientras** investigaba, no reconstruido de memoria al final.
* `validation-evidence.txt` — la salida real y completa de `npm run validate:class-07` con `FINAL RESULT: PASSED`.

## Qué NO entregué

* `.env` (contiene mi cadena de conexión y mi secreto reales).
* Tokens, passwords o logs que contengan un header `Authorization`.
* Capturas de mi panel de Supabase con credenciales visibles.

## Commits realizados

| Momento | Mensaje |
| --- | --- |
| Doctor en verde y suite inicial verde | `class-07-baseline` |
| INC-701 e INC-702 corregidos con sus pruebas | `class-07-incidents-resolved` |
| OPS-703 completo y validador en PASSED | `class-07-submission` |

Etiqueta final:

```bash
git tag class-07-submission
```

## Cómo se evalúa

| Dimensión | Peso |
| --- | --- |
| Reproducción y diagnóstico | 25% |
| Corrección de incidentes | 20% |
| Manejo consistente de errores | 20% |
| Request ID y logs seguros | 15% |
| Pruebas y validador | 15% |
| Explicación y uso de IA | 5% |

No se evalúa memoria de sintaxis ni sofisticación del prompt. Una corrección que funciona pero que no puedo relacionar con la causa se considera **incompleta**.
