import { describe, expect, it } from 'vitest';
import { queryRag } from './query.service';
import { sendFeedback } from './feedback.service';
import { getSessionHistory } from './history.service';
import { getQuestionTrace, getSessionTrace } from './trace.service';
import { listContracts } from './contracts.service';
import { listDocuments } from './documents.service';
import { listOrganizations } from './organizations.service';
import { listSources } from './sources.service';
import { checkHealth } from './health.service';
import { failureOf, json, stubFetch, stubNetworkDown } from '../test/http';

const RESPONSE = {
  query_id: 'q_a1b2c3d4',
  session_id: 's_1234567890123456',
  query: 'Quais contratos?',
  answer: 'Resposta.',
  bases_consultadas: ['estruturada'],
  sources_used: [],
  confidence_level: 'alta',
  is_refusal: false,
  refusal_reason: null,
};

describe('query.service', () => {
  it('na primeira pergunta envia query e top_k sem session_id', async () => {
    const { calls } = stubFetch(() => json(200, RESPONSE));
    const result = await queryRag('  Quais contratos?  ');

    expect(calls[0].url.pathname).toBe('/api/v1/query');
    expect(calls[0].body).toEqual({ query: 'Quais contratos?', top_k: 5 });
    expect(result.query_id).toBe('q_a1b2c3d4');
  });

  it('reenvia session_id e as trocas anteriores nas perguntas seguintes', async () => {
    const { calls } = stubFetch(() => json(200, RESPONSE));
    await queryRag('E em 2024?', {
      sessionId: 's_1234567890123456',
      history: [{ pergunta: 'E em 2025?', resposta: 'Há três contratos.' }],
    });
    expect(calls[0].body).toEqual({
      query: 'E em 2024?', top_k: 5, session_id: 's_1234567890123456',
      historico: [{ pergunta: 'E em 2025?', resposta: 'Há três contratos.' }],
    });
  });
});

describe('feedback.service', () => {
  it('envia o query_id recebido sem alteração', async () => {
    const { calls } = stubFetch(() => json(200, { status: 'recebido' }));
    await sendFeedback({ query_id: 'q_a1b2c3d4', avaliacao: 'negativo', comentario: 'faltou fonte' });

    expect(calls[0].url.pathname).toBe('/api/v1/feedback');
    expect(calls[0].body).toEqual({
      query_id: 'q_a1b2c3d4',
      avaliacao: 'negativo',
      comentario: 'faltou fonte',
    });
  });

  it('propaga o 404 como consulta não encontrada (nunca simula sucesso)', async () => {
    stubFetch(() => json(404, { detail: 'query_id desconhecido.' }));
    const error = await failureOf(sendFeedback({ query_id: 'q_x', avaliacao: 'positivo' }));

    expect(error.status).toBe(404);
    expect(error.message).toBe('Esta consulta não foi encontrada no servidor.');
  });

  it('propaga falha de rede', async () => {
    stubNetworkDown();
    await expect(sendFeedback({ query_id: 'q_x', avaliacao: 'positivo' })).rejects.toThrow(/conectar/);
  });
});

describe('history.service', () => {
  it('consulta somente a sessão informada por X-Session-Id', async () => {
    const { calls } = stubFetch(() => json(200, []));
    await getSessionHistory('s_1234567890123456');
    expect(calls[0].url.pathname).toBe('/api/v1/history');
    expect(calls[0].headers.get('X-Session-Id')).toBe('s_1234567890123456');
    expect(calls[0].headers.get('X-API-Key')).toBeNull();
  });
});

describe('trace services', () => {
  it('usa X-Session-Id no caminho da pergunta e nunca X-API-Key', async () => {
    const { calls } = stubFetch(() => json(200, {}));
    await getQuestionTrace('q_1', 's_1234567890123456');
    expect(calls[0].url.pathname).toBe('/api/v1/trace/q_1');
    expect(calls[0].headers.get('X-Session-Id')).toBe('s_1234567890123456');
    expect(calls[0].headers.has('X-API-Key')).toBe(false);
  });

  it('usa a sessão na rota do caminho da conversa', async () => {
    const { calls } = stubFetch(() => json(200, {}));
    await getSessionTrace('s_1234567890123456');
    expect(calls[0].url.pathname).toBe('/api/v1/sessions/s_1234567890123456/trace');
    expect(calls[0].headers.get('X-Session-Id')).toBe('s_1234567890123456');
  });

  it('traduz 401 sem tratar como login', async () => {
    stubFetch(() => json(401, {}));
    await expect(getQuestionTrace('q_1', 's_outra_conversa_123')).rejects.toThrow('outra conversa');
  });

  it('explica o 404 de traces antigos', async () => {
    stubFetch(() => json(404, {}));
    await expect(getQuestionTrace('q_antiga', 's_1234567890123456')).rejects.toThrow('anterior');
  });
});

describe('explore services', () => {
  it('contratações: envia busca, órgão e paginação', async () => {
    const { calls } = stubFetch(() => json(200, []));
    await listContracts({ busca: 'software', orgao: 'Caxias' }, { limit: 24, offset: 48 });

    expect(calls[0].url.pathname).toBe('/api/v1/explore/contratacoes');
    expect(Object.fromEntries(calls[0].url.searchParams)).toEqual({
      busca: 'software',
      orgao: 'Caxias',
      limit: '24',
      offset: '48',
    });
  });

  it('documentos: não envia tipo vazio', async () => {
    const { calls } = stubFetch(() => json(200, []));
    await listDocuments({ busca: '', tipo: '' }, { limit: 24, offset: 0 });

    expect(calls[0].url.searchParams.has('tipo')).toBe(false);
    expect(calls[0].url.searchParams.has('busca')).toBe(false);
  });

  it('órgãos: envia busca e paginação', async () => {
    const { calls } = stubFetch(() => json(200, []));
    await listOrganizations({ busca: 'Defensoria' }, { limit: 24, offset: 0 });
    expect(calls[0].url.pathname).toBe('/api/v1/explore/orgaos');
    expect(Object.fromEntries(calls[0].url.searchParams)).toEqual({
      busca: 'Defensoria', limit: '24', offset: '0',
    });
  });

  it('fontes oficiais: usa o endpoint público do manifesto', async () => {
    const { calls } = stubFetch(() => json(200, []));
    await listSources();
    expect(calls[0].url.pathname).toBe('/api/v1/explore/fontes');
  });
});

describe('health.service', () => {
  it('online quando o backend responde {"status":"ok"}', async () => {
    stubFetch(() => json(200, { status: 'ok' }));
    expect(await checkHealth()).toBe(true);
  });

  it('offline quando não há conexão', async () => {
    stubNetworkDown();
    expect(await checkHealth()).toBe(false);
  });
});
