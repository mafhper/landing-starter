# download/ — o resolvedor de downloads

Os botões de download do site apontam para rotas, não para arquivos:

```
/download/macos        → 302 → /download/macos-arm64
/download/macos-arm64  → 302 → github.com/OWNER/REPO/releases/download/v9.9.9/App-v9.9.9-macos-arm64.dmg
GitHub                 → 302 → URL assinada → o binário
```

## Qual nível usar

| Onde o site vive | Nível |
|---|---|
| GitHub Pages ou qualquer host estático | **1** — link direto em `releases/latest/download/<asset>`; exige nome de asset fixo (sem versão) |
| Host que roda JS no servidor (Cloudflare, Deno Deploy, qualquer runtime de `fetch`) | 2 — o worker deste diretório |
| Idem ao 2, com tráfego alto | 3 — dispatch + KV |

> **GitHub Pages é estático: não roda o worker.** Para ele, use o Nível 1.

### Nível 1

```html
<a href="https://github.com/OWNER/REPO/releases/latest/download/App-macos-arm64.dmg">
```

O GitHub resolve o "latest" sozinho. O nome do asset precisa ser fixo: a versão fica na
tag do release, nunca no nome do arquivo.

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
