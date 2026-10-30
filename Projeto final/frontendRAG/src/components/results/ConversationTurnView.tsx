import type { ConversationTurn } from '../../types/app';
import type { Avaliacao } from '../../types/app';
import { Icon } from '../ui/Icon';
import { AnswerFeedback } from '../feedback/AnswerFeedback';
import { AnswerMarkdown } from './AnswerMarkdown';
import { EVIDENCE_LEVEL_LABELS, NATUREZA_LABELS, refusalLabel } from '../../constants/labels';

interface ConversationTurnViewProps {
  turn: ConversationTurn;
  sessionId?: string;
  onRated: (queryId: string, avaliacao: Avaliacao) => void;
  onViewTrace: (queryId: string) => void;
}

/** Uma pergunta da conversa com a resposta, as fontes e a avaliação. */
export function ConversationTurnView({ turn, sessionId, onRated, onViewTrace }: ConversationTurnViewProps) {
  const { response } = turn;
  const isConversation = !response.is_refusal && response.bases_consultadas.length === 0
    && response.sources_used.length === 0;

  // A API separa parágrafos por linha em branco; um <p> por bloco facilita a leitura.
  const paragraphs = response.answer
    ? response.answer.split('\n\n').filter((p) => p.trim().length > 0)
    : [];

  return (
    <article className="conversation-turn" aria-label={`Pergunta: ${response.query}`}>
      <div className="turn-question">
        <p>{response.query}</p>
      </div>

      {response.pergunta_reformulada ? (
        <p className="reformulated-query">Entendi como: {response.pergunta_reformulada}</p>
      ) : null}

      {/* Sem evidência suficiente, o backend recusa; mostramos o motivo em vez de uma resposta. */}
      {response.is_refusal ? (
        <div className="refusal-box">
          <div className="refusal-icon-title">
            <Icon name="info" size={18} />
            <h2>Não foi possível responder com as fontes disponíveis</h2>
          </div>
          {response.refusal_reason ? (
            <p className="refusal-explanation">{refusalLabel(response.refusal_reason)}</p>
          ) : null}
          {response.refusal_reason === 'sem_evidencia' ? (
            <p className="refusal-explanation">
              Faça uma pergunta sobre o acervo, por exemplo:
              {' '}“O que o e-mail sintético da DPRJ diz sobre papel A4?”
            </p>
          ) : null}
          {paragraphs.length > 0 ? (
            <div className="refusal-paragraphs">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <section className="result-answer-section" aria-labelledby={`answer-${response.query_id}`}>
          <h2 id={`answer-${response.query_id}`} className="visually-hidden">
            {isConversation ? 'Conversa' : 'Resposta fundamentada'}
          </h2>
          <div className="result-answer-prose">
            <AnswerMarkdown answer={response.answer} />
          </div>
        </section>
      )}

      <div className="turn-meta-row">
        <span className="turn-meta-tag">{isConversation ? 'Conversa — sem consulta ao acervo' : EVIDENCE_LEVEL_LABELS[response.confidence_level]}</span>
        {response.bases_consultadas.map((natureza) => (
          <span key={natureza} className="turn-meta-tag">
            Base {NATUREZA_LABELS[natureza].toLowerCase()}
          </span>
        ))}
      </div>

      {response.avisos?.length ? (
        <div className="response-notes">{response.avisos.map((aviso) => <p key={aviso}>{aviso}</p>)}</div>
      ) : null}

      {response.sources_used.length > 0 ? (
        <section
          className="result-sources-section"
          aria-labelledby={`sources-${response.query_id}`}
        >
          <h2 id={`sources-${response.query_id}`} className="sources-section-title">
            Fontes utilizadas ({response.sources_used.length})
          </h2>
          <div className="result-sources-list">
            {response.sources_used.map((source) => (
              <article key={source.chunk_id} className="source-item-card">
                <div className="source-card-top">
                  <Icon name="file-text" size={15} />
                  <h3 className="source-card-title" title={source.source_file}>
                    {source.source_file}
                  </h3>
                </div>
                <div className="source-card-meta">
                  <span className="source-meta-tag">Base: {source.base_id}</span>
                  {source.base_id === 'emails_sinteticos' ? (
                    <span className="source-meta-tag">Cenário sintético — não é um fato real</span>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <AnswerFeedback
        queryId={response.query_id}
        sessionId={sessionId}
        value={turn.feedback}
        onRated={(avaliacao) => onRated(response.query_id, avaliacao)}
      />
      <button type="button" className="btn-view-trace" onClick={() => onViewTrace(response.query_id)}>
        <Icon name="layers" size={15} />
        Ver caminho
      </button>
    </article>
  );
}
