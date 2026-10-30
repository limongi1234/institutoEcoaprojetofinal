import { pathToFileURL } from 'node:url';
import { loadEnv } from 'vite';

export const SAMPLE_QUERY = 'O que estabelece a Lei 14.133/2021?';

export function backendUrl(envDir = process.cwd()) {
  return loadEnv('development', envDir, 'VITE_').VITE_API_BASE_URL ?? '';
}

export async function checkBackend({ baseUrl, query, fetchImpl = fetch, log = console.log }) {
  let base;
  try {
    base = new URL(baseUrl);
    if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) throw new Error();
  } catch {
    log('ERRO: configure VITE_API_BASE_URL com a URL HTTP(S) do backend.');
    return false;
  }
  const root = base.href.replace(/\/+$/, '');
  const request = async (endpoint, body) => {
    const response = await fetchImpl(`${root}${endpoint}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        'ngrok-skip-browser-warning': '1',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(body === undefined ? 20_000 : 240_000),
    });
    if (!response.ok) throw new Error(`${endpoint}: HTTP ${response.status}`);
    return response.json();
  };
  try {
    log(`Backend: ${root}`);
    const health = await request('/health');
    if (health?.status !== 'ok') throw new Error('/health não retornou status ok.');
    log('OK: API online.');
    if (query !== undefined) {
      const result = await request('/api/v1/query', { query, top_k: 5 });
      if (!result?.query_id || typeof result.answer !== 'string' || !result.answer.trim()) throw new Error('Resposta fora do contrato esperado.');
      log(`OK: consulta respondida; query_id=${result.query_id}.`);
    }
    return true;
  } catch (error) {
    log(`ERRO: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const query = process.argv[2] === '--query' ? (process.argv[3] ?? SAMPLE_QUERY) : undefined;
  process.exitCode = (await checkBackend({ baseUrl: backendUrl(), query })) ? 0 : 1;
}
