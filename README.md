# landing-starter

Template de landing de produto em **HTML/CSS/JS puro, sem build e sem
dependencia**, com um resolvedor de downloads que sempre entrega o ultimo
release do GitHub. O padrao foi destilado de uma analise de site real
(`openlogi.org`) — ver `template/download/README.md` para a origem.

## O que vem pronto

- **Navbar subtrativa**: cada breakpoint esconde o que nao e essencial
  (920 / 680 / 600 / 380) e mantem brand + CTA sempre visiveis.
  **Sem hamburger, sem JS de menu.**
- **Tema claro/escuro** com script anti-FOUC, toggle e
  `prefers-reduced-motion` respeitado.
- **Design system de uma pagina**: tokens semanticos (claro e escuro),
  hairlines em vez de sombras, "grid como fio" (gap de 1px sobre fundo
  hairline) e marcadores `+` nas secoes em telas largas.
- **Resolvedor de downloads** (`template/download/`): rotas
  `/download/<os>` com Client Hints (`Sec-CH-UA-Arch`), `302` para o
  ultimo release e cache de 300s — com **11 testes em Node que rodam sem
  Cloudflare**.
- **`bootstrap.mjs`**: instancia um projeto novo a partir do template com
  um comando (nome, repo, accent, versao, `--git`).

## Uso

Instanciar um projeto novo:

```bash
node bootstrap.mjs ../meu-app --name "Meu App" --repo mafhper/meu-app --accent "#0ea5e9" --git
```

Ver o que faria, sem escrever:

```bash
node bootstrap.mjs ../meu-app --dry
```

Testes (valem no template e em qualquer projeto instanciado):

```bash
node --test template/download/worker.test.mjs
```

## Estrutura

```text
template/                  <- tudo que vira o projeto novo
  index.html
  assets/css/styles.css    <- tokens + layout + nav subtrativa + breakpoints
  assets/js/app.js         <- tema, nav .scrolled, copiar comando (so isto)
  serve.mjs                <- dev server sem dependencia (node serve.mjs)
  download/worker.mjs      <- o resolvedor (Cloudflare Worker, zero dependencia)
  download/worker.test.mjs <- 11 casos, roda com node --test
  download/wrangler.jsonc
  download/README.md       <- os tres niveis do mecanismo, com o porque
  README.template.md       <- vira README.md no destino
  .gitignore
bootstrap.mjs              <- instancia um projeto novo
demo/                      <- o template instanciado ("Demo Notes"), publicado no Pages
```

## Demo

`demo/` e o template instanciado pelo proprio bootstrap, com conteudo de um
produto ficticio ("Demo Notes"). E o que o GitHub Pages publica:

- publicado: `https://mafhper.github.io/landing-starter/`
- local: `node template/serve.mjs demo 8787`

O workflow `.github/workflows/pages.yml` publica **so a pasta `demo/`** —
o template e os scripts do repo nao vao para o site.

## Os tres niveis de download

1. **Link direto** `releases/latest/download/<asset>` — sem backend nenhum,
   exige nome de asset fixo (sem versao no nome).
2. **O worker incluido** — nome versionado, escolha por SO/arch via Client
   Hints, cache de 300s, degradacao graciosa. E o padrao do site analisado.
3. **Dispatch no release (KV)** — o CI empurra a tag para o site; evita a
   API do GitHub no caminho do clique. Snippet no
   `template/download/README.md`.

## De onde veio

Padrao destilado da analise de `openlogi.org`: navbar subtrativa, tokens
escopados por pagina, download server-side com Client Hints e o release do
repo original **empurrando** a versao via `repository_dispatch`.

As ilustracoes isometricas dos cards usam o kernel do `iso-figure`
(ai-iso-skill, MIT): projecao 30 graus via `matrix()`, oclusao por ordem de
pintura e `non-scaling-stroke` — ajustado ao design system da pagina (faces
nos tokens do tema, accent no elemento "vivo", hover que explode a pilha,
faz o pulso viajar no arco e o selo flutuar; tudo desligado sob
`prefers-reduced-motion`). Nenhum markup do site original foi copiado.

## Licenca

Defina a sua antes de publicar. O template nao impoe licenca.
