#!/usr/bin/env node
/* ==========================================================================
   capture.mjs - screenshot de uma página via Edge/Chrome headless (CDP).

   Uso:
     node tools/capture.mjs <url> <saida.(png|webp|jpg)> [opções]

   Opções:
     --w 1440          largura do viewport (default 1440)
     --h 900           altura do viewport (default 900)
     --scale 1         deviceScaleFactor
     --theme dark|light|system   emula prefers-color-scheme (default: system)
     --motion none|reduce        emula prefers-reduced-motion
     --store chave=valor         grava localStorage antes do load (repetível;
                                 ex.: --store theme=light para templates dark-first)
     --full            captura a página inteira (além do viewport)
     --wait 900        espera extra depois de fonts.ready, em ms
     --eval "expr"     avalia a expressão na página e imprime o resultado
                       (awaitPromise + JSON) antes de capturar

   Sem dependências: usa o WebSocket nativo do Node e o CDP do navegador.
   O perfil do navegador mora em node_modules/.cache/ (já ignorado pelo repo,
   autossuficiente em clone limpo) e é removido no fim.
   ========================================================================== */

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/* ---- argumentos --------------------------------------------------------- */

const args = process.argv.slice(2);
const positional = [];
const opts = { w: 1440, h: 900, scale: 1, theme: "system", motion: "none", full: false, wait: 900, store: [] };

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--full") { opts.full = true; continue; }
  if (a.startsWith("--")) {
    const key = a.slice(2);
    const val = args[++i];
    if (val === undefined) { console.error(`--${key} precisa de um valor`); process.exit(1); }
    if (key === "w" || key === "h" || key === "wait") opts[key] = Number(val);
    else if (key === "scale") opts.scale = Number(val);
    else if (key === "theme" || key === "motion") opts[key] = val;
    else if (key === "store") opts.store.push(val);
    else if (key === "eval") opts.eval = val;
    else { console.error(`opção desconhecida: --${key}`); process.exit(1); }
    continue;
  }
  positional.push(a);
}

const [url, out] = positional;
if (!url || !out) {
  console.error("uso: node tools/capture.mjs <url> <saida.png|webp|jpg> [--w 1440] [--h 900] [--theme dark|light] [--full] [--motion reduce] [--wait 900]");
  process.exit(1);
}
const outPath = resolve(out);

/* ---- achado do navegador ------------------------------------------------ */

function findBrowser() {
  const candidates = [
    join(process.env["ProgramFiles(x86)"] ?? "C:/Program Files (x86)", "Microsoft/Edge/Application/msedge.exe"),
    join(process.env.ProgramFiles ?? "C:/Program Files", "Microsoft/Edge/Application/msedge.exe"),
    join(process.env.LOCALAPPDATA ?? "", "Microsoft/Edge/Application/msedge.exe"),
    join(process.env.ProgramFiles ?? "C:/Program Files", "Google/Chrome/Application/chrome.exe"),
    join(process.env["ProgramFiles(x86)"] ?? "C:/Program Files (x86)", "Google/Chrome/Application/chrome.exe"),
  ];
  return candidates.find((p) => p && existsSync(p)) ?? null;
}

const browser = findBrowser();
if (!browser) {
  console.error("não achei Edge nem Chrome em caminhos conhecidos");
  process.exit(1);
}

/* ---- perfil temporário + launch ----------------------------------------- */

const profile = join(ROOT, "node_modules", ".cache", "landing-starter", `capture-${Date.now()}`);
mkdirSync(profile, { recursive: true });
rmSync(join(profile, "DevToolsActivePort"), { force: true });

const child = spawn(browser, [
  "--headless=new",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-extensions",
  "--disable-gpu",
  "--hide-scrollbars",
  "--remote-debugging-port=0",
  `--user-data-dir=${profile}`,
  "about:blank",
], { stdio: "ignore" });

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function waitForPort() {
  const file = join(profile, "DevToolsActivePort");
  for (let i = 0; i < 100; i++) {
    if (existsSync(file)) {
      const txt = readFileSync(file, "utf8").split("\n");
      if (txt[0]) return Number(txt[0]);
    }
    await sleep(100);
  }
  throw new Error("timeout esperando o DevToolsActivePort");
}

