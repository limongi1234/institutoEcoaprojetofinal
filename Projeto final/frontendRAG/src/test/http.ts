// Substituto de `fetch` só para testes: registra as chamadas e devolve respostas definidas no teste.
import { vi } from 'vitest';
import type { ApiError } from '../services/api';

export interface RecordedCall {
  url: URL;
  method: string;
  body: unknown;
  headers: Headers;
}

type Handler = (call: RecordedCall) => Response | Promise<Response>;

export function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Instala um `fetch` falso; `handler` decide a resposta de cada chamada. */
export function stubFetch(handler: Handler) {
  const calls: RecordedCall[] = [];
  const fetchStub = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const call: RecordedCall = {
      url: new URL(String(input)),
      method: init?.method ?? 'GET',
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
      headers: new Headers(init?.headers),
    };
    calls.push(call);
    return handler(call);
  });
  vi.stubGlobal('fetch', fetchStub);
  return { calls, fetchStub };
}

/** Simula backend desligado: o navegador rejeita a requisição antes de qualquer resposta. */
export function stubNetworkDown() {
  return stubFetch(() => Promise.reject(new TypeError('Failed to fetch')));
}

/** Aguarda uma promessa que deve falhar e devolve o erro tipado; falha o teste se ela resolver. */
export async function failureOf(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    return error as ApiError;
  }
  throw new Error('Esperava uma falha, mas a requisição foi concluída.');
}
