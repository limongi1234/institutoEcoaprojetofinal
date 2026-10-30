import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../app/App';
import { json, stubFetch } from '../../test/http';

describe('Integração do chat com /api/v1/query', () => {
  it('exibe a resposta e a fonte sintética recebidas da API', async () => {
    const { calls } = stubFetch(call => call.url.pathname === '/health'
      ? json(200, { status: 'ok' })
      : json(200, { query_id: 'q_test', query: 'O que diz o email da DPRJ?',
        answer: 'Segundo o cenário sintético, o órgão é a DPRJ.',
        bases_consultadas: ['conversacional'], confidence_level: 'media',
        is_refusal: false, refusal_reason: null,
        sources_used: [{ chunk_id: 'email:1', base_id: 'emails_sinteticos', source_file: 'email.json' }],
      }));
    render(<App />);
    await userEvent.type(screen.getByLabelText('Pergunta sobre contratações públicas'), 'O que diz o email da DPRJ?{Enter}');
    expect(await screen.findByText('Segundo o cenário sintético, o órgão é a DPRJ.')).toBeInTheDocument();
    expect(screen.getByText('Fontes utilizadas (1)')).toBeInTheDocument();
    expect(screen.getByText('Cenário sintético — não é um fato real')).toBeInTheDocument();
    expect(calls.find(call => call.url.pathname === '/api/v1/query')?.body)
      .toEqual({ query: 'O que diz o email da DPRJ?', top_k: 5 });
  });

  it('saudação é exibida como conversa normal, sem recusa nem evidência inventada', async () => {
    stubFetch(call => call.url.pathname === '/health' ? json(200, { status: 'ok' })
      : json(200, { query_id: 'q_hello', query: 'Olá', answer: 'Olá! Como posso ajudar?',
        bases_consultadas: [], confidence_level: 'baixa', sources_used: [],
        is_refusal: false, refusal_reason: null }));
    render(<App />);
    await userEvent.type(screen.getByLabelText('Pergunta sobre contratações públicas'), 'Olá{Enter}');
    expect(await screen.findByText('Olá! Como posso ajudar?')).toBeInTheDocument();
    expect(screen.getByText('Conversa — sem consulta ao acervo')).toBeInTheDocument();
    expect(screen.queryByText('Não foi possível responder com as fontes disponíveis')).not.toBeInTheDocument();
    expect(screen.queryByText(/Fontes utilizadas/)).not.toBeInTheDocument();
  });

  it('explica como consultar quando uma pergunta recebe sem_evidencia', async () => {
    stubFetch(call => call.url.pathname === '/health' ? json(200, { status: 'ok' })
      : json(200, { query_id: 'q_greeting', query: 'Qual dado inexistente no acervo?', answer: 'Sem evidência no acervo.',
        bases_consultadas: [], confidence_level: 'recusado', sources_used: [],
        is_refusal: true, refusal_reason: 'sem_evidencia' }));
    render(<App />);
    await userEvent.type(screen.getByLabelText('Pergunta sobre contratações públicas'), 'Qual dado inexistente no acervo?{Enter}');
    expect(await screen.findByText(/Faça uma pergunta sobre o acervo/)).toBeInTheDocument();
    expect(screen.getByLabelText('Pergunta de acompanhamento')).toBeInTheDocument();
  });
});
