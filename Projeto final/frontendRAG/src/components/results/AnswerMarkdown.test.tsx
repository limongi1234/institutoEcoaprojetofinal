import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { AnswerMarkdown } from './AnswerMarkdown';
import { ConversationTurnView } from './ConversationTurnView';
import type { ConversationTurn } from '../../types/app';

const markdown = 'Confira o resultado:\n\n'
  + '| Órgão | Valor registrado |\n| --- | ---: |\n'
  + '| BANCO CENTRAL | R$ 672.969.074,40 |\n| OUTRO ÓRGÃO | R$ 0,00 |\n\nFonte: [1]';

describe('Resposta em Markdown', () => {
  it('renderiza tabela GFM sem mostrar os delimitadores como texto', () => {
    render(<AnswerMarkdown answer={markdown} />);
    const table = screen.getByRole('table', { name: 'Resultados calculados' });
    expect(within(table).getAllByRole('row')).toHaveLength(3);
    expect(within(table).getByRole('columnheader', { name: 'Órgão' })).toHaveAttribute('scope', 'col');
    expect(within(table).getByRole('cell', { name: 'R$ 672.969.074,40' })).toHaveClass('is-numeric');
    expect(screen.queryByText('| --- | ---: |')).not.toBeInTheDocument();
    expect(screen.getByText('Fonte: [1]')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Tabela de resultados' })).toHaveAttribute('tabindex', '0');
  });

  it('preserva barras, nomes e HTML escapados como texto de célula', () => {
    render(<AnswerMarkdown answer={'| Objeto |\n| --- |\n| A \\| B &lt;img src=x&gt; \\*literal\\* |'} />);
    expect(screen.getByRole('cell')).toHaveTextContent('A | B <img src=x> *literal*');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('não executa HTML nem carrega imagens e remove protocolos perigosos', () => {
    const { container } = render(<AnswerMarkdown answer={'Texto seguro\n\n<script>alert(1)</script>\n\n<img src="https://evil.test/pixel">\n\n![pixel](https://evil.test/pixel)\n\n[link](javascript:alert%281%29)'} />);
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('link')).toHaveAttribute('href', '');
    expect(screen.getByText('Texto seguro')).toBeInTheDocument();
  });

  it('mantém respostas antigas e ausência de dados legíveis, sem inventar tabela', () => {
    render(<AnswerMarkdown answer={'Não foram encontrados registros.\n\nAusência na amostra não comprova inexistência.'} />);
    expect(screen.getByText('Não foram encontrados registros.')).toBeInTheDocument();
    expect(screen.getByText('Ausência na amostra não comprova inexistência.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('usa a mesma renderização para uma resposta reaberta do histórico', () => {
    const turn: ConversationTurn = {
      response: { query_id: 'q_saved', session_id: 's_saved', query: 'Quais contratos?', answer: markdown,
        bases_consultadas: ['estruturada'], confidence_level: 'alta', is_refusal: false, refusal_reason: null,
        sources_used: [{ chunk_id: 'sql:contratacoes:1', base_id: 'contratos_estruturado', source_file: 'base.sqlite' }] },
    };
    render(<ConversationTurnView turn={turn} onRated={() => undefined} onViewTrace={() => undefined} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Fontes utilizadas (1)')).toBeInTheDocument();
    expect(screen.getByText('base.sqlite')).toBeInTheDocument();
  });
});
