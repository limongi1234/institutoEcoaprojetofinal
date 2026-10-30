// Tipos que existem só na interface (navegação e estado da tela), fora do contrato da API.
import type { FeedbackRequest, RagResponse } from './api';

export type AppView =
  | 'consulta'
  | 'contratacoes'
  | 'documentos'
  | 'orgaos'
  | 'fontes'
  | 'historico'
  | 'como-funciona'
  | 'transparencia'
  | 'sobre';

export type Avaliacao = FeedbackRequest['avaliacao'];

/** Uma pergunta da conversa atual. Vive só em memória: o backend é quem persiste o histórico. */
export interface ConversationTurn {
  response: RagResponse;
  /** Avaliação já confirmada pelo backend (nesta sessão ou vinda do histórico). */
  feedback?: Avaliacao;
}
