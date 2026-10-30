import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { json, stubFetch } from '../../test/http';
import { TracePanel } from './TracePanel';

const TRACE = {
  query_id: 'q_1', session_id: 's_1234567890123456', run_ids: ['run_1'],
  pergunta: 'Quais contratos?', inicio: '2026-10-08T10:00:00-03:00', fim: '2026-10-08T10:00:02-03:00',
  latencia_total_ms: 2000,
  integridade: { status: 'parcial', algoritmo: 'HMAC-SHA256', registros_verificados: 23058, registros_legados: 14682, problemas: 0, verificado_em: '2026-10-30T19:45:12Z', motivo: null },
  resumo: { consultou_sql: true, consultou_vetorial: true, evidencias_sql: 2, evidencias_vetorial: { contratos: 5 }, fontes_citadas: ['a'], confidence_level: 'alta', is_refusal: false },
  etapas: [{ ordem: 1, stage: 'consulta_sql', base: 'sql', status: 'ok', ts: '2026-10-08T10:00:00-03:00', latencia_ms: 120, input: 'pergunta', output: '2 linhas', tokens: null, modelo: null, hash: '6fb0da913e42abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd', hash_anterior: '8bd326c502cbabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd', detalhes: { sql: 'SELECT * FROM contratacoes', linhas: [{ id: 1 }] } }],
};

const SESSION_TRACE = {
  session_id: 's_1234567890123456', inicio: TRACE.inicio, fim: TRACE.fim,
  total_perguntas: 1, consultou_sql: 1, consultou_vetorial: 1,
  perguntas: [{ ordem: 1, query_id: 'q_1', pergunta: 'Quais contratos?', inicio: TRACE.inicio, fim: TRACE.fim, latencia_total_ms: 2000, resumo: TRACE.resumo, etapas: ['consulta_sql'] }],
};

