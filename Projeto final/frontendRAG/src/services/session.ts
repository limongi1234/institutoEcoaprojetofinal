// Sessão da conversa atual, guardada por aba (sessionStorage).
//
// O backend identifica o "novo usuário" pelo header `X-Session-Id` — mesma
// autorização do trace. Guardar por aba (e não em localStorage) faz a sessão
// morrer quando a aba fecha, sem acúmulo de identificadores no navegador.

const KEY = 'rag.session_id';

export function getSessionId(): string | null {
  return window.sessionStorage.getItem(KEY);
}

export function setSessionId(sessionId: string): void {
  window.sessionStorage.setItem(KEY, sessionId);
}

export function clearSessionId(): void {
  window.sessionStorage.removeItem(KEY);
}
