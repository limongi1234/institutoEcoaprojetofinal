import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const VARIABLE_HELP =
  'Configure VITE_API_BASE_URL em Settings > Secrets and variables > Actions > Variables (não em Secrets).';

export function validateBackendUrl(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`VITE_API_BASE_URL está vazia. ${VARIABLE_HELP}`);
  }
  if (value !== value.trim()) {
    throw new Error('VITE_API_BASE_URL não pode conter espaços antes ou depois do endereço.');
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`VITE_API_BASE_URL deve ser uma URL HTTPS absoluta. ${VARIABLE_HELP}`);
  }
  if (url.protocol !== 'https:') {
    throw new Error('O GitHub Pages exige um backend HTTPS; HTTP causa bloqueio de conteúdo misto.');
  }
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host === '0.0.0.0' ||
      host.startsWith('127.') || host === '[::1]') {
    throw new Error('O backend do site público não pode apontar para localhost/loopback.');
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error('Use somente a URL base do backend, sem credenciais, query string ou fragmento.');
  }
  return value.replace(/\/+$/, '');
}

export function verifyPagesBuild(directory, value) {
  const backend = validateBackendUrl(value);
  const html = readFileSync(join(directory, 'index.html'), 'utf8');
  if (html.includes('pages-loader') || /(?:src|href)=["'][^"']*\/src\//.test(html)) {
    throw new Error('O artefato contém o index de desenvolvimento/legado, não o index gerado pelo Vite.');
  }
  const scripts = readdirSync(join(directory, 'assets'))
    .filter((name) => name.endsWith('.js'));
  const configured = scripts.some((name) =>
    readFileSync(join(directory, 'assets', name), 'utf8').includes(JSON.stringify(backend)));
  if (!configured) {
    throw new Error('A URL configurada não foi encontrada no JavaScript de dist/. Não publique este build.');
  }
  return backend;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.includes('--dist')) {
      verifyPagesBuild(resolve('dist'), process.env.VITE_API_BASE_URL);
      console.log('Artefato dist/ verificado: index de produção e URL do backend presente no bundle.');
    } else {
      validateBackendUrl(process.env.VITE_API_BASE_URL);
      console.log('VITE_API_BASE_URL válida para publicação no GitHub Pages.');
    }
  } catch (error) {
    console.error(`Configuração de publicação inválida: ${error.message}`);
    process.exitCode = 1;
  }
}
