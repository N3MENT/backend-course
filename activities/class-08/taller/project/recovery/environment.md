# Recuperación · Entorno

## Supabase inaccesible

**Síntoma:** el doctor falla en "Database connection established"; el terminal
muestra `ETIMEDOUT`, `ECONNREFUSED` o `ENOTFOUND`.

**Qué significa aproximadamente:** el proceso no logra hablar con mi base. Casi
nunca es mi código: es la red, la cadena de conexión o un proyecto pausado.

**Qué comprobar:**

* El estado del proyecto en el dashboard de Supabase (los proyectos gratuitos
  se pausan tras días de inactividad).
* Que `DATABASE_URL` fue copiada del diálogo Connect, no tecleada.
* Si mi red es solo IPv4, que estoy usando la cadena del Session pooler.

**Acción sugerida:** restauro el proyecto si está pausado, espero a que diga
Active y vuelvo a ejecutar `npm run class-07:doctor`.

**Qué no hacer:** crear un proyecto nuevo (perdería mis datos de la clase 06);
pegar la cadena completa en un chat para pedir ayuda.

**Pregunta para comprender:** ¿este fallo es un error esperado o inesperado para
MI backend? ¿Qué código debería responder mi API mientras tanto?

## `.env` faltante o incompleto

**Síntoma:** el doctor falla en "Environment configured", o la app lanza
`DATABASE_URL is required.`

**Qué significa aproximadamente:** el proceso arrancó sin su configuración
local. `.env` no se versiona: cada clon lo recrea.

**Qué comprobar:** que `.env` exista junto a `package.json` y que `DATABASE_URL`
y `JWT_SECRET` tengan valor.

**Acción sugerida:** `cp .env.example .env`, pego la cadena de la clase 06 y, si
perdí el secreto, `npm run generate:secret`.

**Qué no hacer:** versionar `.env` para "no volver a perderlo"; inventar un
secreto corto a mano.

**Pregunta para comprender:** ¿por qué el repositorio incluye `.env.example`
pero excluye `.env`?

## Seed incompleto

**Síntoma:** el doctor falla en "Seed data available", o `incidents:reproduce`
dice que no encuentra usuarios o solicitudes del seed.

**Qué significa aproximadamente:** faltan los datos identificables del taller
(usuarios `*.seed@example.test` y sus solicitudes).

**Qué comprobar:** la salida de `npm run db:seed` — debe terminar con "Seed
completed successfully."

**Acción sugerida:** `npm run db:seed`. Es repetible: reconstruye SOLO los datos
del taller y conserva lo demás.

**Qué no hacer:** insertar filas a mano en la tabla; borrar tablas completas
para "empezar limpio".

**Pregunta para comprender:** ¿qué distingue a los datos que el seed puede tocar
de los que no?

## Puerto ocupado

**Síntoma:** `npm run dev` termina con `EADDRINUSE: address already in use`.

**Qué significa aproximadamente:** otro proceso (probablemente un servidor mío
anterior) sigue escuchando en ese puerto.

**Qué comprobar:** terminales abiertas con un `npm run dev` olvidado.

**Acción sugerida:** cierro el proceso anterior (Ctrl+C en su terminal) o
cambio `PORT` en `.env` y reinicio.

**Qué no hacer:** matar procesos del sistema que no reconozco.

**Pregunta para comprender:** ¿por qué dos procesos no pueden escuchar el mismo
puerto?

## JWT inválido

**Síntoma:** todos los logins devuelven token, pero TODA petición autenticada
responde `401 INVALID_TOKEN`.

**Qué significa aproximadamente:** el secreto con el que se firmó el token no es
el mismo con el que se verifica — normalmente cambié `JWT_SECRET` con el
servidor corriendo o entre el login y la petición.

**Qué comprobar:** que no edité `.env` después de obtener el token; que solo hay
UN valor de `JWT_SECRET`.

**Acción sugerida:** reinicio el servidor y vuelvo a hacer login para obtener un
token firmado con el secreto actual.

**Qué no hacer:** copiar un token viejo de otra sesión; comentar la verificación
"mientras tanto".

**Pregunta para comprender:** ¿por qué cambiar el secreto invalida todos los
tokens emitidos?
