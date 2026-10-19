# Marca — landing-starter (catálogo)

Identidade da **galeria do catálogo** (`site/`, publicada na raiz do Pages).
Os templates `template/` e `template-v2/` **não** usam esta marca —
continuam neutros com placeholders.

## Arquivos

| Arquivo | Papel | `viewBox` |
|---|---|---|
| `logo.svg` | **SVG-mãe editável** — símbolo + wordmark em paths, sem `<text>` | 512 (`0 0 512 512`) |
| `logo-dark.svg` | Derivado dark (fundo escuro). Hoje, byte-idêntico à mãe (dark-first) | 512 |
| `logo-light.svg` | Derivado light (fundo claro). Mesma geometria, tintas trocadas | 512 |
| `icon.svg` | Símbolo em **placa própria** (badge). Sem wordmark | 512 |
| `favicon.svg` | Versão mínima para a aba — adaptador mínimo: placa + frame + lua-dot + 1 crista; dobra/cristas/halo cheio só a partir de `icon.svg` | 64 |

Regra: **derivado se regenera a partir da mãe** — nunca edite
`logo-dark.svg`, `logo-light.svg`, `icon.svg` ou `favicon.svg` à mão.

Interface: usar os SVGs só via `<img>` — nunca inline dois derivados no
mesmo documento sem renomear os IDs (`halo`, `plate`, `accentG`, `nearG`,
`fclip` se repetem nos arquivos).

## O símbolo

Uma **moldura de landing** (o que o catálogo distribui) com **dobra de
template** no canto (o `bootstrap.mjs` preenche e "dobra" o template em
projeto), cena interna com **starfield, lua e três cristas** — o horizonte
da linguagem Aurora — e o **halo** como artefato-assinatura. A wordmark
`landing-starter` é monolinear em paths (hífen e pingo do `i`
em accent).

## Paleta (herdada do site/Aurora)

| Token | Valor |
|---|---|
| accent | `#7c3aed` |
| glow-a / glow-b | `#7c5cff` / `#c084fc` |
| canvas (dark) | `#07080c` |
| ink dark / light | `#eef1f6` / `#101319` |

Gradientes com 2–3 paradas em `defs`. A arte nasce escura; a variante
light deriva sem redesenhar.

Neutros de construção (tintas de placa/chrome do desenho, fora dos
tokens Aurora): `#151b29`, `#0e1016`, `#2a3040`, `#3a4560`, `#1b2233`,
`#1b1f29`.

Validado pelo executor: `logo-light.svg` confere sobre `#fff` e `#edf0f5`
(traço e halo leem nos dois fundos).

## Tipografia

Zalando Sans SemiExpanded + Geist Mono, ambas **SIL OFL 1.1** (textos das
licenças em `template-v2/assets/fonts/`; no site publicado, copiados para
`site/assets/fonts/` e linkados no rodapé). A wordmark da mãe é lettering
vetorial próprio — não referencia fonte, não usa `<text>`. Nos rasters com
nome assado, a fonte entra via CSS (`@font-face`, já self-hosted em
`site/assets/fonts/`).

## Uso

- Header da galeria: badge do `icon.svg` (~28px) + o nome em texto ao lado —
  a lockup empilhada não lê a 28px (wordmark fica com ~2px).
- Aba: `favicon.svg` (+ PNGs de fallback, abaixo).
- Social/SEO: `og.webp` 1200x630 (abaixo) — único raster referenciado no
  repo (`site/index.html`: `og:image` + `twitter:image`).
- `release.webp` 1200x630 — anexo de post de release; mesmo render do
  `og.webp`; aplicação manual (nada no repo o referencia).
- `banner-github.webp` 1280x640 — social preview do repositório no GitHub
  (Settings → Social preview); aplicação manual.
- `promo-card.webp` 1200x630 — cartão social de anúncio/post; aplicação manual.
- `hero.webp` / `hero@2x.webp` 1280x640 / 2560x1280 — hero sem texto (1x/2x)
  para material que peça imagem de topo; aplicação manual.

## Raster + wiring (executado pelo `@build`)

Raster final (via Chromium, sem dependências) e wiring no `site/` — executado
em 2026-10-19:

| Destino em `site/` | Dimensão | Origem |
|---|---|---|
| `favicon-16.png` / `favicon-32.png` / `favicon-192.png` / `favicon-512.png` | 16 / 32 / 192 / 512 | `assets/brand/favicon.svg` |
| `apple-touch-icon-180.png` | 180x180 | `assets/brand/icon.svg` |
| `icon.ico` | 16/32/48 | `assets/brand/icon.svg` |
| `og.webp` / `release.webp` | 1200x630 | `icon.svg` (placa) + nome em texto (`Zalando Sans SemiExpanded`) + tagline sobre canvas + halo |
| `banner-github.webp` | 1280x640 | `icon.svg` (placa) + nome em texto (`Zalando Sans SemiExpanded`) + halo (assinatura de leitura) |
| `hero.webp` / `hero@2x.webp` | 1280x640 / 2560x1280 | `icon.svg` + halo, **sem texto** |
| `promo-card.webp` | 1200x630 | cartão social com o **nome assado no raster** |

Wiring: copiar os SVGs para `site/` (`favicon.svg`, `brand/logo-dark.svg`,
`brand/icon.svg`), referenciar no `<head>` (favicon, PNGs por `sizes`,
`apple-touch-icon`, `theme-color`, `og:image` absoluto, `twitter:card`) +
header (badge `icon.svg` ~28px + nome em texto), e validar com
`node tools/build-site.mjs`. Nada acima é provisório fora da spec.

Notas da execução: `og.webp` e `release.webp` são **o mesmo render** sob dois
nomes (a variação com versão foi descartada — número envelhece no raster); a
tagline assada é o literal `Pick a landing. Make it yours.` (2ª metade em
gradiente, como no `h1` do site); o nome assado sai em texto com a fonte
self-hosted (`Zalando Sans SemiExpanded`, como no header) — o lettering em
paths fica na SVG-mãe, não nos rasters; a placa do `icon.svg` em
`og`/`release`/`banner` casa com `hero`/`promo-card`; `icon.ico` tem 3
entradas PNG (16/32/48) e os PNGs de favicon saem com cantos transparentes.

## Licença

Arte 100% própria, código próprio, fontes OFL já presentes no repositório.
