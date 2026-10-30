import { useEffect, useRef, useState } from 'react';
import type { AppView, Avaliacao, ConversationTurn } from '../../types/app';
import { SearchComposer } from '../../components/search/SearchComposer';
import { FollowUpComposer } from '../../components/search/FollowUpComposer';
import { ConversationTurnView } from '../../components/results/ConversationTurnView';
import { Icon } from '../../components/ui/Icon';
import { QueryProgress } from '../../components/results/QueryProgress';
import { TracePanel } from '../../components/trace/TracePanel';

interface ConsultaPageProps {
  turns: ConversationTurn[];
  sessionId: string | null;
  pendingQuery: string | null;
  loading: boolean;
  estimatedDurationMs: number;
  error: string | null;
  errorKind: 'config' | 'network' | 'timeout' | 'http' | null;
  errorStatus: number | null;
  retryAfterSeconds: number;
  onSubmitQuery: (query: string) => void;
  onRetryQuery: () => void;
  onRated: (queryId: string, avaliacao: Avaliacao) => void;
  onNewConversation: () => void;
  onNavigate: (view: AppView) => void;
}

export function ConsultaPage({
  turns,
  sessionId,
  pendingQuery,
  loading,
  estimatedDurationMs,
  error,
  errorKind,
  errorStatus,
  retryAfterSeconds,
  onSubmitQuery,
  onRetryQuery,
  onRated,
  onNewConversation,
  onNavigate,
}: ConsultaPageProps) {
  const latestRef = useRef<HTMLDivElement>(null);
  const [traceQueryId, setTraceQueryId] = useState<string | null>(null);
  const [showSessionTrace, setShowSessionTrace] = useState(false);
  const hasThread = turns.length > 0 || pendingQuery !== null;

  // Leva o usuário até a pergunta nova, em vez de deixá-lo no topo da conversa.
  useEffect(() => {
    if (turns.length > 1 || pendingQuery) {
      latestRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [turns.length, pendingQuery]);

  if (!hasThread) {
    return (
      <div className="consulta-page-container">
        <SearchComposer loading={loading || retryAfterSeconds > 0} onSubmit={onSubmitQuery} onNavigate={onNavigate} />
        {error ? <QueryError message={error} kind={errorKind} status={errorStatus} retryAfterSeconds={retryAfterSeconds} onRetry={onRetryQuery} /> : null}
      </div>
    );
  }

  const title = turns[0]?.response.query ?? pendingQuery;

  return (
    <div className="conversation-page">
      <header className="conversation-header">
        <div className="conversation-header-copy">
          <span className="result-badge-label">CONVERSA</span>
          <h1 className="conversation-title">{title}</h1>
        </div>
        <button
          type="button"
          className="btn-new-search-link"
          onClick={onNewConversation}
          aria-label="Iniciar nova conversa"
        >
          <Icon name="plus" size={13} />
          <span>Nova conversa</span>
        </button>
        {sessionId && turns.length > 0 ? (
          <button type="button" className="btn-conversation-trace" onClick={() => setShowSessionTrace(true)}>
            <Icon name="layers" size={14} />
            Caminho da conversa
          </button>
        ) : null}
      </header>

      <div className="conversation-thread" aria-live="polite">
        {turns.map((turn, index) => (
          <div
            key={turn.response.query_id}
            ref={index === turns.length - 1 && !pendingQuery ? latestRef : null}
          >
            <ConversationTurnView turn={turn} sessionId={sessionId ?? undefined} onRated={onRated} onViewTrace={setTraceQueryId} />
          </div>
        ))}

        {pendingQuery ? (
          <div ref={latestRef} className="conversation-turn">
            <div className="turn-question">
              <p>{pendingQuery}</p>
            </div>
            <QueryProgress key={pendingQuery} estimatedDurationMs={estimatedDurationMs} />
          </div>
        ) : null}

        {error && !loading ? <QueryError message={error} kind={errorKind} status={errorStatus} retryAfterSeconds={retryAfterSeconds} onRetry={onRetryQuery} /> : null}
      </div>

      <div className="conversation-composer-dock">
        <FollowUpComposer loading={loading || retryAfterSeconds > 0} onSubmit={onSubmitQuery} />
      </div>

      {sessionId && traceQueryId ? <TracePanel sessionId={sessionId} queryId={traceQueryId} onClose={() => setTraceQueryId(null)} /> : null}
      {sessionId && showSessionTrace ? <TracePanel sessionId={sessionId} onClose={() => setShowSessionTrace(false)} /> : null}
    </div>
  );
}

function QueryError({ message, kind, status, retryAfterSeconds, onRetry }: { message: string; kind: string | null; status: number | null; retryAfterSeconds: number; onRetry: () => void }) {
  const rateLimited = status === 429;
  return (
    <div className="error-notice-card" role="alert">
      <Icon name="info" size={18} />
      <div className="error-copy">
        <strong>{rateLimited ? 'Limite de perguntas atingido' : kind === 'timeout' ? 'A consulta demorou mais que o esperado.' : 'Não foi possível concluir a consulta'}</strong>
        {kind !== 'timeout' ? <p>{message}</p> : null}
        <button type="button" className="btn-state-retry" onClick={onRetry} disabled={rateLimited && retryAfterSeconds > 0}>
          {rateLimited && retryAfterSeconds > 0 ? `Tente novamente em ${retryAfterSeconds} s` : 'Tentar novamente'}
        </button>
      </div>
    </div>
  );
}
