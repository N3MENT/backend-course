import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_FILE = path.join(__dirname, '..', 'src', 'server.js');
const BASE_URL = 'http://127.0.0.1:3000';

let child;
let serverLogs = '';

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
  if (!(await import('node:fs')).existsSync(SERVER_FILE)) {
    throw new Error(`No se encontró el servidor: ${SERVER_FILE}`);
  }

  child = spawn(process.execPath, [SERVER_FILE], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  child.stderr.on('data', (chunk) => {
    serverLogs += chunk.toString();
  });

  child.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(serverLogs);
    }
  });

  await waitForServer(`${BASE_URL}/health`);
});

after(() => {
  if (child && child.exitCode === null) {
    child.kill();
  }
});

test('GET / responde 200 con el mensaje de bienvenida', async () => {
  const response = await fetch(`${BASE_URL}/`);
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/plain/);
  assert.equal(body, 'Bienvenido al servidor de Desarrollo Backend');
});

test('GET /health responde 200 con OK', async () => {
  const response = await fetch(`${BASE_URL}/health`);
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/plain/);
  assert.equal(body, 'OK');
});

test('GET /api/info responde JSON con los metadatos de la materia', async () => {
  const response = await fetch(`${BASE_URL}/api/info`);
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /application\/json/);
  assert.equal(data.materia, 'Desarrollo Backend');
  assert.equal(data.clase, 1);
  assert.equal(data.tema, 'Del clic a la respuesta');
  assert.equal(data.estado, 'activo');
});

test('GET a una ruta inexistente responde 404', async () => {
  const response = await fetch(`${BASE_URL}/ruta-inexistente`);
  const body = await response.text();

  assert.equal(response.status, 404);
  assert.equal(body, 'Ruta no encontrada');
});