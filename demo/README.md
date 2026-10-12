# Demo Notes

A local-first notes app for people who do not want an account.

Notes stay on disk.

## O que é

Site estático (HTML + CSS + JS, sem build) para um produto de uma página. Gerado a
partir do template `landing-starter`.

## Rodar

```bash
node serve.mjs
# http://localhost:8787/
```

Não há build. Também funciona abrindo `index.html` direto no navegador.

## Customizar

- **Cores e tipografia:** bloco 1 de `assets/css/styles.css` (tokens). Trocar o valor
  troca o tema; trocar o nome do papel quebra a hierarquia.
- **Conteúdo:** seções de `index.html` — hero, features, download, faq, footer.
- **Download:** os botões apontam para `/download/<os>`; escolha o nível por tipo de
  host em `download/README.md`.

## Testes

```bash
node --test download/worker.test.mjs
```

## Deploy

- **Só o site (sem backend):** GitHub Pages, Netlify ou Cloudflare Pages. Para GitHub
  Pages, use os links do Nível 1 do `download/README.md`.
- **Com host que rode o worker:** `cd download && npx wrangler deploy` e aponte a rota
  `/download/*`.

## Licença

Defina a sua antes de publicar. O template não impõe licença.
