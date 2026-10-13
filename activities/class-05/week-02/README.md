# Entrega 05B — El mundo de la autenticación (`/learn`)

Autor: Diego Silva — diegosilva.itsu@gmail.com

Vive en `activities/class-05/week-02/` como proyecto Vite independiente.

## Justificación por escrito del proyecto separado

El enunciado prefiere que la 05B viva en `/learn` junto a la 05A, pero permite
un proyecto separado si se justifica por escrito. Mi justificación:

- La 05A (interfaz de solicitudes) y la 05B (documentación interactiva) son
  entregas de una semana distinta: al aislar `week-02/` mantengo carpetas
  independientes por semana, tal como el flujo de trabajo de este repositorio
  separa `taller/` y `week-01/`.
- La 05B no consume la API del taller: no necesita `VITE_API_URL`, token ni
  CORS. Un monorepo con dos páginas me obligaría a copiar la config de la 05A y
  a mantenerlas coordinadas sin beneficio.
- Conservo la ruta `/learn` como única entrada, idéntica al layout de la 05A, y
  el diseño visual sigue la misma familia.

## Arranque

```bash
npm install
npm run dev        # http://localhost:5173 (redirige a /learn/)
npm run build      # genera dist/ (no se publica)
```

## Contenido

- Los 20 contenidos obligatorios como secciones con badges de
  dato · interpretación · recomendación · decisión propia.
- 4 interacciones significativas: inspector ficticio de JWT
  (decodificar ≠ verificar), comparador de mecanismos, quiz con
  retroalimentación y puntaje, y árbol de decisión para elegir estrategia de
  autenticación.
- Fuentes en la sección 20, distinguiendo dato y recomendación.
- Todo ficticio: ejemplos de credenciales inventados, nada real.

## Seguridad

No hay tokens, passwords ni secretos reales; los valores de ejemplo son literales
ficticios (`firma_falsa_solo_demostrativa`, `valentina@demo.local`, hashes
`scrypt$demo$…`). `ai-usage.md` documenta el proceso.
