import { apiRequest } from './api';
import type { HealthResponse } from '../types/api';

/** Verifica se o backend responde (GET /health). Qualquer falha significa offline. */
export async function checkHealth(): Promise<boolean> {
  try {
    const data = await apiRequest<HealthResponse>('/health', { timeoutMs: 5_000 });
    return data?.status === 'ok';
  } catch {
    return false;
  }
}
