import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { json, stubFetch } from '../test/http';
import { useRagWorkspace } from './useRagWorkspace';

function response(query: string, queryId: string, sessionId = 's_1234567890123456') {
  return {
    query_id: queryId,
    session_id: sessionId,
    query,
    answer: `Resposta para ${query}`,
    bases_consultadas: ['estruturada'],
    sources_used: [],
    confidence_level: 'alta',
    is_refusal: false,
    refusal_reason: null,
  };
}

describe('useRagWorkspace', () => {
  it('guarda a sessão por aba, reenvia contexto e descarta em Nova conversa', async () => {
    let call = 0;
    const { calls } = stubFetch((request) => {
      const currentCall = ++call;
      const sessionId = currentCall < 4 ? 's_1234567890123456' : 's_2234567890123456';
      return json(200, response(String((request.body as { query: string }).query), `q_${currentCall}`, sessionId));
    });
    const { result } = renderHook(() => useRagWorkspace());

    await act(() => result.current.submitQuery('Primeira pergunta'));
    expect(window.sessionStorage.getItem('nexo:conversation-session-id')).toBe('s_1234567890123456');
    expect(window.sessionStorage.getItem('nexo:conversation-session-ids')).toBe(JSON.stringify(['s_1234567890123456']));

    await act(() => result.current.submitQuery('E depois?'));
    expect(calls[1].body).toMatchObject({
      session_id: 's_1234567890123456',
      historico: [{ pergunta: 'Primeira pergunta', resposta: 'Resposta para Primeira pergunta' }],
    });

    await act(() => result.current.submitQuery('E por fim?'));
    expect(calls[2].body).toMatchObject({
      session_id: 's_1234567890123456',
      historico: [
        { pergunta: 'Primeira pergunta', resposta: 'Resposta para Primeira pergunta' },
        { pergunta: 'E depois?', resposta: 'Resposta para E depois?' },
      ],
    });

    act(() => result.current.startNewConversation());
    expect(window.sessionStorage.getItem('nexo:conversation-session-id')).toBeNull();
    expect(window.sessionStorage.getItem('nexo:conversation-session-ids')).toBe(JSON.stringify(['s_1234567890123456']));
    expect(result.current.turns).toHaveLength(0);

    await act(() => result.current.submitQuery('Pergunta da nova conversa'));
    expect(calls[3].body).toEqual({ query: 'Pergunta da nova conversa', top_k: 5 });
    expect(window.sessionStorage.getItem('nexo:conversation-session-ids')).toBe(
      JSON.stringify(['s_1234567890123456', 's_2234567890123456'])
    );
  });

  it('ao receber 422 por sessão restaurada, limpa o id e tenta uma vez sem ele', async () => {
    window.sessionStorage.setItem('nexo:conversation-session-id', 's_1234567890123456');
    let call = 0;
    const { calls } = stubFetch(() => ++call === 1 ? json(422, {}) : json(200, response('Pergunta', 'q_2', 's_nova_123456789012')));
    const { result } = renderHook(() => useRagWorkspace());

    await act(() => result.current.submitQuery('Pergunta'));
    await waitFor(() => expect(result.current.turns).toHaveLength(1));
    expect(calls).toHaveLength(2);
    expect(calls[0].body).toMatchObject({ session_id: 's_1234567890123456' });
    expect(calls[1].body).not.toHaveProperty('session_id');
    expect(window.sessionStorage.getItem('nexo:conversation-session-id')).toBe('s_nova_123456789012');
    expect(window.sessionStorage.getItem('nexo:conversation-session-ids')).toBe(JSON.stringify(['s_nova_123456789012']));
  });
});
