# Rodar o NEXO RJ após um clone

Este guia prepara os **dois serviços** do repositório e conecta a interface ao RAG
real. Os dados pesados do corpus não estão no Git: além do código, é necessário
instalar um pacote de dados distribuído separadamente.

| Serviço | Pasta no repositório | Endereço local |
| --- | --- | --- |
| Backend | `Projeto final/rag-grande-desafio-grupo04-cenario01/` | `http://localhost:8080` |
| Frontend | `Projeto final/frontendRAG/` | `http://localhost:5173` |

Use dois terminais: um fica executando a API, outro o Vite. Subir apenas o frontend
não instala nem inicia o backend. O GitHub Pages também não executa o backend.

## 1. Pré-requisitos

- Git;
- **Python 3.14 de 64 bits**, recomendado pela compatibilidade com FAISS/PyTorch;
- **Node.js LTS 22+** com npm;
- internet para o endpoint compartilhado de geração/embeddings e, na primeira
  execução com rerank, para baixar o modelo (~470 MB).

Reserve alguns GB para o clone, ambiente Python, PyTorch e cache do modelo.
PostgreSQL, Ollama local, GPU e Tesseract **não são necessários** para este fluxo.

Confira `git --version`, `node --version` e `npm --version`. No Windows, confira
`py -3.14 --version`; no Linux/macOS, `python3.14 --version`.

Se o PowerShell bloquear `npm.ps1`, use `npm.cmd` no lugar de `npm`.

## 2. Clonar o repositório e baixar os dados

Em uma pasta de sua escolha, execute:

```bash
git clone https://github.com/limongi1234/institutoEcoaprojetofinal.git
cd "institutoEcoaprojetofinal/Projeto final/rag-grande-desafio-grupo04-cenario01"
```