function cleanup(code) {
  try { child.kill(); } catch {}
  try { rmSync(profile, { recursive: true, force: true, maxRetries: 3 }); } catch {}
  process.exit(code);
}

/* ---- cliente CDP mínimo -------------------------------------------------- */

let msgId = 0;
const pending = new Map();

function send(ws, method, params = {}, sessionId) {
  const id = ++msgId;
  return new Promise((res, rej) => {
    pending.set(id, { res, rej });
    ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }));
  });
}

async function main() {
  const port = await waitForPort();
  const version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();

  const ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = () => rej(new Error("falha ao conectar no WebSocket do devtools"));
  });

  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) rej(new Error(`${msg.error.message ?? "erro CDP"}`));
      else res(msg.result);
    }
  };

  const { targetId } = await send(ws, "Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send(ws, "Target.attachToTarget", { targetId, flatten: true });
  const scoped = (m, p) => send(ws, m, p, sessionId);

  await scoped("Page.enable");
  await scoped("Runtime.enable");
  await scoped("Emulation.setDeviceMetricsOverride", {
    width: opts.w,
    height: opts.h,
    deviceScaleFactor: opts.scale,
    mobile: false,
  });

  const features = [{ name: "prefers-color-scheme", value: opts.theme }];
  if (opts.motion === "reduce") features.push({ name: "prefers-reduced-motion", value: "reduce" });
  else features.push({ name: "prefers-reduced-motion", value: "no-preference" });
  await scoped("Emulation.setEmulatedMedia", { features });

  /* Semeia localStorage antes de qualquer script da página (ex.: tema de
     templates dark-first, que não seguem o sistema). */
  if (opts.store.length) {
    const entries = opts.store
      .map((kv) => {
        const eq = kv.indexOf("=");
        if (eq < 1) throw new Error(`--store espera chave=valor, recebi "${kv}"`);
        return [kv.slice(0, eq), kv.slice(eq + 1)];
      })
      .map(([k, v]) => `try{localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(v)})}catch(e){}`)
      .join("");
    await scoped("Page.addScriptToEvaluateOnNewDocument", { source: entries });
  }

  await scoped("Page.navigate", { url });

  /* espera o documento + fontes + settle */
  for (let i = 0; i < 120; i++) {
    const { result } = await scoped("Runtime.evaluate", { expression: "document.readyState", returnByValue: true });
    if (result?.value === "complete") break;
    await sleep(100);
  }
  await scoped("Runtime.evaluate", { expression: "document.fonts.ready.then(() => true)", awaitPromise: true, returnByValue: true });
  await sleep(opts.wait);

  if (opts.eval) {
    const { result, exceptionDetails } = await scoped("Runtime.evaluate", { expression: opts.eval, awaitPromise: true, returnByValue: true });
    if (exceptionDetails) console.log(`eval erro: ${exceptionDetails.text} ${exceptionDetails.exception?.description ?? ""}`);
    else console.log(`eval => ${JSON.stringify(result?.value)}`);
  }

  const ext = extname(outPath).toLowerCase();
  const format = ext === ".webp" ? "webp" : ext === ".jpg" || ext === ".jpeg" ? "jpeg" : "png";
  const shotParams = { format };
  if (format !== "png") shotParams.quality = 86;

  if (opts.full) {
    const { cssContentSize } = await scoped("Page.getLayoutMetrics");
    shotParams.captureBeyondViewport = true;
    shotParams.clip = { x: 0, y: 0, width: Math.ceil(cssContentSize.width), height: Math.ceil(cssContentSize.height), scale: 1 };
  }

  const { data } = await scoped("Page.captureScreenshot", shotParams);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, Buffer.from(data, "base64"));
  console.log(`ok ${outPath} (${Buffer.byteLength(Buffer.from(data, "base64"))} bytes)`);

  try { await send(ws, "Browser.close"); } catch {}
  ws.close();
  cleanup(0);
}

main().catch((err) => {
  console.error("erro:", err.message);
  cleanup(1);
});
