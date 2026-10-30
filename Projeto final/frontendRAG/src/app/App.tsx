import { useEffect, useRef, useState } from 'react';
import type { AppView } from '../types/app';
import type { HistoryItem } from '../types/api';
import type { ConversationTurn } from '../types/app';
import { useRagWorkspace } from '../hooks/useRagWorkspace';
import { useSidebar } from '../hooks/useSidebar';
import { Sidebar, SIDEBAR_ID } from '../components/layout/Sidebar';
import { Footer } from '../components/layout/Footer';
import { Icon } from '../components/ui/Icon';
import nexoLogo from '../assets/nexo.png';

import { ConsultaPage } from '../pages/Consulta/ConsultaPage';
import { ContratacoesPage } from '../pages/Contratacoes/ContratacoesPage';
import { DocumentosPage } from '../pages/Documentos/DocumentosPage';
import { OrgaosPage } from '../pages/Orgaos/OrgaosPage';
import { FontesPage } from '../pages/Fontes/FontesPage';
import { TransparenciaPage } from '../pages/Transparencia/TransparenciaPage';
import { SobrePage } from '../pages/Sobre/SobrePage';
import { ComoFuncionaPage } from '../pages/Sobre/ComoFuncionaPage';
import { HistoricoPage } from '../pages/Historico/HistoricoPage';

export function App() {
  const [activeView, setActiveView] = useState<AppView>('consulta');
  const sidebar = useSidebar();
  const mainRef = useRef<HTMLElement>(null);
  const previousViewRef = useRef(activeView);

  const workspace = useRagWorkspace();

  // Em uma SPA, a troca de tela não recarrega o documento. Move o foco para o
  // conteúdo novo para que teclado e leitor de tela percebam a navegação.
  useEffect(() => {
    if (previousViewRef.current !== activeView) {
      mainRef.current?.focus();
      previousViewRef.current = activeView;
    }
  }, [activeView]);

  const handleNewQuery = () => {
    workspace.startNewConversation();
    setActiveView('consulta');
  };

  // Busca vinda dos catálogos é um assunto novo, então abre uma conversa própria.
  const handleDirectSearch = (queryText: string) => {
    workspace.startNewConversation();
    workspace.submitQuery(queryText);
    setActiveView('consulta');
  };

  // Clique num card do histórico restaura a conversa e navega para a consulta.
  const handleOpenConversation = (items: HistoryItem[], sessionId: string) => {
    const turns: ConversationTurn[] = [...items].reverse().map((item) => ({
      response: {
        ...item.resposta,
        query_id: item.query_id,
        session_id: sessionId,
      },
      feedback: item.feedback.length > 0 ? item.feedback[0].avaliacao : undefined,
    }));
    workspace.restoreConversation(turns, sessionId);
    setActiveView('consulta');
  };

  const renderActivePage = () => {
    switch (activeView) {
      case 'consulta':
        return (
          <ConsultaPage
            turns={workspace.turns}
            sessionId={workspace.sessionId}
            pendingQuery={workspace.pendingQuery}
            loading={workspace.loading}
            estimatedDurationMs={workspace.estimatedDurationMs}
            error={workspace.error}
            errorKind={workspace.errorKind}
            errorStatus={workspace.errorStatus}
            retryAfterSeconds={workspace.retryAfterSeconds}
            onSubmitQuery={workspace.submitQuery}
            onRetryQuery={workspace.retryQuery}
            onRated={workspace.markRated}
            onNewConversation={handleNewQuery}
            onNavigate={setActiveView}
          />
        );

      case 'contratacoes':
        return <ContratacoesPage onSearchQuery={handleDirectSearch} />;

      case 'documentos':
        return <DocumentosPage onSearchQuery={handleDirectSearch} />;

      case 'orgaos':
        return <OrgaosPage onSearchQuery={handleDirectSearch} />;

      case 'fontes':
        return <FontesPage />;

      case 'historico':
        return <HistoricoPage sessionIds={workspace.sessionIds} onNewQuery={handleNewQuery} onOpenConversation={handleOpenConversation} />;

      case 'como-funciona':
        return <ComoFuncionaPage onNavigate={setActiveView} />;

      case 'transparencia':
        return <TransparenciaPage />;

      case 'sobre':
        return <SobrePage />;

      default:
        return null;
    }
  };

  return (
    <div className="nexo-app-layout">
      <a className="skip-link" href="#conteudo-principal">Pular para o conteúdo principal</a>
      {/* Só aparece no mobile; no desktop a sidebar fixa cumpre esse papel. */}
      <header className="nexo-mobile-topbar" aria-label="Cabeçalho mobile">
        <button
          type="button"
          className="mobile-hamburger-btn"
          onClick={sidebar.openMobile}
          aria-label="Abrir menu"
          aria-expanded={sidebar.mobileOpen}
          aria-controls={SIDEBAR_ID}
        >
          <Icon name="menu" size={20} />
        </button>

        <button
          type="button"
          className="mobile-brand-center"
          onClick={handleNewQuery}
          aria-label="NEXO RJ - Página inicial"
        >
          <img src={nexoLogo} alt="" className="mobile-topbar-logo" />
        </button>

        <button
          type="button"
          className="mobile-new-btn"
          onClick={handleNewQuery}
          aria-label="Nova conversa"
          title="Nova conversa"
        >
          <Icon name="plus" size={18} />
        </button>
      </header>

      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        onNewQuery={handleNewQuery}
        mobileOpen={sidebar.mobileOpen}
        onCloseMobile={sidebar.closeMobile}
        collapsed={sidebar.collapsed}
        onToggleCollapsed={sidebar.toggleCollapsed}
      />

      <div className="nexo-main-wrapper">
        <main ref={mainRef} id="conteudo-principal" className="nexo-main-canvas" tabIndex={-1}>
          <div className="nexo-container">{renderActivePage()}</div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
