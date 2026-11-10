# __PROJECT_NAME__

__DESC__

__TAGLINE__

## O que é

Site estático (HTML + CSS + JS, sem build) para uma marca de uma página, com caráter
editorial e de comércio: hero tipográfico com sedas desenhadas em CSS, manifesto,
coleção com filtro, ofício em seção escura, diário, carta do atelier e uma sacola de
demonstração com ficha de peça. Nenhuma imagem: as sedas são gradientes compostos e
as dobras são luz. Gerado a partir do template `template-v3` do `landing-starter`.

## Rodar

```bash
node serve.mjs
# http://localhost:8787/
```

Não há build e não há dependências. Abrir `index.html` direto funciona; o servidor
existe só para servir por HTTP local (e para testar em outro dispositivo da rede).

## Customizar

- **Cores e tipografia:** bloco `:root` de `assets/css/styles.css`. O acento da marca
  é `--accent` (o bootstrap o preenche); papel, tinta, ouro e sálvia são tokens
  separados. A display é Bodoni Moda e o texto é Inter, ambos self-hosted.
- **Conteúdo:** seções de `index.html` — hero, manifesto, coleção, ofício, diário,
  carta e rodapé. O nome da marca e a descrição aparecem em vários pontos; o bootstrap
  substitui todos de uma vez.
- **Peças:** os cards visíveis ficam em `index.html` (nome, preço, categoria e a
  seda `data-scarf`); as fichas completas ficam em `DETAILS`, no topo de
  `assets/js/app.js`. Ao trocar uma peça, ajuste os dois.
- **Sacola:** é uma demonstração funcional no cliente (quantidade, remoção, subtotal).
  “Finalizar reserva” apenas mostra uma mensagem; não há backend, pagamento, cookie
  nem analytics.
- **Sedas:** cada padrão é uma regra `.silk[data-scarf="..."]` em `styles.css`.
  Para criar outra, copie uma regra e use o mesmo identificador no card e na ficha.
- **Movimento:** a entrada usa `IntersectionObserver` + CSS; marquee, deriva das sedas
  e sheen dos cards são CSS. `prefers-reduced-motion: reduce` desliga tudo e deixa o
  conteúdo visível de imediato.
- **Favicon e compartilhamento:** o favicon é um SVG inline no `<head>`; as meta tags
  Open Graph usam o nome e a descrição preenchidos pelo bootstrap.

## Fontes

`assets/fonts/` traz **Bodoni Moda** (display) e **Inter** (texto), self-hosted sob
SIL OFL 1.1 — os textos das licenças viajam junto. Para remover, apague o bloco
`@font-face` de `styles.css`; o fallback de sistema assume. Não há requisição a
Google Fonts nem a qualquer outro domínio.

## Acessibilidade

O contraste dos pares de texto essenciais fica em 4,5:1 ou mais; o menu móvel usa
`aria-expanded`, `inert` e trava de rolagem; os diálogos fecham por `Esc` e por clique
no fundo; o filtro mantém as quatro peças no DOM; e o formulário valida o e-mail no
cliente com uma mensagem em `role="status"`.

## Contraste

O verificador é `contrast.mjs`, sem dependências. Ele lê os tokens do bloco `:root`
de `assets/css/styles.css` e recalcula a tabela com o acento vigente:

```bash
node contrast.mjs
```

| Par | Contraste |
|---|---:|
| texto principal / papel | 16,05 |
| texto principal / rodapé | 14,67 |
| texto secundário / papel | 5,18 |
| texto secundário / rodapé | 4,73 |
| acento / papel | 9,51 |
| texto / atelier escuro | 16,05 |
| texto secundário / atelier | 8,27 |
| ouro / atelier | 5,19 |
| status de sucesso / papel | 5,37 |

Depois de trocar a paleta ou o acento, rode `node contrast.mjs` de novo. O script sai
com código 1 se algum par de texto ficar abaixo de 4,5:1.

## Originalidade

A página é original: as sedas são gradientes CSS compostos, as dobras são luz e não há
imagem, vídeo ou asset gráfico de terceiro. A copy, a paleta e o desenho são próprios.
As duas famílias tipográficas são SIL OFL e viajam no repositório com os textos das
licenças.

## Verificação feita

- Desktop (1440×900) e mobile (390×844) nominais; sem rolagem horizontal
  (`scrollWidth === clientWidth`).
- Nenhum erro de console ou de página nas navegações e interações testadas.
- Diálogos abrem com foco no fechar, fecham por `Esc` e por clique no fundo.
- Menu móvel com `aria-expanded`, `inert` e trava de rolagem; fechar devolve o foco.
- Filtro mantém as quatro peças no DOM e revela as que voltam.
- Newsletter valida e-mail inválido e limpa o campo no sucesso.
- Sacola: duas peças, quantidade, remoção, subtotal e mensagem de demonstração.
- `prefers-reduced-motion: reduce` remove a classe `.js`, desliga marquee/deriva/entradas
  e deixa todo o conteúdo visível.

## Deploy

O site é estático: GitHub Pages, Netlify, Cloudflare Pages ou qualquer host de
arquivos. Não há worker, função de servidor nem variável de ambiente.

## Natureza do conteúdo

Marca, preços, edições, endereço e e-mail são ficção de conceito. O checkout não
existe. Substitua o conteúdo antes de publicar.

## Licença

Defina a sua antes de publicar. O template não impõe licença.
