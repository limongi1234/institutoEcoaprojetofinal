import { useState } from 'react';
import { Icon } from '../ui/Icon';
import { sendFeedback } from '../../services/feedback.service';
import { errorMessage } from '../../hooks/useApiResource';
import type { Avaliacao } from '../../types/app';

// Limite do campo `comentario` no contrato.
const MAX_COMMENT = 2000;

interface AnswerFeedbackProps {
  queryId: string;
  sessionId?: string;
  /** Avaliação já registrada no backend (ex.: consulta reaberta do histórico). */
  value?: Avaliacao;
  onRated: (avaliacao: Avaliacao) => void;
}

type Step = 'ask' | 'comment' | 'sending' | 'done' | 'error';

/** Pergunta se a resposta foi útil e só confirma depois que o backend aceitar. */
export function AnswerFeedback({ queryId, sessionId, value, onRated }: AnswerFeedbackProps) {
  const [step, setStep] = useState<Step>(value ? 'done' : 'ask');
  const [avaliacao, setAvaliacao] = useState<Avaliacao | null>(value ?? null);
  const [comentario, setComentario] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (choice: Avaliacao, comment: string | null) => {
    setAvaliacao(choice);
    setStep('sending');
    setError(null);
    try {
      await sendFeedback({ query_id: queryId, avaliacao: choice, comentario: comment }, sessionId);
      setStep('done');
      onRated(choice);
    } catch (err) {
      setError(errorMessage(err));
      setStep('error');
    }
  };

  const retry = () => {
    if (avaliacao) submit(avaliacao, avaliacao === 'negativo' ? comentario.trim() || null : null);
  };

  if (step === 'done') {
    return (
      <div className="answer-feedback-box" role="status">
        <div className="feedback-confirmed">
          <Icon name="check" size={14} className="feedback-check-icon" />
          <span>
            Feedback registrado: resposta {avaliacao === 'positivo' ? 'útil' : 'não útil'}.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="answer-feedback-box" role="region" aria-label="Avaliação da resposta">
      {step === 'comment' ? (
        <form
          className="feedback-comment-form"
          onSubmit={(e) => {
            e.preventDefault();
            submit('negativo', comentario.trim() || null);
          }}
        >
          <label className="feedback-question" htmlFor={`comentario-${queryId}`}>
            O que faltou na resposta? (opcional)
          </label>
          <textarea
            id={`comentario-${queryId}`}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            maxLength={MAX_COMMENT}
            rows={3}
            placeholder="Ex.: a fonte não respondia à pergunta."
          />
          <div className="feedback-buttons">
            <button type="button" className="btn-feedback" onClick={() => setStep('ask')}>
              Cancelar
            </button>
            <button type="submit" className="btn-feedback btn-feedback-primary">
              Enviar avaliação
            </button>
          </div>
        </form>
      ) : (
        <div className="feedback-prompt-row">
          <span className="feedback-question">
            {step === 'sending' ? 'Enviando avaliação...' : 'Esta resposta foi útil?'}
          </span>
          <div className="feedback-buttons">
            <button
              type="button"
              className="btn-feedback"
              disabled={step === 'sending'}
              onClick={() => submit('positivo', null)}
              aria-label="Sim, esta resposta foi útil"
            >
              <Icon name="thumbs-up" size={14} />
              <span>Sim</span>
            </button>
            <button
              type="button"
              className="btn-feedback"
              disabled={step === 'sending'}
              onClick={() => setStep('comment')}
              aria-label="Não, esta resposta não foi útil"
            >
              <Icon name="thumbs-down" size={14} />
              <span>Não</span>
            </button>
          </div>
        </div>
      )}

      {step === 'error' && error ? (
        <div className="feedback-error" role="alert">
          <span>Não foi possível registrar o feedback: {error}</span>
          <button type="button" className="btn-feedback" onClick={retry}>
            Tentar novamente
          </button>
        </div>
      ) : null}
    </div>
  );
}
