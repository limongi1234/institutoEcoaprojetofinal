import { useEffect, useRef, useState } from 'react';
import type { AppView } from '../../types/app';
import { useHealth, type HealthStatus } from '../../hooks/useHealth';
import { Icon, type IconName } from '../ui/Icon';
import nexoLogo from '../../assets/nexo.png';
import nexoMark from '../../assets/nexo-mark.png';

export const SIDEBAR_ID = 'nexo-sidebar';

interface SidebarProps {
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  onNewQuery: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

interface NavItem {
  id: AppView;
  label: string;
  icon: IconName;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { id: 'consulta', label: 'Consulta', icon: 'search' },
      { id: 'historico', label: 'Histórico', icon: 'clock' },
    ],
  },
  {
    title: 'Explorar',
    items: [
      { id: 'contratacoes', label: 'Contratações', icon: 'layers' },
      { id: 'documentos', label: 'Documentos', icon: 'file-text' },
      { id: 'orgaos', label: 'Órgãos', icon: 'building' },
      { id: 'fontes', label: 'Fontes oficiais', icon: 'compass' },
    ],
  },
  {
    title: 'Sobre',
    items: [
      { id: 'como-funciona', label: 'Como funciona', icon: 'help-circle' },
      { id: 'transparencia', label: 'Transparência da IA', icon: 'shield' },
      { id: 'sobre', label: 'Sobre o projeto', icon: 'info' },
    ],
  },
];

const HEALTH_LABELS: Record<HealthStatus, string> = {
  checking: 'Verificando backend...',
  online: 'Backend online',
  offline: 'Backend offline',
};

export function Sidebar({
  activeView,
  onSelectView,
  onNewQuery,
  mobileOpen,
  onCloseMobile,
  collapsed,
  onToggleCollapsed,
}: SidebarProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  const health = useHealth();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // Leva o foco para dentro do drawer, para teclado e leitor de tela seguirem o menu.
  useEffect(() => {
    if (!mobileOpen) return;
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();

    const keepFocusInside = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const focusable = sidebarRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', keepFocusInside);
    return () => {
      document.removeEventListener('keydown', keepFocusInside);
      returnFocusRef.current?.focus();
    };
  }, [mobileOpen]);

  const handleNavClick = (view: AppView) => {
    onSelectView(view);
    onCloseMobile();
  };

  const handleNewClick = () => {
    onNewQuery();
    onCloseMobile();
  };

  const sidebarClassName = [
    'nexo-sidebar',
    mobileOpen ? 'is-open' : '',
    collapsed ? 'is-collapsed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <div
        className={`sidebar-backdrop ${mobileOpen ? 'is-visible' : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside ref={sidebarRef} id={SIDEBAR_ID} className={sidebarClassName} aria-label="Navegação da aplicação">
        <div className="sidebar-top">
          <button
            type="button"
            className="sidebar-brand-btn"
            onClick={() => handleNavClick('consulta')}
            aria-label="NEXO RJ - Página inicial"
          >
            {logoFailed ? (
              // Sem a logo, mostra o nome em texto para a marca nunca sumir.
              <span className="sidebar-brand-text">NEXO RJ</span>
            ) : (
              <>
                <img
                  src={nexoLogo}
                  alt=""
                  className="sidebar-logo-full"
                  onError={() => setLogoFailed(true)}
                />
                <img src={nexoMark} alt="" className="sidebar-logo-mark" />
              </>
            )}
          </button>

          <button
            type="button"
            className="sidebar-icon-btn sidebar-collapse-btn"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            aria-expanded={!collapsed}
            aria-controls={SIDEBAR_ID}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            <Icon name="panel-left" size={18} />
          </button>

          <button
            ref={closeButtonRef}
            type="button"
            className="sidebar-icon-btn sidebar-close-btn"
            onClick={onCloseMobile}
            aria-label="Fechar menu"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <button
          type="button"
          className="btn-new-query"
          onClick={handleNewClick}
          aria-label="Iniciar nova conversa"
          title={collapsed ? 'Nova conversa' : undefined}
        >
          <Icon name="plus" size={16} />
          <span className="sidebar-label">Nova conversa</span>
        </button>

        <nav className="sidebar-nav" aria-label="Seções">
          {NAV_SECTIONS.map((section, index) => (
            <div key={section.title ?? index} className="sidebar-section">
              {section.title ? (
                <span className="sidebar-section-header">{section.title}</span>
              ) : null}
              <div className="sidebar-nav-list">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`sidebar-nav-item ${activeView === item.id ? 'is-active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                    aria-current={activeView === item.id ? 'page' : undefined}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon name={item.icon} size={16} />
                    <span className="sidebar-label">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer" role="status" title={HEALTH_LABELS[health]}>
          <span className={`status-dot dot-${health}`} aria-hidden="true" />
          <span className="sidebar-label">{HEALTH_LABELS[health]}</span>
        </div>
      </aside>
    </>
  );
}
