import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  SessionTraceResponse,
  TraceIntegrity,
  TraceResponse,
  TraceStage,
  TraceSummary,
} from '../../types/api';
import { getQuestionTrace, getSessionTrace } from '../../services/trace.service';
import { errorMessage } from '../../hooks/useApiResource';
import { Icon } from '../ui/Icon';
import { EvidenceTable as DetailedEvidenceTable, ranksBefore } from './EvidenceTable';
import { FiltersBlock } from './FiltersBlock';
import { ModelUsage } from './ModelUsage';
import { StageNotes } from './StageNotes';
import { formatMs, STAGE_LABELS, STATUS_PRESENTATION } from './traceLabels';

interface TracePanelProps {
  sessionId: string;
  queryId?: string;
  onClose: () => void;
}

type PanelSelection = { kind: 'session' } | { kind: 'question'; queryId: string };

const INTEGRITY_PRESENTATION: Record<TraceIntegrity['status'], { label: string; semantic: 'success' | 'neutral' | 'danger' }> = {
  valida: { label: 'Cadeia íntegra', semantic: 'success' },
  parcial: { label: 'Cadeia sem quebras', semantic: 'neutral' },
  legado: { label: 'Log legado', semantic: 'neutral' },
  invalida: { label: 'Cadeia quebrada', semantic: 'danger' },
  nao_verificada: { label: 'Aguardando conferência', semantic: 'neutral' },
};

const INTEGRITY_REASONS: Record<string, string> = {
  verificacao_em_andamento: 'A verificação está em andamento.',
  cadeia_desligada: 'A cadeia de hashes está desligada no backend.',
};

function formatVerificationDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }).format(date);
}

function metric(value: number | null): string {
  return value === null ? '—' : value.toLocaleString('pt-BR');
}

function IntegritySummary({ integrity, onRefresh }: { integrity?: TraceIntegrity | null; onRefresh: () => void }) {
  if (!integrity) return null;
  const presentation = INTEGRITY_PRESENTATION[integrity.status] ?? INTEGRITY_PRESENTATION.nao_verificada;
  const verifiedAt = formatVerificationDate(integrity.verificado_em);
  const reason = integrity.motivo
    ? INTEGRITY_REASONS[integrity.motivo] ?? integrity.motivo.replace(/^erro_na_verificacao:/, 'Erro na verificação: ')
    : null;
  return (
    <section className={`trace-integrity trace-integrity-${presentation.semantic}`} aria-labelledby="trace-integrity-title">
      <div className="trace-integrity-heading">
        <h3 id="trace-integrity-title">Integridade do log</h3>
        <span className={`trace-integrity-badge trace-integrity-badge-${presentation.semantic}`}>{presentation.label}</span>
      </div>
      <p className="trace-integrity-description">Cada etapa de cada pergunta vira uma linha no log, e cada linha guarda o hash da anterior, como os elos de uma corrente. Alterar, apagar ou trocar a ordem de uma linha quebra a corrente naquele ponto.</p>
      <dl className="trace-integrity-stats">
        <div><dd>{metric(integrity.registros_verificados)}</dd><dt>Linhas encadeadas</dt></div>
        <div><dd>{metric(integrity.registros_legados)}</dd><dt>Linhas anteriores à cadeia</dt></div>
        <div><dd>{metric(integrity.problemas)}</dd><dt>Quebras</dt></div>
      </dl>
      <dl className="trace-integrity-meta">
        <div><dt>Algoritmo</dt><dd>{integrity.algoritmo ?? 'Não informado'}</dd></div>
        <div><dt>Cadeia</dt><dd>{integrity.motivo === 'cadeia_desligada' ? 'Desligada' : 'Ligada'}</dd></div>
        <div><dt>Conferido em</dt><dd>{verifiedAt ?? 'Aguardando verificação'}</dd></div>
      </dl>
      {reason ? <p className="trace-integrity-reason">{reason}</p> : null}
      <p className="trace-integrity-note">A cadeia comprova que o log não foi alterado. Ela não comprova que a resposta da IA está correta.</p>
      <button type="button" className="trace-integrity-refresh" onClick={onRefresh}><Icon name="refresh-cw" size={15} /> Conferir de novo</button>
    </section>
  );
}

function HashDetails({ stage }: { stage: TraceStage }) {
  if (!stage.hash) return <p className="trace-hash-legacy">Registro anterior à cadeia de hashes</p>;
  return (
    <section className="trace-hash-details" aria-label={`Hashes da etapa ${stage.ordem}`}>
      <dl>
        <div><dt>Hash da etapa</dt><dd><code>{stage.hash}</code></dd></div>
        <div><dt>Hash anterior no log global</dt><dd><code>{stage.hash_anterior ?? 'não informado'}</code></dd></div>
      </dl>
      <p>O registro anterior pode pertencer a outra requisição; a validação é feita pelo backend.</p>
    </section>
  );
}