Baixe o ZIP do pacote de dados V7 e o seu `.sha256` na
[pasta do Google Drive](https://drive.google.com/drive/folders/14K1K-q9kze5qivG__b0KvkJV4L7buc1r?usp=drive_link)
e extraia **na raiz do backend** (a pasta acima). O ZIP inclui documentos
normalizados, SQLite, catálogo, índices FAISS e `runtime_bundle.json`, nos
caminhos usados pela API. O clone fornece apenas o código.

## 3. Instalar o backend

### Windows (PowerShell)

Os comandos usam diretamente o Python do ambiente virtual; **não é necessário
ativá-lo nem alterar a política de execução do PowerShell**.

```powershell
py -3.14 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

### Linux/macOS

```bash
python3.14 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
cp .env.example .env
```

Não sobrescreva um `.env` existente em uma instalação que já tenha configurações
próprias. Use sempre o Python da `.venv` para instalar e executar o backend.

## 4. Conferir a configuração do backend

O `.env.example` traz os padrões do endpoint da turma. Para o fluxo local:

```env
OLLAMA_URL=http://ecoa-llm.duckdns.org:11434/v1
OLLAMA_API_KEY=ollama
GENERATION_MODEL=qcwind/qwen3-8b-instruct-Q4-K-M
EMBEDDING_MODEL=xagi/qwen3-embedding:0.6b-q4_k_m
DATABASE_URL=
SNAPSHOT_MANIFEST=runtime_bundle.json
```

- `DATABASE_URL=` vazio usa o SQLite instalado em `data/structured/`; o arquivo não vem no clone do código e deve acompanhar o pacote de dados.
- Não troque o provedor/modelo de embeddings sem reconstruir índices compatíveis.
- `RERANK_ENABLED=true` é o padrão. Para uma primeira execução leve, altere para
  **`RERANK_ENABLED=false`**: evita o download/carregamento do cross-encoder,
  mas muda a ordenação e pode reduzir a qualidade da recuperação.
- As origens `http://localhost:5173` e `http://127.0.0.1:5173` já são liberadas.
- `OPENROUTER_API_KEY` é opcional; não precisa de chave privada para testar o
  endpoint ECOA padrão. Se esse endpoint estiver indisponível, as perguntas
  factuais podem falhar mesmo com `/health` online.
- `.env` é local e ignorado pelo Git. Nunca faça commit de credenciais.

**Histórico na demo:** está temporariamente aberto, por decisão do operador, e
lista consultas de todos os usuários. Não coloque conteúdo sensível nas perguntas
ou comentários. Na versão atual do backend, `RAG_API_KEY` continua protegendo
os traces administrativos, mas não é necessária para o Histórico. Se uma versão
anterior retornar “Endpoint desabilitado: defina RAG_API_KEY”, ela ainda tem a
proteção antiga: precisa da correção do backend e de reinício da API. Definir a
chave só no servidor não autentica o frontend. Nunca publique a chave em `VITE_*`.

## 5. Iniciar a API — terminal 1

Na raiz do backend, no Windows:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.api:app --reload --host 127.0.0.1 --port 8080
```

No Linux/macOS:

```bash
.venv/bin/python -m uvicorn app.api:app --reload --host 127.0.0.1 --port 8080
```

Deixe rodando. Abra <http://localhost:8080/health>: deve retornar
`{"status":"ok"}`. Confira também <http://localhost:8080/ready> para validar o
bundle instalado. A documentação interativa fica em <http://localhost:8080/docs>.
**Saúde online não garante que o LLM esteja disponível.**

## 6. Instalar o frontend — terminal 2

O frontend fica na pasta ao lado do backend. A partir da raiz do backend:

```bash
cd ../frontendRAG
npm ci
```

## 7. Diagnosticar antes de abrir a interface

```bash
npm run check:backend
```

Verifica `/health`, o resumo do corpus e uma contratação real. Não chama o LLM.

Para verificar também embeddings, recuperação e geração:

```bash
npm run check:query
```

Envia **“O que estabelece a Lei 14.133/2021?”**, espera até 240 segundos por essa
requisição e só passa se receber resposta não recusada, `query_id` e fontes.
**Esta pergunta é real e fica registrada no histórico do backend.** Uma recusa
ou falta de evidência reprova esse teste; não é substituída por resposta simulada.
O comando não avalia a correção jurídica da resposta nem garante todas as perguntas.

Para outra pergunta:

```bash
npm run check:backend -- --query "Quais contratos de ambulâncias foram publicados?"
```

Os diagnósticos HTTP não testam CORS no navegador, Histórico ou feedback.
Confira esses fluxos também na interface.

## 8. Iniciar a interface e perguntar

```bash
npm run dev
```

Abra **<http://localhost:5173>**:

1. Confira **Backend online** na barra lateral.
2. Abra **Contratações** e **Transparência da IA**: devem mostrar dados da API.
3. Em **Consulta**, envie uma pergunta, por exemplo:
   - O que estabelece a Lei 14.133/2021?
   - Sou MEI, posso participar de pregão eletrônico?
   - Quais contratos de ambulâncias foram publicados?
4. Confira o texto e as fontes. Respostas limitadas ou recusas são possíveis;
   o corpus não cobre todas as perguntas.
5. Avalie a resposta. “Feedback registrado” só aparece após o sucesso na API.
6. Abra **Histórico**, reveja a consulta e recarregue a página para conferir
   a persistência no servidor.

O campo de continuação mantém as respostas na tela, mas esta versão do frontend
não envia o contexto anterior: as perguntas continuam independentes para o RAG.
Não guarda consultas em `localStorage` ou `sessionStorage`.

## 9. Outra URL de backend

O `.env.development` versionado já aponta para a porta 8080. Para outra porta/host,
crie **`.env.development.local`** na raiz do frontend:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Use a URL base, sem `/api/v1/query`. Reinicie o Vite após mudar a configuração.
Os diagnósticos leem os mesmos arquivos de desenvolvimento do Vite.

**Variáveis `VITE_*` entram no JavaScript público:** não use para senhas,
`DATABASE_URL`, `RAG_API_KEY` nem tokens de provedores.

## 10. Nas próximas execuções

Não precisa reinstalar tudo. Inicie a API com o Python da `.venv` no terminal 1;
no terminal 2, rode `npm run check:backend` e `npm run dev`. Mantenha ambos abertos.

Para verificar o frontend offline:

```bash
npm test
npm run build
```

Os testes usam respostas HTTP controladas apenas no ambiente de teste. Não chamam
o endpoint ECOA e não colocam dados simulados no build de produção.

## Problemas comuns

| Sintoma | O que conferir |
| --- | --- |
| Backend offline / `fetch failed` | API iniciada? Porta 8080? `.env.development.local` correto? |
| `/health` passa, mas catálogo falha | SQLite presente (pacote V7 extraído na raiz do backend) e `DATABASE_URL=` vazio. |
| Toda pergunta retorna erro 500 | Dependências instaladas no mesmo Python usado pelo `uvicorn`; veja o traceback no terminal 1. |
| `No module named faiss` | Instale `requirements.txt` na `.venv`; não use o Python global para iniciar a API. |
| Timeout na primeira pergunta | Download do reranker ou endpoint lento; aguarde ou teste com `RERANK_ENABLED=false` e reinicie a API. |
| Diagnóstico passa, navegador mostra CORS | Abra em `localhost:5173`; outra origem exige `CORS_ALLOW_ORIGINS` no backend e reinício. |
| Histórico retorna 403 sobre `RAG_API_KEY` | Backend com proteção antiga ou processo sem reinício; a abertura temporária deve estar aplicada no backend. |
| Porta 5173 ocupada | Encerre o Vite antigo; o projeto não muda silenciosamente de porta. |
| Erro ao instalar FAISS/PyTorch | Use Python 3.14 de 64 bits; confira a mensagem de instalação e espaço em disco. |
| Build/preview sem URL da API | Configure `.env.production.local`; `.env.development` só vale no desenvolvimento. |

## Site publicado

GitHub Pages serve somente arquivos estáticos. Para usar a interface publicada,
é necessário backend **HTTPS público**, URL definida no build e origem liberada
no CORS. `http://localhost:8080` não é uma API pública para os visitantes do site.
Veja [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md).
