import { TIMEOUT_CATALOG_MS, apiRequest } from './api';
import type { ContratacaoRecord } from '../types/api';

export interface ContractFilters {
  busca?: string;
  orgao?: string;
}

/** Contratações da base estruturada (GET /api/v1/explore/contratacoes). */
export function listContracts(
  filters: ContractFilters,
  page: { limit: number; offset: number }
): Promise<ContratacaoRecord[]> {
  return apiRequest<ContratacaoRecord[]>('/api/v1/explore/contratacoes', {
    params: { ...filters, ...page }, timeoutMs: TIMEOUT_CATALOG_MS,
  });
}
