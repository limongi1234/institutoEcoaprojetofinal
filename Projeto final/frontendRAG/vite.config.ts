/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// O carregador do index.html só serve ao GitHub Pages lendo a raiz do repositório.
// No dev e no build ele é removido para não carregar o bundle duas vezes.
const stripPagesLoader = (): Plugin => ({
  name: 'strip-pages-loader',
  transformIndexHtml: {
    order: 'pre',
    handler: (html) => html.replace(/\s*<!-- pages-loader -->[\s\S]*?<!-- \/pages-loader -->/, ''),
  },
});

// Os arquivos do build mantêm o hash padrão do Vite no nome: cada versão ganha
// nomes novos, então o cache do navegador nunca serve CSS/JS/imagem antigos.
export default defineConfig({
  // Caminhos relativos permitem servir o app em subpasta (ex.: /frontendRAG/).
  base: './',
  plugins: [react(), stripPagesLoader()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
  test: {
    // Scripts de publicação usam node:test, não o ambiente de navegador.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Endereço fictício: nos testes o fetch é substituído, nenhuma requisição sai da máquina.
    env: { VITE_API_BASE_URL: 'http://api.test' },
  },
});
