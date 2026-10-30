import { TIMEOUT_CATALOG_MS, apiRequest } from './api';
import type { ProjectSummary } from '../types/api';

/** Versões e totais reais do acervo (GET /api/v1/project/summary). */
export function getProjectSummary(): Promise<ProjectSummary> {
  return apiRequest<ProjectSummary>('/api/v1/project/summary', { timeoutMs: TIMEOUT_CATALOG_MS });
}
