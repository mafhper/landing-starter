# download/ — o resolvedor de downloads

Os botoes de download do site nao apontam para arquivos: apontam para rotas.

```
/download/macos       -> 302 -> /download/macos-arm64
/download/macos-arm64 -> 302 -> https://github.com/OWNER/REPO/releases/download/v9.9.9/App-v9.9.9-macos-arm64.dmg
GitHub                -> 302 -> URL assinada com token -> o binario
```

## Qual nivel usar (e onde cada um roda)

| Onde o site vive | Nivel | O que e |
|---|---|---|
| **GitHub Pages ou qualquer host estatico** | **1** | link direto `releases/latest/download/<asset>`; o GitHub resolve o "latest" sozinho; exige nome de asset **fixo** (sem versao) |
| Host que roda JS no servidor (Cloudflare, Deno Deploy, qualquer runtime de `fetch`) | 2 | o worker deste diretorio: nome versionado, escolha por SO/arch, cache de 300s |
| Idem ao 2, com trafego alto | 3 | dispatch do release para um KV proprio; evita consultar a API do GitHub no caminho do clique |

> **GitHub Pages e estatico: nao roda o worker.** Para ele, o caminho e o **Nivel 1**.

### Nivel 1 — o caminho padrao para GitHub Pages

```html
<a href="https://github.com/OWNER/REPO/releases/latest/download/App-macos-arm64.dmg">
```

Funciona em qualquer host estatico, sem backend nenhum. A unica exigencia e que o asset
publicado tenha **nome fixo** (`App-macos-arm64.dmg`, nunca `App-v1.2.3-macos-arm64.dmg`):
a versao fica na tag do release, e o nome do arquivo nunca muda.

## Nivel 2 — o worker deste diretorio

Para host com server-side. O site fica 100% estatico (zero JS de download no navegador) e
o worker faz o trabalho, para **sempre entregar o ultimo release** com a arquitetura certa:

1. **Escolhe a arquitetura pelo Client Hint.** `Sec-CH-UA-Arch` chega como `"x86"` ou
   `"arm"` (Chrome/Edge). Em macOS o hint decide entre `arm64` (default) e `x64`; em Linux
   e Windows o default (`x64`) manda, porque o hint nessas plataformas nao e confiavel
   (maquinas arm64 usam a rota explicita, ex.: `/download/linux-arm64`).
2. **Resolve a versao no servidor.** Consulta
   `api.github.com/repos/<repo>/releases/latest`, monta o nome do asset pela convencao
   configurada e responde `302` para o GitHub.
3. **Cacheia pelo tempo certo.** `Cache-Control: public, max-age=300` — o clique nao bate
   na API a cada visita, e release nova propaga em ate 5 minutos. A resposta da API tambem
   e cacheada, mesmo TTL.

Se a API do GitHub estiver fora, o worker **degrada** para a pagina de releases
(`github.com/<repo>/releases/latest`) em vez de dar erro.

## Configuracao

Em `worker.mjs` (ou via `vars` no `wrangler.jsonc`, que sobrescreve):

- `repo`: `OWNER/REPO` do seu projeto.
- `assets`: o nome do arquivo por OS/arch. `{tag}` = `v1.2.3`, `{version}` = `1.2.3`.
  Mantenha a mesma convencao no pipeline de release.
- `defaults` e `hintChanges`: quais rotas o hint pode trocar.

## Testes (sem depender de host)

```bash
node --test download/worker.test.mjs
```

O handler aceita `fetch` e cache falsos, entao o fluxo inteiro roda em Node. Os 11 casos
cobrem: normalizacao de arch, parsing de rota, defaults e hint, nome do asset, URL final,
404 e a degradacao quando a API cai.

## Deploy (quando houver um host com server-side)

O worker e um handler `fetch` padrao — roda em qualquer runtime que ofereca `fetch` no
servidor. O exemplo deste diretorio usa Cloudflare (o plano gratuito serve), mas **nao e
requisito**:

```bash
cd download
npx wrangler login     # uma vez
npx wrangler deploy
```

Aponte a rota `seudominio.com/download/*` para o worker (ver comentarios do
`wrangler.jsonc`). Para outro host (Deno Deploy, Vercel, Netlify Functions), o mesmo
`worker.mjs` se adapta — o que muda e o arquivo de configuracao e a forma de publicar.

## Nivel 3 — dispatch no release

Em vez de consultar a API do GitHub a cada cache miss, o proprio release empurra a tag
para o worker (KV ou `repository_dispatch`). E o que o projeto de referencia faz:

```yaml
# .github/workflows/release.yml (trecho)
- name: Dispatch site update
  uses: peter-evans/repository-dispatch@v4
  with:
    token: ${{ secrets.SITE_TOKEN }}
    repository: OWNER/SITE_REPO
    event-type: publish-installer
    client-payload: '{"tag": "${{ github.ref_name }}"}'
```

O ganho e sobreviver a rate limit da API do GitHub com trafego alto; para a maioria dos
casos, o cache do Nivel 2 basta.

## Creditos do padrao

Mecanismo observado em `openlogi.org` (alternativa local-first ao Logitech Options+, em
Rust): rotas `/<os>` com Client Hints, `302` para o release, `max-age=300`. Este template
recria o padrao; nenhum codigo do site original foi copiado.