function countVectorEvidence(value: TraceSummary['evidencias_vetorial']): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object') return Object.values(value).reduce((sum, item) => sum + Number(item || 0), 0);
  return 0;
}

function SummaryBadges({ summary, totalMs }: { summary: TraceSummary; totalMs: number }) {
  const cited = Array.isArray(summary.fontes_citadas) ? summary.fontes_citadas.length : Number(summary.num_fontes ?? 0);
  const sql = summary.consultou_sql ? (summary.sql_retornou_evidencia === false ? 'SQL — sem resultado' : 'SQL') : '';
  const vector = summary.consultou_vetorial ? (summary.vetorial_retornou_evidencia === false ? 'Vetorial — sem resultado' : 'Vetorial') : '';
  return (
    <div className="trace-summary-grid">
      <div><span>Bases consultadas</span><strong>{[sql, vector].filter(Boolean).join(' · ') || 'Nenhuma'}</strong></div>
      <div><span>Evidências SQL</span><strong>{Number(summary.evidencias_sql ?? 0)}</strong></div>
      <div><span>Evidências vetoriais</span><strong>{countVectorEvidence(summary.evidencias_vetorial)}</strong></div>
      <div><span>Fontes citadas</span><strong>{cited}</strong></div>
      <div><span>Resultado</span><strong>{summary.is_refusal ? 'Recusada' : String(summary.confidence_level ?? 'Concluída')}</strong></div>
      <div><span>Tempo total</span><strong>{formatMs(totalMs)}</strong></div>
    </div>
  );
}

function JsonBlock({ value }: { value: unknown }) {
  if (value === null || value === undefined) return null;
  return <pre className="trace-code-block">{typeof value === 'string' ? value : JSON.stringify(value, null, 2)}</pre>;
}

function StageCard({ stage, previousRanks }: { stage: TraceStage; previousRanks: Map<string, number> }) {
  const sql = stage.detalhes.sql;
  const rows = stage.detalhes.linhas ?? stage.detalhes.resultado;
  const nestedResponse = stage.detalhes.resposta && typeof stage.detalhes.resposta === 'object'
    ? stage.detalhes.resposta as Record<string, unknown>
    : null;
  const prompt = stage.detalhes.prompt ?? nestedResponse?.prompt;
  const status = String(stage.detalhes.outcome ?? stage.status);
  const statusPresentation = STATUS_PRESENTATION[status] ?? { label: status, semantic: 'neutral' };
  const envelope = ['interacao', 'requisicao_inicio', 'pipeline_inicio', 'pipeline_fim', 'persistencia_historico', 'requisicao_fim'].includes(stage.stage);
  return (
    <li className={`trace-stage-card${envelope ? ' trace-stage-envelope' : ''}`}>
      <div className="trace-stage-marker" aria-hidden="true" />
      <div className="trace-stage-content">
        <div className="trace-stage-heading">
          <div><strong>{STAGE_LABELS[stage.stage] ?? stage.stage.replaceAll('_', ' ')}</strong>{stage.base ? <span className={`trace-base-badge trace-base-${stage.base}`}>{stage.base === 'sql' ? 'SQL' : 'Vetorial'}</span> : null}</div>
          <span>{formatMs(stage.latencia_ms)}</span>
        </div>
        <span className={`trace-status trace-status-${statusPresentation.semantic}`}>{statusPresentation.label}</span>
        <HashDetails stage={stage} />
        {stage.detalhes.tentativa_busca === 2 && ['retrieval_denso', 'retrieval_bm25', 'fusao_rrf', 'rerank'].includes(stage.stage) ? <span className="trace-attempt">2ª tentativa · sem filtros</span> : null}
        <details className="trace-stage-details">
          <summary>Ver detalhes</summary>
          <DetailedEvidenceTable stage={stage} previousRanks={previousRanks} />
          <FiltersBlock detalhes={stage.detalhes} />
          <StageNotes stage={stage} />
          <ModelUsage stage={stage} />
          {sql ? <section><h4>SQL executado</h4><JsonBlock value={sql} /></section> : null}
          {rows ? <section><h4>Resultado</h4><JsonBlock value={rows} /></section> : null}
          {prompt ? <details><summary>Ver prompt</summary><JsonBlock value={prompt} /></details> : null}
          <details><summary>Entrada e saída</summary><h4>Entrada</h4><JsonBlock value={stage.input} /><h4>Saída</h4><JsonBlock value={stage.output} /></details>
        </details>
      </div>
    </li>
  );
}

