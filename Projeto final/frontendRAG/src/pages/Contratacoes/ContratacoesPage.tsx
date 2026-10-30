import { useMemo, useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { EmptyState, ErrorState, LoadMore, LoadingState } from '../../components/ui/AsyncState';
import { DetailList } from '../../components/catalog/DetailList';
import { listContracts } from '../../services/contracts.service';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { formatCurrency } from '../../utils/format';
import type { ContratacaoRecord } from '../../types/api';

interface ContratacoesPageProps {
  onSearchQuery: (query: string) => void;
}

export function ContratacoesPage({ onSearchQuery }: ContratacoesPageProps) {
  const [busca, setBusca] = useState('');
  const [orgao, setOrgao] = useState('');
  const debouncedBusca = useDebouncedValue(busca.trim());
  const debouncedOrgao = useDebouncedValue(orgao.trim());
  const filters = useMemo(
    () => ({ busca: debouncedBusca, orgao: debouncedOrgao }),
    [debouncedBusca, debouncedOrgao]
  );
  const list = usePaginatedList(listContracts, filters);

  const handleConsultar = (contrato: ContratacaoRecord) => {
    const doOrgao = contrato.orgao ? ` do órgão ${contrato.orgao}` : '';
    onSearchQuery(`Quais são os detalhes do contrato PNCP ${contrato.id}${doOrgao}?`);
  };

  return (
    <div className="page-content-wrapper">
      <header className="page-header">
        <span className="page-eyebrow">EXPLORAR ACERVO</span>
        <h1 className="page-title">Contratações públicas</h1>
        <p className="page-description">
          Contratos registrados na base estruturada do acervo, com fornecedor, objeto e valor.
        </p>
      </header>

      <div className="catalog-filter-bar">
        <div className="catalog-search-field">
          <Icon name="search" size={15} />
          <input
            type="search"
            placeholder="Objeto, fornecedor, contrato ou órgão..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            aria-label="Buscar contratações"
          />
        </div>
        <div className="catalog-search-field">
          <Icon name="building" size={15} />
          <input
            type="search"
            placeholder="Filtrar por órgão..."
            value={orgao}
            onChange={(e) => setOrgao(e.target.value)}
            aria-label="Filtrar por nome do órgão"
          />
        </div>
      </div>

      {list.status === 'loading' ? <LoadingState label="Carregando contratações..." /> : null}
      {list.status === 'error' && list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : null}
      {list.status === 'empty' ? <EmptyState title="Nenhuma contratação encontrada." /> : null}

      {list.status === 'success' ? (
        <>
          <div className="catalog-items-grid">
            {list.items.map((item) => (
              <article key={item.id} className="catalog-card">
                <div className="catalog-card-header">
                  <span className="catalog-card-tag">{item.fonte_oficial}</span>
                  {item.esfera ? <span className="catalog-status-pill">{item.esfera}</span> : null}
                </div>

                <h2 className="catalog-card-title">{item.numero_contrato}</h2>
                {item.orgao ? <p className="catalog-card-orgao">{item.orgao}</p> : null}
                {item.objeto ? <p className="catalog-card-objeto">{item.objeto}</p> : null}

                <DetailList
                  items={[
                    { label: 'Fornecedor', value: item.fornecedor },
                    {
                      label: 'Valor global',
                      value: item.valor_global === null ? null : formatCurrency(item.valor_global),
                    },
                    { label: 'Município', value: item.municipio },
                    { label: 'Modalidade', value: item.modalidade },
                    { label: 'Situação', value: item.status },
                    { label: 'Homologação', value: item.data_homologacao },
                  ]}
                />

                <div className="catalog-card-actions">
                  <button type="button" className="btn-card-action" onClick={() => handleConsultar(item)}>
                    <span>Consultar no NEXO</span>
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
