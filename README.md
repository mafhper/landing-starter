# landing-starter

Catálogo de templates de sites de uma página em HTML, CSS e JavaScript puro.
Três variantes — **Classic**, **Aurora** e **Silk** — sem framework e sem
dependências de runtime nos sites. Node aparece só nos scripts do repositório:
instanciação, servidor local, montagem do catálogo e verificações.

**Catálogo:** https://mafhper.github.io/landing-starter/

- **Classic:** https://mafhper.github.io/landing-starter/classic/
- **Aurora:** https://mafhper.github.io/landing-starter/aurora/
- **Silk:** https://mafhper.github.io/landing-starter/silk/

## Templates

| Template | Pasta | Indicado para | O que traz |
|---|---|---|---|
| **Classic** | `template/` | Landing de produto clara, com tema escuro pelo sistema | Nav subtrativa, hairlines no lugar de sombras, ilustrações isométricas e download de release no cliente (Nível 1.5) + worker de exemplo |
| **Aurora** | `template-v2/` | Landing de produto dark-first, com claro funcional | Moldura de app com halo, mocks de mini-UI, ribbons de gradiente, starfield, paisagem e grão; fontes OFL self-hosted |
| **Silk** | `template-v3/` | Página editorial/comércio de uma marca fictícia | Sedas em gradientes CSS, coleção com filtro, ofício, diário, carta e sacola de demonstração; fontes OFL self-hosted |

As demos publicadas são instâncias dos templates (`/classic/`, `/aurora/`, `/silk/`).
Cada template tem um `README.template.md` com o que editar; cada demo tem o mesmo
texto em `README.md`, com os placeholders preenchidos.

## O que cada template tem

| Mecanismo | Classic | Aurora | Silk |
|---|:---:|:---:|:---:|
| `bootstrap.mjs` (instanciação) | sim | sim | sim |
| `serve.mjs` (dev local, não produção) | sim | sim | sim |
| Navbar responsiva | sim | sim | sim |
| Tema claro/escuro | claro/escuro (sistema + toggle) | dark-first + claro explícito | não |
| Download de release (Nível 1.5; worker é exemplo) | sim | sim | não |
| Testes Node (24 casos) | sim | sim | não |
| `contrast.mjs` (WCAG nos tokens do `:root`) | não | não | sim |
| Fontes self-hosted | não (stack do sistema) | Zalando Sans SemiExpanded + Geist Mono | Bodoni Moda + Inter |
| Sacola de demonstração | não | não | sim |

O “build” do repositório é só a montagem do Pages: `tools/build-site.mjs` copia a
galeria, as três demos e gera os zips em `_site/`. Os sites em si não têm build.

## Uso

```bash
node bootstrap.mjs --list
node bootstrap.mjs ../meu-app --template template-v3 --name "Minha Marca" --accent "#6e2419"
node bootstrap.mjs ../meu-app --dry   # mostra o que faria, sem escrever
```

`--template` aceita `template` (Classic, o default), `template-v2` (Aurora) e
`template-v3` (Silk). O bootstrap substitui os placeholders que existem no template e
avisa se algum sobrar. `--repo`, `--slug` e `--version` só têm efeito nos templates
que usam esses tokens (Classic e Aurora); `--accent`, `--name`, `--desc` e `--tagline`
valem nos três. Use `--git` se quiser `git init` + commit inicial no destino.

## Verificações

- **Ver o site:** abra `index.html` direto ou rode `node serve.mjs` dentro do
  template/demo (porta 8787). O `serve.mjs` é de desenvolvimento; não é servidor de
  produção.
- **Classic e Aurora:** `node --test download/worker.test.mjs assets/js/latest-release.test.mjs`
  — 24 casos, sem rede, rodando de dentro do template ou da demo.
- **Silk:** `node contrast.mjs` — lê os tokens do `:root` de `assets/css/styles.css` e
  reprova qualquer par de texto abaixo de 4,5:1.
- **Catálogo:** `node tools/build-site.mjs` monta `_site/` e valida referências locais
  e placeholders residuais antes de publicar.

## Estrutura

```
site/           galeria publicada na raiz do Pages
template/       Classic
template-v2/    Aurora
template-v3/    Silk
demo/           Classic instanciado ("Demo Notes")  -> /classic/
demo-v2/        Aurora instanciado ("Demo Notes")   -> /aurora/
demo-v3/        Silk instanciado ("Silk")           -> /silk/
tools/          build-site.mjs (monta _site + zips) e capture.mjs (Edge headless)
bootstrap.mjs   instancia um projeto a partir de um template
```

`download/` existe em Classic e Aurora (resolvedor de release e worker de exemplo);
o Silk não tem essa pasta.

## Pages

O workflow `.github/workflows/pages.yml` publica o catálogo no GitHub Pages. Em push
para `main`, ele dispara quando mudam `site/`, `demo*/`, `template*/`, `tools/` ou o
próprio workflow; também aceita `workflow_dispatch`. O passo
`node tools/build-site.mjs` monta `_site/` — galeria, demos e zips — e falha se uma
referência local não resolve ou se sobra placeholder nos arquivos publicados. Os zips
em `/downloads/` são gerados a cada build, nunca versionados; no Linux o build usa
`zip`, no Windows cai para `Compress-Archive`.

## Requisitos

- **Sites:** nenhum. São HTML/CSS/JS; abra `index.html` ou use qualquer host estático.
- **Scripts:** Node 20+ (ESM e `node --test`). `tools/capture.mjs` usa WebSocket nativo
  (Node 22+) e precisa de Edge/Chrome instalado; o build dos zips usa `zip` no Linux
  ou `Compress-Archive` no Windows.
- **Fontes:** Aurora e Silk trazem as fontes no repositório; não há requisição a Google
  Fonts nem a qualquer CDN.

## Créditos e licenças

- **Classic:** código próprio, destilado de uma análise da página da `openlogi.org`;
  as ilustrações usam o kernel do `iso-figure` (MIT). Usa a stack de fontes do sistema.
- **Aurora:** código próprio, inspirado no visual do app desktop do Genex
  (`genex-desktop`, MIT) — sem código copiado do site. Fontes self-hosted sob SIL OFL 1.1.
- **Silk:** código próprio; marca, conteúdo, preços e endereço são ficção de conceito;
  nenhuma imagem de terceiro (as sedas são gradientes CSS). Fontes self-hosted sob SIL OFL 1.1.
- **Fontes (Aurora):** Zalando Sans SemiExpanded e Geist Mono; licenças em
  `template-v2/assets/fonts/`.
- **Fontes (Silk):** Bodoni Moda e Inter; licenças em `template-v3/assets/fonts/`.
- **Licença dos projetos gerados:** defina antes de publicar. O starter não impõe licença.
