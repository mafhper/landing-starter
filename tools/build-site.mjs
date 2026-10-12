#!/usr/bin/env node
/* ==========================================================================
   build-site.mjs - monta o _site/ publicado no GitHub Pages.

   O que ele faz, em ordem:
     1. limpa _site/ e _stage/;
     2. copia site/ (a galeria) para a raiz do _site;
     3. copia cada demo para o seu slug (demo/ -> /classic/, demo-v2/ -> /aurora/);
     4. empacota cada template em downloads/<slug>.zip (com START-HERE.md e o
        README.template.md renomeado para README.md);
     5. valida: toda referência local (src/href) existe, e nenhum placeholder
        __TOKEN__ sobrou nas páginas publicadas.

   Os zips nunca são versionados: são gerados aqui, a cada build (local ou CI).
   No CI (ubuntu) usa o `zip`; no Windows cai para Compress-Archive.
   Sem dependências.

   Uso:
     node tools/build-site.mjs [--no-zip]
   ========================================================================== */

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "_site");
const STAGE = join(ROOT, "_stage");
const noZip = process.argv.includes("--no-zip");

/* ---- o catálogo ---------------------------------------------------------- */

const TEMPLATES = [
  { slug: "classic", dir: "template", demo: "demo", name: "Classic" },
  { slug: "aurora", dir: "template-v2", demo: "demo-v2", name: "Aurora" },
];

/* ---- 1. limpeza ---------------------------------------------------------- */

rmSync(OUT, { recursive: true, force: true });
rmSync(STAGE, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
mkdirSync(STAGE, { recursive: true });

/* ---- 2. galeria na raiz -------------------------------------------------- */

cpSync(join(ROOT, "site"), OUT, { recursive: true });

/* ---- 3. demos nos slugs -------------------------------------------------- */

for (const t of TEMPLATES) {
  const from = join(ROOT, t.demo);
  if (!existsSync(from)) {
    console.error(`erro: demo "${t.demo}" não existe (slug ${t.slug})`);
    process.exit(1);
  }
  cpSync(from, join(OUT, t.slug), { recursive: true });
}

/* ---- 4. zips dos templates ----------------------------------------------- */

function startHere(t) {
  return `# ${t.name} template — start here

This folder is the raw "${t.name}" template (folder \`${t.dir}\` in the
landing-starter repository). Placeholders like \`__PROJECT_NAME__\` are not
filled in yet.

## Option A — use the starter (recommended)

Inside a clone of landing-starter:

    node bootstrap.mjs ../my-app --template ${t.dir} \\
      --name "My App" --repo owner/repo --accent "#7c3aed"

That fills every placeholder, and checks that none is left behind.

## Option B — standalone

Replace the tokens yourself, anywhere they appear:

    __PROJECT_NAME__   display name
    __DESC__           meta description + footer line
    __TAGLINE__        first sentence of the hero lede
    __REPO__           GitHub repository, owner/repo
    __SLUG__           slug for package ids (brew)
    __ACCENT__         brand colour (hex)
    __VERSION__        version shown in the hero

Then run \`node serve.mjs\` and open http://localhost:8787/.
No build step: it is plain HTML, CSS and JavaScript.
`;
}

function makeZip(slug, zipPath) {
  try {
    execFileSync("zip", ["-r", "-q", zipPath, slug], { cwd: STAGE, stdio: "pipe" });
    return "zip";
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    execFileSync("powershell", [
      "-NoProfile",
      "-Command",
      `Compress-Archive -LiteralPath '${join(STAGE, slug)}' -DestinationPath '${zipPath}' -Force`,
    ], { stdio: "pipe" });
    return "Compress-Archive";
  }
}

const zipMsgs = [];
if (!noZip) {
  mkdirSync(join(OUT, "downloads"), { recursive: true });
  for (const t of TEMPLATES) {
    const staged = join(STAGE, t.slug);
    cpSync(join(ROOT, t.dir), staged, { recursive: true });
    const readme = join(staged, "README.template.md");
    if (existsSync(readme)) renameSync(readme, join(staged, "README.md"));
    writeFileSync(join(staged, "START-HERE.md"), startHere(t), "utf8");
    const zipPath = join(OUT, "downloads", `${t.slug}.zip`);
    const how = makeZip(t.slug, zipPath);
    zipMsgs.push(`${t.slug}.zip (${Math.round(statSync(zipPath).size / 1024)} KB via ${how})`);
  }
} else {
  zipMsgs.push("(pulados: --no-zip)");
}

rmSync(STAGE, { recursive: true, force: true });

/* ---- 5. validação do publicado ------------------------------------------- */

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

const erros = [];
const refRe = /(?:src|href)\s*=\s*"([^"]+)"/g;

for (const file of walk(OUT)) {
  const ext = extname(file).toLowerCase();
  if (![".html", ".css", ".js", ".mjs"].includes(ext)) continue;
  const text = readFileSync(file, "utf8");
  const rel = file.slice(OUT.length + 1);
  const isTest = /\.test\.[cm]?js$/.test(file);

  /* Testes podem citar tokens de propósito (é o caso do latest-release);
     o que não pode sobrar é placeholder na página publicada. */
  if (!isTest) {
    const leftover = text.match(/__[A-Z_]{2,}__/);
    if (leftover) erros.push(`${rel}: placeholder residual ${leftover[0]}`);
  }

  if (ext !== ".html") continue;
  for (const m of text.matchAll(refRe)) {
    const ref = m[1];
    if (/^(https?:)?\/\//.test(ref) || ref.startsWith("#") || ref.startsWith("/") || ref.startsWith("mailto:") || ref.startsWith("data:")) continue;
    if (ref.includes("__")) continue;
    const clean = ref.split(/[?#]/)[0];
    if (!clean) continue;
    let alvo = resolve(dirname(file), clean);
    if (existsSync(alvo) && statSync(alvo).isDirectory()) alvo = join(alvo, "index.html");
    if (!existsSync(alvo)) erros.push(`${rel}: referência quebrada "${ref}"`);
  }
}

if (erros.length) {
  console.error("validação falhou:");
  for (const e of erros) console.error("  " + e);
  process.exit(1);
}

/* ---- resumo -------------------------------------------------------------- */

let bytes = 0, files = 0;
for (const f of walk(OUT)) { bytes += statSync(f).size; files++; }

console.log("== _site montado ==");
console.log(`  raiz      site/ (galeria)`);
for (const t of TEMPLATES) console.log(`  /${t.slug}/     ${t.demo}/`);
console.log(`  downloads ${zipMsgs.join(", ")}`);
console.log(`  arquivos  ${files} (${Math.round(bytes / 1024)} KB)`);
console.log("  validação ok: referências locais resolvem e não há placeholder residual");
