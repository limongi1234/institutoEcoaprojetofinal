import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

const plugins = [remarkGfm];
// No raw HTML, images/remote tracking, embeds or executable content from answers.
const elements = ['p', 'br', 'strong', 'em', 'del', 'ul', 'ol', 'li', 'blockquote',
  'hr', 'pre', 'code', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'table', 'thead', 'tbody', 'tr', 'th', 'td'];
const components: Components = {
  table: ({ children }) => (
    <div className="markdown-table-scroll" role="region" aria-label="Tabela de resultados" tabIndex={0}>
      <table className="markdown-result-table" aria-label="Resultados calculados">{children}</table>
    </div>
  ),
  th: ({ children, style }) => (
    <th scope="col" style={style} className={style?.textAlign === 'right' ? 'is-numeric' : undefined}>{children}</th>
  ),
  td: ({ children, style }) => (
    <td style={style} className={style?.textAlign === 'right' ? 'is-numeric' : undefined}>{children}</td>
  ),
  a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
};

/** GFM tables in query answers and saved history, without parsing SQL or running HTML. */
export function AnswerMarkdown({ answer }: { answer: string }) {
  return (
    <ReactMarkdown remarkPlugins={plugins} components={components} allowedElements={elements} skipHtml>
      {answer}
    </ReactMarkdown>
  );
}
