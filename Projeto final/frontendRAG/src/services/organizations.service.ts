import { TIMEOUT_CATALOG_MS, apiRequest } from './api';
import type { OrgaoRecord } from '../types/api';

export interface OrganizationFilters {
  busca?: string;
}

/** Órgãos agregados da base estruturada (GET /api/v1/explore/orgaos). */
export function listOrganizations(
  filters: OrganizationFilters,
  page: { limit: number; offset: number }
): Promise<OrgaoRecord[]> {
  return apiRequest<OrgaoRecord[]>('/api/v1/explore/orgaos', {
    timeoutMs: TIMEOUT_CATALOG_MS,
    params: { ...filters, ...page },
  });
}
