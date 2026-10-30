import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContratacoesPage } from './Contratacoes/ContratacoesPage';
import { App } from '../app/App';
import { json, stubFetch, stubNetworkDown } from '../test/http';

const CONTRATO = {
  id: '30381552000158-2-000016/2025',
  numero_contrato: '30381552000158-2-000016/2025',
  orgao: 'DUQUE DE CAXIAS CAMARA MUNICIPAL',
  orgao_cnpj: '30381552000158',
  fornecedor: 'MODERNIZACAO PUBLICA E INFORMATICA LTDA',
  objeto: 'Licenciamento de programas de informática.',
  valor_global: 38551.16,
  data_homologacao: null,
  modalidade: null,
  fonte_oficial: 'PNCP',
  status: null,
  esfera: 'municipal',
  municipio: 'Duque de Caxias',
};

describe('ContratacoesPage', () => {
  it('mostra os dados da API e campos nulos como "Não informado"', async () => {
    stubFetch(() => json(200, [CONTRATO]));
    render(<ContratacoesPage onSearchQuery={vi.fn()} />);

    const card = (await screen.findByText(CONTRATO.numero_contrato)).closest('article')!;
    expect(within(card).getByText('R$ 38.551,16')).toBeInTheDocument();
    // modalidade, status e data_homologacao são null no registro.
    expect(within(card).getAllByText('Não informado')).toHaveLength(3);
  });

  it('consulta o NEXO pelo número de controle PNCP real', async () => {
    const onSearchQuery = vi.fn();
    stubFetch(() => json(200, [{ ...CONTRATO, numero_contrato: 'Contrato 16/2025' }]));
    render(<ContratacoesPage onSearchQuery={onSearchQuery} />);
    await userEvent.click(await screen.findByRole('button', { name: /Consultar no NEXO/ }));
    expect(onSearchQuery).toHaveBeenCalledWith(expect.stringContaining(`PNCP ${CONTRATO.id}`));
    expect(onSearchQuery).not.toHaveBeenCalledWith(expect.stringContaining('Contrato 16/2025'));
  });

  it('erro da API mostra mensagem e "Tentar novamente"', async () => {
    let attempt = 0;
    stubFetch(() => (++attempt === 1 ? json(503, {}) : json(200, [CONTRATO])));
    render(<ContratacoesPage onSearchQuery={vi.fn()} />);

    expect(await screen.findByText(/temporariamente indisponível/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Tentar novamente/ }));
    expect(await screen.findByText(CONTRATO.numero_contrato)).toBeInTheDocument();
  });
});

describe('App com backend desligado', () => {
  it('a consulta mostra erro de conexão e nenhuma resposta', async () => {
    stubNetworkDown();
    render(<App />);

    await userEvent.type(screen.getByLabelText('Pergunta sobre contratações públicas'), 'Quais contratos?{Enter}');

    expect(await screen.findByText(/conectar ao backend/)).toBeInTheDocument();
    expect(screen.queryByText(/Fontes utilizadas/)).not.toBeInTheDocument();
    expect(await screen.findByText('Backend offline')).toBeInTheDocument();
  });
});

describe('Acessibilidade por teclado', () => {
  it('oferece salto para o conteúdo e move o foco ao trocar de tela', async () => {
    stubFetch(() => json(200, { status: 'ok' }));
    render(<App />);

    const skipLink = screen.getByRole('link', { name: 'Pular para o conteúdo principal' });
    const main = screen.getByRole('main');
    expect(skipLink).toHaveAttribute('href', '#conteudo-principal');
    expect(main).toHaveAttribute('id', 'conteudo-principal');

    await userEvent.click(screen.getByRole('button', { name: 'Sobre o projeto' }));
    expect(main).toHaveFocus();
  });
});

describe('Histórico das conversas', () => {
  it('lista todas as sessões conhecidas e restaura a conversa selecionada inteira', async () => {
    const previousSessionId = 's_2234567890123456';
    const currentSessionId = 's_1234567890123456';
    window.sessionStorage.setItem('nexo:conversation-session-id', currentSessionId);
    window.sessionStorage.setItem(
      'nexo:conversation-session-ids',
      JSON.stringify([previousSessionId, currentSessionId])
    );
    const previousConversation = [{
      query_id: 'q_0', run_id: 'r_0', ts: '2026-10-14T12:00:00Z', query: 'Pergunta de outra conversa',
      resposta: { query: 'Pergunta de outra conversa', answer: 'Resposta da conversa anterior', bases_consultadas: [],
        sources_used: [], confidence_level: 'alta', is_refusal: false, refusal_reason: null },
      feedback: [],
    }];
    const currentConversation = [
      {
        query_id: 'q_2', run_id: 'r_2', ts: '2026-10-14T12:02:00Z', query: 'Pergunta recente',
        resposta: { query: 'Pergunta recente', answer: 'Resposta recente', bases_consultadas: [],
          sources_used: [], confidence_level: 'alta', is_refusal: false, refusal_reason: null },
        feedback: [],
      },
      {
        query_id: 'q_1', run_id: 'r_1', ts: '2026-10-14T12:01:00Z', query: 'Pergunta antiga',
        resposta: { query: 'Pergunta antiga', answer: 'Resposta antiga', bases_consultadas: [],
          sources_used: [], confidence_level: 'alta', is_refusal: false, refusal_reason: null },
        feedback: [],
      },
    ];
    stubFetch((request) => {
      if (request.url.pathname === '/api/v1/history') {
        return json(200, request.headers.get('X-Session-Id') === previousSessionId
          ? previousConversation
          : currentConversation);
      }
      return json(200, { status: 'ok' });
    });
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Histórico' }));
    expect(await screen.findByText('Resposta da conversa anterior')).toBeInTheDocument();
    expect(screen.getByText('Resposta antiga')).toBeInTheDocument();
    expect(screen.getByText('Resposta recente')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Abrir conversa: Pergunta recente' }));

    expect(screen.getByRole('article', { name: 'Pergunta: Pergunta antiga' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Pergunta: Pergunta recente' })).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: 'Pergunta: Pergunta de outra conversa' })).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem('nexo:conversation-session-id')).toBe(currentSessionId);
  });
});
