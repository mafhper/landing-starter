# Demo Notes

A local-first notes app for people who do not want an account.

Notes stay on disk.

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
- **Downloads:** os botoes apontam para `/download/<os>`. Os dois caminhos
  (estatico puro e worker) estao em `download/README.md`.

## Testes

```bash
node --test download/worker.test.mjs
```

## Deploy

- **So o site (sem backend):** publique a raiz em GitHub Pages, Netlify ou
  Cloudflare Pages. Nesse caso use o "Nivel 1" do `download/README.md`
  (links diretos para `releases/latest/download/...`, com nome de asset
  fixo).
- **Com o resolvedor de downloads:** `cd download && npx wrangler deploy`
  e aponte a rota `/download/*` para o worker.

## Licenca

Defina a sua antes de publicar. O template nao impoe licenca.
