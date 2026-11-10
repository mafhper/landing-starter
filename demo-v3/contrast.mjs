/* Contraste WCAG 2.x dos pares usados neste template.
   Sem dependências: rode `node contrast.mjs` na pasta do projeto.

   Os tokens são lidos de assets/css/styles.css — trocar a paleta no CSS e
   rodar de novo é suficiente. O acento padrão do template é #6e2419; depois
   do bootstrap ele já está preenchido. */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(root, "assets", "css", "styles.css"), "utf8");
const rootBlock = css.match(/:root\{([\s\S]*?)\}/);
if (!rootBlock) {
  console.error("não achei o bloco :root em assets/css/styles.css");
  process.exit(1);
}

const palette = {};
for (const match of rootBlock[1].matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) {
  palette[match[1]] = match[2].trim();
}

const required = ["paper", "paper-2", "paper-3", "ink", "ink-2", "muted", "muted-inv", "accent", "gold", "success"];
const missing = required.filter((name) => !palette[name]);
if (missing.length) {
  console.error(`tokens ausentes no :root: ${missing.join(", ")}`);
  process.exit(1);
}

const accent = palette.accent;
/* Montado em runtime para o bootstrap não substituir o literal. */
const PLACEHOLDER = "__" + "ACCENT__";
if (accent === PLACEHOLDER) {
  console.warn("--accent ainda é um placeholder; usando o acento padrão #6e2419.");
  palette.accent = "#6e2419";
} else if (!/^#[0-9a-fA-F]{6}$/.test(accent)) {
  console.error(
    `--accent "${accent}" não é um hex de 6 dígitos; o verificador precisa de uma cor sólida (ex.: #6e2419).`
  );
  process.exit(1);
}

function luminance(hex) {
  const value = hex.replace("#", "");
  const channels = [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((channel) => (
    channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
  ));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(foreground, background) {
  const a = luminance(foreground);
  const b = luminance(background);
  const [light, dark] = a > b ? [a, b] : [b, a];
  return (light + 0.05) / (dark + 0.05);
}

const pairs = [
  ["texto principal", "ink", "paper"],
  ["texto principal no rodapé", "ink", "paper-2"],
  ["texto secundário", "muted", "paper"],
  ["texto secundário no rodapé", "muted", "paper-2"],
  ["texto secundário no cartão", "ink-2", "paper"],
  ["acento (links, itálicos)", "accent", "paper"],
  ["botão sólido (hover)", "paper", "accent"],
  ["texto no atelier escuro", "paper", "ink"],
  ["texto secundário no atelier", "muted-inv", "ink"],
  ["ouro no atelier", "gold", "ink"],
  ["status de sucesso", "success", "paper"],
  ["botão ativo (filtro)", "paper", "ink"],
  ["wordmark do rodapé (decorativo)", "paper-3", "paper-2"]
];

let failures = 0;
console.log("Par".padEnd(38), "Contraste", "Mínimo", "Veredito");
console.log("-".repeat(72));
for (const [label, foreground, background] of pairs) {
  const ratio = contrast(palette[foreground], palette[background]);
  const decorative = label.includes("decorativo");
  const minimum = decorative ? 0 : 4.5;
  const ok = ratio >= minimum;
  if (!ok && !decorative) failures += 1;
  console.log(
    label.padEnd(38),
    ratio.toFixed(2).padStart(9),
    String(minimum).padStart(6),
    ok || decorative ? "ok" : "REPROVA"
  );
}

console.log("-".repeat(72));
console.log(failures === 0 ? "Todos os pares de texto passam em 4,5:1." : `${failures} par(es) reprovado(s).`);
if (failures) process.exitCode = 1;