describe('TracePanel', () => {
  it('leva o foco ao diálogo e fecha com Escape', async () => {
    stubFetch(() => json(200, TRACE));
    const onClose = vi.fn();
    render(<TracePanel sessionId="s_1234567890123456" queryId="q_1" onClose={onClose} />);

    expect(screen.getByRole('button', { name: 'Fechar caminho' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('preserva o fluxo de foco entre conversa, pergunta e retorno', async () => {
    stubFetch((request) => json(200, request.url.pathname.includes('/sessions/') ? SESSION_TRACE : TRACE));
    render(<TracePanel sessionId="s_1234567890123456" onClose={vi.fn()} />);

    const question = await screen.findByRole('button', { name: /Quais contratos/ });
    await userEvent.click(question);
    const back = screen.getByRole('button', { name: '← Conversa' });
    expect(back).toHaveFocus();

    await userEvent.click(back);
    expect(screen.getByRole('heading', { name: 'Caminho da conversa' })).toHaveFocus();
    expect(await screen.findByRole('button', { name: /Quais contratos/ })).toBeInTheDocument();
  });

  it('mostra o resumo e os detalhes do caminho da pergunta', async () => {
    const { calls } = stubFetch(() => json(200, TRACE));
    render(<TracePanel sessionId="s_1234567890123456" queryId="q_1" onClose={vi.fn()} />);

    expect(await screen.findByText('Quais contratos?')).toBeInTheDocument();
    expect(screen.getByText('Evidências SQL')).toBeInTheDocument();
    expect(screen.getByText('Consulta à base estruturada')).toBeInTheDocument();
    expect(screen.getByText('Cadeia sem quebras')).toHaveClass('trace-integrity-badge-neutral');
    expect(screen.getByText('23.058')).toBeInTheDocument();
    expect(screen.getByText('14.682')).toBeInTheDocument();
    expect(screen.getByText(TRACE.etapas[0].hash)).toBeInTheDocument();
    expect(screen.getByText(TRACE.etapas[0].hash_anterior)).toBeInTheDocument();
    await userEvent.click(screen.getByText('Ver detalhes'));
    expect(screen.getByText('SELECT * FROM contratacoes')).toBeInTheDocument();
    expect(calls[0].headers.get('X-Session-Id')).toBe('s_1234567890123456');
  });

  it('mostra quebra de integridade e trata etapa legada sem hash', async () => {
    stubFetch(() => json(200, {
      ...TRACE,
      integridade: { ...TRACE.integridade, status: 'invalida', problemas: 2 },
      etapas: [{ ...TRACE.etapas[0], hash: null, hash_anterior: null }],
    }));
    render(<TracePanel sessionId="s_1234567890123456" queryId="q_1" onClose={vi.fn()} />);

    expect(await screen.findByText('Cadeia quebrada')).toHaveClass('trace-integrity-badge-danger');
    expect(screen.getByText('Registro anterior à cadeia de hashes')).toBeInTheDocument();
    expect(screen.getByText('Quebras').previousElementSibling).toHaveTextContent('2');
  });

  it('explica quando a integridade ainda não foi verificada', async () => {
    stubFetch(() => json(200, {
      ...TRACE,
      integridade: { status: 'nao_verificada', algoritmo: 'HMAC-SHA256', registros_verificados: null, registros_legados: null, problemas: null, verificado_em: null, motivo: 'verificacao_em_andamento' },
    }));
    render(<TracePanel sessionId="s_1234567890123456" queryId="q_1" onClose={vi.fn()} />);

    expect(await screen.findByText('Aguardando conferência')).toBeInTheDocument();
    expect(screen.getByText('A verificação está em andamento.')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(3);
  });

  it('oferece nova tentativa quando a rede falha', async () => {
    let attempt = 0;
    stubFetch(() => ++attempt === 1 ? Promise.reject(new TypeError('offline')) : json(200, TRACE));
    render(<TracePanel sessionId="s_1234567890123456" queryId="q_1" onClose={vi.fn()} />);
    expect(await screen.findByText(/conectar ao backend/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByText('Quais contratos?')).toBeInTheDocument();
  });

  it('aceita trace legado com num_fontes e sinaliza trace incompleto', async () => {
    stubFetch(() => json(200, { ...TRACE, completo: false, latencia_metodo: 'soma_etapas_legado', resumo: { ...TRACE.resumo, fontes_citadas: undefined, num_fontes: 3 } }));
    render(<TracePanel sessionId="s_1234567890123456" queryId="q_1" onClose={vi.fn()} />);
    expect(await screen.findByText(/trace incompleto/)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('tempo estimado')).toBeInTheDocument();
  });

  it('mostra selo de segunda tentativa', async () => {
    stubFetch(() => json(200, { ...TRACE, etapas: [{ ...TRACE.etapas[0], stage: 'retrieval_bm25', detalhes: { tentativa_busca: 2 } }] }));
    render(<TracePanel sessionId="s_1234567890123456" queryId="q_1" onClose={vi.fn()} />);
    expect(await screen.findByText('2ª tentativa · sem filtros')).toBeInTheDocument();
  });

  it('normaliza outcome e mostra plano B de etapa degradada', async () => {
    stubFetch(() => json(200, { ...TRACE, etapas: [{ ...TRACE.etapas[0], status: 'ok', detalhes: { outcome: 'degradado', fallback: 'busca sem filtros' } }] }));
    render(<TracePanel sessionId="s_1234567890123456" queryId="q_1" onClose={vi.fn()} />);
    expect(await screen.findByText('com reserva')).toHaveClass('trace-status-warning');
    await userEvent.click(screen.getByText('Ver detalhes'));
    expect(screen.getByText(/Plano B/).parentElement).toHaveTextContent('busca sem filtros');
  });

  it('mostra status pulado e seu motivo', async () => {
    stubFetch(() => json(200, { ...TRACE, etapas: [{ ...TRACE.etapas[0], status: 'pulado', detalhes: { motivo: 'calculo_sql_suficiente' } }] }));
    render(<TracePanel sessionId="s_1234567890123456" queryId="q_1" onClose={vi.fn()} />);
    expect(await screen.findByText('não executada')).toHaveClass('trace-status-neutral');
    await userEvent.click(screen.getByText('Ver detalhes'));
    expect(screen.getByText(/cálculo SQL respondeu sozinho/)).toBeInTheDocument();
  });

  it('usa nomes amigáveis nas etapas de envelope', async () => {
    const names = ['requisicao_inicio', 'pipeline_inicio', 'pipeline_fim', 'persistencia_historico', 'requisicao_fim'];
    stubFetch(() => json(200, { ...TRACE, etapas: names.map((stage, ordem) => ({ ...TRACE.etapas[0], ordem, stage, detalhes: {} })) }));
    render(<TracePanel sessionId="s_1234567890123456" queryId="q_1" onClose={vi.fn()} />);
    expect(await screen.findByText('Pergunta recebida')).toBeInTheDocument();
    expect(screen.getByText('Início do processamento')).toBeInTheDocument();
    expect(screen.getByText('Fim do processamento')).toBeInTheDocument();
    expect(screen.getByText('Gravação no histórico')).toBeInTheDocument();
    expect(screen.getByText('Resposta enviada')).toBeInTheDocument();
  });

  it('aplica a semântica visual explícita dos status', async () => {
    const statuses = ['iniciado', 'iniciado', 'ok', 'pulado', 'conversa', 'aviso', 'degradado', 'recusa', 'erro', 'rejeitado', 'desconhecido'];
    stubFetch(() => json(200, {
      ...TRACE,
      etapas: statuses.map((status, ordem) => ({
        ...TRACE.etapas[0], ordem, stage: ordem === 0 ? 'requisicao_inicio' : ordem === 1 ? 'pipeline_inicio' : `etapa_${ordem}`, status, detalhes: {},
      })),
    }));
    render(<TracePanel sessionId="s_1234567890123456" queryId="q_1" onClose={vi.fn()} />);

    expect(await screen.findAllByText('registrado')).toHaveLength(2);
    screen.getAllByText('registrado').forEach((status) => expect(status).toHaveClass('trace-status-neutral'));
    expect(screen.getByText('concluído')).toHaveClass('trace-status-success');
    expect(screen.getByText('não executada')).toHaveClass('trace-status-neutral');
    expect(screen.getByText('conversa')).toHaveClass('trace-status-neutral');
    expect(screen.getByText('aviso')).toHaveClass('trace-status-warning');
    expect(screen.getByText('com reserva')).toHaveClass('trace-status-warning');
    expect(screen.getByText('recusada')).toHaveClass('trace-status-neutral');
    expect(screen.getByText('erro')).toHaveClass('trace-status-danger');
    expect(screen.getByText('rejeitado')).toHaveClass('trace-status-warning');
    expect(screen.getByText('desconhecido')).toHaveClass('trace-status-neutral');
  });
});
