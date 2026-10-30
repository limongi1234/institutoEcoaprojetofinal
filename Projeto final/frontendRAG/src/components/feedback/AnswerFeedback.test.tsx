import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnswerFeedback } from './AnswerFeedback';
import { json, stubFetch } from '../../test/http';

describe('AnswerFeedback', () => {
  it('"Sim" envia positivo e só confirma após o 200', async () => {
    const { calls } = stubFetch(() => json(200, { status: 'recebido' }));
    const onRated = vi.fn();
    render(<AnswerFeedback queryId="q_a1b2c3d4" sessionId="s_1234567890123456" onRated={onRated} />);

    await userEvent.click(screen.getByRole('button', { name: /Sim/ }));

    expect(await screen.findByText(/Feedback registrado/)).toBeInTheDocument();
    expect(calls[0].body).toEqual({ query_id: 'q_a1b2c3d4', avaliacao: 'positivo', comentario: null });
    expect(calls[0].headers.get('X-Session-Id')).toBe('s_1234567890123456');
    expect(onRated).toHaveBeenCalledWith('positivo');
  });

  it('"Não" pede comentário opcional e envia negativo', async () => {
    const { calls } = stubFetch(() => json(200, { status: 'recebido' }));
    render(<AnswerFeedback queryId="q_a1b2c3d4" onRated={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /Não/ }));
    await userEvent.type(screen.getByLabelText(/O que faltou/), 'A fonte não respondia.');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar avaliação' }));

    expect(await screen.findByText(/não útil/)).toBeInTheDocument();
    expect(calls[0].body).toEqual({
      query_id: 'q_a1b2c3d4',
      avaliacao: 'negativo',
      comentario: 'A fonte não respondia.',
    });
  });

  it('em erro mostra a falha real, não confirma e permite tentar novamente', async () => {
    let attempt = 0;
    stubFetch(() => (++attempt === 1 ? json(500, {}) : json(200, { status: 'recebido' })));
    const onRated = vi.fn();
    render(<AnswerFeedback queryId="q_a1b2c3d4" onRated={onRated} />);

    await userEvent.click(screen.getByRole('button', { name: /Sim/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/não conseguiu concluir/);
    expect(screen.queryByText(/Feedback registrado/)).not.toBeInTheDocument();
    expect(onRated).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByText(/Feedback registrado/)).toBeInTheDocument();
    expect(onRated).toHaveBeenCalledWith('positivo');
  });

  it('mostra como registrado o feedback que já veio do histórico', () => {
    const { fetchStub } = stubFetch(() => json(200, {}));
    render(<AnswerFeedback queryId="q_a1b2c3d4" value="negativo" onRated={vi.fn()} />);

    expect(screen.getByText(/não útil/)).toBeInTheDocument();
    expect(fetchStub).not.toHaveBeenCalled();
  });
});
