import { TIMEOUT_CATALOG_MS, apiRequest } from './api';
import type { DocumentoRecord } from '../types/api';

export interface DocumentFilters {
  busca?: string;
  tipo?: string;
}

/** Tipos aceitos pelo filtro `tipo`, conforme o contrato. */
export const DOCUMENT_TYPES = ['Normativo', 'Contrato', 'Ata de Registro', 'PCA', 'Conversa sintética'] as const;

/** Documentos do inventário oficial (GET /api/v1/explore/documentos). */
export function listDocuments(
  filters: DocumentFilters,
  page: { limit: number; offset: number }
): Promise<DocumentoRecord[]> {
  return apiRequest<DocumentoRecord[]>('/api/v1/explore/documentos', {
    params: { ...filters, ...page }, timeoutMs: TIMEOUT_CATALOG_MS,
  });
}
