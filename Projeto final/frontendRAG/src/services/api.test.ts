import { describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest } from './api';
import { failureOf, json, stubFetch, stubNetworkDown } from '../test/http';

describe('apiRequest', () => {
  it('monta a URL com a base configurada e omite parâmetros vazios', async () => {
    const { calls } = stubFetch(() => json(200, []));
    await apiRequest('/api/v1/explore/orgaos', { params: { busca: '', limit: 24, offset: 0, x: null } });

    expect(calls[0].url.origin).toBe('http://api.test');
    expect(calls[0].url.pathname).toBe('/api/v1/explore/orgaos');
    expect(Object.fromEntries(calls[0].url.searchParams)).toEqual({ limit: '24', offset: '0' });
  });

  it('envia o corpo como JSON em POST', async () => {
    const { calls, fetchStub } = stubFetch(() => json(200, { ok: true }));
    await apiRequest('/api/v1/query', { method: 'POST', body: { query: 'a' } });

    expect(calls[0].method).toBe('POST');
    expect(calls[0].body).toEqual({ query: 'a' });
    const init = fetchStub.mock.calls[0][1] as RequestInit;
    expect(init.headers).toEqual({
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': '1',
    });
  });

  it('envia o header do ngrok também em requisições GET', async () => {
    const { calls } = stubFetch(() => json(200, { status: 'ok' }));
    await apiRequest('/health');
    expect(calls[0].headers.get('ngrok-skip-browser-warning')).toBe('1');
  });

  it('transforma falha de rede em erro de conexão (sem dado substituto)', async () => {
    stubNetworkDown();
    const error = await failureOf(apiRequest('/health'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.kind).toBe('network');
    expect(error.message).toMatch(/conectar ao backend/);
  });

  it('preserva o status e usa as mensagens de validação do FastAPI no 422', async () => {
    stubFetch(() => json(422, { detail: [{ msg: 'campo obrigatório' }, { msg: 'tamanho inválido' }] }));
    const error = await failureOf(apiRequest('/api/v1/query'));

    expect(error.status).toBe(422);
    expect(error.kind).toBe('http');
    expect(error.message).toBe('campo obrigatório tamanho inválido');
  });

  it('preserva detail e Retry-After no limite 429', async () => {
    stubFetch(() => new Response(
      JSON.stringify({ detail: 'Muitas requisições em pouco tempo. Tente de novo em 17 s.' }),
      { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '17' } }
    ));
    const error = await failureOf(apiRequest('/api/v1/query'));

    expect(error.status).toBe(429);
    expect(error.message).toBe('Muitas requisições em pouco tempo. Tente de novo em 17 s.');
    expect(error.retryAfterSeconds).toBe(17);
  });

  it.each([
    [404, /não encontrado/],
    [500, /não conseguiu concluir/],
    [503, /temporariamente indisponível/],
  ])('usa a mensagem padrão do status %i quando não há detail', async (status, message) => {
    stubFetch(() => json(status, {}));
    const error = await failureOf(apiRequest('/x'));

    expect(error.status).toBe(status);
    expect(error.message).toMatch(message);
  });

  it('interrompe a requisição no timeout', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      (_: unknown, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
        })
    );
    const pending = failureOf(apiRequest('/api/v1/query', { timeoutMs: 1000 }));
    await vi.advanceTimersByTimeAsync(1000);
    const error = await pending;

    expect(error.kind).toBe('timeout');
  });

  it('avisa quando VITE_API_BASE_URL não foi configurada', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '');
    vi.resetModules();
    const { apiRequest: requestWithoutUrl } = await import('./api');
    const fetchStub = vi.fn();
    vi.stubGlobal('fetch', fetchStub);

    const error = await failureOf(requestWithoutUrl('/health'));

    expect(error.kind).toBe('config');
    expect(fetchStub).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
