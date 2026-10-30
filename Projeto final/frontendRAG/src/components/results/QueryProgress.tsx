import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../ui/Icon';

interface QueryProgressProps {
  estimatedDurationMs: number;
}

const STEPS = [
  { at: 0, label: 'Entendendo sua pergunta' },
  { at: 0.12, label: 'Procurando informações nas fontes oficiais' },
  { at: 0.45, label: 'Selecionando as informações mais relevantes' },
  { at: 0.65, label: 'Escrevendo uma resposta clara e confiável' },
] as const;

function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds} s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds === 0 ? `${minutes} min` : `${minutes} min ${seconds} s`;
}

/** O relógio é real; as etapas são aproximadas enquanto a API não envia eventos de progresso. */
export function QueryProgress({ estimatedDurationMs }: QueryProgressProps) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => setElapsedMs(Date.now() - startedAt), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const activeIndex = useMemo(() => {
    const progress = elapsedMs / Math.max(estimatedDurationMs, 1);
    let index = 0;
    STEPS.forEach((step, candidate) => {
      if (progress >= step.at) index = candidate;
    });
    return index;
  }, [elapsedMs, estimatedDurationMs]);

  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const remainingSeconds = Math.max(0, Math.ceil((estimatedDurationMs - elapsedMs) / 1000));
  const exceededEstimate = elapsedMs > estimatedDurationMs;

  return (
    <div className="processing-indicator-box" role="status" aria-live="polite">
      <div className="processing-heading">
        <div className="processing-pulse" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="processing-text-group">
          <h2 className="processing-title processing-shimmer">Buscando e analisando fontes</h2>
          <p className="processing-sub">
            {formatDuration(elapsedSeconds)} decorridos
            <span aria-hidden="true"> · </span>
            {exceededEstimate
              ? 'finalizando a resposta'
              : `aproximadamente ${formatDuration(remainingSeconds)} restantes`}
          </p>
        </div>
      </div>

      <details className="processing-details">
        <summary>
          <span>Ver andamento</span>
          <Icon name="chevron-down" size={14} />
        </summary>
        <ol className="processing-steps" aria-label="Etapas aproximadas da consulta">
          {STEPS.map((step, index) => {
            const state = index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'waiting';
            return (
              <li key={step.label} className={`processing-step processing-step-${state}`}>
                <span className="processing-step-marker" aria-hidden="true">
                  {state === 'done' ? '✓' : index + 1}
                </span>
                <span>{step.label}</span>
                {state === 'active' ? <small>Agora</small> : null}
              </li>
            );
          })}
        </ol>
        <p className="processing-disclaimer">
          As etapas são aproximadas. O tempo pode variar conforme a pergunta.
        </p>
      </details>
    </div>
  );
}
