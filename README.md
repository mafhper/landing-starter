# landing-starter

Catálogo de templates de landing de produto em HTML/CSS/JS puro — sem build, sem
dependências, sem framework. Cada template é uma página estática; Classic e Aurora
incluem navbar responsiva, tema claro/escuro e download que resolve o último release
do GitHub, e todos são instanciados pelo mesmo `bootstrap.mjs`.

**Catálogo (GitHub Pages):** https://mafhper.github.io/landing-starter/
**Classic:** [/classic/](https://mafhper.github.io/landing-starter/classic/) ·
**Aurora:** [/aurora/](https://mafhper.github.io/landing-starter/aurora/) ·
**Silk:** [/silk/](https://mafhper.github.io/landing-starter/silk/)

## Templates

| Template | Pasta | Caráter | Origem |
|---|---|---|---|
| **Classic** | `template/` | Hairlines no lugar de sombras, nav subtrativa, ilustrações isométricas; tema claro com escuro por preferência do sistema | Destilado de uma análise de `openlogi.org` |
| **Aurora** | `template-v2/` | Dark-first com claro funcional: moldura de app com halo, cards com mini-UI, ribbons de gradiente, starfield, paisagem e grão; fontes OFL self-hosted | Releitura própria inspirada no app desktop do Genex (MIT); nenhum código do site original foi copiado |
| **Silk** | `template-v3/` | Editorial e tátil: papel quente, Bodoni Moda, sedas desenhadas em CSS, coleção com filtro, ofício, diário e sacola de demonstração; fontes OFL self-hosted | Conceito próprio de uma casa de seda fictícia; nenhuma imagem e nenhuma requisição externa |

Mecanismos compartilhados: **serve.mjs** para ver local e **testes em Node sem host**
(Classic e Aurora). O **download em quatro níveis** (detalhes em `download/README.md`
de cada template que o usa) é específico desses dois; o Silk não tem fluxo de download.

## Uso

```bash
node bootstrap.mjs ../meu-app --template template-v2 --name "Meu App" --repo dono/repo --accent "#7c3aed" --git
node bootstrap.mjs --list        # o catálogo
```

Ver sem escrever: `--dry`. O bootstrap substitui os placeholders (`__PROJECT_NAME__`,
`__REPO__`, `__SLUG__`, …) e avisa se algum sobrar.

Testes de um template instanciado (Classic e Aurora):
`node --test download/worker.test.mjs assets/js/latest-release.test.mjs`.
No Silk, a prova é `node contrast.mjs` — ele lê os tokens do `:root` e reprova
qualquer par de texto abaixo de 4,5:1.

## Estrutura

```
site/           a galeria publicada na raiz do Pages (cards com preview e download)
template/       Classic — o que vira o projeto novo
template-v2/    Aurora  — idem, com a camada de artefatos visuais
template-v3/    Silk    — idem, editorial/comércio, sem fluxo de download
demo/           Classic instanciado ("Demo Notes"), publicado em /classic/
demo-v2/        Aurora instanciado ("Demo Notes"), publicado em /aurora/
demo-v3/        Silk instanciado ("Silk"), publicado em /silk/
tools/          build-site.mjs (monta o _site + zips) e capture.mjs (screenshots via Edge headless)
bootstrap.mjs   instancia um projeto novo a partir de um template do catálogo
```

## Pages

O workflow `.github/workflows/pages.yml` roda `node tools/build-site.mjs`, que monta
`_site/` — galeria na raiz, demos em `/classic/`, `/aurora/` e `/silk/`, zips dos
templates em `/downloads/` (gerados a cada build, nunca versionados) — e publica o
conjunto. O build valida as referências locais e a ausência de placeholders residuais
antes de publicar.

## Créditos e licenças

- **Classic**: código próprio, destilado de uma análise da página da `openlogi.org`;
  ilustrações usam o kernel do `iso-figure` (MIT).
- **Aurora**: código próprio, inspirado no visual do app desktop do Genex
  (`genex-desktop`, MIT) — sem código copiado do site.
- **Silk**: código próprio; marca, conteúdo, preços e endereço são ficção de conceito;
  nenhuma imagem de terceiro (as sedas são gradientes CSS).
- **Fontes (Aurora e galeria)**: Zalando Sans SemiExpanded e Geist Mono, ambas sob
  SIL OFL 1.1; os textos das licenças estão em `template-v2/assets/fonts/`.
- **Fontes (Silk)**: Bodoni Moda e Inter, ambas sob SIL OFL 1.1; as licenças estão
  em `template-v3/assets/fonts/`.
- Licença dos templates gerados: defina antes de publicar. O starter não impõe licença.
