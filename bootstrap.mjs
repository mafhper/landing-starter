#!/usr/bin/env node
/* ==========================================================================
   bootstrap.mjs - instancia um projeto novo a partir de template/.

   Uso:
     node bootstrap.mjs <destino> [opcoes]

   Opcoes:
     --name "Meu App"       nome exibido (default: nome da pasta do destino)
     --repo owner/repo      repositorio GitHub (default: OWNER/REPO)
     --tagline "..."        primeira frase do lede do hero
     --desc "..."           meta description + rodape
     --accent "#1d4ed8"     cor de marca (hex)
     --version "0.1.0"      versao exibida no hero
     --git                  roda git init + commit inicial no destino
     --dry                  mostra o que faria, sem escrever nada

   O que ele faz, em ordem:
     1. valida os argumentos (destino nao pode existir com conteudo);
     2. percorre template/ e escreve cada arquivo no destino, substituindo
        os placeholders (__PROJECT_NAME__, __REPO__, __SLUG__, ...);
     3. confere que nenhum placeholder sobrou;
     4. imprime os proximos passos.
   ========================================================================== */

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = join(ROOT, "template");

/* ---- argumentos --------------------------------------------------------- */

const BOOL_FLAGS = new Set(["dry", "git"]);
const flags = new Map();
const positionals = [];
for (let i = 0; i < process.argv.length - 2; i++) {
  const a = process.argv[i + 2];
  if (a.startsWith("--")) {
    const key = a.slice(2);
    if (BOOL_FLAGS.has(key)) {
      flags.set(key, true);
    } else {
      const val = process.argv[i + 3];
      if (val === undefined || val.startsWith("--")) fail(`--${key} precisa de um valor`);
      flags.set(key, val);
      i++;
    }
  } else {
    positionals.push(a);
  }
}

function fail(msg) {
  console.error(`erro: ${msg}`);
  console.error("uso: node bootstrap.mjs <destino> [--name ..] [--repo ..] [--tagline ..] [--desc ..] [--accent ..] [--version ..] [--git] [--dry]");
  process.exit(1);
}

const destinoArg = positionals[0];
if (!destinoArg) fail("falta o destino");
const destino = resolve(destinoArg);
const dry = flags.has("dry");

/* ---- defaults e validacao ----------------------------------------------- */

function humanize(s) {
  return s
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

const name = String(flags.get("name") ?? humanize(basename(destino)));
const repo = String(flags.get("repo") ?? "OWNER/REPO");
const tagline = String(flags.get("tagline") ?? "A small tool that does one thing well.");
const desc = String(flags.get("desc") ?? "One line about the product, for search results and link previews.");
const accent = String(flags.get("accent") ?? "#1d4ed8");
const version = String(flags.get("version") ?? "0.1.0");
const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "app";

if (!/^#[0-9a-fA-F]{3,8}$/.test(accent)) fail(`--accent "${accent}" nao e um hex valido (ex.: #1d4ed8)`);
if (!/^[^\s/]+\/[^\s/]+$/.test(repo)) fail(`--repo "${repo}" nao esta no formato owner/repo`);
if (!/^[0-9][0-9a-zA-Z.+-]*$/.test(version)) fail(`--version "${version}" invalida (ex.: 0.1.0)`);

if (!existsSync(TEMPLATE)) fail(`nao achei ${TEMPLATE} - rode o bootstrap da pasta do template`);
if (existsSync(destino) && readdirSync(destino).length > 0) {
  fail(`o destino ${destino} ja existe e nao esta vazio`);
}
if (destino === ROOT || destino.startsWith(TEMPLATE + "\\") || destino.startsWith(TEMPLATE + "/")) {
  fail("o destino nao pode ser a raiz do template nem ficar dentro de template/");
}

/* ---- o mapa de substituicao --------------------------------------------- */

const MAP = {
  __PROJECT_NAME__: name,
  __DESC__: desc,
  __TAGLINE__: tagline,
  __REPO__: repo,
  __SLUG__: slug,
  __ACCENT__: accent,
  __VERSION__: version,
};

const TEXT_EXT = new Set([".html", ".css", ".js", ".mjs", ".md", ".jsonc", ".json", ".toml", ".txt", ".yml", ".yaml", ".csv", ".svg", ".gitignore"]);

const isText = (p) => TEXT_EXT.has(extname(p)) || basename(p) === ".gitignore";

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else yield p;
  }
}

