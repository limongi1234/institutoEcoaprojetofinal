// Tipos da API do backend NEXO, copiados do contrato oficial (FRONTEND_API_CONTRACT.md).
// Não acrescente campos aqui sem que o contrato mude primeiro.

export type EvidenceNature =
  | 'normativa'
  | 'estruturada'
  | 'conversacional'
  | 'agregada';

export type ConfidenceLevel = 'alta' | 'media' | 'baixa' | 'recusado';

export interface SourceRef {
  chunk_id: string;
  base_id: string;
  source_file: string;
}

export interface RagQueryRequest {
  query: string;
  top_k?: number;
  session_id?: string;
  historico?: ConversationHistoryTurn[];
}

export interface ConversationHistoryTurn {
  pergunta: string;
  resposta?: string;
}

export interface RagResponse {
  query_id: string;
  session_id: string;
  query: string;
  answer: string;
  bases_consultadas: EvidenceNature[];
  sources_used: SourceRef[];
  confidence_level: ConfidenceLevel;
  is_refusal: boolean;
  refusal_reason: string | null;
  pergunta_reformulada?: string | null;
  avisos?: string[];
}

export type TraceBase = 'sql' | 'vetorial' | null;

export interface TraceEvidence {
  rank?: number; chunk_id?: string; base_id?: string; source_file?: string; score?: number | null;
  dense_score?: number | null; sparse_score?: number | null; rrf_score?: number | null;
  rerank_score?: number | null; identificador_pncp_exato?: boolean;
  [key: string]: unknown;
}

export interface TraceFilterCondition { operator?: string; value?: unknown; optional?: boolean; }
export interface TraceModelCall {
  provider?: string; model_requested?: string; model?: string; status?: string;
  tokens?: Record<string, number>; latencia_ms?: number; error_type?: string;
}

export interface TraceStage {
  ordem: number;
  stage: string;
  base: TraceBase;
  status: string;
  ts: string;
  latencia_ms: number;
  input: unknown;
  output: unknown;
  tokens: Record<string, number> | null;
  modelo: string | null;
  detalhes: Record<string, unknown>;
  /** HMAC-SHA256 do registro no log; null em registros anteriores à cadeia. */
  hash?: string | null;
  /** Hash do registro global anterior, que pode pertencer a outra requisição. */
  hash_anterior?: string | null;
}

export type TraceIntegrityStatus = 'valida' | 'parcial' | 'legado' | 'invalida' | 'nao_verificada';

export interface TraceIntegrity {
  status: TraceIntegrityStatus;
  algoritmo: string | null;
  registros_verificados: number | null;
  registros_legados: number | null;
  problemas: number | null;
  verificado_em: string | null;
  motivo: string | null;
}

export interface TraceSummary {
  caminho?: string | null;
  consultou_sql?: boolean;
  consultou_vetorial?: boolean;
  evidencias_sql?: number;
  evidencias_vetorial?: number | Record<string, number>;
  fontes_citadas?: string[];
  confidence_level?: ConfidenceLevel;
  is_refusal?: boolean;
  refusal_reason?: string | null;
  sql_retornou_evidencia?: boolean;
  vetorial_retornou_evidencia?: boolean;
  num_fontes?: number;
  [key: string]: unknown;
}

export interface TraceResponse {
  query_id: string;
  session_id: string | null;
  run_ids: string[];
  pergunta: string | null;
  inicio: string;
  fim: string;
  latencia_total_ms: number;
  resumo: TraceSummary;
  etapas: TraceStage[];
  status?: string;
  completo?: boolean | null;
  latencia_metodo?: string;
  latencia_pipeline_ms?: number | null;
  integridade?: TraceIntegrity | null;
}

export interface SessionTraceQuestion {
  ordem: number;
  query_id: string;
  pergunta: string | null;
  inicio: string;
  fim: string;
  latencia_total_ms: number;
  resumo: TraceSummary;
  etapas: string[];
}

export interface SessionTraceResponse {
  session_id: string;
  inicio: string;
  fim: string;
  total_perguntas: number;
  consultou_sql: number;
  consultou_vetorial: number;
  perguntas: SessionTraceQuestion[];
}

export interface FeedbackRequest {
  query_id: string;
  avaliacao: 'positivo' | 'negativo';
  comentario?: string | null;
}

export interface FeedbackEntry {
  avaliacao: 'positivo' | 'negativo';
  comentario: string | null;
  ts: string;
}

export interface HistoryItem {
  query_id: string;
  run_id: string;
  ts: string;
  query: string;
  resposta: Omit<RagResponse, 'query_id' | 'session_id'>;
  feedback: FeedbackEntry[];
}

export interface ContratacaoRecord {
  id: string;
  numero_contrato: string;
  orgao: string | null;
  orgao_cnpj: string | null;
  fornecedor: string | null;
  objeto: string | null;
  valor_global: number | null;
  data_homologacao: string | null;
  modalidade: string | null;
  fonte_oficial: string;
  status: string | null;
  esfera: string | null;
  municipio: string | null;
}

export interface DocumentoRecord {
  id: string;
  titulo: string;
  tipo: string;
  orgao: string | null;
  ano: number | null;
  fonte: string | null;
  descricao: string | null;
  link: string | null;
  base_id: string;
  natureza: string;
  formato: string | null;
}

export interface OrgaoRecord {
  cnpj: string | null;
  sigla: string | null;
  nome: string;
  esfera: string | null;
  municipio: string | null;
  total_contratacoes: number;
  valor_total: number | null;
  principais_categorias: string[];
  principais_fornecedores: string[];
}

export interface OfficialSource {
  id: string;
  nome: string;
  sigla: string | null;
  instituicao: string | null;
  tipo_informacao: string | null;
  url: string | null;
  natureza: EvidenceNature;
  frequencia_coleta: string | null;
  descricao: string | null;
  escopo: string;
  formatos: string[];
}

export interface ProjectBaseSummary {
  base_id: string;
  natureza: string;
  escopo: string;
  status: string | null;
  documentos: number;
  formatos: Record<string, number>;
  documentos_ativos?: number | null;
  chunks_ativos?: number | null;
  vetores_ativos?: number | null;
}

export interface ActiveCorpusSummary {
  versao: string | null;
  snapshot_id: string | null;
  construido_em: string | null;
  total_documentos: number;
  total_chunks: number;
  total_vetores: number | null;
  chunks_sem_vetor: number | null;
  bytes_documents: number | null;
  schema_sql: string | null;
  vetores_por_base: Record<string, number>;
  avisos: string[];
}

export interface SnapshotAnterior {
  versao: string;
  coletado_em: string | null;
  arquivos: number;
  backup: string | null;
}

export interface ProjectSummary {
  projeto: string;
  scenario_id: string;
  descricao: string | null;
  versao_manifesto: string | null;
  versao_corpus: string;
  versao_inventario?: string | null;
  corpus_ativo?: ActiveCorpusSummary | null;
  snapshot_anterior?: SnapshotAnterior | null;
  coletado_em: string | null;
  inventario_completo: boolean;
  total_documentos: number;
  total_itens: number;
  total_falhas: number;
  bases: ProjectBaseSummary[];
}

export interface HealthResponse {
  status: string;
}
