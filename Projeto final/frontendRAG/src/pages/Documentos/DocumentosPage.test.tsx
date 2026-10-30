import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentosPage } from './DocumentosPage';
import { json, stubFetch } from '../../test/http';

const EMAIL = {
  id: 'emails_sinteticos:1', titulo: '[Sintético] Entrega de papel A4',
  tipo: 'Conversa sintética', orgao: 'DPRJ', ano: 2024, fonte: 'Conversações sintéticas',
  descricao: 'Conversa fictícia para testes; não comprova fatos reais do PNCP.', link: null,
  base_id: 'emails_sinteticos', natureza: 'conversacional', formato: 'json',
};

describe('DocumentosPage: suplemento sintético', () => {
  it('consulta a conversa com uma pergunta roteável e identifica o conteúdo fictício', async () => {
    stubFetch(() => json(200, [EMAIL]));
    const onSearchQuery = vi.fn();
    render(<DocumentosPage onSearchQuery={onSearchQuery} />);
    expect(await screen.findByText(EMAIL.titulo)).toBeInTheDocument();
    expect(screen.getByText(EMAIL.descricao)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Abrir na fonte' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Consultar no NEXO/ }));
    expect(onSearchQuery).toHaveBeenCalledWith('O que diz a conversa sintética "[Sintético] Entrega de papel A4" de DPRJ?');
  });

  it('envia o tipo sintético ao endpoint real do catálogo', async () => {
    const { calls } = stubFetch(() => json(200, [EMAIL]));
    render(<DocumentosPage onSearchQuery={vi.fn()} />);
    await screen.findByText(EMAIL.titulo);
    await userEvent.selectOptions(screen.getByLabelText('Filtrar por tipo de documento'), 'Conversa sintética');
    await waitFor(() => expect(calls.some(call => call.url.pathname === '/api/v1/explore/documentos'
      && call.url.searchParams.get('tipo') === 'Conversa sintética')).toBe(true));
  });
});
