import { BASE_LABELS, FILTER_REASONS } from './traceLabels';

const FIELD_LABELS: Record<string, string> = { data_vigencia: 'Ano/período de vigência', orgao: 'Órgão', valor: 'Valor', esfera: 'Esfera', data_assinatura: 'Data de assinatura', data_resultado: 'Data do resultado', data_publicacao: 'Data de publicação', ano_pca: 'Ano do PCA', ano: 'Ano' };
const OPERATOR_LABELS: Record<string, string> = { contains: 'contém', '==': 'igual a', '>=': 'a partir de', '>': 'acima de', '<=': 'até', '<': 'antes de' };
const recordOf = (value: unknown): Record<string, unknown> | null => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
const labelField = (field: string) => FIELD_LABELS[field] ?? field.replaceAll('_', ' ');
const displayValue = (value: unknown) => typeof value === 'string' ? `“${value}”` : String(value);

function AppliedFilter({ field, value }: { field: string; value: unknown }) {
  if (Array.isArray(value)) return <>{value.map((condition, index) => <AppliedFilter key={`${field}-${index}`} field={field} value={condition} />)}</>;
  const condition = recordOf(value); const operator = condition?.operator; const actual = condition && 'value' in condition ? condition.value : value;
  if (actual === undefined || actual === null || actual === false || field === 'optional') return null;
  return <p><strong>{labelField(field)}</strong>{operator ? ` ${OPERATOR_LABELS[String(operator)] ?? String(operator)} ` : ': '}{displayValue(actual)}</p>;
}
function IgnoredFilters({ ignored }: { ignored: Record<string, unknown> }) {
  const grouped = Object.entries(ignored).flatMap(([baseOrField, value]) => { const reasons = recordOf(value); if (!reasons) return [{ base: '', field: baseOrField, reason: String(value) }]; return Object.entries(reasons).flatMap(([reason, fields]) => (Array.isArray(fields) ? fields : [fields]).filter((field) => typeof field === 'string').map((field) => ({ base: baseOrField, field: String(field), reason }))); });
  return <>{grouped.map(({ base, field, reason }, index) => <p key={`${base}-${field}-${reason}-${index}`}><strong>{base ? `${BASE_LABELS[base] ?? base.replaceAll('_', ' ')} — ` : ''}{labelField(field)}:</strong>{' '}{FILTER_REASONS[reason] ?? reason.replaceAll('_', ' ')}</p>)}</>;
}
export function FiltersBlock({ detalhes }: { detalhes: Record<string, unknown> }) {
  const applied = recordOf(detalhes.filtros), ignored = recordOf(detalhes.filtros_ignorados);
  const hasApplied = Boolean(applied && Object.entries(applied).some(([key, value]) => key !== 'optional' && value !== null && value !== undefined && value !== false)); const hasIgnored = Boolean(ignored && Object.keys(ignored).length);
  if (!hasApplied && !hasIgnored) return null;
  return <div className="trace-filters">{hasApplied && applied ? <section><h4>Filtros aplicados</h4>{Object.entries(applied).map(([field, value]) => <AppliedFilter key={field} field={field} value={value} />)}</section> : null}{hasIgnored && ignored ? <section><h4>Filtros não aplicados</h4><IgnoredFilters ignored={ignored} /></section> : null}</div>;
}
