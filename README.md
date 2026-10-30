# NEXO RJ — RAG sobre Contratações Públicas do RJ

**Grande Desafio · Cenário 1 · Grupo 04**
**Residência TIC em Trilhas · PUC-Rio · Instituto ECOA**

O NEXO RJ responde perguntas em linguagem natural sobre as contratações públicas
do Estado do Rio de Janeiro. É um sistema de **Adaptive RAG**: antes de buscar, ele
decide **onde** buscar (norma, registro estruturado, conversa ou número agregado).
Em seguida recupera evidências com busca híbrida (densa + BM25 + RRF + rerank) e
gera uma resposta que cita as fontes. Quando o caso exige, ele recusa a pergunta.

O projeto tem **duas partes, em dois repositórios e dois serviços**:

| Parte | Tecnologia | Repositório | Onde roda |
| --- | --- | --- | --- |
| **Backend / RAG** | Python · FastAPI | [rag-grande-desafio-grupo04-cenario01](https://github.com/Diogooliveira10/rag-grande-desafio-grupo04-cenario01) (pasta [Projeto final/](Projeto%20final/rag-grande-desafio-grupo04-cenario01/)) | Máquina local, exposta por túnel ngrok na demo |
| **Frontend** | React 19 · TypeScript · Vite 6 | [frontendRAG](https://github.com/Etuarda/frontendRAG) | [etuarda.github.io/frontendRAG](https://etuarda.github.io/frontendRAG/) (GitHub Pages) |

O frontend usa **apenas** a API do backend. Não há respostas simuladas: com o
backend desligado, a interface mostra erro de conexão. O site publicado só
funciona enquanto o backend e o túnel estiverem no ar.

---

## Por que este cenário

Todo órgão público publica suas contratações no [PNCP](https://pncp.gov.br), por
força da Lei 14.133/2021. O portal, porém, só permite consultar um contrato de
cada vez: não dá para cruzar edital, contrato, ata de registro de preços e valores
homologados numa única pergunta. Este projeto constrói essa camada de consulta.

Escolhemos o Cenário 1 por ser o mais verificável: qualquer resposta pode ser
conferida no próprio PNCP. Ele também mostra bem a diferença entre as duas buscas:
número de contrato e CNPJ só aparecem com BM25, e "compra de equipamento
hospitalar" só aparece com embeddings.

## Bases de conhecimento

| Base | Natureza | Conteúdo |
| --- | --- | --- |
| `editais_normativo` | Normativa | Lei 14.133/2021, decretos estaduais e editais |
| `contratos_estruturado` | Estruturada | 106.667 registros do PNCP (compras, empenhos, contratos) |
| `atas_conversacional` | Conversacional | Atas de registro de preços (JSON + PDF, com OCR) |
| `emails_sinteticos` | Conversacional | 25 conversas fictícias (5 restritas), marcadas como sintéticas |
| `pca_agregado` | Agregada | Plano de contratações, itens homologados e indicadores |

O corpus atual é o **v7-reparo**: 144.112 chunks e 144.112 vetores
Qwen3-Embedding-0.6B. O que entra no corpus é definido em
[corpus_manifest.yaml](Projeto%20final/rag-grande-desafio-grupo04-cenario01/corpus_manifest.yaml).

## Como funciona

```mermaid
flowchart TD
    A[query_analysis] --> B[roteamento]
    B --> C[retrieval_denso]
    B --> D[retrieval_bm25]
    C --> E[fusao_rrf]
    D --> E
    E --> F[rerank]
    F --> G[geracao]
    G --> H[validacao]
    H --> I[feedback]
    B -. perguntas de conta .-> S[consulta_sql]
    S --> G
```

- **Roteamento:** regras determinísticas, sem LLM, escolhem as bases antes da busca.
- **Busca híbrida:** densa (FAISS) + BM25, unidas por RRF e reordenadas por um
  cross-encoder local. O rerank elevou o hit@3 de 0,64 para 0,83.
- **Perguntas de conta** (ranking, média, mediana, evolução): respondidas por SQL
  pré-escrito e parametrizado. O LLM nunca escreve SQL nem reescreve os números.
- **Sensibilidade:** CPF, telefone e e-mail pessoal são mascarados antes do prompt
  e na resposta. Dados bancários, credenciais e juízo sobre a legalidade de um
  contrato são recusados.
- **Observabilidade:** cada etapa grava log JSONL com `run_id`, latência e tokens,
  numa cadeia de hashes que denuncia adulteração. Histórico e feedback ficam em
  SQLite local.

**Avaliação (2026-10-27, v7):** 36/36 no golden set das personas, com 100% de
citação. A suíte tem cerca de 2.400 testes.

## Interface (frontend)

Telas: **Consulta**, **Histórico**, **Feedback**, **Explorar** (contratações) e
**Transparência**. Saudações e conversas recebem resposta direta; perguntas
factuais passam pelo RAG, com fontes e guardrails.

Fluxo do código: `Página/Componente → hook → service → api.ts → FastAPI`.

```text
src/
├── app/         # composição das páginas e navegação
├── pages/       # Consulta, Histórico, Explorar, Sobre...
├── components/  # componentes visuais (sem fetch)
├── hooks/       # estado de tela e chamadas via services
├── services/    # api.ts (cliente HTTP único) + um service por recurso
├── types/       # tipos do contrato e da UI
└── styles/      # global.css
```

O contrato HTTP entre as partes fica no backend:
[docs/FRONTEND_API_CONTRACT.md](Projeto%20final/rag-grande-desafio-grupo04-cenario01/docs/FRONTEND_API_CONTRACT.md).

---

## Como rodar localmente

**Pré-requisitos:** Git, Python 3.12+ (64 bits), Node.js LTS 22+ e cerca de 16 GB
de RAM. A geração e os embeddings padrão usam o endpoint compartilhado da turma,
portanto é preciso internet.

### 1. Backend

```powershell
git clone https://github.com/Diogooliveira10/rag-grande-desafio-grupo04-cenario01.git
cd rag-grande-desafio-grupo04-cenario01
powershell -ExecutionPolicy Bypass -File scripts\setup.ps1   # Windows
# ou: bash scripts/setup.sh                                  # Linux/macOS
```

O script cria o `.venv`, instala o `requirements-lock.txt` e copia `.env.example`
para `.env`.

**Dados V7 (5,3 GB, fora do Git):** baixe o ZIP com FTS e o `.sha256` na
[pasta do Google Drive](https://drive.google.com/drive/folders/14K1K-q9kze5qivG__b0KvkJV4L7buc1r?usp=drive_link)
e extraia o conteúdo na raiz do backend. Depois, no `.env`:

```dotenv
SNAPSHOT_MANIFEST=runtime_bundle.json
```

Suba a API:

```powershell
.venv\Scripts\python -m uvicorn app.api:app --host 127.0.0.1 --port 8080
```

A API leva cerca de 1 minuto para subir e mais cerca de 2 minutos para a primeira
validação do `/ready`. Consulte o `/ready` a cada 10 s até ele responder 200.

### 2. Frontend

```bash
git clone https://github.com/Etuarda/frontendRAG.git
cd frontendRAG
npm ci
npm run check:backend   # verifica API, corpus e banco (não chama o LLM)
npm run check:query     # envia uma pergunta real e exige resposta com fontes
npm run dev             # http://localhost:5173
```

O `.env.development` já aponta para `http://localhost:8080`. Para usar outra URL,
crie `.env.development.local`. Nunca coloque senhas ou tokens em variáveis
`VITE_*`, porque elas ficam públicas no navegador.

Na tela **Consulta**, experimente: *"O que estabelece a Lei 14.133/2021?"*.

### Outros comandos úteis

| Onde | Comando | O que faz |
| --- | --- | --- |
| Backend | `py app/cli.py perguntar "..."` | Pergunta pelo terminal (pipeline completo) |
| Backend | `pytest tests/ -m "not llm"` | Testes offline (os mesmos do CI) |
| Backend | `py .\eval\run_eval.py run --pipeline src.pipeline:responder` | Golden set das personas |
| Frontend | `npm test` | Testes offline da interface |
| Frontend | `npm run build` | Checagem de tipos e build em `dist/` |

## Demo publicada

O backend roda na máquina de quem apresenta e fica público por um túnel
[ngrok](https://ngrok.com) com domínio HTTPS fixo. Não há deploy em nuvem: os
planos gratuitos não comportam o rerank nem os logs em disco.

```powershell
python -m uvicorn app.api:app --host 127.0.0.1 --port 8080
ngrok http --url=https://<dominio>.ngrok-free.dev 8080
```

O frontend é publicado no GitHub Pages por um workflow do GitHub Actions, com o
domínio do túnel em `VITE_API_BASE_URL`. Toda chamada envia o header
`ngrok-skip-browser-warning`, e a origem `https://etuarda.github.io` já está
liberada no CORS do backend. Faça uma pergunta de aquecimento antes de abrir
para o público.

## Documentação detalhada

**Backend**
- [README completo do backend](Projeto%20final/rag-grande-desafio-grupo04-cenario01/README.md): coleta, preparação, embeddings, índice, SQL e configuração
- [ARQUITETURA.md](Projeto%20final/rag-grande-desafio-grupo04-cenario01/ARQUITETURA.md): pipeline, estágios e camadas
- [PERSONAS.md](Projeto%20final/rag-grande-desafio-grupo04-cenario01/PERSONAS.md): personas e perguntas de referência
- [CORPUS_INVENTORY.md](Projeto%20final/rag-grande-desafio-grupo04-cenario01/CORPUS_INVENTORY.md): inventário do corpus
- [docs/OBSERVABILIDADE.md](Projeto%20final/rag-grande-desafio-grupo04-cenario01/docs/OBSERVABILIDADE.md): contrato dos logs
- [docs/GUIA_INTEGRACAO_LOCAL_FRONTEND_BACKEND.md](Projeto%20final/rag-grande-desafio-grupo04-cenario01/docs/GUIA_INTEGRACAO_LOCAL_FRONTEND_BACKEND.md): integração local

**Frontend** (no repositório [frontendRAG](https://github.com/Etuarda/frontendRAG))
- `docs/GUIA_EXECUCAO_LOCAL.md`: execução local passo a passo
- `docs/FRONTEND_INTEGRATION.md`: endpoints, estados de tela e testes
- `docs/DEPLOY_GITHUB_PAGES.md`: publicação no GitHub Pages

---

*TIC em Trilhas · PUC-Rio · Instituto ECOA · MCTI Futuro · Softex*
