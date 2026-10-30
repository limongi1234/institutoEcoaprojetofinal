import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Icon } from '../ui/Icon';

interface FollowUpComposerProps {
  loading: boolean;
  onSubmit: (query: string) => void;
}

// Limite de crescimento do campo para ele não cobrir a conversa no mobile.
const MAX_HEIGHT_PX = 160;

/** Campo compacto para continuar a conversa logo abaixo da última resposta. */
export function FollowUpComposer({ loading, onSubmit }: FollowUpComposerProps) {
  const [query, setQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Cresce junto com o texto, como em apps de mensagem.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [query]);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    const clean = query.trim();
    if (!clean || loading) return;
    onSubmit(clean);
    setQuery('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form className="followup-composer" onSubmit={handleSubmit}>
      <textarea
        ref={textareaRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Faça outra pergunta sobre este assunto..."
        aria-label="Pergunta de acompanhamento"
        rows={1}
        maxLength={4000}
      />
      <button
        type="submit"
        className="btn-composer-send"
        disabled={loading || !query.trim()}
        aria-label={loading ? 'Aguardando resposta...' : 'Enviar pergunta'}
        title="Pressione Enter para enviar"
      >
        <Icon name="arrow-right" size={16} />
      </button>
    </form>
  );
}
