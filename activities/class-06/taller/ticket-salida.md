# Ticket de salida — Clase 06

Autor: Diego Silva — diegosilva.itsu@gmail.com
Clasificación: reflexión individual · Sección: Entrega y cierre

Respondo las 13 preguntas con mis propias palabras, tal como quedaron después
del taller.

---

## Sobre el entorno

**1.** ¿Qué hace `npm run db:migrate` y por qué puedo ejecutarlo dos veces sin
romper nada?

Aplica los cambios de esquema en orden (001→004) y guarda cada archivo aplicado
en la tabla `schema_migrations`. La segunda vez revisa esa tabla y se salta lo
que ya está hecho; por eso es seguro repetirlo: cada migración corre una sola
vez, en su propia transacción.

**2.** ¿Qué diferencia hay entre una migración y el seed? ¿Cuál de los dos puedo
volver a ejecutar sin pensarlo y por qué?

La migración define la estructura (tablas y restricciones); el seed carga datos
de demostración (Ana, Luis, María y sus solicitudes). El seed se puede
re-ejecutar sin pensarlo: el script primero borra únicamente a los usuarios
`*.seed@example.test` y los vuelve a crear, sin tocar nada que no sea suyo.

**3.** ¿Cuál de estos valores es un secreto real y cuál es dato de demostración:
mi `DATABASE_URL`, mi `JWT_SECRET`, la contraseña del taller de
`ana.seed@example.test`? ¿Qué haría si expusiera uno de los reales?

`DATABASE_URL` y `JWT_SECRET` son secretos reales (la llave de mi base y la firma
de mis tokens). La contraseña de Ana es dato de demostración: está en el seed y
en el README del repo. Si expusiera uno real, cambiaría la contraseña de la base
desde el panel de Supabase, regeneraría el secreto con `npm run generate:secret`,
actualizaría `.env` y verificaría que no quedó en Git ni en capturas.

## Sobre el código

**4.** ¿En qué archivo vivía BUG-106 y qué regla del contrato estaba rompiendo?

Vivía en `src/modules/requests/requests.service.js`, en `listRequests`. Rompía la
regla de la Clase 03: una colección filtrada vacía sigue siendo una colección
(200 con `[]`); el 404 es solo para un recurso individual que no existe.

**5.** Explica con tus palabras la diferencia entre "un filtro válido sin
resultados" (200 con `[]`) y "un recurso que no existe" (404).

Cuando un filtro no coincide, la colección existe pero no tiene elementos: su
representación vacía es `[]`. Cuando pido un recurso por id y no hay ninguna
solicitud con ese id, no hay nada que representar: ese caso es 404. Una cosa es
"no hay filas para mostrar" y otra distinta "no existe lo que preguntaste".

**6.** En FEATURE-206, ¿por qué una solicitud ajena responde 404 y no 403? ¿Quién
tomó esa decisión: yo, la IA o el contrato?

Responde 404 idéntico al "no existe" para no revelar que la solicitud ajena
existe; así no puedo enumerar solicitudes de otros usuarios. La decisión la tomó
el contrato existente desde la Clase 05; yo, con ayuda para ubicar las piezas, lo
reutilicé tal cual, sin inventar una regla nueva.

**7.** ¿Qué piezas ya existentes del proyecto reutilicé para el endpoint de
historial, y qué habría pasado si hubiera escrito todo desde cero?

Reutilicé `findById` y `findHistory` del store, la política `canViewHistory`, el
mapper `mapHistoryEventRow`, el helper `notFound()` y el formato de errores. Si
lo escribía todo desde cero habría duplicado la autorización y los errores, y con
cualquier descuido el endpoint respondería distinto al de `GET /requests/:id`:
más código que mantener y más riesgo de romper el contrato.

## Sobre las pruebas

**8.** ¿Qué significan las tres partes Preparar / Actuar / Comprobar en una
prueba? Señálalas en una prueba mía.

Preparar es armar las condiciones (usuario y token), Actuar es ejecutar la acción
(el GET) y Comprobar es verificar el resultado esperado (el assert). En mi prueba
de regresión de BUG-106: Preparar → creo un usuario nuevo y hago login; Actuar →
`GET /requests?status=closed`; Comprobar → `assert.equal(response.status, 200)`
y `assert.deepEqual(response.body, [])`.

**9.** ¿Por qué las pruebas crean sus propios datos con identificadores únicos y
limpian solo lo que crearon, en vez de borrar tablas completas?

Así dos ejecuciones (o dos developers) no chocan: cada usuario lleva un `runId`
aleatorio en el email. Y como limpian solo sus ids, el seed y cualquier otro dato
sobreviven a cada corrida; un `DELETE` masivo o `TRUNCATE` destruiría el entorno
de todos.

**10.** Cuando una prueba falló durante el taller, ¿qué leí primero en la salida
y qué me dijo sobre dónde buscar?

Primero leí el resumen de conteos (`tests 0 / pass 0`). Eso me dijo que el
problema no era el código sino el runner: el glob `'test/*.test.js'` no expandía
en mi terminal de Windows, así que ejecuté los archivos de prueba explícitamente
y ya corrieron 13 tests. O sea, la salida me apuntó al comando, no a la lógica.

## Sobre la IA y sobre mí

**11.** Da un ejemplo real de algo que la IA me respondió y que verifiqué antes
de aceptar. ¿Cómo lo verifiqué?

La IA sugirió usar el transaction pooler de Supabase
(`postgres...:6543?pgbouncer=true`) porque el session pooler daba `ECONNRESET`,
como ya había pasado en la Clase 05. No lo acepté de palabra: lo probé con un
script de `node` + `pg` que conectó, ejecutó `SELECT version()` y respondió
PostgreSQL 17.6. Luego corrí el doctor y confirmé "Environment ready".

**12.** ¿Qué decisión de esta clase NO le habría delegado a la IA aunque me la
ofreciera resuelta, y por qué?

Elegir qué proyecto de Supabase conservar y cuál borrar. Es mi cuenta, con datos
de entregas anteriores, y un borrado equivocado no se deshace. Preferí
identificarlo yo mismo revisando los `.env` locales y los README, y borrar solo
con certeza. Las acciones destructivas o sobre credenciales no se delegan.

**13.** ¿Qué fue lo más difícil del taller para mí, y qué haría distinto si
mañana me asignaran otro ticket en un backend que no conozco?

Lo más difícil fue moverme rápido en un código que no escribí: saber dónde vive
cada responsabilidad (rutas, servicios, política, store) sin leer todo durante
una hora. Si mañana me asignan otro ticket, leería primero el recorrido de una
petición y el contrato de errores del proyecto, y llenaría el work-log durante el
taller y no al final, para que registre el proceso real.

---

> La frase que resume esta clase: **"Usamos IA para comprender y avanzar más
> rápido, pero nosotros conservamos el contrato, verificamos el resultado y
> podemos explicar el cambio."**
