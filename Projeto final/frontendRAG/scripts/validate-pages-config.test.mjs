import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateBackendUrl, verifyPagesBuild } from './validate-pages-config.mjs';

const BACKEND = 'https://backend.example.com';

for (const value of [undefined, '', '   ']) {
  test(`rejeita URL ausente: ${JSON.stringify(value)}`, () => {
    assert.throws(() => validateBackendUrl(value), /Actions > Variables \(não em Secrets\)/);
  });
}

for (const value of [
  'backend.example.com', 'http://backend.example.com', 'javascript:alert(1)',
  'https://localhost:8080', 'https://api.localhost', 'https://127.0.0.1',
  'https://[::1]', 'https://0.0.0.0', 'https://localhost.',
  ' https://backend.example.com', 'https://backend.example.com ',
  'https://user:password@backend.example.com',
  'https://backend.example.com?token=secret', 'https://backend.example.com#fragment',
]) {
  test(`rejeita URL imprópria para Pages: ${value}`, () => {
    assert.throws(() => validateBackendUrl(value));
  });
}

test('aceita HTTPS com subcaminho e normaliza barras finais', () => {
  assert.equal(validateBackendUrl(`${BACKEND}/api///`), `${BACKEND}/api`);
});

test('a CLI falha antes do build quando a variável está vazia', () => {
  const script = fileURLToPath(new URL('./validate-pages-config.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [script], {
    encoding: 'utf8', env: { ...process.env, VITE_API_BASE_URL: '' },
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /VITE_API_BASE_URL está vazia/);
});

function fixture(t, html, javascript) {
  const dir = mkdtempSync(join(tmpdir(), 'nexo-pages-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, 'assets'));
  writeFileSync(join(dir, 'index.html'), html);
  writeFileSync(join(dir, 'assets', 'index-example.js'), javascript);
  return dir;
}

const HTML = '<script type="module" src="./assets/index-example.js"></script>';

test('aceita bundle de produção com o backend configurado', (t) => {
  const dir = fixture(t, HTML, `const base=${JSON.stringify(BACKEND)};`);
  assert.equal(verifyPagesBuild(dir, BACKEND), BACKEND);
});

test('rejeita o caso de regressão: bundle com URL vazia', (t) => {
  const dir = fixture(t, HTML, 'const qh="".replace(/\\/+$/, "");');
  assert.throws(() => verifyPagesBuild(dir, BACKEND), /não foi encontrada/);
});

test('rejeita bundle com outro backend', (t) => {
  const dir = fixture(t, HTML, 'const base="https://old.example.com";');
  assert.throws(() => verifyPagesBuild(dir, BACKEND), /não foi encontrada/);
});

test('rejeita index legado mesmo com bundle configurado', (t) => {
  const dir = fixture(t, `<!-- pages-loader -->${HTML}`, `const base="${BACKEND}";`);
  assert.throws(() => verifyPagesBuild(dir, BACKEND), /desenvolvimento\/legado/);
});

test('rejeita index de desenvolvimento', (t) => {
  const dir = fixture(t, '<script type="module" src="/src/main.tsx"></script>', `const base="${BACKEND}";`);
  assert.throws(() => verifyPagesBuild(dir, BACKEND), /desenvolvimento\/legado/);
});
