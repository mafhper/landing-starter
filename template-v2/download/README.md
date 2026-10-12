# download/ — o resolvedor de downloads

Os botões de download entregam o binário do **último release** do GitHub sem você
republicar o site. Há quatro caminhos, do mais simples ao mais robusto — a escolha é
por tipo de host:

## Qual nível usar

| Onde o site vive | Nível |
|---|---|
| Host estático, assets com nome **fixo** (sem versão) | **1** — link direto em `releases/latest/download/<asset>` |
| Host estático (GitHub Pages), assets com **versão no nome** | **1.5** — resolução no cliente (`assets/js/latest-release.mjs`) |
| Host que roda JS no servidor (Cloudflare, Deno Deploy, qualquer runtime de `fetch`) | 2 — o worker deste diretório |
| Idem ao 2, com tráfego alto | 3 — dispatch + KV |

> **GitHub Pages é estático: não roda o worker.** Para ele, use o Nível 1 (assets de nome
> fixo) ou o Nível 1.5 (assets versionados); o template já vem com o Nível 1.5 montado.

### Nível 1

```html
<a href="https://github.com/OWNER/REPO/releases/latest/download/App-macos-arm64.dmg">
```

O GitHub resolve o "latest" sozinho. O nome do asset precisa ser fixo: a versão fica na
tag do release, nunca no nome do arquivo.

## Nível 1.5 — resolução no cliente

Para releases cujo nome do asset muda a cada versão (ex.: `Mark-Lee_1.8.3_amd64.deb`). O
site continua estático; um módulo pequeno resolve os links no navegador do visitante:

1. lê o repositório de `<html data-repo="OWNER/REPO">`;
2. busca `api.github.com/repos/OWNER/REPO/releases/latest` (API pública, CORS aberto);
3. para cada `<a data-release-os="...">`, escolhe o asset cujo nome casa o primeiro padrão
   da plataforma e reescreve o `href` para o `browser_download_url`.

**Degradação:** qualquer falha — rede, rate limit por visitante (a API sem token aceita
60 req/h por IP), release sem asset — deixa o link no fallback gravado no HTML, que
funciona sem JS:

```html
<a class="btn install-dl" href="https://github.com/OWNER/REPO/releases/latest" data-release-os="macos">Download .dmg</a>
```

O href do HTML é o fallback de verdade; o script só melhora o que já funciona. Em
`file://` (abrir o HTML direto) o módulo não carrega — o navegador bloqueia módulos fora
de http(s) — e os botões ficam no fallback; use `node serve.mjs` para ver a resolução.

### Configurar os padrões

O mapa padrão está em `latest-release.mjs` (`DEFAULT_PATTERNS`), na ordem em que os
padrões são testados — o primeiro que casar vence:

- `macos`: `.dmg`, depois `.app.tar.gz`;
- `windows`: `.msi`, depois `-setup.exe`;
- `linux`: `.deb`, depois `.rpm`, depois `.AppImage`.

Para ajustar sem editar o módulo, um botão pode declarar os próprios padrões —
expressões regulares separadas por vírgula, sem as barras:

```html
<a ... data-release-os="linux" data-release-patterns="_amd64\.deb$,_amd64\.rpm$">Download .deb</a>
```

Testes: `node --test assets/js/latest-release.test.mjs` — 13 casos, sem rede.

## Nível 2 — o worker

O que faz:

1. escolhe a arquitetura por `Sec-CH-UA-Arch` (macOS: `arm64` padrão, `x64` com hint
   `"x86"`; Linux/Windows: `x64`);
2. resolve a versão no servidor (`releases/latest`) e responde 302 para o asset;
3. cacheia por 300s (`Cache-Control: public, max-age=300`).

Se a API do GitHub falhar, redireciona para a página de releases.

Configuração: `repo` e os nomes de asset por SO/arch em `worker.mjs` (ou via `vars` do
`wrangler.jsonc`). Nos nomes, `{tag}` = `v1.2.3` e `{version}` = `1.2.3`.

Testes: `node --test download/worker.test.mjs` — 11 casos, sem host.

Deploy (quando houver host): o worker é um handler `fetch` padrão, roda em qualquer
runtime com `fetch` no servidor. O exemplo incluído usa Cloudflare:

```bash
cd download
npx wrangler login
npx wrangler deploy
```

Aponte a rota `/download/*` do domínio para o worker (ver `wrangler.jsonc`).

## Nível 3 — dispatch no release

O release empurra a tag para o site, em vez de o worker consultar a API a cada cache
miss:

```yaml
- uses: peter-evans/repository-dispatch@v4
  with:
    token: ${{ secrets.SITE_TOKEN }}
    repository: OWNER/SITE_REPO
    event-type: publish-installer
    client-payload: '{"tag": "${{ github.ref_name }}"}'
```

Para tráfego alto; o cache do Nível 2 resolve a maioria dos casos.

---

Padrão recriado a partir de `openlogi.org`; nenhum código do site original foi copiado.
