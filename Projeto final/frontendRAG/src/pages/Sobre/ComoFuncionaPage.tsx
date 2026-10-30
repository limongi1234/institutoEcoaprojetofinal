import { Icon } from '../../components/ui/Icon';
import type { AppView } from '../../types/app';

interface ComoFuncionaPageProps {
  onNavigate: (view: AppView) => void;
}

export function ComoFuncionaPage({ onNavigate }: ComoFuncionaPageProps) {
  return (
    <div className="page-content-wrapper">
      <header className="page-header">
        <span className="page-eyebrow">GUIA DO USUÁRIO</span>
        <h1 className="page-title">Como Funciona o NEXO RJ</h1>
        <p className="page-description">
          Aprenda a realizar consultas assertivas, explorar o acervo governamental e auditar as
          evidências apresentadas nas respostas.
        </p>
      </header>

      <div className="how-it-works-grid">
        <div className="how-step-card">
          <div className="how-step-number">1</div>
          <Icon name="search" size={20} className="how-step-icon" />
          <h2 className="how-step-title">Pergunte em Linguagem Natural</h2>
          <p className="how-step-desc">
            Digite sua dúvida exatamente como falaria com um especialista. Você pode perguntar sobre
            valores de contratos, regras de editais, participação de microempresas ou compras de um
            determinado órgão.
          </p>
        </div>

        <div className="how-step-card">
          <div className="how-step-number">2</div>
          <Icon name="compass" size={20} className="how-step-icon" />
          <h2 className="how-step-title">Busca em Múltiplas Fontes</h2>
          <p className="how-step-desc">
            O NEXO busca trechos relevantes nas bases oficiais do acervo. Você pode conferir quais
            são em Fontes oficiais.
          </p>
        </div>

        <div className="how-step-card">
          <div className="how-step-number">3</div>
          <Icon name="file-text" size={20} className="how-step-icon" />
          <h2 className="how-step-title">Resposta Fundamentada</h2>
          <p className="how-step-desc">
            Você recebe uma resposta clara, acompanhada da indicação exata de quais documentos oficiais
            foram usados como fonte, permitindo verificação imediata.
          </p>
        </div>

        <div className="how-step-card">
          <div className="how-step-number">4</div>
          <Icon name="thumbs-up" size={20} className="how-step-icon" />
          <h2 className="how-step-title">Feedback e Aprendizado</h2>
          <p className="how-step-desc">
            Ao final de cada resposta, indique se ela foi útil. A avaliação fica registrada junto da
            consulta no servidor.
          </p>
        </div>
      </div>

      <div className="how-it-works-cta">
        <button
          type="button"
          className="btn-start-search"
          onClick={() => onNavigate('consulta')}
        >
          <span>Ir para a consulta inteligente</span>
          <Icon name="arrow-right" size={16} />
        </button>
      </div>
    </div>
  );
}
