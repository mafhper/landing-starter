/* ==========================================================================
   latest-release.test.mjs - prova local do resolvedor de download no cliente.

   Roda com:   node --test assets/js/latest-release.test.mjs

   Sem navegador: a escolha do asset é uma função pura, e a aplicação aos
   links aceita `fetch` falso e um `doc` mínimo (dispensa o DOM). Os casos
   usam valores conhecidos-bons: os nomes e as URLs reais do release
   v1.8.3 de mafhper/mark-lee, capturados da API pública em 2026-10-12.
   ========================================================================== */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_PATTERNS,
  fallbackUrl,
  chooseAsset,
  parsePatterns,
  patternsFor,
  fetchLatest,
  applyLatestRelease,
} from "./latest-release.mjs";

/* Os assets reais do mafhper/mark-lee v1.8.3, congelados como fonte
   independente (a API devolve `browser_download_url`; o teste não rede). */
const MARKLEE_ASSETS = [
  { name: "Mark-Lee-1.8.3-1.x86_64.rpm", browser_download_url: "https://github.com/mafhper/mark-lee/releases/download/v1.8.3/Mark-Lee-1.8.3-1.x86_64.rpm" },
  { name: "Mark-Lee_1.8.3_aarch64.app.tar.gz", browser_download_url: "https://github.com/mafhper/mark-lee/releases/download/v1.8.3/Mark-Lee_1.8.3_aarch64.app.tar.gz" },
  { name: "Mark-Lee_1.8.3_amd64.AppImage", browser_download_url: "https://github.com/mafhper/mark-lee/releases/download/v1.8.3/Mark-Lee_1.8.3_amd64.AppImage" },
  { name: "Mark-Lee_1.8.3_amd64.deb", browser_download_url: "https://github.com/mafhper/mark-lee/releases/download/v1.8.3/Mark-Lee_1.8.3_amd64.deb" },
  { name: "Mark-Lee_1.8.3_x64-setup.exe", browser_download_url: "https://github.com/mafhper/mark-lee/releases/download/v1.8.3/Mark-Lee_1.8.3_x64-setup.exe" },
  { name: "Mark-Lee_1.8.3_x64_en-US.msi", browser_download_url: "https://github.com/mafhper/mark-lee/releases/download/v1.8.3/Mark-Lee_1.8.3_x64_en-US.msi" },
  { name: "release-v1.8.webp", browser_download_url: "https://github.com/mafhper/mark-lee/releases/download/v1.8.3/release-v1.8.webp" },
];

/* ---- chooseAsset -------------------------------------------------------- */

test("chooseAsset: os assets reais do mark-lee v1.8.3 por plataforma", () => {
  assert.equal(chooseAsset(MARKLEE_ASSETS, DEFAULT_PATTERNS.macos).name, "Mark-Lee_1.8.3_aarch64.app.tar.gz");
  assert.equal(chooseAsset(MARKLEE_ASSETS, DEFAULT_PATTERNS.windows).name, "Mark-Lee_1.8.3_x64_en-US.msi");
  assert.equal(chooseAsset(MARKLEE_ASSETS, DEFAULT_PATTERNS.linux).name, "Mark-Lee_1.8.3_amd64.deb");
});

test("chooseAsset: a ordem dos padroes vence a ordem dos assets", () => {
  const assets = [
    { name: "App_1.0.0_aarch64.app.tar.gz" },
    { name: "App_1.0.0_aarch64.dmg" },
  ];
  assert.equal(chooseAsset(assets, DEFAULT_PATTERNS.macos).name, "App_1.0.0_aarch64.dmg");
});

test("chooseAsset: sem match, lista vazia ou lixo -> null (o link fica no fallback)", () => {
  assert.equal(chooseAsset([], DEFAULT_PATTERNS.macos), null);
  assert.equal(chooseAsset([{ name: "notes.txt" }], DEFAULT_PATTERNS.windows), null);
  assert.equal(chooseAsset(null, DEFAULT_PATTERNS.linux), null);
  assert.equal(chooseAsset(MARKLEE_ASSETS, []), null);
  assert.equal(chooseAsset(MARKLEE_ASSETS, null), null);
});

/* ---- parsePatterns + patternsFor ---------------------------------------- */

test("parsePatterns: lista separada por virgula vira regex; vazio e invalido viram null", () => {
  const ps = parsePatterns("\\.pkg$, [sem-fechar");
  assert.equal(ps.length, 1);
  assert.ok(ps[0].test("App.pkg"));
  assert.equal(parsePatterns(""), null);
  assert.equal(parsePatterns("[sem-fechar"), null);
  assert.equal(parsePatterns(null), null);
});

