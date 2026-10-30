import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConsultaPage } from './ConsultaPage';

describe('ConsultaPage: timeout', () => {
  it('mostra mensagem amigável, sem spinner, e permite tentar novamente', async () => {
    const retry = vi.fn();
    render(<ConsultaPage turns={[]} sessionId={null} pendingQuery={null} loading={false}
      estimatedDurationMs={82000} error="erro técnico oculto" errorKind="timeout" errorStatus={null} retryAfterSeconds={0}
      onSubmitQuery={vi.fn()} onRetryQuery={retry} onRated={vi.fn()}
      onNewConversation={vi.fn()} onNavigate={vi.fn()} />);
    expect(screen.getByText('A consulta demorou mais que o esperado.')).toBeInTheDocument();
    expect(screen.queryByText('erro técnico oculto')).not.toBeInTheDocument();
    expect(screen.queryByText(/Analisando sua pergunta/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
