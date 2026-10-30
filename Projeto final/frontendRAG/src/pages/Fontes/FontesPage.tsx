import { Icon } from '../../components/ui/Icon';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/AsyncState';
import { DetailList } from '../../components/catalog/DetailList';
import { listSources } from '../../services/sources.service';
import { useApiResource } from '../../hooks/useApiResource';
import { naturezaLabel } from '../../constants/labels';

export function FontesPage() {
  const { status, data, error, reload } = useApiResource(listSources, []);

  return (
    <div className="page-content-wrapper">
      <header className="page-header">
        <span className="page-eyebrow">TRANSPARÊNCIA E PROVENIÊNCIA</span>
        <h1 className="page-title">Fontes oficiais</h1>
        <p className="page-description">
          Bases oficiais declaradas no manifesto do acervo. São elas que fundamentam as respostas.
        </p>
      </header>

      {status === 'loading' ? <LoadingState label="Carregando fontes..." /> : null}
      {status === 'error' && error ? <ErrorState message={error} onRetry={reload} /> : null}
      {status === 'empty' ? (
        <EmptyState title="Nenhuma fonte oficial declarada no manifesto." />
      ) : null}

      {status === 'success' && data ? (
        <div className="catalog-items-grid">
          {data.map((source) => (
            <article key={source.id} className="catalog-card">
              <div className="catalog-card-header">
                {source.sigla ? <span className="orgao-sigla-badge">{source.sigla}</span> : <span />}
                <span className="source-freq-tag">{naturezaLabel(source.natureza)}</span>
              </div>

              <h2 className="catalog-card-title">{source.nome}</h2>
              {source.instituicao ? (
                <p className="source-institution-text">{source.instituicao}</p>
              ) : null}
              {/* Evita repetir o nome quando o manifesto usa o mesmo texto como descrição. */}
              {source.descricao && source.descricao !== source.nome ? (
                <p className="catalog-card-objeto">{source.descricao}</p>
              ) : null}

              <DetailList
                items={[
                  { label: 'Tipo de informação', value: source.tipo_informacao },
                  { label: 'Escopo', value: source.escopo },
                  { label: 'Formatos', value: source.formatos.join(', ') },
                  { label: 'Frequência de coleta', value: source.frequencia_coleta },
                ]}
              />

              {source.url ? (
                <div className="catalog-card-actions">
                  <a href={source.url} target="_blank" rel="noreferrer" className="btn-external-link">
                    <span>Acessar portal oficial</span>
                    <Icon name="external-link" size={14} />
                  </a>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
