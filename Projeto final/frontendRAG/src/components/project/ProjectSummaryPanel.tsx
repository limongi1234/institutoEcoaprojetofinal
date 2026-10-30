import { EmptyState, ErrorState, LoadingState } from '../ui/AsyncState';
import { DetailList } from '../catalog/DetailList';
import { getProjectSummary } from '../../services/project.service';
import { useApiResource } from '../../hooks/useApiResource';
import { naturezaLabel } from '../../constants/labels';
import { formatDateTime, formatNumber } from '../../utils/format';

interface ProjectSummaryPanelProps {
  /** Versão curta (página Sobre): sem a tabela de bases. */
  compact?: boolean;
}

/**
 * Resumo do snapshot que a API verificou como ativo. Os números e avisos vêm
 * de GET /api/v1/project/summary; esta interface não seleciona nem promove versões.
 */
export function ProjectSummaryPanel({ compact = false }: ProjectSummaryPanelProps) {
  const { status, data, error, reload } = useApiResource(getProjectSummary, []);

  if (status === 'loading') return <LoadingState label="Carregando dados do acervo..." />;
  if (status === 'error' && error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <EmptyState title="Resumo do acervo indisponível." />;

  const active = data.corpus_ativo;
  const previous = data.snapshot_anterior;
  const chunks = active?.total_chunks;
  const vectors = active?.total_vetores;
  const missingVectors = active?.chunks_sem_vetor;
  const vectorCoverage = missingVectors == null || vectors == null
    ? 'Não verificada'
    : missingVectors === 0
      ? 'Completa'
      : `Parcial (${formatNumber(missingVectors)} sem vetor)`;
  const mb = active?.bytes_documents ? Math.round(active.bytes_documents / (1024 * 1024)) : null;

  return (
    <section className="project-summary" aria-labelledby="project-summary-title">
      <h2 id="project-summary-title" className="project-summary-title">
        {data.projeto}
      </h2>
      {data.descricao ? <p className="project-summary-desc">{data.descricao}</p> : null}

      <div className="project-metrics">
        <div className="orgao-metric-box">
          <span className="metric-num">{chunks == null ? 'Não verificado' : formatNumber(chunks)}</span>
          <span className="metric-lbl">Chunks normalizados</span>
        </div>
        <div className="orgao-metric-box">
          <span className="metric-num">
            {vectors === null || vectors === undefined ? 'Não verificado' : formatNumber(vectors)}
          </span>
          <span className="metric-lbl">Vetores FAISS</span>
        </div>
        <div className="orgao-metric-box">
          <span className="metric-num">{active?.schema_sql ?? 'Não verificado'}</span>
          <span className="metric-lbl">Schema SQL</span>
        </div>
      </div>

      <DetailList
        items={[
          { label: 'Cenário', value: data.scenario_id },
          { label: 'Versão do corpus', value: active?.versao ?? 'Não verificada' },
          { label: 'Inventário de coleta', value: data.versao_inventario ?? data.versao_corpus },
          { label: 'Snapshot', value: active?.snapshot_id },
          { label: 'Construído em', value: active?.construido_em ? formatDateTime(active.construido_em) : null },
          { label: 'Cobertura vetorial', value: vectorCoverage },
          { label: 'Versão do manifesto', value: data.versao_manifesto },
          { label: 'documents.jsonl', value: mb === null ? null : `${mb} MB` },
        ]}
      />

      {active?.avisos.map((warning) => (
        <p className="project-summary-desc" key={warning}>{warning}</p>
      ))}

      {!compact && previous ? (
        <p className="project-summary-desc">
          Inventário de coleta anterior {previous.versao} ({formatNumber(previous.arquivos)} arquivos,
          coletado em {previous.coletado_em ? formatDateTime(previous.coletado_em) : '—'})
          {previous.backup ? ` preservado em ${previous.backup}` : ''}. Ele não descreve o acervo
          ativo nem garante cobertura integral. Um arquivo de origem pode conter vários contratos.
        </p>
      ) : null}

      {!compact && data.bases.length > 0 ? (
        <div className="project-bases">
          <h3 className="project-bases-title">Bases do acervo</h3>
          <div className="table-scroll">
            <table className="project-bases-table">
              <thead>
                <tr>
                  <th scope="col">Base</th>
                  <th scope="col">Natureza</th>
                  <th scope="col">Escopo</th>
                  <th scope="col">Situação</th>
                  <th scope="col" className="num">Chunks</th>
                </tr>
              </thead>
              <tbody>
                {data.bases.map((base) => (
                  <tr key={base.base_id}>
                    <td>
                      <code>{base.base_id}</code>
                    </td>
                    <td>{naturezaLabel(base.natureza)}</td>
                    <td>{base.escopo}</td>
                    <td>{base.status ?? 'Não informado'}</td>
                    <td className="num">
                      {base.chunks_ativos == null ? 'Não informado' : formatNumber(base.chunks_ativos)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}