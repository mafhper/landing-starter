# Demo Notes

A local-first notes app for people who do not want an account.

Notes stay on disk.

## O que é

Site estático (HTML + CSS + JS, sem build) para um produto de uma página, com a
camada de artefatos visuais da Aurora: halo e moldura de app no hero, cards com
mini-UI, ribbons de gradiente, starfield e paisagem, e grão sobre a página.
Gerado a partir do template `template-v2` do `landing-starter`.

## Rodar

```bash
node serve.mjs
# http://localhost:8787/
```

Não há build. Abrir `index.html` direto funciona; o resolvedor de download (Nível 1.5)
é um módulo ES e só roda via http(s) — use `node serve.mjs` para vê-lo em ação.

## Customizar

- **Cores e tipografia:** bloco 1 de `assets/css/styles.css` (tokens). A página é
  **dark-first**: o tema escuro é o `:root` e o claro é a classe `.light`. Trocar o
  valor troca o tema; trocar o nome do papel quebra a hierarquia.
- **Artefatos:** cada efeito tem token próprio — `--glow-*` (halo e ribbons),
  `--ribbon-op`, `--star-*` (estrelas), `--grain-op` (grão), `--land-*` (paisagem).
  Intensidade em `.light` logo abaixo do `:root`.
- **Conteúdo:** seções de `index.html` — hero (com o shot), features (com os mocks),
  interface (chips, ícones e diagrama), download, cta, faq, footer.
- **Mocks:** os "wells" das features e o shot do hero são desenhos em HTML/CSS —
  troque por um screenshot real quando tiver um, ou mantenha como placeholder.
- **Download:** os botões resolvem o último release no cliente (Nível 1.5), guiados
  por `data-release-os` em `index.html` e pelo mapa de padrões em
  `assets/js/latest-release.mjs`; escolha o nível por tipo de host em
  `download/README.md`.

## Fontes

`assets/fonts/` traz duas fontes self-hosted sob SIL OFL 1.1 (os textos das licenças
viajam junto): **Zalando Sans SemiExpanded** (texto) e **Geist Mono** (máquina). Para
remover, apague o bloco `@font-face` de `styles.css` — o fallback de sistema assume.

## Testes

```bash
node --test download/worker.test.mjs assets/js/latest-release.test.mjs
```

## Deploy

- **Só o site (sem backend):** GitHub Pages, Netlify ou Cloudflare Pages — o Nível 1.5
  do `download/README.md` já é o padrão e não precisa de configuração.
- **Com host que rode o worker:** `cd download && npx wrangler deploy` e aponte a rota
  `/download/*`.

## Licença

Defina a sua antes de publicar. O template não impõe licença.
