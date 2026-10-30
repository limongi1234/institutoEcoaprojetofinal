import type { ReactNode } from 'react';
import { Icon } from './Icon';

// Estados padronizados para toda tela que depende da API (loading, empty, error).

export function LoadingState({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="state-panel" role="status" aria-live="polite">
      <Icon name="refresh-cw" size={18} className="spin-animation" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="state-panel state-empty">
      <Icon name="layers" size={22} />
      <strong>{title}</strong>
      {children}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state-panel state-error" role="alert">
      <Icon name="info" size={20} />
      <strong>Não foi possível carregar os dados</strong>
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="btn-state-retry" onClick={onRetry}>
          <Icon name="refresh-cw" size={14} />
          <span>Tentar novamente</span>
        </button>
      ) : null}
    </div>
  );
}

interface LoadMoreProps {
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  onLoadMore: () => void;
}

export function LoadMore({ hasMore, loading, error, onLoadMore }: LoadMoreProps) {
  if (!hasMore) return null;
  return (
    <div className="load-more-row">
      {error ? <p className="load-more-error" role="alert">{error}</p> : null}
      <button type="button" className="btn-load-more" onClick={onLoadMore} disabled={loading}>
        {loading ? 'Carregando...' : error ? 'Tentar novamente' : 'Carregar mais'}
      </button>
    </div>
  );
}
