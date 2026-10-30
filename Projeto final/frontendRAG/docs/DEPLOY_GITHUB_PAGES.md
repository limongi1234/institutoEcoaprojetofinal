# Publicar o NEXO RJ com o backend configurado

## Configuração pronta para a demo

O workflow `.github/workflows/deploy.yml` já usa este backend HTTPS por padrão:

```text
https://earlobe-lagged-outscore.ngrok-free.dev
```

Não é necessário criar uma variável para usar esse endereço. A URL é pública, não uma credencial. O backend e o túnel ngrok precisam permanecer ligados.

Para substituir o endereço sem alterar o código, crie uma **Repository variable**:

1. Abra **Settings → Secrets and variables → Actions → Variables**.
2. Clique em **New repository variable**.
3. Nome: `VITE_API_BASE_URL`.
4. Valor: a nova URL HTTPS pública, sem espaços, credenciais, query string ou fragmento.

O workflow dá prioridade a `vars.VITE_API_BASE_URL`; se ela estiver ausente/vazia, usa a URL de demo acima. Uma entrada criada em **Secrets** não substitui `vars.*`. O valor `VITE_*` é incorporado ao JavaScript público, portanto nunca use senhas ou tokens nele.

## Ação necessária de quem administra o repositório

**Settings → Pages → Build and deployment → Source → GitHub Actions**.

Não deixe **Deploy from a branch / main / (root)**: esse modo serve o `index.html` e os bundles versionados em `assets/`, e não o `dist/` gerado pelo workflow. Assim, um deploy de Actions pode terminar sem que o site servido corresponda ao artefato esperado.

Depois de integrar o PR e mudar a origem do Pages:

1. Abra **Actions → Deploy to GitHub Pages**.
2. Use **Run workflow**, selecionando `main`.
3. Aguarde o build e o deploy terminarem.
4. Abra `https://etuarda.github.io/frontendRAG/` e recarregue sem cache.

A alteração do Pages depende de permissão de administração; o workflow apenas verifica a configuração, não altera silenciosamente as configurações do repositório.

## Proteções do workflow

Antes de publicar, o workflow:

- exige uma URL HTTPS válida e rejeita localhost/loopback, credenciais e URL vazia;
- verifica pela API do GitHub que o Pages está usando `build_type=workflow`;
- executa os testes;
- gera o build Vite em `dist/`;
- verifica que `dist/index.html` é de produção e que a URL configurada foi incorporada ao JavaScript;
- publica somente `dist/`.

Se alguma verificação falhar, não publica um novo artefato quebrado. Os arquivos versionados em `assets/` e `docs/assets/` são legados e não são utilizados pela publicação via Actions. Não é preciso gerar nem commitar bundles para esse fluxo.

## Validar localmente o mesmo build

PowerShell, na pasta do frontend:

```powershell
npm ci
npm test
$env:VITE_API_BASE_URL = "https://earlobe-lagged-outscore.ngrok-free.dev"
npm run check:pages
npm run build
npm run check:pages-build
```

O padrão do workflow não altera o desenvolvimento local: `npm run dev` continua usando `.env.development` e o backend em `http://localhost:8080`.

## Conferir o backend e o navegador

- `GET https://earlobe-lagged-outscore.ngrok-free.dev/health` deve retornar `{"status":"ok"}`. Para evitar o aviso do ngrok, envie `ngrok-skip-browser-warning: 1`.
- O backend precisa permitir a origem CORS `https://etuarda.github.io` e os headers usados pelo cliente, incluindo `ngrok-skip-browser-warning`, `Content-Type` e `X-Session-Id`.
- No navegador, envie uma pergunta e confira na aba Network que `POST /api/v1/query` usa o domínio ngrok, não uma URL vazia nem localhost.
- Se o bundle ainda apresentar a URL vazia, confira a origem do Pages e se o deploy finalizou depois do merge; criar uma variável não modifica builds antigos.
- HTTP 200 em `/health` e CORS correto confirmam conectividade, não garantem que o LLM ou todas as dependências do RAG estejam disponíveis.
