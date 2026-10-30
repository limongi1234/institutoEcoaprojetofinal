import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConversationTurnView } from './ConversationTurnView';

describe('ConversationTurnView', () => {
  it('identifica conversa sem consulta ao acervo e abre o caminho', async () => {
    const onViewTrace = vi.fn();
    render(<ConversationTurnView turn={{ response: {
      query_id: 'q_1', session_id: 's_1234567890123456', query: 'Oi', answer: 'Olá!',
      bases_consultadas: [], sources_used: [], confidence_level: 'baixa', is_refusal: false,
      refusal_reason: null,
    } }} onRated={vi.fn()} onViewTrace={onViewTrace} />);

    expect(screen.getByText('Conversa — sem consulta ao acervo')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Ver caminho' }));
    expect(onViewTrace).toHaveBeenCalledWith('q_1');
  });
});
