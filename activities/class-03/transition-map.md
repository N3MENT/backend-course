# Transition map — ciclo de vida de un support ticket

Autor: Diego Silva — diegosilva.itsu@gmail.com

> Fase 1 · se completa **antes de usar IA y antes de tocar código**.
> Lo que no aparece como transición permitida está prohibido: los huecos también son reglas.

## Estados

* **`pending`** — la incidencia fue reportada y está a la espera de que un agente la tome.
* **`in_progress`** — un agente tomó el caso y está investigando o aplicando la solución.
* **`resolved`** — el agente aplicó la solución técnica. **Terminal.**
* **`cancelled`** — el requerimiento fue descartado sin resolverse. **Terminal.**

## Transiciones permitidas

| Desde | Hacia | ¿Qué la dispara? |
| ----- | ----- | ---------------- |
| `pending` | `in_progress` | el agente toma el caso para investigación |
| `pending` | `cancelled` | el cliente cancela el requerimiento |
| `in_progress` | `resolved` | el agente aplica la solución técnica |
| `in_progress` | `cancelled` | el agente o el cliente descartan el requerimiento |

## Transiciones inválidas notables

| Intento | Por qué se rechaza |
| ------- | ------------------ |
| `pending → resolved` | ninguna incidencia salta de "reportada" a "resuelta" sin pasar por atención |
| `pending → cancelled` desde el agente | el cliente es quien cancela un ticket todavía no atendido |
| `resolved → *` | es un estado terminal: no admite salida |
| `cancelled → *` | es un estado terminal: no admite salida |

## Estados terminales

`resolved` y `cancelled` no admiten transiciones de salida. Si llega un `PATCH` sobre un
ticket en estado terminal — modifique el `status` o cualquier otro campo — la API responde
`409` con `TICKET_IN_TERMINAL_STATUS`.

## Justificación

Mi mapa permite el camino feliz (`pending → in_progress → resolved`) más la salida lateral
de cancelación desde `pending` o `in_progress`. Es un flujo secuencial de atención, tal como
lo pide la regla de negocio: "avanza secuencialmente hasta su resolución o cancelación".

**`pending → cancelled` y `in_progress → cancelled` son las únicas salidas a terminal.** Un
ticket pendiente que nunca se atenderá se cancela; un ticket en atención que se descarta se
cancela también. No existe `resolved → cancelled`: si la solución ya fue aplicada, el
trabajo terminó; la única historia coherente es el estado terminal `resolved`.

**`resolved → in_progress` no existe (invariante de negocio).** Si una falla reaparece sobre
un ticket resuelto, el negocio exige abrir un **nuevo ticket** de soporte. Esta decisión
preserva la integridad del flujo y la calidad de las métricas: cada ticket cuenta una sola
historia, sin reabrir ciclos que confundirían los reportes de tiempo y resolución.

**Cancelar ≠ resolver.** Ambos terminan el ticket, pero cuentan historias distintas:
`resolved` culmina el trabajo con una solución aplicada; `cancelled` lo interrumpe sin
resolverlo. La distinción permite auditar por qué un ticket terminó sin atenderse.
