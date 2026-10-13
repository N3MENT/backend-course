# Recuperación · Conexión a la base

Autor: Diego Silva — diegosilva.itsu@gmail.com

## Contraseña incorrecta

Síntoma:
`password authentication failed` (código 28P01).

Significado:
Llegamos al servidor, pero rechazó las credenciales: el problema es la URL, no mi
red ni mi código.

Comprueba:
¿Copié la cadena completa del diálogo Connect? ¿La contraseña es la del proyecto
(no la de mi cuenta de Supabase)?

Acción:
Vuelvo al diálogo Connect y copio la cadena de nuevo. Si olvidé la contraseña del
proyecto, la restablezco en Settings → Database.

Qué NO hacer:
No "pruebo" contraseñas al azar; no pego la URL real en un chat de IA.

Pregunta:
¿Cómo demuestra este error que la red sí funciona?

## Caracteres especiales en la contraseña

Síntoma:
La contraseña es correcta, pero la conexión falla o la URL "se corta".

Significado:
Dentro de una URL, caracteres como `@ : / # ? &` tienen significado propio; si mi
contraseña los contiene, deben ir codificados.

Acción:
La opción simple del taller: restablecer la contraseña y elegir una sin
caracteres reservados. La alternativa técnica es codificarlos: `@` → `%40`.

Qué NO hacer:
No entro al agujero del URL-encoding a mitad del taller.

Pregunta:
¿Qué papel juega el carácter `@` dentro de una cadena de conexión?

## ENOTFOUND

Síntoma:
`getaddrinfo ENOTFOUND ...`

Significado:
El hostname no se pudo resolver: la URL está incompleta, escrita a mano, o mi red
no alcanza ese endpoint.

Comprueba:
¿Copié el host desde Connect o lo escribí suponiendo la región?

Acción:
Copio la cadena de nuevo desde Connect. Si persiste, uso la cadena del Session
pooler que muestra el mismo diálogo.

Qué NO hacer:
Jamás escribo el hostname a mano.

Pregunta:
¿Qué diferencia hay entre "no existe ese nombre" y "no responde"?

## Timeout o fallo por IPv6

Síntoma:
`ETIMEDOUT`, `ECONNREFUSED`, o la conexión "se queda pensando".

Significado:
El host existe pero no responde desde mi red. La conexión directa de Supabase usa
IPv6; muchas redes estudiantiles solo tienen IPv4.

Acción:
Abro el diálogo Connect y uso la cadena del Session pooler (funciona sobre IPv4).
Actualizo `DATABASE_URL` y corro `npm run class-06:doctor`.

Qué NO hacer:
No cambio de red a ciegas ni desactivo mi firewall.

Pregunta:
¿Por qué la misma cadena puede funcionar en mi casa y fallar en el aula?

## Proyecto de Supabase no disponible

Síntoma:
Timeouts constantes; el dashboard muestra el proyecto "Paused" o "Restoring".

Significado:
Los proyectos gratuitos se pausan por inactividad; mientras despiertan no aceptan
conexiones.

Acción:
Lo restauro desde el dashboard y espero a que quede "Active" (1–2 min).

Qué NO hacer:
No creo un segundo proyecto "porque el primero no sirve".

Pregunta:
¿Dónde vive realmente mi información mientras el proyecto está pausado?