function QuestionTraceView({ trace, onRefreshIntegrity }: { trace: TraceResponse; onRefreshIntegrity: () => void }) {
  return (
    <>
      {trace.completo === false ? <div className="trace-incomplete">Processamento não terminou — trace incompleto</div> : null}
      <p className="trace-question">{trace.pergunta ?? 'Pergunta sem texto registrado'}</p>
      <IntegritySummary integrity={trace.integridade} onRefresh={onRefreshIntegrity} />
      <SummaryBadges summary={trace.resumo} totalMs={trace.latencia_pipeline_ms ?? trace.latencia_total_ms} />
      {trace.latencia_metodo === 'soma_etapas_legado' ? <small>tempo estimado</small> : null}
      <ol className="trace-timeline">
        {trace.etapas.map((stage, index) => <StageCard key={`${stage.ordem}-${stage.stage}`} stage={stage} previousRanks={stage.stage === 'rerank' ? ranksBefore(trace.etapas, index) : new Map()} />)}
      </ol>
    </>
  );
}

function SessionTraceView({ trace, onQuestion }: { trace: SessionTraceResponse; onQuestion: (queryId: string) => void }) {
  return (
    <>
      <div className="trace-session-summary">
        <div><strong>{trace.total_perguntas}</strong><span>Perguntas</span></div>
        <div><strong>{trace.consultou_sql}</strong><span>Usaram SQL</span></div>
        <div><strong>{trace.consultou_vetorial}</strong><span>Usaram busca vetorial</span></div>
      </div>
      <ol className="trace-session-list">
        {trace.perguntas.map((question) => (
          <li key={question.query_id}>
            <button type="button" onClick={() => onQuestion(question.query_id)}>
              <span className="trace-session-order">{question.ordem}</span>
              <span><strong>{question.pergunta ?? 'Pergunta sem texto registrado'}</strong><small>{formatMs(question.latencia_total_ms)}</small></span>
              <span className="trace-session-badges">{question.resumo.consultou_sql ? <em>SQL</em> : null}{question.resumo.consultou_vetorial ? <em>Vetorial</em> : null}</span>
              <Icon name="chevron-right" size={16} />
            </button>
          </li>
        ))}
      </ol>
    </>
  );
}

export function TracePanel({ sessionId, queryId, onClose }: TracePanelProps) {
  const [selection, setSelection] = useState<PanelSelection>(queryId ? { kind: 'question', queryId } : { kind: 'session' });
  const [data, setData] = useState<TraceResponse | SessionTraceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const previousSelectionRef = useRef(selection.kind === 'question' ? `question:${selection.queryId}` : 'session');

  const changeSelection = useCallback((next: PanelSelection) => {
    // Evita renderizar temporariamente o payload da conversa como pergunta
    // (ou vice-versa) enquanto a próxima requisição ainda não começou.
    setData(null);
    setError(null);
    setLoading(true);
    setSelection(next);
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      setData(selection.kind === 'question' ? await getQuestionTrace(selection.queryId, sessionId) : await getSessionTrace(sessionId));
    } catch (err) {
      setError(errorMessage(err)); setData(null);
    } finally { setLoading(false); }
  }, [selection, sessionId, attempt]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const selectionKey = selection.kind === 'question' ? `question:${selection.queryId}` : 'session';
    if (previousSelectionRef.current !== selectionKey) {
      // O controle acionado sai do DOM quando a visão muda. Reposiciona o foco
      // num destino previsível para o fluxo por teclado não cair no <body>.
      if (selection.kind === 'question' && !queryId) backButtonRef.current?.focus();
      else titleRef.current?.focus();
      previousSelectionRef.current = selectionKey;
    }
  }, [selection, queryId]);
  useEffect(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!panelRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      returnFocusRef.current?.focus();
    };
  }, [onClose]);

  return (
    <div className="trace-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={panelRef} className="trace-panel" role="dialog" aria-modal="true" aria-labelledby="trace-panel-title">
        <header className="trace-panel-header">
          <div>
            {selection.kind === 'question' && !queryId ? <button ref={backButtonRef} type="button" className="trace-back" onClick={() => changeSelection({ kind: 'session' })}>← Conversa</button> : null}
            <span className="composer-eyebrow">Transparência</span>
            <h2 ref={titleRef} id="trace-panel-title" tabIndex={-1}>{selection.kind === 'question' ? 'Caminho da pergunta' : 'Caminho da conversa'}</h2>
          </div>
          <button ref={closeButtonRef} type="button" className="trace-close" onClick={onClose} aria-label="Fechar caminho"><Icon name="x" size={20} /></button>
        </header>
        <div className="trace-panel-body">
          {loading ? <div className="trace-loading"><span /><span /><span /> Carregando caminho...</div> : null}
          {error ? <div className="trace-error" role="alert"><Icon name="info" size={18} /><div><strong>Não foi possível abrir o caminho</strong><p>{error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)}>Tentar de novo</button></div></div> : null}
          {!loading && !error && data && selection.kind === 'question' ? <QuestionTraceView trace={data as TraceResponse} onRefreshIntegrity={() => { closeButtonRef.current?.focus(); setAttempt((value) => value + 1); }} /> : null}
          {!loading && !error && data && selection.kind === 'session' ? <SessionTraceView trace={data as SessionTraceResponse} onQuestion={(id) => changeSelection({ kind: 'question', queryId: id })} /> : null}
        </div>
      </section>
    </div>
  );
}
