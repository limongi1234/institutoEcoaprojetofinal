import { useCallback, useEffect, useState } from 'react';
import { getHistoryForSessions, type SessionHistoryEntry } from '../services/history.service';
import { errorMessage } from './useApiResource';

export function useHistory(sessionIds: string[]) {
  const [items, setItems] = useState<SessionHistoryEntry[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'empty' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!sessionIds.length) {
      setItems([]);
      setStatus('idle');
      return;
    }
    setStatus('loading');
    setError(null);
    try {
      const result = await getHistoryForSessions(sessionIds);
      setItems(result);
      setStatus(result.length ? 'success' : 'empty');
    } catch (err) {
      setError(errorMessage(err));
      setStatus('error');
    }
  }, [sessionIds]);

  useEffect(() => { void reload(); }, [reload]);
  return { items, status, error, reload };
}
