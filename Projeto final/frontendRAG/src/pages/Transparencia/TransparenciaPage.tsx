import { Icon, type IconName } from '../../components/ui/Icon';
import { ProjectSummaryPanel } from '../../components/project/ProjectSummaryPanel';

interface Principle {
  icon: IconName;
  title: string;
  text: string;
}

// Fluxos efetivamente disponíveis no pipeline. Totais e versões vêm da API,
// não de números ou nomes de modelos fixados nesta página.
const PRINCIPLES: Principle[] = [
  {
    icon: 'compass',
    title: 'Respostas a partir do acervo oficial',
    text: 'Perguntas documentais usam trechos recuperados das bases oficiais listadas abaixo. Contagens, valores e rankings são calculados em SQL na base estruturada; quando o SQL é suficiente, a busca documental não é executada. Cada resposta indica as fontes utilizadas.',
  },
  {
    icon: 'shield',
    title: 'Recusa quando não há evidência',
    text: 'Se as fontes não sustentam uma resposta segura, o sistema recusa e explica o motivo. Sem evidência suficiente, também pode apresentar uma resposta limitada com ressalvas, em vez de arriscar uma resposta.',
  },
  {
    icon: 'info',
    title: 'Nível de evidência visível',
    text: 'As respostas exibem o nível de evidência atribuído pelo servidor: alto, moderado, baixo ou insuficiente. Esse nível considera as evidências e as limitações do recorte; não é uma probabilidade de acerto nem garantia de completude.',
  },
  {
    icon: 'thumbs-up',
    title: 'Avaliação de quem usa',
    text: 'Você pode avaliar as respostas e conferir fontes, avisos e etapas registradas no histórico autorizado.',
  },
];

export function TransparenciaPage() {
  return (
    <div className="page-content-wrapper">
      <header className="page-header">
        <span className="page-eyebrow">TRANSPARÊNCIA DA IA</span>
        <h1 className="page-title">Transparência da IA</h1>
        <p className="page-description">
          Como as respostas são fundamentadas e quais dados compõem o acervo consultado.
        </p>
      </header>

      <div className="principles-grid">
        {PRINCIPLES.map((item) => (
          <section key={item.title} className="transparency-card">
            <div className="transparency-title-row">
              <Icon name={item.icon} size={20} />
              <h2>{item.title}</h2>
            </div>
            <p className="transparency-summary">{item.text}</p>
          </section>
        ))}
      </div>

      <ProjectSummaryPanel />
    </div>
  );
}
