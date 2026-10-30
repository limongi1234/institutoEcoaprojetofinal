export const STAGE_LABELS: Record<string, string> = {
  interacao: 'Conversa ou consulta', requisicao_inicio: 'Pergunta recebida', pipeline_inicio: 'Início do processamento', reformulacao: 'Entendimento do contexto', query_analysis: 'Análise da pergunta', roteamento: 'Escolha das bases', retrieval_denso: 'Busca por significado', retrieval_bm25: 'Busca por palavras', fusao_rrf: 'Combinação dos resultados', rerank: 'Ordenação das evidências', consulta_sql: 'Consulta à base estruturada', geracao: 'Geração da resposta', validacao: 'Validação das fontes', resumo_consulta: 'Resumo do caminho', persistencia_historico: 'Gravação no histórico', pipeline_fim: 'Fim do processamento', requisicao_fim: 'Resposta enviada', feedback: 'Feedback da resposta',
};
export const BASE_LABELS: Record<string, string> = { contratos_estruturado: 'Contratos', editais_normativo: 'Normas', atas_conversacional: 'Atas', pca_agregado: 'Indicadores PCA', emails_sinteticos: 'E-mails' };
export type TraceStatusSemantic = 'success' | 'neutral' | 'warning' | 'danger';

export const STATUS_PRESENTATION: Record<string, { label: string; semantic: TraceStatusSemantic }> = {
  ok: { label: 'concluído', semantic: 'success' },
  iniciado: { label: 'registrado', semantic: 'neutral' },
  pulado: { label: 'não executada', semantic: 'neutral' },
  conversa: { label: 'conversa', semantic: 'neutral' },
  aviso: { label: 'aviso', semantic: 'warning' },
  degradado: { label: 'com reserva', semantic: 'warning' },
  recusa: { label: 'recusada', semantic: 'neutral' },
  erro: { label: 'erro', semantic: 'danger' },
  rejeitado: { label: 'rejeitado', semantic: 'warning' },
};
export const SKIP_REASONS: Record<string, string> = { calculo_sql_suficiente: 'o cálculo SQL respondeu sozinho, sem busca de trechos', sem_historico: 'primeira pergunta da conversa, nada a reescrever', autossuficiente: 'a pergunta já fazia sentido sozinha', modo_desligado: 'etapa desligada na configuração' };
export const FILTER_REASONS: Record<string, string> = { nenhum_chunk_passou: 'nenhum trecho atendia; a busca seguiu sem esse filtro', sem_campo: 'esta base não possui esse dado' };
export const formatMs = (ms: number) => { if (ms < 1000) return `${ms} ms`; const seconds = ms / 1000; return seconds < 60 ? `${seconds.toFixed(seconds < 10 ? 1 : 0)} s` : `${Math.floor(seconds / 60)} min ${Math.round(seconds % 60)} s`; };
