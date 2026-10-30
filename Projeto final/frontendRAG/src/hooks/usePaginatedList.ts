import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage, type ResourceStatus } from './useApiResource';

export const PAGE_SIZE = 24;

type PageFetcher<T, F> = (filters: F, page: { limit: number; offset: number }) => Promise<T[]>;

/**
 * Lista paginada por `limit`/`offset` com "carregar mais".
 * Uma página menor que o limite indica que não há mais registros.
 */
export function usePaginatedList<T, F>(fetchPage: PageFetcher<T, F>, filters: F) {
  const [items, setItems] = useState<T[]>([]);
  const [status, setStatus] = useState<ResourceStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const requestRef = useRef(0);
  const fetchPageRef = useRef(fetchPage);
  useEffect(() => { fetchPageRef.current = fetchPage; }, [fetchPage]);

  // Filtros chegam como objeto novo a cada render; a chave evita recarregar sem mudança real.
  const filtersKey = JSON.stringify(filters);

  const loadFirstPage = useCallback(async () => {
    const requestId = ++requestRef.current;
    setStatus('loading');
    setError(null);
    setLoadMoreError(null);
    setLoadingMore(false);
    try {
      const page = await fetchPageRef.current(JSON.parse(filtersKey) as F, { limit: PAGE_SIZE, offset: 0 });
      if (requestId !== requestRef.current) return;
      setItems(page);
      setHasMore(page.length === PAGE_SIZE);
      setStatus(page.length === 0 ? 'empty' : 'success');
    } catch (err) {
      if (requestId !== requestRef.current) return;
      setError(errorMessage(err));
      setStatus('error');
    }
  }, [filtersKey]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    const requestId = requestRef.current;
    setLoadingMore(true);
    setLoadMoreError(null);
    try {
      const page = await fetchPageRef.current(JSON.parse(filtersKey) as F, {
        limit: PAGE_SIZE,
        offset: items.length,
      });
      if (requestId !== requestRef.current) return;
      setItems((current) => [...current, ...page]);
      setHasMore(page.length === PAGE_SIZE);
    } catch (err) {
      if (requestId === requestRef.current) setLoadMoreError(errorMessage(err));
    } finally {
      if (requestId === requestRef.current) setLoadingMore(false);
    }
  }, [filtersKey, hasMore, items.length, loadingMore]);

  useEffect(() => {
    void loadFirstPage();
    return () => { requestRef.current++; };
  }, [loadFirstPage]);

  return { items, status, error, reload: loadFirstPage, hasMore, loadMore, loadingMore, loadMoreError };
}
