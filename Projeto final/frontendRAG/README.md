# NEXO RJ — Frontend

Interface React do NEXO RJ, consulta inteligente sobre contratações públicas do Estado do Rio de Janeiro. Projeto da Residência em IA & RAG (Instituto ECOA · PUC-Rio).

O frontend consome **exclusivamente** o backend FastAPI do Grande Desafio. Não há respostas simuladas nem catálogo de exemplo: com o backend desligado, a interface mostra erro de conexão. **Subir só o frontend não inicia o RAG**: são dois serviços. Neste repositório, o backend fica na pasta ao lado, [`../rag-grande-desafio-grupo04-cenario01/`](../rag-grande-desafio-grupo04-cenario01/).

## Instalar e fazer perguntas

A partir da raiz do repositório:

```bash
cd "Projeto final/frontendRAG"
npm ci
```

Pré-requisitos: Git, **Node.js LTS 22+** e **Python 3.14 de 64 bits** para o backend. A geração e os embeddings padrão dependem da internet e do endpoint compartilhado da turma.

1. Siga [docs/GUIA_EXECUCAO_LOCAL.md](docs/GUIA_EXECUCAO_LOCAL.md) para instalar o backend, que fica na pasta ao lado, e iniciar a API em `http://localhost:8080`. O Git não inclui os arquivos grandes do corpus: instale o pacote de dados distribuído separadamente antes de iniciar a API; o código não traz SQLite, documentos nem índices.
2. Na pasta deste frontend, com o backend rodando:

   ```bash
   npm run check:backend   # verifica API, corpus e banco; não chama o LLM
   npm run check:query     # envia uma pergunta real e exige resposta com fontes
   npm run dev            # abra http://localhost:5173
   ```

3. Na tela **Consulta**, envie, por exemplo: **“O que estabelece a Lei 14.133/2021?”**. A resposta deve mostrar fontes. Verifique também Contratações, Histórico e feedback.

Baixe o ZIP do pacote de dados V7 e o seu `.sha256` na [pasta do Google Drive](https://drive.google.com/drive/folders/14K1K-q9kze5qivG__b0KvkJV4L7buc1r?usp=drive_link), extraia na raiz do backend e configure `SNAPSHOT_MANIFEST=runtime_bundle.json` no `.env`. Após iniciar a API, confira `/ready`. A interface exibe os dados do backend conectado.

`npm run dev` e os diagnósticos usam `.env.development`, já versionado com `VITE_API_BASE_URL=http://localhost:8080`. Para outra URL, crie `.env.development.local` e reinicie o Vite. Nunca coloque senhas ou tokens nas variáveis `VITE_*`: elas são públicas no navegador.

O diagnóstico rápido não garante que o LLM esteja disponível nem testa CORS; `check:query` valida uma consulta real, e a interface valida a conexão do navegador. A primeira pergunta pode demorar pelo download do reranker. O guia explica como desativá-lo opcionalmente e como resolver falhas de instalação/conexão.

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm ci` | Instala as versões do `package-lock.json` |
| `npm run dev` | Servidor de desenvolvimento na porta 5173 |
| `npm run check:backend` | Diagnóstico HTTP da API, corpus e banco estruturado |
| `npm run check:query` | Diagnóstico + pergunta real; grava consulta no histórico do backend |
| `npm test` | Testes offline da interface e dos diagnósticos |
| `npm run build` | Checagem de tipos e build de produção em `dist/` |
| `npm run build:pages` | Build + cópia para `assets/` e `docs/` (GitHub Pages) |
| `npm run preview` | Serve o build de `dist/` localmente |
| `npm run check:pages` | Valida a URL HTTPS do backend antes da publicação |
| `npm run check:pages-build` | Confere o index e a URL incorporada ao bundle em `dist/` |

Todas as chamadas usam `VITE_API_BASE_URL` e enviam `ngrok-skip-browser-warning: 1`.
Para testar outro backend localmente, defina a variável em `.env.development.local`.

## Publicação no GitHub Pages

> Neste repositório, o workflow fica em `Projeto final/frontendRAG/.github/` e o
> GitHub não o executa, porque só lê a pasta `.github/` da raiz. A demo é
> publicada pelo repositório original do frontend.

O workflow já incorpora `https://earlobe-lagged-outscore.ngrok-free.dev` como backend
padrão da demo. Opcionalmente, `vars.VITE_API_BASE_URL` substitui esse endereço: cadastre
em **Settings → Secrets and variables → Actions → Variables**, não em Secrets.

**Quem administra o repositório precisa selecionar Settings → Pages → Source → GitHub
Actions.** Não use publicação pela raiz da `main`: ela serve os bundles legados em vez
do `dist/` gerado pelo workflow. Após integrar a correção e alterar essa configuração,
execute **Actions → Deploy to GitHub Pages → Run workflow** na `main`.

O workflow bloqueia publicação com configuração inválida e verifica a URL no artefato.
Passo a passo e diagnóstico: [docs/DEPLOY_GITHUB_PAGES.md](docs/DEPLOY_GITHUB_PAGES.md).

Para testar outra pergunta: `npm run check:backend -- --query "Sou MEI, posso participar de pregão eletrônico?"`.

**Produção/Pages:** configure uma URL HTTPS pública do backend no build e libere a origem do site publicado no CORS. O GitHub Pages hospeda apenas a interface, não o Python nem o LLM. Veja [docs/FRONTEND_INTEGRATION.md](docs/FRONTEND_INTEGRATION.md).

## Stack e estrutura

React 19 · TypeScript · Vite 6 · CSS próprio, mobile-first.

```text
src/
├── app/            # Composição das páginas e navegação
├── pages/          # Consulta, Histórico, Explorar, Sobre...
├── components/     # Componentes visuais reutilizáveis (sem fetch)
├── hooks/          # Estado de tela e chamadas via services
├── services/       # api.ts (cliente HTTP único) + um service por recurso
├── types/          # Tipos do contrato e tipos só de UI
├── constants/      # Rótulos de interface
├── utils/          # Formatadores
└── styles/         # global.css
scripts/            # Diagnóstico local e publicação
```

Fluxo: `Página/Componente → hook → service → api.ts → FastAPI`.

O contrato oficial, [FRONTEND_API_CONTRACT.md](../rag-grande-desafio-grupo04-cenario01/docs/FRONTEND_API_CONTRACT.md), é mantido na pasta do backend. Os detalhes de endpoints, estados de tela e testes estão em [docs/FRONTEND_INTEGRATION.md](docs/FRONTEND_INTEGRATION.md).
