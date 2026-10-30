import { TIMEOUT_CATALOG_MS, apiRequest } from './api';
import type { OfficialSource } from '../types/api';

/** Bases oficiais declaradas no manifesto do corpus (GET /api/v1/explore/fontes). */
export function listSources(): Promise<OfficialSource[]> {
  return apiRequest<OfficialSource[]>('/api/v1/explore/fontes', { timeoutMs: TIMEOUT_CATALOG_MS });
}
