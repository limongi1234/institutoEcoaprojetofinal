import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConversationHistoryTurn } from '../types/api';
import type { Avaliacao, ConversationTurn } from '../types/app';
import { ApiError } from '../services/api';
import { queryRag } from '../services/query.service';
import { errorMessage } from './useApiResource';

const SESSION_STORAGE_KEY = 'nexo:conversation-session-id';
const SESSION_IDS_STORAGE_KEY = 'nexo:conversation-session-ids';

function readStoredSession(): string | null {
  try {
    return window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeSession(sessionId: string | null): void {
  try {
    if (sessionId) window.sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    else window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // A conversa continua funcional em memória quando o navegador bloqueia storage.
  }
}

function readStoredSessionIds(currentSessionId: string | null): string[] {
  try {
    const stored = window.sessionStorage.getItem(SESSION_IDS_STORAGE_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    const sessionIds = Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string' && id.length > 0)
      : [];
    if (currentSessionId && !sessionIds.includes(currentSessionId)) sessionIds.push(currentSessionId);
    return [...new Set(sessionIds)];
  } catch {
    return currentSessionId ? [currentSessionId] : [];
  }
}

function storeSessionIds(sessionIds: string[]): void {
  try {
    window.sessionStorage.setItem(SESSION_IDS_STORAGE_KEY, JSON.stringify(sessionIds));
  } catch {
    // O histórico fica limitado às sessões em memória quando o navegador bloqueia storage.
  }
}

function historyFrom(turns: ConversationTurn[]): ConversationHistoryTurn[] {
  return turns.slice(-10).map(({ response }) => ({
    pergunta: response.query,
    resposta: response.answer,
  }));
}

/** Conversa atual, com sessão isolada por aba e contexto reenviado ao backend. */
export function useRagWorkspace() {
  const initialSession = useRef<string | null>(readStoredSession());
  const sessionIdRef = useRef<string | null>(initialSession.current);
  const turnsRef = useRef<ConversationTurn[]>([]);
  const [turns, setTurnsState] = useState<ConversationTurn[]>([]);
  const [sessionId, setSessionIdState] = useState<string | null>(initialSession.current);
  const [sessionIds, setSessionIdsState] = useState<string[]>(() => readStoredSessionIds(initialSession.current));
  const sessionIdsRef = useRef(sessionIds);
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<ApiError['kind'] | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);
  const failedQueryRef = useRef<string | null>(null);
  const [estimatedDurationMs, setEstimatedDurationMs] = useState(82_000);
  const queryStartedAtRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => { storeSessionIds(sessionIds); }, [sessionIds]);

  useEffect(() => {
    if (retryAfterSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setRetryAfterSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryAfterSeconds > 0]);

  const setTurns = useCallback((next: ConversationTurn[] | ((current: ConversationTurn[]) => ConversationTurn[])) => {
    const value = typeof next === 'function' ? next(turnsRef.current) : next;
    turnsRef.current = value;
    setTurnsState(value);
  }, []);

  const setSessionId = useCallback((next: string | null) => {
    sessionIdRef.current = next;
    setSessionIdState(next);
    storeSession(next);
    if (next && !sessionIdsRef.current.includes(next)) {
      const updated = [...sessionIdsRef.current, next];
      sessionIdsRef.current = updated;
      setSessionIdsState(updated);
      storeSessionIds(updated);
    }
  }, []);

  const forgetSessionId = useCallback((invalidSessionId: string) => {
    const updated = sessionIdsRef.current.filter((id) => id !== invalidSessionId);
    sessionIdsRef.current = updated;
    setSessionIdsState(updated);
    storeSessionIds(updated);
  }, []);

  const loading = pendingQuery !== null;

  const submitQuery = useCallback(
    async (queryText: string) => {
      const normalized = queryText.trim();
      if (!normalized || pendingQuery !== null || retryAfterSeconds > 0) return;

      const requestId = ++requestIdRef.current;
      queryStartedAtRef.current = Date.now();
      setPendingQuery(normalized);
      setError(null);
      setErrorKind(null);
      setErrorStatus(null);
      failedQueryRef.current = null;

      const context = () => ({
        sessionId: sessionIdRef.current,
        history: historyFrom(turnsRef.current),
      });

      try {
        let response;
        try {
          response = await queryRag(normalized, context());
        } catch (err) {
          // Uma sessão restaurada pode ter formato/validade incompatível com o servidor atual.
          const invalidSessionId = sessionIdRef.current;
          if (!(err instanceof ApiError) || err.status !== 422 || !invalidSessionId) throw err;
          forgetSessionId(invalidSessionId);
          setSessionId(null);
          response = await queryRag(normalized, {
            history: historyFrom(turnsRef.current),
          });
        }

        if (requestId !== requestIdRef.current) return;
        setSessionId(response.session_id);
        const duration = Date.now() - (queryStartedAtRef.current ?? Date.now());
        setEstimatedDurationMs((current) => Math.max(5_000, Math.round(current * 0.4 + duration * 0.6)));
        setTurns((current) => [...current, { response }]);
      } catch (err) {
        if (requestId === requestIdRef.current) {
          setError(errorMessage(err));
          setErrorKind(err instanceof ApiError ? err.kind : 'network');
          setErrorStatus(err instanceof ApiError ? err.status ?? null : null);
          if (err instanceof ApiError && err.status === 429) {
            setRetryAfterSeconds(err.retryAfterSeconds ?? 1);
          }
          failedQueryRef.current = normalized;
        }
      } finally {
        if (requestId === requestIdRef.current) setPendingQuery(null);
      }
    },
    [pendingQuery, retryAfterSeconds, forgetSessionId, setSessionId, setTurns]
  );

  const retryQuery = useCallback(() => {
    const query = failedQueryRef.current;
    if (query) void submitQuery(query);
  }, [submitQuery]);

  const markRated = useCallback((queryId: string, avaliacao: Avaliacao) => {
    setTurns((current) =>
      current.map((turn) =>
        turn.response.query_id === queryId ? { ...turn, feedback: avaliacao } : turn
      )
    );
  }, [setTurns]);

  /** Restaura uma conversa do histórico, substituindo os turns atuais. */
  const restoreConversation = useCallback((items: ConversationTurn[], newSessionId: string | null) => {
    requestIdRef.current++;
    setTurns(items);
    setSessionId(newSessionId);
    setPendingQuery(null);
    setError(null);
    setErrorKind(null);
    setErrorStatus(null);
    failedQueryRef.current = null;
  }, [setSessionId, setTurns]);

  const startNewConversation = useCallback(() => {
    requestIdRef.current++;
    setTurns([]);
    setSessionId(null);
    setPendingQuery(null);
    setError(null);
    setErrorKind(null);
    setErrorStatus(null);
    failedQueryRef.current = null;
  }, [setSessionId, setTurns]);

  return {
    turns,
    sessionId,
    pendingQuery,
    loading,
    estimatedDurationMs,
    error,
    errorKind,
    errorStatus,
    retryAfterSeconds,
    submitQuery,
    retryQuery,
    markRated,
    restoreConversation,
    sessionIds,
    startNewConversation,
  };
}
