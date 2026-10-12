# landing-starter

Template de landing de produto em HTML/CSS/JS puro — sem build, sem dependências.
Inclui navbar responsiva, tema claro/escuro, ilustrações isométricas com interação e
botões de download que sempre entregam o último release do GitHub.

**Demo:** https://mafhper.github.io/landing-starter/

## Como funciona

- **Navbar subtrativa** — os links somem por prioridade (920 / 680 / 600 / 380 px) e
  restam marca, tema e CTA. Sem hamburger, sem JS de menu.
- **Tema claro/escuro** — script anti-FOUC, toggle e `prefers-reduced-motion` respeitado
  em todas as animações.
- **Ilustrações isométricas** nos cards, com hover: a pilha separa em camadas, o pulso
  viaja pelo arco, o selo flutua.
- **Download do último release**, em quatro níveis por tipo de host (detalhes em
  `template/download/README.md`):
  - **Nível 1** — host estático com asset de nome fixo: link direto em
    `releases/latest/download/<asset>`;
  - **Nível 1.5** (o padrão do template) — host estático com assets versionados:
    `latest-release.mjs` resolve os links no cliente, direto para os assets do último
    release; se a API falhar, o link fica na página de releases;
  - **Nível 2** — host com server-side: worker incluído (`/download/<os>`, 302, cache de
    300s);
  - **Nível 3** — tráfego alto: dispatch + KV.
- **`bootstrap.mjs`** instancia um projeto novo com um comando.

## Uso

```bash
node bootstrap.mjs ../meu-app --name "Meu App" --repo dono/repo --accent "#0ea5e9" --git
```

Ver sem escrever: `--dry`. Testes: `node --test template/download/worker.test.mjs template/assets/js/latest-release.test.mjs`.

## Estrutura

```
template/       o que vira o projeto novo (index.html, assets/, download/, serve.mjs)
bootstrap.mjs   instancia um projeto novo a partir de template/
demo/           o template instanciado ("Demo Notes"), publicado no Pages
```

## Licença

Defina antes de publicar.

---

Padrão destilado de uma análise de `openlogi.org`; ilustrações usam o kernel do
`iso-figure` (MIT).
