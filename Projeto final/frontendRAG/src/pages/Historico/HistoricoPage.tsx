import { EmptyState, ErrorState, LoadingState } from '../../components/ui/AsyncState';
import { Icon } from '../../components/ui/Icon';
import { useHistory } from '../../hooks/useHistory';
import { formatDateTime } from '../../utils/format';
import type { HistoryItem } from '../../types/api';

interface HistoricoPageProps {
  sessionIds: string[];
  onNewQuery: () => void;
  onOpenConversation: (items: HistoryItem[], sessionId: string) => void;
}

export function HistoricoPage({ sessionIds, onNewQuery, onOpenConversation }: HistoricoPageProps) {
  const history = useHistory(sessionIds);
  const conversations = new Map<string, HistoryItem[]>();
  for (const { item, sessionId } of history.items) {
    const items = conversations.get(sessionId) ?? [];
    items.push(item);
    conversations.set(sessionId, items);
  }
  return (
    <div className="page-content-wrapper">
      <header className="page-header">
        <span className="page-eyebrow">CONVERSAS DESTA ABA</span>
        <h1 className="page-title">Histórico</h1>
        <p className="page-description">Consultas das conversas iniciadas nesta aba, identificadas com segurança pelo navegador.</p>
      </header>

      {!sessionIds.length ? (
        <EmptyState title="Inicie uma conversa para consultar o histórico desta aba.">
          <button type="button" className="btn-empty-start" onClick={onNewQuery}>
            <Icon name="plus" size={15} /><span>Nova conversa</span>
          </button>
        </EmptyState>
      ) : null}
      {sessionIds.length > 0 && history.status === 'loading' ? <LoadingState label="Carregando histórico..." /> : null}
      {sessionIds.length > 0 && history.status === 'error' && history.error ? <ErrorState message={history.error} onRetry={history.reload} /> : null}
      {sessionIds.length > 0 && history.status === 'empty' ? <EmptyState title="Nenhuma consulta nesta aba." /> : null}
      {sessionIds.length > 0 && history.status === 'success' ? (
        <ul className="history-items-feed" aria-label="Consultas das conversas desta aba">
          {history.items.map(({ item, sessionId }) => (
            <li key={`${sessionId}:${item.query_id}`} className="history-feed-card history-feed-card--clickable">
              <button
                type="button"
                className="history-feed-card-btn"
                onClick={() => onOpenConversation(conversations.get(sessionId) ?? [item], sessionId)}
                aria-label={`Abrir conversa: ${item.query}`}
              >
                <div className="feed-card-header">
                  <strong>{item.query}</strong>
                  <time dateTime={item.ts}>{formatDateTime(item.ts)}</time>
                </div>
                <p>{item.resposta.answer}</p>
                <span className="feed-card-cta"><Icon name="arrow-right" size={14} /> Abrir conversa</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
