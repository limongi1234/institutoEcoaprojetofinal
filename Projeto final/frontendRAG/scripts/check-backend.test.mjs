import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { backendUrl, checkBackend, SAMPLE_QUERY } from './check-backend.mjs';

function fixture(overrides = {}) {
  const calls = [];
  const logs = [];
  const responses = {
    '/health': { status: 'ok' },
    '/api/v1/project/summary': { versao_corpus: 'v6', total_documentos: 1425, bases: [{}] },
    '/api/v1/explore/contratacoes?limit=1': [{ id: 'contrato-1' }],
    '/api/v1/query': { query_id: 'q_real', answer: 'Resposta fundamentada', is_refusal: false, sources_used: [{}] },
    ...overrides,
  };
  const options = {
    baseUrl: 'http://localhost:8080/',
    log: (message) => logs.push(message),
    fetchImpl: async (url, init) => {
      calls.push({ url, ...init });
      const key = url.replace('http://localhost:8080', '');
      const body = responses[key];
      if (body instanceof Error) throw body;
      if (body instanceof Response) return body;
      return new Response(JSON.stringify(body));
    },
  };
  return { options, calls, logs };
}

test('diagnóstico verifica API, corpus e SQLite sem chamar o LLM', async () => {
  const { options, calls } = fixture();
  assert.equal(await checkBackend(options), true);
  assert.equal(calls.length, 3);
  assert.ok(calls.every((call) => call.method === 'GET'));
});

test('pergunta real mantém o contrato e só passa com resposta e fontes', async () => {
  const { options, calls, logs } = fixture();
  assert.equal(await checkBackend({ ...options, query: SAMPLE_QUERY }), true);
  const query = calls.at(-1);
  assert.equal(query.method, 'POST');
  assert.equal(query.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(query.body), { query: SAMPLE_QUERY, top_k: 5 });
  assert.ok(logs.some((line) => line.includes('q_real')));
});

test('URL inválida ou com credenciais falha antes de acessar a rede', async () => {
  for (const baseUrl of ['', 'localhost:8080', 'file:///tmp/backend', 'https://user:secret@api.test', 'http://api.test?q=1', 'http://api.test/#hash']) {
    const { options, calls } = fixture();
    assert.equal(await checkBackend({ ...options, baseUrl }), false);
    assert.equal(calls.length, 0);
  }
});

test('backend offline ou HTTP 500 não vira sucesso', async () => {
  for (const value of [new Error('fetch failed'), new Response('{}', { status: 500 })]) {
    const { options, calls } = fixture({ '/health': value });
    assert.equal(await checkBackend({ ...options, query: SAMPLE_QUERY }), false);
    assert.equal(calls.length, 1);
  }
});

test('timeout retorna falha e orientação', async () => {
  const { options, logs } = fixture({ '/health': new DOMException('Prazo esgotado', 'TimeoutError') });
  assert.equal(await checkBackend(options), false);
  assert.ok(logs.some((line) => line.startsWith('ERRO:')));
});

test('API online não basta quando corpus ou banco estão vazios', async () => {
  for (const overrides of [
    { '/health': { status: 'degraded' } },
    { '/api/v1/project/summary': { total_documentos: 0, bases: [] } },
    { '/api/v1/explore/contratacoes?limit=1': [] },
  ]) {
    const { options, calls } = fixture(overrides);
    assert.equal(await checkBackend({ ...options, query: SAMPLE_QUERY }), false);
    assert.ok(calls.every((call) => call.method === 'GET'));
  }
});

test('resposta vazia, inválida, recusada ou sem fontes reprova a pergunta', async () => {
  for (const response of [
    null,
    { answer: 'Sem id', sources_used: [{}] },
    { query_id: 'q_1', answer: '', sources_used: [{}], is_refusal: false },
    { query_id: 'q_1', answer: 'Recusa', sources_used: [], is_refusal: true },
    { query_id: 'q_1', answer: 'Sem fontes', sources_used: [], is_refusal: false },
  ]) {
    const { options } = fixture({ '/api/v1/query': response });
    assert.equal(await checkBackend({ ...options, query: SAMPLE_QUERY }), false);
  }
});

test('diagnóstico carrega .env.development.local como o Vite e permite override de ambiente', () => {
  const dir = mkdtempSync(join(tmpdir(), 'nexo-config-'));
  const previous = process.env.VITE_API_BASE_URL;
  try {
    delete process.env.VITE_API_BASE_URL;
    writeFileSync(join(dir, '.env.development'), 'VITE_API_BASE_URL=http://localhost:8080\n');
    writeFileSync(join(dir, '.env.development.local'), 'VITE_API_BASE_URL=http://localhost:8081\n');
    assert.equal(backendUrl(dir), 'http://localhost:8081');
    process.env.VITE_API_BASE_URL = 'http://localhost:9090';
    assert.equal(backendUrl(dir), 'http://localhost:9090');
  } finally {
    if (previous === undefined) delete process.env.VITE_API_BASE_URL;
    else process.env.VITE_API_BASE_URL = previous;
    rmSync(dir, { recursive: true, force: true });
  }
});
