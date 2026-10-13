# Recuperación · Migraciones

Autor: Diego Silva — diegosilva.itsu@gmail.com

## relation "requests" does not exist

Síntoma:
`relation "requests" does not exist` (código 42P01).

Significado:
La conexión funciona, pero la tabla no está disponible: el esquema no se instaló
(o apunto a otra base).

Comprueba:
`npm run class-06:doctor`: ¿dice "schema has not been installed"?

Acción:
`npm run db:migrate`

Qué NO hacer:
No modifico la ruta de Express para ocultar el error.

Pregunta:
¿Por qué este error demuestra que sí llegamos a PostgreSQL?

## Migración pendiente

Síntoma:
El doctor marca "All migrations applied ... FAIL".

Significado:
Hay archivos .sql que el libro de registro (`schema_migrations`) no conoce.

Acción:
`npm run db:migrate`: solo aplicará las pendientes, en orden.

Qué NO hacer:
No ejecuto los .sql a mano en el editor: el runner registra lo aplicado.

Pregunta:
¿Quién recuerda qué migraciones ya corrieron, yo o la base?

## Migración que falló a la mitad

Síntoma:
`[FAILED] 00X_...sql` con un error de SQL.

Significado:
Esa migración se revirtió completa (cada una corre en su transacción): no hay
cambios a medias.

Comprueba:
El mensaje: ¿qué línea del .sql rechazó PostgreSQL?

Acción:
Corrijo la causa (¿orden? ¿tabla previa faltante?) y vuelvo a ejecutar.

Qué NO hacer:
No marco la migración como aplicada a mano en `schema_migrations`.

Pregunta:
¿Qué habría quedado en la base si no hubiera una transacción por migración?

## violates foreign key constraint

Síntoma:
`violates foreign key constraint` al insertar o borrar.

Significado:
La base defendió una relación: intenté crear un hijo sin padre, o borrar un padre
con hijos vivos.

Comprueba:
¿En qué orden estoy insertando o borrando? Para borrar: history → requests →
users; al revés para crear.

Acción:
Respeto el orden de dependencias; en las pruebas, borro primero el historial.

Qué NO hacer:
No elimino la constraint para "destrabar" el flujo.

Pregunta:
¿De qué error silencioso me acaba de salvar esta restricción?

## duplicate key value

Síntoma:
`duplicate key value violates unique constraint`.

Significado:
Ya existe una fila con ese valor único (típicamente un email repetido).

Comprueba:
¿Mis pruebas usan emails únicos por corrida (`runId` aleatorio)?

Acción:
Uso los helpers de test-data (generan emails únicos); si fue el seed, recuerdo
que identifica a sus usuarios por email y no duplica.

Qué NO hacer:
No borro usuarios ajenos para liberar el email.

Pregunta:
¿Qué garantiza la unicidad: mi JavaScript o la base? ¿Por qué ambas capas?
