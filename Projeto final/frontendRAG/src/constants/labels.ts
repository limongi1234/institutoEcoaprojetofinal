// Textos de interface para valores enumerados da API. Não são dados: só traduzem códigos.
import type { ConfidenceLevel, EvidenceNature } from '../types/api';

export const EVIDENCE_LEVEL_LABELS: Record<ConfidenceLevel, string> = {
  alta: 'Evidência alta',
  media: 'Evidência moderada',
  baixa: 'Evidência baixa',
  recusado: 'Evidência insuficiente',
};

export const NATUREZA_LABELS: Record<EvidenceNature, string> = {
  normativa: 'Normativa',
  estruturada: 'Estruturada',
  conversacional: 'Conversacional',
  agregada: 'Agregada',
};

// O contrato tipa refusal_reason como string; códigos desconhecidos aparecem como vieram.
const REFUSAL_LABELS: Record<string, string> = {
  dados_bancarios_fornecedor: 'A pergunta envolve dados bancários ou financeiros protegidos de terceiros.',
  credenciais_vazadas: 'A pergunta envolve credenciais de acesso ou informações sigilosas.',
  juizo_legalidade_contrato:
    'Não é possível afirmar fraude ou ilegalidade sem decisão administrativa ou judicial.',
  fora_de_escopo: 'O assunto está fora do escopo das contratações públicas do Rio de Janeiro.',
  sem_evidencia: 'As fontes disponíveis não trazem evidências suficientes para responder.',
};

export function refusalLabel(reason: string): string {
  return REFUSAL_LABELS[reason] ?? reason;
}

export function naturezaLabel(natureza: string): string {
  return NATUREZA_LABELS[natureza as EvidenceNature] ?? natureza;
}
