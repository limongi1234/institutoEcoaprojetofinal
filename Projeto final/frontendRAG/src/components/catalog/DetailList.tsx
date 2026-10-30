import { NOT_AVAILABLE } from '../../utils/format';

export interface DetailItem {
  label: string;
  value: string | number | null | undefined;
}

/** Pares rótulo/valor de um registro; valores ausentes aparecem como "não informado". */
export function DetailList({ items }: { items: DetailItem[] }) {
  return (
    <dl className="catalog-card-details">
      {items.map(({ label, value }) => {
        const missing = value === null || value === undefined || value === '';
        return (
          <div key={label} className="detail-row">
            <dt className="detail-label">{label}</dt>
            <dd className={missing ? 'detail-value is-missing' : 'detail-value'}>
              {missing ? NOT_AVAILABLE : value}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
