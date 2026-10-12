/* ==========================================================================
   latest-release.mjs — Nível 1.5: os botões de download resolvem o último
   release no navegador, sem backend nenhum.

   Como funciona:
     1. lê o repositório de <html data-repo="owner/repo">;
     2. busca https://api.github.com/repos/owner/repo/releases/latest
        (a API pública responde com CORS aberto);
     3. para cada <a data-release-os="...">, escolhe o asset por padrão de
        nome e reescreve o href para o browser_download_url.

   Degradação: qualquer falha (rede, rate limit por visitante, release sem
   asset, placeholder não substituído) deixa o link onde estava — o fallback
   gravado no HTML, que funciona sem JS:
   https://github.com/owner/repo/releases/latest

   Configuração: o mapa de padrões abaixo. Cada item é uma lista ORDENADA de
   regex testadas contra o nome do asset; o primeiro padrão que casar vence.
   Um botão pode sobrescrever o mapa com data-release-patterns="\.pkg$,\.dmg$"
   (expressões separadas por vírgula, sem as barras).

   As funções puras são exportadas e o DOM só é tocado quando `document`
   existe, então o mesmo arquivo roda igual em Node — os testes ficam ao
   lado, em latest-release.test.mjs.
   ========================================================================== */

const API = "https://api.github.com";

/* O mapa padrão por plataforma, calibrado para os nomes que os projetos do
   dono publicam (ex.: Mark-Lee_1.8.3_x64_en-US.msi). Ajuste para a sua
   convenção — o que não casar nenhum padrão fica no fallback. */
export const DEFAULT_PATTERNS = {
  macos: [/\.dmg$/i, /\.app\.tar\.gz$/i],
  windows: [/\.msi$/i, /-setup\.exe$/i],
  linux: [/\.deb$/i, /\.rpm$/i, /\.AppImage$/i],
};

/* A página de releases do repositório: o fallback que funciona sem JS. */
export function fallbackUrl(repo) {
  return `https://github.com/${repo}/releases/latest`;
}

/* O primeiro padrão (na ordem da lista) que casa o nome de algum asset
   vence; dentro de um padrão, vale a ordem dos assets do release.
   Sem match (ou lista vazia) -> null, e o botão fica no fallback. */
export function chooseAsset(assets, patterns) {
  if (!Array.isArray(assets) || !Array.isArray(patterns)) return null;
  for (const pattern of patterns) {
    for (const asset of assets) {
      if (asset && typeof asset.name === "string" && pattern.test(asset.name)) {
        return asset;
      }
    }
  }
  return null;
}

/* "\.dmg$,\.pkg$" -> [/\.dmg$/, /\.pkg$/]. Item vazio ou regex inválida é
   ignorado; sem padrão válido -> null (vale o mapa padrão). */
export function parsePatterns(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const patterns = [];
  for (const part of value.split(",")) {
    const source = part.trim();
    if (!source) continue;
    try {
      patterns.push(new RegExp(source, "i"));
    } catch (e) {
      /* regex inválida: ignora e segue */
    }
  }
  return patterns.length ? patterns : null;
}

/* Os padrões de um botão: data-release-patterns quando presente, senão o
   mapa padrão pela plataforma do data-release-os. Sem plataforma
   conhecida -> null (o botão não é tocado). */
export function patternsFor(anchor, defaults = DEFAULT_PATTERNS) {
  const os = anchor?.dataset?.releaseOs;
  if (!os) return null;
  return parsePatterns(anchor.dataset.releasePatterns) ?? defaults[os] ?? null;
}

/* O último release, ou null se a API falhar de qualquer jeito. `fetchImpl`
   existe para o teste injetar um fetch falso. */
export async function fetchLatest(repo, fetchImpl = fetch) {
  try {
    const res = await fetchImpl(`${API}/repos/${repo}/releases/latest`, {
      headers: { accept: "application/vnd.github+json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

/* Aplica: escolhe o asset de cada botão e reescreve o href. O que não casar
   permanece no fallback. Devolve quantos botões foram resolvidos.
   Exportada para teste com um `doc` mínimo (só documentElement.dataset e
   querySelectorAll). */
export async function applyLatestRelease(doc, deps = {}) {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const repo = doc?.documentElement?.dataset?.repo;
  /* Sem repo, ou placeholder não substituído: não há o que resolver. */
  if (!repo || repo.includes("__")) return 0;

  const buttons = [...doc.querySelectorAll("a[data-release-os]")];
  if (!buttons.length) return 0;

  const fallback = fallbackUrl(repo);
  const release = await fetchLatest(repo, fetchImpl);
  const assets = Array.isArray(release?.assets) ? release.assets : [];

  let resolved = 0;
  for (const button of buttons) {
    const asset = chooseAsset(assets, patternsFor(button));
    if (asset?.browser_download_url) {
      button.href = asset.browser_download_url;
      resolved++;
    } else if (!button.href) {
      /* O href do HTML já é o fallback; isto cobre um botão que veio sem. */
      button.href = fallback;
    }
  }
  return resolved;
}

/* No navegador, o módulo se aplica sozinho à própria página; em Node não há
   `document` e importar este arquivo (nos testes) não toca em nada. */
if (typeof document !== "undefined") {
  applyLatestRelease(document).catch(() => {});
}
