# Recuperación · Pruebas y aplicación

Autor: Diego Silva — diegosilva.itsu@gmail.com

## Token inválido en pruebas manuales

Síntoma:
Tenía un token que funcionaba y ahora todo responde `401 INVALID_TOKEN`.

Significado:
El token se firmó con un secreto distinto o expiró; si cambié `JWT_SECRET` o
reinicié con otro `.env`, los tokens viejos ya no verifican.

Comprueba:
¿Cambié `.env` después de obtener el token? ¿Reinicié el server?

Acción:
Hago login de nuevo y uso el token fresco.

Qué NO hacer:
No toco el middleware para "aceptar" el token viejo.

Pregunta:
¿Por qué cambiar el secreto invalida todos los tokens emitidos?

## JWT_SECRET diferente entre procesos

Síntoma:
El login del test funciona, pero `/auth/me` responde 401 dentro de la misma
corrida; o el server manual rechaza los tokens del test.

Significado:
Dos procesos con `.env` distintos firman y verifican con claves distintas.

Comprueba:
¿Edité `.env` con el server viejo aún corriendo?

Acción:
Un solo `.env`, reinicio todo lo que estaba corriendo.

Pregunta:
¿Quién debe compartir el secreto: los procesos o las personas?

## El test "no termina" (la terminal queda colgada)

Síntoma:
La suite pasa, pero el proceso no devuelve el prompt.

Significado:
Una conexión quedó abierta, típicamente un pool sin cerrar.

Comprueba:
¿El archivo de test cierra el pool en su hook final (`after`)?

Acción:
Uso los helpers: `cleanupCreatedData()` y `closePool()` en `after(...)`.

Qué NO hacer:
No agrego `process.exit()` dentro de un test para "forzar" el final.

Pregunta:
¿Qué diferencia hay entre "terminaron mis pruebas" y "terminó mi proceso"?

## Cleanup fallido o peligroso

Síntoma:
Después de las pruebas faltan datos del seed, o sobran datos de prueba.

Significado:
Un cleanup demasiado amplio borró de más, o uno frágil corrió de menos.

Comprueba:
¿El cleanup borra por ids registrados o por una condición amplia? ¿Corre en
`finally`/`after` aunque la prueba falle?

Acción:
Borro solo por ids recogidos, en orden history → requests → users. Restauro el
seed con `npm run db:seed` si algo del seed faltara.

Qué NO hacer:
`DELETE FROM requests;` sin WHERE. Nunca.

Pregunta:
¿Qué pasaría con el trabajo de mi compañero de equipo si mi cleanup borrara
"todo lo que parezca de prueba"?
