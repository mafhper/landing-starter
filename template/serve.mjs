#!/usr/bin/env node
/* ==========================================================================
   serve.mjs - servidor estático de DESENVOLVIMENTO. Sem dependência, sem build.

   Uso:
     node serve.mjs [dir] [porta]     (default: . e 8787)

   O QUE ELE É
   - um servidor mínimo para ver o site local: `node serve.mjs` na pasta do
     projeto, e abra http://localhost:8787/.
   - o site é estático; em produção ele vai para GitHub Pages, Netlify,
     Cloudflare Pages ou qualquer host de arquivos (ver README.md).

   O QUE ELE NÃO É
   - não é servidor de produção: sem cache, sem compressão, sem TLS.
   - as rotas /download/* dependem do worker de download/ (o resolvedor de
     verdade); aqui elas respondem um aviso - ver download/README.md.
   ========================================================================== */

import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, resolve, sep } from "node:path";

const dir = resolve(process.argv[2] ?? ".");
const port = Number(process.argv[3] ?? 8787);

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jsonc": "application/json; charset=utf-8",
  ".toml": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  const pathname = decodeURIComponent(url.pathname);

  /* O resolvedor de downloads é o worker; aqui ele não está no ar. */
  if (pathname.startsWith("/download/")) {
    res.writeHead(501, { "content-type": "text/plain; charset=utf-8" });
    res.end(
      "O resolvedor de downloads é o worker de download/ - no dev local ele não está no ar.\n" +
      "Veja download/README.md (os níveis) para como funciona em produção.\n",
    );
    return;
  }

  /* Caminho seguro: resolve sob o diretório servido, sem sair dele. */
  const rel = pathname.replace(/^[/\\]+/, "");
  let alvo = resolve(dir, rel);
  if (alvo !== dir && !alvo.startsWith(dir + sep)) {
    res.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    res.end("fora do diretório servido\n");
    return;
  }

  if (existsSync(alvo) && statSync(alvo).isDirectory()) alvo = resolve(alvo, "index.html");
  if (!existsSync(alvo) || !statSync(alvo).isFile()) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end(`não achei ${pathname}\n`);
    return;
  }

  res.writeHead(200, {
    "content-type": TIPOS[extname(alvo).toLowerCase()] ?? "application/octet-stream",
    "cache-control": "no-store",
  });
  createReadStream(alvo).pipe(res);
}).listen(port, () => {
  console.log(`servindo ${dir}`);
  console.log(`  http://localhost:${port}/`);
});
