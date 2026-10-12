/* ==========================================================================
   worker.test.mjs - prova local do resolvedor de downloads.

   Roda com:   node --test download/worker.test.mjs

   Não precisa de Cloudflare: o handler aceita `deps` com fetch e cache
   falsos, então o fluxo inteiro (rota -> hint -> tag -> URL do GitHub)
   roda em Node. Os casos usam valores conhecidos-bons: nomes de asset
   literais, não uma recomputação do que o código faz.
   ========================================================================== */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  normalizeArch,
  parseTarget,
  pickArch,
  assetName,
  buildDownloadUrl,
  handleRequest,
} from "./worker.mjs";

/* ---- normalizeArch ------------------------------------------------------ */

test("normalizeArch: vocabulário do Client Hint e das rotas viram x64/arm64", () => {
  assert.equal(normalizeArch('"x86"'), "x64");   // como o header chega
  assert.equal(normalizeArch("x86_64"), "x64");
  assert.equal(normalizeArch("amd64"), "x64");
  assert.equal(normalizeArch('"arm"'), "arm64");
  assert.equal(normalizeArch("aarch64"), "arm64");
  assert.equal(normalizeArch(""), null);
  assert.equal(normalizeArch(null), null);
  assert.equal(normalizeArch("mips"), null);
});

/* ---- parseTarget -------------------------------------------------------- */

test("parseTarget: os sozinho, os-arch, alias e lixo", () => {
  assert.deepEqual(parseTarget("macos"), { os: "macos", arch: null });
  assert.deepEqual(parseTarget("macos-arm64"), { os: "macos", arch: "arm64" });
  assert.deepEqual(parseTarget("mac"), { os: "macos", arch: null });
  assert.deepEqual(parseTarget("windows-x86_64"), { os: "windows", arch: "x64" });
  assert.equal(parseTarget("solaris"), null);
  assert.equal(parseTarget("macos-mips"), null);
});

/* ---- pickArch ----------------------------------------------------------- */

test("pickArch: macOS muda com o hint; linux/windows não (default manda)", () => {
  assert.equal(pickArch("macos", null), "arm64");        // default macOS
  assert.equal(pickArch("macos", '"x86"'), "x64");       // hint Intel
  assert.equal(pickArch("macos", '"arm"'), "arm64");
  assert.equal(pickArch("linux", '"arm"'), "x64");       // não troca
  assert.equal(pickArch("windows", null), "x64");
});

/* ---- assetName + buildDownloadUrl --------------------------------------- */

test("assetName: 'App-v0.8.13-macos-arm64.dmg' para macos/arm64/v0.8.13", () => {
  assert.equal(assetName("macos", "arm64", "v0.8.13"), "App-v0.8.13-macos-arm64.dmg");
  assert.equal(assetName("macos", "x64", "v0.8.13"), "App-v0.8.13-macos-x86_64.dmg");
  assert.equal(assetName("linux", "x64", "v0.8.13"), "app-v0.8.13-linux-amd64.deb");
  assert.equal(assetName("windows", "arm64", "v0.8.13"), "App-v0.8.13-windows-arm64.msi");
  assert.equal(assetName("macos", "mips", "v0.8.13"), null);
});

test("assetName aceita {version} sem o v", () => {
  const name = assetName("linux", "arm64", "v1.2.3");
  assert.ok(!name.includes("{tag}") && !name.includes("{version}"));
});

test("buildDownloadUrl: monta a URL de release do GitHub", () => {
  assert.equal(
    buildDownloadUrl("OWNER/REPO", "v0.8.13", "App-v0.8.13-macos-arm64.dmg"),
    "https://github.com/OWNER/REPO/releases/download/v0.8.13/App-v0.8.13-macos-arm64.dmg",
  );
});

/* ---- handleRequest: o fluxo completo, com dublês ------------------------ */

const cfg = { repo: "OWNER/REPO" };

function fakeFetch(tag = "v9.9.9", ok = true) {
  return async (req) => {
    assert.ok(String(req.url).includes("/releases/latest"));
    return new Response(JSON.stringify({ tag_name: tag }), {
      status: ok ? 200 : 500,
      headers: { "content-type": "application/json" },
    });
  };
}

test("hop 1: /download/macos com hint x86 redireciona para a rota explícita", async () => {
  const req = new Request("https://example.test/download/macos", {
    headers: { "sec-ch-ua-arch": '"x86"' },
  });
  const res = await handleRequest(req, { fetchImpl: fakeFetch(), cache: null, config: cfg });
  assert.equal(res.status, 302);
  assert.equal(new URL(res.headers.get("location")).pathname, "/download/macos-x64");
});

test("hop 1: sem hint, macOS cai no default arm64", async () => {
  const req = new Request("https://example.test/download/macos");
  const res = await handleRequest(req, { fetchImpl: fakeFetch(), cache: null, config: cfg });
  assert.equal(new URL(res.headers.get("location")).pathname, "/download/macos-arm64");
});

test("hop 2: rota explícita resolve o último release e aponta para o asset", async () => {
  const req = new Request("https://example.test/download/macos-arm64");
  const res = await handleRequest(req, { fetchImpl: fakeFetch("v9.9.9"), cache: null, config: cfg });
  assert.equal(res.status, 302);
  assert.equal(
    res.headers.get("location"),
    "https://github.com/OWNER/REPO/releases/download/v9.9.9/App-v9.9.9-macos-arm64.dmg",
  );
  assert.match(res.headers.get("cache-control"), /max-age=300/);
});

test("rota desconhecida: 404", async () => {
  const req = new Request("https://example.test/download/plan9");
  const res = await handleRequest(req, { fetchImpl: fakeFetch(), cache: null, config: cfg });
  assert.equal(res.status, 404);
});

test("API fora do ar: degrada para a página de releases", async () => {
  const req = new Request("https://example.test/download/windows-x64");
  const res = await handleRequest(req, { fetchImpl: fakeFetch("v0", false), cache: null, config: cfg });
  assert.equal(res.status, 302);
  assert.equal(res.headers.get("location"), "https://github.com/OWNER/REPO/releases/latest");
});
