import { Icon } from '../../components/ui/Icon';
import { ProjectSummaryPanel } from '../../components/project/ProjectSummaryPanel';
import nexoLogo from '../../assets/nexo.png';
import ecoaLogo from '../../assets/ecoaPucRio.png';

export function SobrePage() {
  return (
    <div className="page-content-wrapper">
      <header className="page-header">
        <span className="page-eyebrow">RESIDÊNCIA EM IA & RAG</span>
        <h1 className="page-title">Sobre o Projeto NEXO RJ</h1>
        <p className="page-description">
          Uma plataforma inteligente de consulta, auditoria e transparência aplicada ao universo de
          compras e contratações governamentais do Estado do Rio de Janeiro.
        </p>
      </header>

      <div className="about-main-card">
        <div className="about-emblem-row">
          <img
            src={nexoLogo}
            alt="Logo NEXO RJ"
            className="about-nexo-logo"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          <div className="about-divider-v" />
          <img
            src={ecoaLogo}
            alt="Instituto ECOA PUC-Rio"
            className="about-ecoa-logo"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        <div className="about-text-prose">
          <h2>Objetivo e Proposta de Valor</h2>
          <p>
            O <strong>NEXO RJ</strong> nasceu com o propósito de transformar a forma como servidores
            públicos, auditores de controle externo, pregoeiros, jornalistas de dados e cidadãos
            consultam o acervo de contratações públicas fluminenses. Em vez de navegar por portais
            fragmentados e ler editais extensos manualmente, o usuário pode fazer perguntas em
            linguagem natural e receber respostas fundamentadas, com indicação das fontes usadas.
          </p>

          <h2>O Contexto do Grande Desafio</h2>
          <p>
            O projeto foi concebido e implementado no âmbito do <em>Grande Desafio</em> do programa de{' '}
            <strong>Residência em Inteligência Artificial & RAG</strong>, promovido pelo{' '}
            <strong>Instituto ECOA</strong> em parceria com a <strong>PUC-Rio</strong>. O desafio
            demandava o desenvolvimento de uma solução de inteligência artificial de ponta a ponta,
            unindo curadoria rigorosa de dados governamentais, engenharia de recuperação híbrida e
            uma experiência de produto de nível de produção.
          </p>

          <h2>O acervo consultado</h2>
          <p>
            Os números abaixo vêm do servidor e mostram a versão do acervo que responde às consultas.
            A lista completa de bases está em Fontes oficiais e em Transparência da IA.
          </p>
        </div>

        <ProjectSummaryPanel compact />

        <div className="about-pillars-grid">
          <div className="about-pillar-item">
            <Icon name="shield" size={18} />
            <h3>Evidências Verificáveis</h3>
            <p>Nenhuma resposta é emitida sem citação do documento oficial original de respaldo.</p>
          </div>
          <div className="about-pillar-item">
            <Icon name="compass" size={18} />
            <h3>Transparência Ativa</h3>
            <p>Facilidade de auditoria e acesso a dados públicos para toda a sociedade civil.</p>
          </div>
          <div className="about-pillar-item">
            <Icon name="cpu" size={18} />
            <h3>Inteligência Segura</h3>
            <p>Proteção de dados e conformidade estrita com as leis de contratações públicas.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
