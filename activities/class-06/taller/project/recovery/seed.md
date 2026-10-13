# Recuperación · Seed

Autor: Diego Silva — diegosilva.itsu@gmail.com

## Seed incompleto o falló a la mitad

Síntoma:
El doctor marca "Seed users/requests found ... FAIL", o el seed terminó con
error.

Significado:
El seed corre dentro de una única transacción: si falló, no dejó datos a medias;
simplemente no se aplicó.

Comprueba:
El mensaje del seed. Si dice `42P01`, faltan las migraciones.

Acción:
`npm run db:migrate` (si faltaba esquema) y luego `npm run db:seed`.

Qué NO hacer:
No inserto usuarios del taller a mano por el editor de Supabase.

Pregunta:
¿Por qué "falló a la mitad" no dejó basura en las tablas?

## ¿Ejecuté el seed dos veces y dupliqué todo?

Síntoma:
Miedo después de un segundo `npm run db:seed`.

Significado:
Ninguno: el seed identifica a sus usuarios por email exclusivo
(`*.seed@example.test`), borra solo sus solicitudes y las recrea.

Comprueba:
En el Table Editor: siguen habiendo 3 usuarios seed y 6 solicitudes seed.

Acción:
Nada. Que sea repetible es exactamente esto.

Qué NO hacer:
No "limpio" con DELETE amplios ni TRUNCATE: me llevaría mi propio trabajo.

Pregunta:
¿Qué hace reproducible a este seeder: la suerte o su criterio de identidad?

## Datos residuales de pruebas

Síntoma:
Usuarios `class06-test-...` o `class06-validation-...` en las tablas.

Significado:
Una corrida de pruebas o del validador se interrumpió antes de su cleanup.

Acción:
Vuelvo a correr `npm test` o `npm run validate:class-06` (limpian lo suyo al
final). Si el residuo persiste, lo borro por email exacto en el SQL Editor:
primero su historial, luego sus solicitudes y luego el usuario.

Qué NO hacer:
`DELETE FROM users;` — jamás. Ni siquiera "para empezar limpio".

Pregunta:
¿Cómo distingo una fila del seed, una de pruebas y una mía?
