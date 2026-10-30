// Cliente HTTP único do frontend: toda chamada ao backend passa por aqui.

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');

// Consultas RAG podem levar bem mais que as de catálogo: o backend espera até 180 s pelo LLM
// (GENERATION_TIMEOUT), mais o tempo de busca. Cada service escolhe seu limite.
export const TIMEOUT_DEFAULT_MS = 20_000;
// Explorar acervo pode pagar a primeira carga do snapshot do JSONL (~7 s);
// 30 s cobre esse piso frio sem esconder falhas verdadeiras do servidor.
export const TIMEOUT_CATALOG_MS = 30_000;
export const TIMEOUT_QUERY_MS = 240_000;

export type ApiErrorKind = 'config' | 'network' | 'timeout' | 'http';

export class ApiError extends Error {
  constructor(
    message: string,
    public kind: ApiErrorKind,
    public status?: number,
    public data?: unknown,
    public retryAfterSeconds?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type QueryValue = string | number | null | undefined;

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  params?: Record<string, QueryValue>;
  timeoutMs?: number;
  headers?: Record<string, string>;
}

// Mensagens por status seguem a seção 13 do contrato.
const STATUS_MESSAGES: Record<number, string> = {
  429: 'Muitas requisições em pouco tempo. Tente novamente em instantes.',
  404: 'Recurso não encontrado.',
  422: 'Os dados enviados são inválidos.',
  500: 'O servidor não conseguiu concluir a solicitação. Tente novamente.',
  503: 'O acervo está temporariamente indisponível. Tente novamente em instantes.',
};

/** FastAPI devolve `detail` como texto ou como lista de erros de validação. */
function readDetail(body: unknown): string | null {
  if (!body || typeof body !== 'object' || !('detail' in body)) return null;
  const { detail } = body as { detail: unknown };
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (item && typeof item === 'object' && 'msg' in item ? String(item.msg) : null))
      .filter(Boolean);
    return messages.length > 0 ? messages.join(' ') : null;
  }
  return null;
}

function buildUrl(endpoint: string, params?: Record<string, QueryValue>): string {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    // Parâmetro vazio não é enviado, para valer o padrão definido pelo backend.
    if (value !== null && value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError(
      'O endereço do backend não foi configurado (VITE_API_BASE_URL).',
      'config'
    );
  }

  const { method = 'GET', body, params, timeoutMs = TIMEOUT_DEFAULT_MS } = options;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    // Evita a pagina intermediaria do ngrok em todas as rotas (health, catalogos,
    // consulta, historico, feedback e trace). Headers especificos sao preservados.
    const headers: Record<string, string> = {
      'ngrok-skip-browser-warning': '1',
      ...options.headers,
    };
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    response = await fetch(buildUrl(endpoint, params), {
      method,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new ApiError('O servidor demorou demais para responder. Tente novamente.', 'timeout');
    }
    throw new ApiError(
      'Não foi possível conectar ao backend. Verifique se ele está em execução.',
      'network',
      undefined,
      error
    );
  } finally {
    window.clearTimeout(timer);
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      readDetail(payload) ??
      STATUS_MESSAGES[response.status] ??
      `Erro inesperado do servidor (${response.status}).`;
    const retryAfterHeader = response.headers.get('Retry-After');
    const retryAfter = retryAfterHeader === null ? Number.NaN : Number(retryAfterHeader);
    const retryAfterSeconds = response.status === 429 && Number.isFinite(retryAfter) && retryAfter >= 0
      ? Math.ceil(retryAfter)
      : undefined;
    throw new ApiError(message, 'http', response.status, payload, retryAfterSeconds);
  }

  return payload as T;
}
