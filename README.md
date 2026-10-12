# landing-starter

Catálogo de templates de landing de produto em HTML/CSS/JS puro — sem build, sem
dependências, sem framework. Cada template inclui navbar responsiva, tema claro/escuro,
download que resolve o último release do GitHub e um `bootstrap.mjs` que instancia o
projeto com um comando.

**Catálogo (GitHub Pages):** https://mafhper.github.io/landing-starter/
**Classic:** [/classic/](https://mafhper.github.io/landing-starter/classic/) ·
**Aurora:** [/aurora/](https://mafhper.github.io/landing-starter/aurora/)

## Templates

| Template | Pasta | Caráter | Origem |
|---|---|---|---|
| **Classic** | `template/` | Hairlines no lugar de sombras, nav subtrativa, ilustrações isométricas; tema claro com escuro por preferência do sistema | Destilado de uma análise de `openlogi.org` |
| **Aurora** | `template-v2/` | Dark-first com claro funcional: moldura de app com halo, cards com mini-UI, ribbons de gradiente, starfield, paisagem e grão; fontes OFL self-hosted | Releitura própria inspirada no app desktop do Genex (MIT); nenhum código do site original foi copiado |

Mecanismos compartilhados: **download em quatro níveis** (detalhes em
`download/README.md` de cada template), **testes em Node sem host** e **serve.mjs**
para ver local.

## Uso

```bash
node bootstrap.mjs ../meu-app --template template-v2 --name "Meu App" --repo dono/repo --accent "#7c3aed" --git
node bootstrap.mjs --list        # o catálogo
```

Ver sem escrever: `--dry`. O bootstrap substitui os placeholders (`__PROJECT_NAME__`,
`__REPO__`, `__SLUG__`, …) e avisa se algum sobrar.

Testes de um template instanciado: `node --test download/worker.test.mjs assets/js/latest-release.test.mjs`.

## Estrutura

```
site/           a galeria publicada na raiz do Pages (cards com preview e download)
template/       Classic — o que vira o projeto novo
template-v2/    Aurora  — idem, com a camada de artefatos visuais
demo/           Classic instanciado ("Demo Notes"), publicado em /classic/
demo-v2/        Aurora instanciado ("Demo Notes"), publicado em /aurora/
tools/          build-site.mjs (monta o _site + zips) e capture.mjs (screenshots via Edge headless)
bootstrap.mjs   instancia um projeto novo a partir de um template do catálogo
```

## Pages

O workflow `.github/workflows/pages.yml` roda `node tools/build-site.mjs`, que monta
`_site/` — galeria na raiz, demos em `/classic/` e `/aurora/`, zips dos templates em
`/downloads/` (gerados a cada build, nunca versionados) — e publica o conjunto. O
build valida as referências locais e a ausência de placeholders residuais antes de
publicar.

## Créditos e licenças

- **Classic**: código próprio, destilado de uma análise da página da `openlogi.org`;
  ilustrações usam o kernel do `iso-figure` (MIT).
- **Aurora**: código próprio, inspirado no visual do app desktop do Genex
  (`genex-desktop`, MIT) — sem código copiado do site.
- **Fontes (Aurora e galeria)**: Zalando Sans SemiExpanded e Geist Mono, ambas sob
  SIL OFL 1.1; os textos das licenças estão em `template-v2/assets/fonts/`.
- Licença dos templates gerados: defina antes de publicar. O starter não impõe licença.
