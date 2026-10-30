import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../services/api';

export type ResourceStatus = 'loading' | 'success' | 'empty' | 'error';

export function errorMessage(error: unknown): string {
  return error instanceof ApiError || error instanceof Error
    ? error.message
    : 'Ocorreu um erro inesperado.';
}

function isEmpty(data: unknown): boolean {
  return Array.isArray(data) && data.length === 0;
}

/**
 * Carrega um recurso da API e expõe os quatro estados da tela.
 * Lista vazia vira `empty`, nunca dado de exemplo.
 */
export function useApiResource<T>(load: () => Promise<T>, deps: readonly unknown[]) {
  const [status, setStatus] = useState<ResourceStatus>('loading');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Só a requisição mais recente pode atualizar a tela.
  const requestRef = useRef(0);

  const run = useCallback(load, deps);

  const reload = useCallback(async () => {
    const requestId = ++requestRef.current;
    setStatus('loading');
    setError(null);
    try {
      const result = await run();
      if (requestId !== requestRef.current) return;
      setData(result);
      setStatus(isEmpty(result) ? 'empty' : 'success');
    } catch (err) {
      if (requestId !== requestRef.current) return;
      setError(errorMessage(err));
      setStatus('error');
    }
  }, [run]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { status, data, error, reload };
}
