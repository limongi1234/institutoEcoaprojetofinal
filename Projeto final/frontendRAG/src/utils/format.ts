// Formatação de valores da API. `null` sempre vira "não informado": nada é inferido.

export const NOT_AVAILABLE = 'Não informado';

export function orNotAvailable(value: string | number | null | undefined): string {
  return value === null || value === undefined || value === '' ? NOT_AVAILABLE : String(value);
}

export function formatCurrency(value: number | null): string {
  return value === null
    ? NOT_AVAILABLE
    : value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return NOT_AVAILABLE;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR');
}
