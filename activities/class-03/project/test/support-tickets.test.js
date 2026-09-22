import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

let server;
let base;

before(async () => {
  server = app.listen(0);
  const { port } = server.address();
  base = `http://127.0.0.1:${port}/api/v1/support-tickets`;
});

after(() => server.close());

const SEED = {
  pending: 'b1e6d2f0-1c9a-4e5d-8a3f-2c5b7d9e1a23',
  inProgress: 'c2f7e3a1-2dab-4f6e-9b40-3d6c8eaf2b34',
  resolved: 'd3a8f4b2-3ebc-4a7f-ac51-4e7d9fb0c345',
  cancelled: 'e4b9a5c3-4fcd-4b8a-bd62-5f8e0ac1d456'
};

async function get(path) {
  return fetch(`${base}${path}`);
}

async function post(path, body) {
  return fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function patch(path, body) {
  return fetch(`${base}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function json(res) {
  return res.json();
}

async function createTicket(title = 'Ticket de prueba') {
  const res = await post('/', { title, description: 'Descripción de prueba.' });
  return (await json(res)).id;
}

describe('GET /api/v1/support-tickets', () => {
  test('lista los tickets sembrados', async () => {
    const res = await get('/');
    assert.equal(res.status, 200);
    const list = await json(res);
    assert.equal(list.length, 4);
  });

  test('filtra por estado y prioridad combinados (AND)', async () => {
    const res = await get('/?status=pending&priority=medium');
    assert.equal(res.status, 200);
    const list = await json(res);
    assert.equal(list.length, 1);
    assert.equal(list[0].id, SEED.pending);
  });

  test('filtro sin coincidencias devuelve lista vacía', async () => {
    const res = await get('/?status=cancelled&priority=urgent');
    assert.equal(res.status, 200);
    assert.deepEqual(await json(res), []);
  });

  test('filtro con estado desconocido responde 400', async () => {
    const res = await get('/?status=reopened');
    assert.equal(res.status, 400);
    const body = await json(res);
    assert.equal(body.error.code, 'INVALID_STATUS');
    assert.ok(body.error.timestamp);
  });
});

describe('GET /api/v1/support-tickets/:id', () => {
  test('devuelve el ticket por id', async () => {
    const res = await get(`/${SEED.pending}`);
    assert.equal(res.status, 200);
    const ticket = await json(res);
    assert.equal(ticket.title, 'Error al exportar reporte PDF');
    assert.equal(ticket.status, 'pending');
  });

  test('id inexistente responde 404 con error unificado', async () => {
    const res = await get('/00000000-0000-4000-8000-000000000000');
    assert.equal(res.status, 404);
    const body = await json(res);
    assert.equal(body.error.code, 'TICKET_NOT_FOUND');
    assert.ok(Array.isArray(body.error.details));
  });
});

describe('POST /api/v1/support-tickets', () => {
  test('crea un ticket con valores por defecto de servidor', async () => {
    const res = await post('/', { title: 'Teclado no responde', description: 'El teclado del cajero 2 no escribe.', priority: 'high' });
    assert.equal(res.status, 201);
    const ticket = await json(res);
    assert.match(ticket.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.equal(ticket.status, 'pending');
    assert.equal(ticket.priority, 'high');
    assert.ok(ticket.createdAt);
    assert.ok(ticket.updatedAt);
  });

  test('ignora campos de servidor enviados por el cliente', async () => {
    const res = await post('/', {
      title: 'Sin red en sala A',
      description: 'La red wifi no aparece en la sala A.',
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      status: 'resolved',
      createdAt: '1999-01-01T00:00:00.000Z'
    });
    const ticket = await json(res);
    assert.equal(res.status, 201);
    assert.notEqual(ticket.id, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    assert.equal(ticket.status, 'pending');
  });

  test('título obligatorio', async () => {
    const res = await post('/', { description: 'Sin título.' });
    assert.equal(res.status, 400);
    assert.equal((await json(res)).error.code, 'MISSING_TITLE');
  });

  test('descripción obligatoria', async () => {
    const res = await post('/', { title: 'Sin descripción' });
    assert.equal(res.status, 400);
    assert.equal((await json(res)).error.code, 'MISSING_DESCRIPTION');
  });

  test('prioridad inválida', async () => {
    const res = await post('/', { title: 'Prioridad rara', description: 'Descripción.', priority: 'bloqueante' });
    assert.equal(res.status, 400);
    assert.equal((await json(res)).error.code, 'INVALID_PRIORITY');
  });
});

describe('PATCH /api/v1/support-tickets/:id', () => {
  test('actualización parcial de campos', async () => {
    const id = await createTicket();
    const res = await patch(`/${id}`, { priority: 'low' });
    assert.equal(res.status, 200);
    const ticket = await json(res);
    assert.equal(ticket.priority, 'low');
    assert.equal(ticket.status, 'pending');
  });

  test('transición válida pending → in_progress', async () => {
    const id = await createTicket();
    const res = await patch(`/${id}`, { status: 'in_progress' });
    assert.equal(res.status, 200);
    assert.equal((await json(res)).status, 'in_progress');
  });

  test('transición inválida pending → resolved responde 409', async () => {
    const id = await createTicket();
    const res = await patch(`/${id}`, { status: 'resolved' });
    assert.equal(res.status, 409);
    const body = await json(res);
    assert.equal(body.error.code, 'INVALID_STATE_TRANSITION');
    assert.ok(Array.isArray(body.error.details));
  });

  test('estado terminal no admite más cambios', async () => {
    const res = await patch(`/${SEED.resolved}`, { priority: 'medium' });
    assert.equal(res.status, 409);
    assert.equal((await json(res)).error.code, 'TICKET_IN_TERMINAL_STATUS');
  });

  test('ticket cancelado no admite reapertura', async () => {
    const res = await patch(`/${SEED.cancelled}`, { status: 'pending' });
    assert.equal(res.status, 409);
    assert.equal((await json(res)).error.code, 'TICKET_IN_TERMINAL_STATUS');
  });

  test('PATCH con campos que el cliente no puede tocar responde 400', async () => {
    const res = await patch(`/${SEED.inProgress}`, { id: 'x' });
    assert.equal(res.status, 400);
    assert.equal((await json(res)).error.code, 'EMPTY_PATCH');
  });

  test('PATCH repitiendo el estado actual es idempotente', async () => {
    const res = await patch(`/${SEED.inProgress}`, { status: 'in_progress' });
    assert.equal(res.status, 200);
    assert.equal((await json(res)).status, 'in_progress');
  });

  test('PATCH con estado inválido responde 400', async () => {
    const res = await patch(`/${SEED.inProgress}`, { status: 'workaround' });
    assert.equal(res.status, 400);
    assert.equal((await json(res)).error.code, 'INVALID_STATUS');
  });

  test('PATCH a ticket inexistente responde 404', async () => {
    const res = await patch('/00000000-0000-4000-8000-000000000000', { status: 'pending' });
    assert.equal(res.status, 404);
    assert.equal((await json(res)).error.code, 'TICKET_NOT_FOUND');
  });

  test('el formato de error siempre incluye timestamp', async () => {
    const res = await get('/?status=reopened');
    const body = await json(res);
    assert.ok(typeof body.error.timestamp === 'string' && !Number.isNaN(Date.parse(body.error.timestamp)));
  });
});