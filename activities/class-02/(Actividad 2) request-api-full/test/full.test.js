import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('GET /requests responde 200 con la lista de solicitudes', async () => {
  const response = await fetch(`${baseUrl}/requests`);
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(data));
  assert.equal(data.length, 3);
});

test('GET /requests/:id de una solicitud existente responde 200 con sus datos', async () => {
  const response = await fetch(`${baseUrl}/requests/1`);
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.id, 1);
  assert.equal(data.title, 'Projector does not turn on');
  assert.equal(data.status, 'open');
});

test('GET /requests/:id de una solicitud inexistente responde 404', async () => {
  const response = await fetch(`${baseUrl}/requests/999`);
  const data = await response.json();

  assert.equal(response.status, 404);
  assert.deepEqual(data, { error: 'Request not found' });
});

test('POST /requests con título responde 201 y crea la solicitud', async () => {
  const response = await fetch(`${baseUrl}/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Broken door lock',
      description: 'The lock on room 101 does not turn properly.',
      priority: 'high'
    })
  });
  const data = await response.json();

  assert.equal(response.status, 201);
  assert.equal(data.id, 4);
  assert.equal(data.title, 'Broken door lock');
  assert.equal(data.status, 'open');
  assert.equal(data.priority, 'high');
});

test('POST /requests sin título responde 400 y no crea la solicitud', async () => {
  const response = await fetch(`${baseUrl}/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description: 'Missing title', priority: 'low' })
  });
  const data = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(data, { error: 'Title is required' });
});