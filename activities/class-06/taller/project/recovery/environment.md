# Recuperación · Entorno y configuración

Autor: Diego Silva — diegosilva.itsu@gmail.com

## No existe .env

Síntoma:
El doctor dice "There is no .env file yet" o la app pide `DATABASE_URL`.

Significado:
La configuración local no existe todavía; el ejemplo sí.

Comprueba:
`ls -a` (macOS/Linux) o `dir /a` (Windows): ¿ves `.env.example` pero no `.env`?

Acción:
macOS/Linux: `cp .env.example .env` · Windows (cmd): `copy .env.example .env` ·
PowerShell: `Copy-Item .env.example .env`. Luego lleno los valores.

Qué NO hacer:
No renombro `.env.example`: debe seguir existiendo como plantilla versionada.

Pregunta:
¿Por qué `.env.example` sí puede vivir en Git y `.env` no?

## Falta una variable

Síntoma:
`DATABASE_URL is required.` o `JWT_SECRET is required.` al arrancar.

Significado:
El archivo existe, pero esa línea está vacía o mal escrita.

Comprueba:
Abro `.env`: ¿la variable tiene valor? ¿el nombre coincide exacto con
`.env.example`?

Acción:
`DATABASE_URL`: la copio del diálogo Connect de Supabase. `JWT_SECRET`: lo
genero con `npm run generate:secret` y pego el resultado.

Qué NO hacer:
No invento un secreto corto a mano; no comparto la URL con nadie (IA incluida).

Pregunta:
¿Qué puede hacer otra persona con mi cadena de conexión completa?

## Puerto ocupado

Síntoma:
`EADDRINUSE: address already in use :::3000`.

Significado:
Otro proceso (probablemente un `npm run dev` anterior) sigue usando el puerto.

Comprueba:
¿Tengo otra terminal con el servidor corriendo?

Acción:
Cierro el proceso anterior (Ctrl+C en su terminal) o cambio `PORT` en `.env`.

Qué NO hacer:
No abro cinco terminales con cinco servidores "para probar".

Pregunta:
¿Por qué dos procesos no pueden escuchar el mismo puerto?

## Compartí un secreto por accidente

Síntoma:
Pegué mi `DATABASE_URL` o mi `JWT_SECRET` en un chat, un issue o una captura.

Significado:
Ese valor ya no es secreto, sin importar si borro el mensaje.

Acción:
Supabase → Settings → Database → restablecer la contraseña; genero un
`JWT_SECRET` nuevo con `npm run generate:secret`; actualizo mi `.env`.

Qué NO hacer:
No asumo que "nadie lo vio". Rotar cuesta un minuto.

Pregunta:
¿Por qué borrar el mensaje no des-expone el secreto?
