import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { PAGE_SIZE, usePaginatedList } from './usePaginatedList';

const range = (from: number, count: number) => Array.from({ length: count }, (_, i) => from + i);

describe('usePaginatedList', () => {
  it('carrega a primeira página e busca a seguinte pelo offset', async () => {
    const fetchPage = vi.fn(async (_filters: object, page: { limit: number; offset: number }) =>
      page.offset === 0 ? range(0, PAGE_SIZE) : range(PAGE_SIZE, 3)
    );
    const { result } = renderHook(() => usePaginatedList(fetchPage, {}));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.items).toHaveLength(PAGE_SIZE);
    expect(result.current.hasMore).toBe(true);

    await act(() => result.current.loadMore());

    expect(fetchPage).toHaveBeenLastCalledWith({}, { limit: PAGE_SIZE, offset: PAGE_SIZE });
    expect(result.current.items).toHaveLength(PAGE_SIZE + 3);
    expect(result.current.hasMore).toBe(false);
  });

  it('callback inline não causa loop nem repete a busca após re-render', async () => {
    const calls = vi.fn(async () => []);
    const { result, rerender } = renderHook(() => usePaginatedList(async () => calls(), {}));
    await waitFor(() => expect(result.current.status).toBe('empty'));
    rerender();
    await act(async () => {});
    expect(calls).toHaveBeenCalledTimes(1);
  });

  it('falha vira estado error com a mensagem real', async () => {
    const { result } = renderHook(() =>
      usePaginatedList(async () => Promise.reject(new Error('Inventário indisponível')), {})
    );
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('Inventário indisponível');
    expect(result.current.items).toEqual([]);
  });

  it('não substitui a busca atual por uma resposta antiga', async () => {
    let resolveOld!: (items: number[]) => void;
    const oldPage = new Promise<number[]>((resolve) => { resolveOld = resolve; });
    const fetchPage = vi.fn(async (filters: { busca: string }) => filters.busca === '' ? oldPage : [2]);
    const { result, rerender } = renderHook(({ busca }) => usePaginatedList(fetchPage, { busca }), {
      initialProps: { busca: '' },
    });
    rerender({ busca: 'novo' });
    await waitFor(() => expect(result.current.items).toEqual([2]));
    await act(async () => { resolveOld([1]); });
    expect(result.current.items).toEqual([2]);
  });

  it('recarrega do início quando os filtros mudam', async () => {
    const fetchPage = vi.fn(async () => [1]);
    const { result, rerender } = renderHook(({ busca }) => usePaginatedList(fetchPage, { busca }), {
      initialProps: { busca: '' },
    });
    await waitFor(() => expect(result.current.status).toBe('success'));

    rerender({ busca: 'software' });

    await waitFor(() =>
      expect(fetchPage).toHaveBeenLastCalledWith({ busca: 'software' }, { limit: PAGE_SIZE, offset: 0 })
    );
  });
});
