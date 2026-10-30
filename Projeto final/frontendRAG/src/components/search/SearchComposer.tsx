import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { Icon } from '../ui/Icon';
import type { AppView } from '../../types/app';

interface SearchComposerProps {
  loading: boolean;
  onSubmit: (query: string) => void;
  onNavigate: (view: AppView) => void;
}

interface Shortcut {
  view: AppView;
  category: string;
  title: string;
  description: string;
}

// Atalhos só navegam para as páginas de Explorar; os dados vêm da API em cada página.
const SHORTCUTS: Shortcut[] = [
  {
    view: 'contratacoes',
    category: 'Contratações',
    title: 'Explorar contratações',
    description: 'Contratos, fornecedores e valores registrados no acervo',
  },
  {
    view: 'documentos',
    category: 'Documentos',
    title: 'Pesquisar documentos',
    description: 'Normativos, contratos, atas, PCA e conversas sintéticas',
  },
  {
    view: 'orgaos',
    category: 'Órgãos',
    title: 'Consultar um órgão',
    description: 'Total contratado e principais fornecedores por órgão',
  },
  {
    view: 'fontes',
    category: 'Fontes oficiais',
    title: 'Explorar fontes oficiais',
    description: 'Bases oficiais que alimentam as respostas',
  },
];

export function SearchComposer({ loading, onSubmit, onNavigate }: SearchComposerProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    const clean = query.trim();
    if (!clean || loading) return;
    onSubmit(clean);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="search-composer-wrapper">
      <div className="composer-header">
        <span className="composer-eyebrow">Consulta inteligente</span>
        <h1 className="composer-title">O que você quer consultar?</h1>
      </div>

      <form className="ai-composer-box" onSubmit={handleSubmit}>
        <div className="composer-input-area">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ex.: O que o e-mail sintético da DPRJ diz sobre papel A4?"
            aria-label="Pergunta sobre contratações públicas"
            rows={2}
            maxLength={4000}
            disabled={loading}
          />
        </div>

        <div className="composer-controls-bar composer-controls-end">
          <button
            type="submit"
            className="btn-composer-send"
            disabled={loading || !query.trim()}
            aria-label={loading ? 'Pesquisando...' : 'Enviar consulta'}
            title="Pressione Enter para enviar"
          >
            <Icon name="arrow-right" size={16} />
          </button>
        </div>
      </form>

      <div className="composer-shortcuts-section">
        <span className="shortcuts-label">Atalhos</span>
        <div className="composer-shortcuts-grid">
          {SHORTCUTS.map((item) => (
            <button
              key={item.view}
              type="button"
              className="shortcut-card"
              onClick={() => onNavigate(item.view)}
              aria-label={`Atalho: ${item.title}`}
            >
              <div className="shortcut-icon-row">
                <span className="shortcut-category">{item.category}</span>
                <Icon name="arrow-up-right" size={14} className="shortcut-arrow" />
              </div>
              <h2 className="shortcut-title">{item.title}</h2>
              <p className="shortcut-desc">{item.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
