import { useMemo, useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { EmptyState, ErrorState, LoadMore, LoadingState } from '../../components/ui/AsyncState';
import { DetailList } from '../../components/catalog/DetailList';
import { listOrganizations } from '../../services/organizations.service';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { formatCurrency, formatNumber } from '../../utils/format';
import type { OrgaoRecord } from '../../types/api';

interface OrgaosPageProps {
  onSearchQuery: (query: string) => void;
}

function TagList({ title, values }: { title: string; values: string[] }) {
  if (values.length === 0) return null;
  return (
    <div className="orgao-tags-section">
      <span className="detail-label">{title}</span>
      <div className="orgao-tags-list">
        {values.map((value) => (
          <span key={value} className="orgao-tag-item">
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

export function OrgaosPage({ onSearchQuery }: OrgaosPageProps) {
  const [busca, setBusca] = useState('');
  const debouncedBusca = useDebouncedValue(busca.trim());
  const filters = useMemo(() => ({ busca: debouncedBusca }), [debouncedBusca]);
  const list = usePaginatedList(listOrganizations, filters);

  const handleConsultar = (orgao: OrgaoRecord) => {
    onSearchQuery(`Quais são as principais contratações de ${orgao.nome}?`);
  };

  return (
    <div className="page-content-wrapper">
      <header className="page-header">
        <span className="page-eyebrow">ADMINISTRAÇÃO PÚBLICA</span>
        <h1 className="page-title">Órgãos contratantes</h1>
        <p className="page-description">
          Órgãos com contratações na base estruturada, com totais calculados pelo servidor.
        </p>
      </header>

      <div className="catalog-filter-bar">
        <div className="catalog-search-field full-width">
          <Icon name="search" size={15} />
          <input
            type="search"
            placeholder="Buscar pelo nome do órgão..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            aria-label="Buscar órgão contratante"
          />
        </div>
      </div>

      {list.status === 'loading' ? <LoadingState label="Carregando órgãos..." /> : null}
      {list.status === 'error' && list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : null}
      {list.status === 'empty' ? <EmptyState title="Nenhum órgão encontrado." /> : null}

      {list.status === 'success' ? (
        <>
          <div className="catalog-items-grid">
            {list.items.map((item) => (
              <article key={item.cnpj ?? item.nome} className="catalog-card">
                <div className="catalog-card-header">
                  {item.sigla ? <span className="orgao-sigla-badge">{item.sigla}</span> : <span />}
                  {item.esfera ? <span className="orgao-esfera-tag">{item.esfera}</span> : null}
                </div>

                <h2 className="catalog-card-title">{item.nome}</h2>

                <div className="orgao-metrics-grid">
                  <div className="orgao-metric-box">
                    <span className="metric-num">{formatNumber(item.total_contratacoes)}</span>
                    <span className="metric-lbl">Contratações no acervo</span>
                  </div>
                  <div className="orgao-metric-box">
                    <span className="metric-num-highlight">{formatCurrency(item.valor_total)}</span>
                    <span className="metric-lbl">Valor total</span>
                  </div>
                </div>

                <DetailList
                  items={[
                    { label: 'Município', value: item.municipio },
                    { label: 'CNPJ', value: item.cnpj },
                  ]}
                />

                <TagList title="Principais fornecedores" values={item.principais_fornecedores} />
                <TagList title="Principais categorias" values={item.principais_categorias} />

                <div className="catalog-card-actions">
                  <button type="button" className="btn-card-action" onClick={() => handleConsultar(item)}>
                    <span>Consultar contratações deste órgão</span>
                    <Icon name="arrow-up-right" size={14} />
                  </button>
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
