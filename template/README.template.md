# __PROJECT_NAME__

__DESC__

__TAGLINE__

## O que é

Site estático (HTML + CSS + JS, sem build) para um produto de uma página. Gerado a
partir do template `landing-starter`.

## Rodar

```bash
node serve.mjs
# http://localhost:8787/
```

Não há build. Abrir `index.html` direto funciona; o resolvedor de download (Nível 1.5)
é um módulo ES e só roda via http(s) — use `node serve.mjs` para vê-lo em ação.

## Customizar

- **Cores e tipografia:** bloco 1 de `assets/css/styles.css` (tokens). Trocar o valor
  troca o tema; trocar o nome do papel quebra a hierarquia.
- **Conteúdo:** seções de `index.html` — hero, features, download, faq, footer.
- **Download:** os botões resolvem o último release no cliente (Nível 1.5), guiados por
  `data-release-os` em `index.html` e pelo mapa de padrões em
  `assets/js/latest-release.mjs`; escolha o nível por tipo de host em
  `download/README.md`.

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
