import { ApiError, apiRequest } from './api';
import type { SessionTraceResponse, TraceResponse } from '../types/api';

function traceError(error: unknown): never {
  if (error instanceof ApiError && error.status === 401) {
    throw new ApiError('Este caminho pertence a outra conversa.', 'http', 401, error.data);
  }
  if (error instanceof ApiError && error.status === 404) {
    throw new ApiError(
      'Este caminho não está disponível. A pergunta pode ser anterior ao recurso de rastreabilidade.',
      'http',
      404,
      error.data
    );
  }
  throw error;
}

function sessionHeader(sessionId: string): Record<string, string> {
  return { 'X-Session-Id': sessionId };
}

export async function getQuestionTrace(queryId: string, sessionId: string): Promise<TraceResponse> {
  try {
    return await apiRequest<TraceResponse>(`/api/v1/trace/${encodeURIComponent(queryId)}`, {
      headers: sessionHeader(sessionId),
    });
  } catch (error) {
    return traceError(error);
  }
}

export async function getSessionTrace(sessionId: string): Promise<SessionTraceResponse> {
  try {
    return await apiRequest<SessionTraceResponse>(
      `/api/v1/sessions/${encodeURIComponent(sessionId)}/trace`,
      { headers: sessionHeader(sessionId) }
    );
  } catch (error) {
    return traceError(error);
  }
}
