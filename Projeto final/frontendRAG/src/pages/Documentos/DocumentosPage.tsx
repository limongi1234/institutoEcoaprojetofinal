import { useMemo, useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { EmptyState, ErrorState, LoadMore, LoadingState } from '../../components/ui/AsyncState';
import { DetailList } from '../../components/catalog/DetailList';
import { DOCUMENT_TYPES, listDocuments } from '../../services/documents.service';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { naturezaLabel } from '../../constants/labels';
import type { DocumentoRecord } from '../../types/api';

interface DocumentosPageProps {
  onSearchQuery: (query: string) => void;
}

export function DocumentosPage({ onSearchQuery }: DocumentosPageProps) {
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState('');
  const debouncedBusca = useDebouncedValue(busca.trim());
  const filters = useMemo(() => ({ busca: debouncedBusca, tipo }), [debouncedBusca, tipo]);
  const list = usePaginatedList(listDocuments, filters);

  const handleConsultar = (doc: DocumentoRecord) => {
    const doOrgao = doc.orgao ? ` de ${doc.orgao}` : '';
    const assunto = doc.base_id === 'emails_sinteticos' ? 'a conversa sintética'
      : doc.natureza === 'normativa' ? 'a norma no documento'
      : doc.natureza === 'agregada' ? 'o registro de planejamento PCA'
      : doc.natureza === 'estruturada' ? 'o contrato' : 'a ata de registro';
    onSearchQuery(`O que diz ${assunto} "${doc.titulo}"${doOrgao}?`);
  };

  return (
    <div className="page-content-wrapper">
      <header className="page-header">
        <span className="page-eyebrow">ACERVO CONSULTÁVEL</span>
        <h1 className="page-title">Acervo de documentos</h1>
        <p className="page-description">
          Documentos do acervo e conversas sintéticas identificadas separadamente.
          Os cenários fictícios não comprovam fatos reais.
        </p>
      </header>

      <div className="catalog-filter-bar">
        <div className="catalog-search-field">
          <Icon name="search" size={15} />
          <input
            type="search"
            placeholder="Buscar documentos..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            aria-label="Buscar documentos"
          />
        </div>
        <div className="catalog-select-field">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            aria-label="Filtrar por tipo de documento"
          >
            <option value="">Todos os tipos</option>
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <Icon name="chevron-down" size={13} className="select-icon" />
        </div>
      </div>

      {list.status === 'loading' ? <LoadingState label="Carregando documentos..." /> : null}
      {list.status === 'error' && list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : null}
      {list.status === 'empty' ? <EmptyState title="Nenhum documento encontrado." /> : null}

      {list.status === 'success' ? (
        <>
          <div className="catalog-items-grid">
            {list.items.map((item) => (
              <article key={item.id} className="catalog-card">
                <div className="catalog-card-header">
                  <span className="catalog-card-tag">{item.tipo}</span>
                  {item.ano !== null ? <span className="catalog-year-pill">{item.ano}</span> : null}
                </div>

                <h2 className="catalog-card-title">{item.titulo}</h2>
                {item.orgao ? <p className="catalog-card-orgao">{item.orgao}</p> : null}
                {item.descricao ? <p className="catalog-card-objeto">{item.descricao}</p> : null}

                <DetailList
                  items={[
                    { label: 'Fonte', value: item.fonte },
                    { label: 'Natureza', value: naturezaLabel(item.natureza) },
                    { label: 'Formato', value: item.formato },
                  ]}
                />

                <div className="catalog-card-actions catalog-card-actions-split">
                  <button type="button" className="btn-card-action" onClick={() => handleConsultar(item)}>
                    <span>Consultar no NEXO</span>
                    <Icon name="arrow-up-right" size={14} />
                  </button>
                  {item.link ? (
                    <a href={item.link} target="_blank" rel="noreferrer" className="btn-external-link">
                      <span>Abrir na fonte</span>
                      <Icon name="external-link" size={14} />
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
          <LoadMore
            hasMore={list.hasMore}
            loading={list.loadingMore}
            error={list.loadMoreError}
            onLoadMore={list.loadMore}
          />
        </>
      ) : null}
    </div>
  );
}
