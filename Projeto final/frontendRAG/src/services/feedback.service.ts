import { ApiError, apiRequest } from './api';
import type { FeedbackRequest } from '../types/api';

/** Registra a avaliação de uma resposta (POST /api/v1/feedback). Falhas chegam à tela como erro. */
export async function sendFeedback(payload: FeedbackRequest, sessionId?: string): Promise<void> {
  try {
    await apiRequest<{ status: string }>('/api/v1/feedback', {
      method: 'POST',
      body: payload,
      headers: sessionId ? { 'X-Session-Id': sessionId } : undefined,
    });
  } catch (error) {
    // 404 aqui significa que o backend não conhece este query_id.
    if (error instanceof ApiError && error.status === 404) {
      throw new ApiError('Esta consulta não foi encontrada no servidor.', 'http', 404, error.data);
    }
    throw error;
  }
}
