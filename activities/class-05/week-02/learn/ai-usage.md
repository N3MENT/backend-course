# Uso de IA — Entrega 05B (`/learn`)

Autor: Diego Silva — diegosilva.itsu@gmail.com

Declaración honesta del rol de la IA en esta entrega, según la rúbrica.

## Especificación inicial

- Objetivo: transformar una investigación sobre mecanismos de identidad en una
  experiencia frontend clara, visual e interactiva.
- Requisitos fijos del enunciado: 20 contenidos obligatorios, al menos 3
  interacciones significativas (no hover, carrusel ni acordeón simple), fuentes
  trazables, diferenciación dato · interpretación · recomendación · decisión,
  seguridad (nada real, sin herramientas ofensivas) y este `ai-usage.md`.

## Prompts importantes

- "Consígueme las instrucciones exactas de la entrega 05B y sus criterios de
  rúbrica." → se resolvió con la consigna oficial.
- "Diseña un esquema de página única que cubra los 20 contenidos con
  interacciones que cumplan 'transformación conceptual'."
- "Revisa el borrador de `main.js` buscando errores de lógica (comparador, quiz
  y árbol), y corrige accesibilidad básica."

## Estructura propuesta

- Proyecto Vite independiente en `week-02/`, justificado por escrito en el
  README.
- Una sola ruta `/learn`: hero con índice, 20 tarjetas y footer; estilos oscuros
  accesibles, foco visible y `aria-live` en las regiones dinámicas.
- Cuatro interacciones: inspector ficticio de JWT, comparador de mecanismos,
  quiz y árbol de decisión.

## Contenido aceptado

- Definiciones y aclaraciones de la consigna (JWT formato/no cifrado/no
  verificación con decodificar; OAuth ≠ OIDC; las API keys no identifican
  personas; ocultar botones no autoriza; no siempre conviene autenticación
  propia).
- Tabla comparativa, preguntas de quiz y árbol: verificadas contra fuentes del
  taller y externas antes de incorporarlas.

## Contenido rechazado

- Cualquier ejemplo con token, password o secreto real → lo sustituí por
  literales ficticios explícitos.
- Una interacción tipo "hover para mostrar": descartada por no ser significativa
  según la rúbrica.
- Argumentos tipo "X es siempre mejor que Y": los reemplacé por condiciones.

## Errores o simplificaciones que detecté

- Un primer borrador del comparador marcaba celdas "iguales" con lógica frágil y
  un valor mal escapado; lo reescribí con datos declarativos y dimensiones
  fijas.
- Eliminé una línea muerta en el quiz y un typo ("Deciisión").
- Aclaré que el ejemplo de payload de JWT es ficticio y no debe usarse como
  plantilla real.

## Fuentes utilizadas

RFC 6749 (OAuth 2), RFC 6750 (Bearer), RFC 7519 (JWT), OpenID Foundation, OWASP
Authentication/Password Storage Cheat Sheets, W3C WebAuthn, NIST SP 800-63B y
las referencias del taller `request-api-v5-starter` (`token.txt`, `password.txt`,
`request.policy.txt`).

## Verificación

- `npm run build` sin errores.
- Revisión manual en navegador de las 4 interacciones y de la navegación por
  índice.
- Contraste y foco revisados contra WCAG básico (`:focus-visible`, `aria-live`,
  no solo color para correcto/incorrecto).

## Decisiones visuales

- Paleta oscura heredada del starter: accesible y de bajo cansancio.
- Badges de color más texto (no solo color) para distinguir
  dato/interpretación/recomendación/decisión.
- Tarjetas con `scroll-margin` para que el ancla no tape el título.
