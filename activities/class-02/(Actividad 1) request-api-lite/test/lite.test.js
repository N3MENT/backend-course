import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_FILE = path.join(__dirname, '..', 'server.js');
const BASE_URL = 'http://127.0.0.1:3000';

let child;

function waitForServer(url, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = async () => {
      if (Date.now() > deadline) {
        return reject(
          new Error(`El servidor no respondió en ${url} antes de ${timeoutMs}ms`)
        );
      }
      try {
        const response = await fetch(url);
        resolve(response);
      } catch {
        setTimeout(attempt, 200);
      }
    };
    attempt();
  });
}

before(async () => {
  child = spawn(process.execPath, [SERVER_FILE], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  child.on('exit', (code) => {
    if (code !== null && code !== 0) {
      throw new Error(`El servidor Lite terminó con código ${code}`);
    }
  });

  await waitForServer(`${BASE_URL}/requests`);
});

after(() => {
  if (child && child.exitCode === null) {
    child.kill();
  }
});

test('GET /requests responde 200 con la lista de solicitudes', async () => {
  const response = await fetch(`${BASE_URL}/requests`);
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(data));
  assert.equal(data.length, 3);
});

test('GET /requests/:id de una solicitud existente responde 200 con sus datos', async () => {
  const response = await fetch(`${BASE_URL}/requests/1`);
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.id, 1);
  assert.equal(data.title, 'Projector does not turn on');
  assert.equal(data.status, 'open');
});

test('GET /requests/:id de una solicitud inexistente responde 404', async () => {
  const response = await fetch(`${BASE_URL}/requests/999`);
  const data = await response.json();

  assert.equal(response.status, 404);
  assert.deepEqual(data, { error: 'Request not found' });
});

test('POST /requests con título responde 201 y crea la solicitud', async () => {
  const response = await fetch(`${BASE_URL}/requests`, {
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
  const response = await fetch(`${BASE_URL}/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description: 'Missing title', priority: 'low' })
  });
  const data = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(data, { error: 'Title is required' });
});