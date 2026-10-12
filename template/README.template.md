# __PROJECT_NAME__

__DESC__

__TAGLINE__

## O que e isso

Site estatico (HTML + CSS + JS, sem build) para um produto de uma pagina,
com os botoes de download resolvendo o ultimo release por rota. Gerado a
partir do template `landing-starter`.

## Rodar localmente

Nao ha build. Sirva a pasta com o dev server embutido (sem dependencia):

```bash
node serve.mjs
# http://localhost:8787/
```

Ou abra `index.html` direto no navegador.

## Customizar

- **Cores e tipografia:** `assets/css/styles.css`, bloco 1 (tokens).
  Trocar o valor troca o tema; trocar o nome do papel quebra a hierarquia.
- **Conteudo:** `index.html` - secoes hero, features, download, faq, footer.
- **Texto do hero, ano e copia:** `assets/js/app.js` (pouco mais que isto).
- **Downloads:** os botoes apontam para `/download/<os>`. O caminho para
  host estatico (GitHub Pages) e a opcao com server-side estao em
  `download/README.md`.

## Testes

```bash
node --test download/worker.test.mjs
```

## Deploy

- **So o site (sem backend):** publique a raiz em GitHub Pages, Netlify ou
  Cloudflare Pages. E o caminho **padrao para GitHub Pages**: use os links do
  "Nivel 1" do `download/README.md` (`releases/latest/download/...`, com
  nome de asset fixo).
- **Com um host que rode o worker** (qualquer runtime de `fetch`; exemplo
  com Cloudflare incluso): `cd download && npx wrangler deploy` e aponte a
  rota `/download/*` para o worker.

## Licenca

Defina a sua antes de publicar. O template nao impoe licenca.
