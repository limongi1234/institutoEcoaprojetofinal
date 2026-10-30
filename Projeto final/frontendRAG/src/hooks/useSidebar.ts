import { useCallback, useEffect, useState } from 'react';

const COLLAPSED_KEY = 'nexo_sidebar_collapsed';
const DESKTOP_QUERY = '(min-width: 768px)';

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Controla a sidebar nos dois formatos: drawer no mobile (abre/fecha)
 * e coluna recolhível no desktop (preferência lembrada entre visitas).
 */
export function useSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleCollapsed = useCallback(() => setCollapsed((curr) => !curr), []);

  useEffect(() => {
    try {
      window.localStorage.setItem(COLLAPSED_KEY, String(collapsed));
    } catch {
      // Storage bloqueado: a preferência vale só para esta visita.
    }
  }, [collapsed]);

  useEffect(() => {
    if (!mobileOpen) return;

    // Trava a rolagem da página para o toque não "vazar" para o conteúdo atrás do drawer.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    // Ao girar a tela ou alargar a janela, o drawer não faz mais sentido.
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const handleViewportChange = () => {
      if (desktop.matches) setMobileOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    desktop.addEventListener('change', handleViewportChange);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      desktop.removeEventListener('change', handleViewportChange);
    };
  }, [mobileOpen]);

  return { mobileOpen, openMobile, closeMobile, collapsed, toggleCollapsed };
}