test("patternsFor: data-release-patterns vence; desconhecido vira null", () => {
  const comOverride = { dataset: { releaseOs: "macos", releasePatterns: "\\.pkg$" } };
  assert.equal(patternsFor(comOverride)[0].source, "\\.pkg$");
  assert.deepEqual(patternsFor({ dataset: { releaseOs: "windows" } }), DEFAULT_PATTERNS.windows);
  assert.equal(patternsFor({ dataset: { releaseOs: "solaris" } }), null);
  assert.equal(patternsFor({ dataset: {} }), null);
});

/* ---- fallbackUrl + fetchLatest ------------------------------------------ */

test("fallbackUrl: a pagina de releases do repositorio", () => {
  assert.equal(fallbackUrl("OWNER/REPO"), "https://github.com/OWNER/REPO/releases/latest");
});

test("fetchLatest: consulta /releases/latest e devolve o JSON", async () => {
  let url = null;
  const fetchImpl = async (u) => { url = u; return { ok: true, json: async () => ({ tag_name: "v9.9.9" }) }; };
  const release = await fetchLatest("mafhper/mark-lee", fetchImpl);
  assert.equal(url, "https://api.github.com/repos/mafhper/mark-lee/releases/latest");
  assert.equal(release.tag_name, "v9.9.9");
});

test("fetchLatest: resposta nao-ok ou excecao de rede viram null", async () => {
  assert.equal(await fetchLatest("OWNER/REPO", async () => ({ ok: false })), null);
  assert.equal(await fetchLatest("OWNER/REPO", async () => { throw new Error("rede"); }), null);
});

/* ---- applyLatestRelease: o fluxo completo, com duplês ------------------- */

function fakeDoc(repo, buttons) {
  return {
    documentElement: { dataset: { repo } },
    querySelectorAll: (sel) => (sel === "a[data-release-os]" ? buttons : []),
  };
}

function fakeButton(os, extra = {}) {
  return { href: "", dataset: { releaseOs: os, ...extra } };
}

const releaseFake = () => ({
  ok: true,
  json: async () => ({ tag_name: "v1.8.3", assets: MARKLEE_ASSETS }),
});

test("applyLatestRelease: reescreve os tres botoes para os assets da v1.8.3", async () => {
  const botoes = [fakeButton("macos"), fakeButton("windows"), fakeButton("linux")];
  const n = await applyLatestRelease(fakeDoc("mafhper/mark-lee", botoes), { fetchImpl: async () => releaseFake() });
  assert.equal(n, 3);
  assert.equal(botoes[0].href, "https://github.com/mafhper/mark-lee/releases/download/v1.8.3/Mark-Lee_1.8.3_aarch64.app.tar.gz");
  assert.equal(botoes[1].href, "https://github.com/mafhper/mark-lee/releases/download/v1.8.3/Mark-Lee_1.8.3_x64_en-US.msi");
  assert.equal(botoes[2].href, "https://github.com/mafhper/mark-lee/releases/download/v1.8.3/Mark-Lee_1.8.3_amd64.deb");
});

test("applyLatestRelease: release sem assets -> fallback no href vazio", async () => {
  const botoes = [fakeButton("macos")];
  const n = await applyLatestRelease(fakeDoc("mafhper/landing-starter", botoes), {
    fetchImpl: async () => ({ ok: true, json: async () => ({ assets: [] }) }),
  });
  assert.equal(n, 0);
  assert.equal(botoes[0].href, "https://github.com/mafhper/landing-starter/releases/latest");
});

test("applyLatestRelease: API fora do ar -> fallback no href vazio", async () => {
  const botoes = [fakeButton("windows")];
  const n = await applyLatestRelease(fakeDoc("mafhper/landing-starter", botoes), {
    fetchImpl: async () => ({ ok: false }),
  });
  assert.equal(n, 0);
  assert.equal(botoes[0].href, "https://github.com/mafhper/landing-starter/releases/latest");
});

test("applyLatestRelease: falha mantem o href que veio do HTML", async () => {
  const botao = { href: "https://github.com/mafhper/mark-lee/releases/latest", dataset: { releaseOs: "macos" } };
  const n = await applyLatestRelease(fakeDoc("mafhper/mark-lee", [botao]), {
    fetchImpl: async () => { throw new Error("rede"); },
  });
  assert.equal(n, 0);
  assert.equal(botao.href, "https://github.com/mafhper/mark-lee/releases/latest");
});

test("applyLatestRelease: sem data-repo (ou placeholder) nao consulta a API", async () => {
  let chamou = false;
  const fetchImpl = async () => { chamou = true; return { ok: true, json: async () => ({}) }; };
  assert.equal(await applyLatestRelease(fakeDoc("", [fakeButton("macos")]), { fetchImpl }), 0);
  assert.equal(await applyLatestRelease(fakeDoc("__REPO__", [fakeButton("macos")]), { fetchImpl }), 0);
  assert.equal(chamou, false);
});
