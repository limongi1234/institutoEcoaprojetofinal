# Integração do frontend NEXO com o backend

O contrato oficial está em [FRONTEND_API_CONTRACT.md](../../rag-grande-desafio-grupo04-cenario01/docs/FRONTEND_API_CONTRACT.md), na pasta do backend. O frontend consome somente a API real: não há mocks, dados de catálogo locais nem chave administrativa no JavaScript.

## Configuração

`VITE_API_BASE_URL` define o backend. Em desenvolvimento, `.env.development` aponta para `http://localhost:8080`.

Na publicação, o workflow usa a URL pública de demo `https://earlobe-lagged-outscore.ngrok-free.dev`
como padrão; `vars.VITE_API_BASE_URL` pode substituí-la. O Pages precisa usar **GitHub Actions**
como origem, não a raiz de uma branch. Configuração, validações e publicação:
[DEPLOY_GITHUB_PAGES.md](DEPLOY_GITHUB_PAGES.md).

O site público nunca usa `RAG_API_KEY` ou `X-API-Key`. Essa credencial pertence apenas a quem opera o backend. O acesso ao caminho de uma conversa usa o `session_id` devolvido pela própria API.

### Limitação do backend local

Quando o backend existe somente em `localhost`, o GitHub Pages publica a interface,
mas não consegue oferecer a integração RAG para outros dispositivos: `localhost`
sempre aponta para a máquina de quem abriu o navegador. Nesse cenário, a validação
integrada deve ser feita com `npm run dev` na mesma máquina do backend. Para uma demo
pública, ainda é necessário expor o backend por HTTPS e configurar
`VITE_API_BASE_URL` antes do build.

## Cliente e serviços

```text
src/services/
├── api.ts                    # cliente HTTP, timeouts e erros
├── query.service.ts          # POST /api/v1/query
├── trace.service.ts          # traces por pergunta e sessão
├── feedback.service.ts       # POST /api/v1/feedback
├── health.service.ts         # GET /health
└── *-service.ts              # catálogos públicos
```

Fluxo: `Página/Componente → hook → service → api.ts → FastAPI`.

## Conversa e sessão

1. A primeira pergunta é enviada sem `session_id`.
2. A resposta traz `query_id` e `session_id`.
3. O `session_id` é guardado em `sessionStorage`, isolado por aba.
4. Perguntas seguintes reenviam o mesmo id e até dez trocas anteriores em `historico`.
5. Se uma sessão restaurada produzir `422`, o frontend descarta o id e repete uma única vez sem ele.
6. “Nova conversa” limpa respostas e sessão.

O conteúdo das respostas não é persistido no navegador. `localStorage` guarda somente a preferência visual de sidebar recolhida.

## Rastreabilidade

Cada resposta possui “Ver caminho”, que chama:

```http
GET /api/v1/trace/{query_id}
X-Session-Id: <session_id>
```

A tela resume bases SQL/vetorial, evidências, fontes citadas, confiança/recusa e tempo. A linha do tempo mostra etapa, base, status, latência e detalhes. Evidências aparecem em tabela com scores e movimento no rerank; SQL, resultados, entrada/saída e prompt ficam recolhidos.

O topo da conversa possui “Caminho da conversa”:

```http
GET /api/v1/sessions/{session_id}/trace
X-Session-Id: <session_id>
```

Ela mostra totais da sessão e uma linha por pergunta. Clicar em uma pergunta abre seu trace individual.

Erros específicos:

- `401`: “Este caminho pertence a outra conversa.”
- `404`: explica que a pergunta pode ser anterior ao recurso de rastreabilidade.
- Rede: mensagem de conexão e botão “Tentar de novo”.

Saudações e conversas sem busca aparecem como “Conversa — sem consulta ao acervo”.

As buscas de texto esperam 400 ms sem digitação antes de chamar a API. O filtro
de documentos oferece somente os tipos do contrato: `Normativo`, `Contrato`,
`Ata de Registro`, `PCA` e `Conversa sintética`. Conteúdo sintético é identificado
como tal na resposta e as conversas restritas não são expostas no catálogo.

## Histórico da sessão

A página pública de Histórico chama `GET /api/v1/history` somente quando existe uma
sessão ativa e envia `X-Session-Id`. Assim, o usuário vê apenas as consultas da própria
conversa. O frontend não envia nem embute `X-API-Key`; o histórico administrativo/global
continua restrito ao backend.

O cliente HTTP também envia `ngrok-skip-browser-warning: 1` de forma centralizada em
todas as rotas. A URL vem exclusivamente de `VITE_API_BASE_URL`.

## Execução local

```powershell
# Backend
python -m uvicorn app.api:app --host 127.0.0.1 --port 8080

# Frontend
npm install
npm run dev
```

Abra `http://localhost:5173`.

Diagnóstico sem navegador:

```powershell
npm run check:backend
npm run check:query
```

## Testes

`npm test` cobre cliente HTTP, sessão por aba, reenvio de contexto, recuperação de `422`, autenticação do trace por `X-Session-Id`, erros `401/404`, serviços, paginação, feedback e estados de página. `npm run build` executa a checagem TypeScript e o build Vite.
