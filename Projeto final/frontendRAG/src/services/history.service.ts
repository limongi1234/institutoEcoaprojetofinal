import { apiRequest } from './api';
import type { HistoryItem } from '../types/api';

export const HISTORY_LIMIT = 100;

export interface SessionHistoryEntry {
  item: HistoryItem;
  sessionId: string;
}

/** Histórico privado da conversa identificada por X-Session-Id. */
export function getSessionHistory(sessionId: string, limit = HISTORY_LIMIT): Promise<HistoryItem[]> {
  return apiRequest<HistoryItem[]>('/api/v1/history', {
    params: { limit },
    headers: { 'X-Session-Id': sessionId },
  });
}

/** Junta o histórico das sessões conhecidas pelo navegador sem pedir acesso global à API. */
export async function getHistoryForSessions(sessionIds: string[]): Promise<SessionHistoryEntry[]> {
  const histories = await Promise.all([...new Set(sessionIds)].map(async (sessionId) => ({
    sessionId,
    items: await getSessionHistory(sessionId),
  })));
  return histories
    .flatMap(({ sessionId, items }) => items.map((item) => ({ item, sessionId })))
    .sort((a, b) => b.item.ts.localeCompare(a.item.ts));
}
