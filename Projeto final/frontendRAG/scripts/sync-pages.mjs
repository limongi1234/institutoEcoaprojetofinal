// Copia o build (dist/) para assets/ e docs/, mantendo o GitHub Pages atualizado
// qualquer que seja a origem configurada: raiz da main, pasta docs/ ou GitHub Actions.
import { cpSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const LOADER = /(<!-- pages-loader -->)[\s\S]*?(\s*<!-- \/pages-loader -->)/;

// Em docs/ só o build é substituído; a documentação (.md) que mora ali é preservada.
rmSync('assets', { recursive: true, force: true });
rmSync('docs/assets', { recursive: true, force: true });
rmSync('docs/index.html', { force: true });

cpSync('dist/assets', 'assets', { recursive: true });
cpSync('dist', 'docs', { recursive: true });

// Os nomes do build mudam a cada versão (hash), então o index.html da raiz
// precisa apontar para os arquivos recém-gerados.
const builtHtml = readFileSync('dist/index.html', 'utf8').replace(/\r\n?/g, '\n');
const builtTags =
  builtHtml.match(/<script\b[^>]*\.\/assets\/[^>]*><\/script>|<link\b[^>]*rel="(?:stylesheet|modulepreload)"[^>]*>/g) ?? [];
const indent = '\n    ';
const loader =
  `${indent}<!-- Quando o GitHub Pages serve a raiz do repositório, carrega o build versionado em assets/. -->` +
  builtTags.map((tag) => indent + tag).join('');

const rootHtml = readFileSync('index.html', 'utf8').replace(/\r\n?/g, '\n');
writeFileSync('index.html', rootHtml.replace(LOADER, `$1${loader}$2`));

// O Vite pode herdar CRLF do index de entrada no Windows. Normaliza também a
// cópia servida por Pages para evitar caracteres CR órfãos e diffs ruidosos.
writeFileSync('docs/index.html', builtHtml);

console.log(`Build sincronizado em assets/ e docs/ (${builtTags.length} arquivos no carregador).`);