/* ---- escreve ------------------------------------------------------------ */

const arquivos = [...walk(TEMPLATE)];
let bytes = 0;
const escritos = [];

for (const src of arquivos) {
  const rel = relative(TEMPLATE, src);
  /* README.template.md existe com esse nome no TEMPLATE para nao colidir com
     o README do proprio repo do template; no destino ele E o README.md. */
  const relDestino = rel.replace(/(^|[\\/])README\.template\.md$/, "$1README.md");
  const dst = join(destino, relDestino);
  bytes += statSync(src).size;
  escritos.push(relDestino);
  if (dry) continue;

  mkdirSync(dirname(dst), { recursive: true });
  if (isText(src)) {
    let conteudo = readFileSync(src, "utf8");
    for (const [chave, valor] of Object.entries(MAP)) conteudo = conteudo.split(chave).join(valor);
    writeFileSync(dst, conteudo, "utf8");
  } else {
    cpSync(src, dst);
  }
}

/* ---- confere residuo ---------------------------------------------------- */

if (!dry) {
  const sobrou = [];
  for (const rel of escritos) {
    const p = join(destino, rel);
    if (!isText(p)) continue;
    const m = readFileSync(p, "utf8").match(/__[A-Z_]{2,}__/);
    if (m) sobrou.push(`${rel}: ${m[0]}`);
  }
  if (sobrou.length) {
    console.error("aviso: placeholder nao substituido:");
    for (const s of sobrou) console.error("  " + s);
  }
}

/* ---- git (opcional) ------------------------------------------------------ */

if (!dry && flags.has("git")) {
  try {
    execFileSync("git", ["init", "-b", "main"], { cwd: destino, stdio: "pipe" });
    execFileSync("git", ["add", "-A"], { cwd: destino, stdio: "pipe" });
    execFileSync("git", ["commit", "-m", "chore: init from landing-starter"], { cwd: destino, stdio: "pipe" });
    console.log("git: repositorio inicializado com o commit inicial");
  } catch (e) {
    console.error("aviso: git nao completou (git user configurado?):", String(e.message).slice(0, 120));
  }
}

/* ---- resumo -------------------------------------------------------------- */

const kb = Math.max(1, Math.round(bytes / 1024));
console.log(dry ? "== dry run (nada foi escrito) ==" : "== projeto criado ==");
console.log(`  destino  ${destino}`);
console.log(`  arquivos ${escritos.length} (${kb} KB)`);
console.log(`  name     ${name}`);
console.log(`  repo     ${repo}${repo === "OWNER/REPO" ? "   <- troque antes de publicar" : ""}`);
console.log(`  slug     ${slug}`);
console.log(`  accent   ${accent}`);
if (dry) {
  console.log("  -------");
  for (const rel of escritos) console.log(`  ${rel}`);
  console.log("\nrode sem --dry para escrever.");
} else {
  console.log(`
proximos passos:
  1. cd ${JSON.stringify(rootRel(destino))}
  2. ajuste o repositorio em download/worker.mjs (CONFIG.repo) ou em download/wrangler.jsonc (vars)
  3. node --test download/worker.test.mjs
  4. para ver local: node serve.mjs   (ou abra index.html direto)`);
}

function rootRel(p) {
  const r = relative(process.cwd(), p);
  return r && !r.startsWith("..") ? r : p;
}
