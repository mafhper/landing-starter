/* ==========================================================================
   worker.mjs - resolve /download/<os> para o asset do ÚLTIMO release.

   Este é o padrão destilado do site analisado (ver README do template).
   O site fica 100% estático; a inteligência mora aqui, em três passos:

     1. /download/<os>          -> escolhe a arquitetura pelo Client Hint
                                   (Sec-CH-UA-Arch) e redireciona para a
                                   rota explícita, ex.: /download/macos-arm64
     2. /download/<os>-<arch>   -> descobre a tag do último release (cache de
                                   300s) e responde 302 para o asset no GitHub
     3. GitHub                  -> redireciona de novo para a URL assinada e
                                   entrega o binário (isso é do GitHub)

   Por que dois hops: o hop 1 é barato e deixa a escolha de arquitetura
   VISÍVEL e cacheável por variante; o hop 2 é o que consulta a API e por
   isso é o que tem cache curto. Nenhum JS roda no navegador do usuário.

   CONFIGURAÇÃO: troque repo e assets abaixo. Os templates usam
   {tag} = v1.2.3 e {version} = 1.2.3.
   ========================================================================== */

export const CONFIG = {
  /* <-- troque pelo seu repositório */
  repo: "OWNER/REPO",

  /* TTL do cache, em segundos. 300 = release nova visível em até 5 min,
     sem martelar a API do GitHub a cada clique. */
  cacheTtl: 300,

  /* Nome do asset por OS/arch. Qualquer convenção serve; mantenha os
     releases publicando os mesmos nomes. */
  assets: {
    macos: {
      arm64: "App-{tag}-macos-arm64.dmg",
      x64: "App-{tag}-macos-x86_64.dmg",
    },
    linux: {
      arm64: "app-{tag}-linux-arm64.deb",
      x64: "app-{tag}-linux-amd64.deb",
    },
    windows: {
      arm64: "App-{tag}-windows-arm64.msi",
      x64: "App-{tag}-windows-x86_64.msi",
    },
  },

  /* Arquitetura padrão quando não há hint. */
  defaults: { macos: "arm64", linux: "x64", windows: "x64" },

  /* Em quais OS o Client Hint troca a escolha. Hoje só macOS: Chrome/Edge
     informam a arch do Mac de forma confiável; em Linux/Windows o hint
     costuma vir vazio ou "x86" mesmo em máquina arm64, então o default
     manda. Quem precisa de arm64 nesses sistemas usa a rota explícita. */
  hintChanges: ["macos"],
};

/* --------------------------------------------------------------------------
   Funções puras (testadas em worker.test.mjs, sem Cloudflare)
   -------------------------------------------------------------------------- */

const OS_ALIASES = {
  mac: "macos", macos: "macos", osx: "macos",
  win: "windows", windows: "windows",
  linux: "linux",
};

/* Sec-CH-UA-Arch chega como `"x86"` (com aspas), `"arm"` ou vazio.
   Normaliza para o vocabulário das rotas: x64 | arm64. */
export function normalizeArch(value) {
  if (!value) return null;
  const v = String(value).replace(/["']/g, "").trim().toLowerCase();
  if (v === "x64" || v === "x86" || v === "x86_64" || v === "amd64") return "x64";
  if (v === "arm64" || v === "arm" || v === "aarch64") return "arm64";
  return null;
}

/* "macos" -> { os: "macos", arch: null }
   "macos-arm64" -> { os: "macos", arch: "arm64" }
   Qualquer coisa desconhecida -> null (o handler devolve 404). */
export function parseTarget(segment) {
  const parts = String(segment).toLowerCase().split("-");
  const os = OS_ALIASES[parts[0]];
  if (!os) return null;
  if (parts.length === 1) return { os, arch: null };
  const arch = normalizeArch(parts.slice(1).join("-"));
  if (!arch) return null;
  return { os, arch };
}

/* Escolhe a arquitetura: o hint só muda o resultado onde CONFIG.hintChanges
   permite; fora disso vale o default do OS. */
export function pickArch(os, hintRaw) {
  if (!CONFIG.defaults[os]) return null;
  if (!CONFIG.hintChanges.includes(os)) return CONFIG.defaults[os];
  return normalizeArch(hintRaw) ?? CONFIG.defaults[os];
}

/* Aplica o template de nome do asset. */
export function assetName(os, arch, tag) {
  const template = CONFIG.assets[os]?.[arch];
  if (!template) return null;
  const version = String(tag).replace(/^v/, "");
  return template.replaceAll("{tag}", tag).replaceAll("{version}", version);
}

export function buildDownloadUrl(repo, tag, name) {
  return `https://github.com/${repo}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(name)}`;
}

/* --------------------------------------------------------------------------
   O handler. `deps` existe para o teste: injeta fetch e cache falsos.
   -------------------------------------------------------------------------- */

export async function handleRequest(request, deps = {}) {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const cache = deps.cache ?? globalThis.caches?.default ?? null;
  const config = resolveConfig(deps);

  const url = new URL(request.url);
  const m = url.pathname.match(/^\/(?:download|dl)\/([a-z0-9_-]+)\/?$/i);
  if (!m) {
    return text(404, `Not found. Use /download/<os> or /download/<os>-<arch> (os: macos, linux, windows).`);
  }

  const target = parseTarget(m[1]);
  if (!target) {
    return text(404, `Unknown target "${m[1]}". Use /download/<os> or /download/<os>-<arch>.`);
  }

  /* Hop 1: sem arch na rota -> escolhe pelo hint e manda para a rota
     explícita. Cacheia também: e determinístico dada a mesma header. */
  if (!target.arch) {
    const arch = pickArch(target.os, request.headers.get("sec-ch-ua-arch")) ?? config.defaults[target.os];
    const to = new URL(`/download/${target.os}-${arch}`, url.origin).toString();
    return redirect(to, config.cacheTtl);
  }

  /* Hop 2: resolve o último release (com cache) e aponta para o asset. */
  const tag = await getLatestTag(config, { fetchImpl, cache });
  if (!tag) {
    /* Degradação graciosa: a API falhou; manda para a página de releases. */
    return redirect(`https://github.com/${config.repo}/releases/latest`, 60);
  }

  const name = assetName(target.os, target.arch, tag);
  if (!name) return text(404, `No asset configured for ${target.os}/${target.arch}.`);
  const to = buildDownloadUrl(config.repo, tag, name);
  return redirect(to, config.cacheTtl);
}

/* Merge de config: defaults do modulo <- env do Worker (wrangler vars) <-
   deps injetadas no teste. O env permite trocar repo/TTL sem editar o código. */
function resolveConfig(deps) {
  const c = { ...CONFIG, ...(deps.config ?? {}) };
  const env = deps.env ?? {};
  if (!deps.config?.repo && env.GITHUB_REPO) c.repo = env.GITHUB_REPO;
  if (!deps.config?.cacheTtl && env.CACHE_TTL) c.cacheTtl = Number(env.CACHE_TTL) || c.cacheTtl;
  return c;
}

async function getLatestTag(config, { fetchImpl, cache }) {
  const apiUrl = `https://api.github.com/repos/${config.repo}/releases/latest`;
  const apiReq = new Request(apiUrl, {
    headers: { accept: "application/vnd.github+json", "user-agent": "download-worker" },
  });

  if (cache) {
    const hit = await cache.match(apiReq);
    if (hit) {
      try { return (await hit.json()).tag_name ?? null; } catch (e) { /* segue para o fetch */ }
    }
  }

  try {
    const res = await fetchImpl(apiReq);
    if (!res.ok) return null;
    const data = await res.json();
    const tag = data?.tag_name ?? null;
    if (cache && tag) {
      await cache.put(
        apiReq,
        new Response(JSON.stringify({ tag_name: tag }), {
          headers: { "content-type": "application/json", "cache-control": `max-age=${config.cacheTtl}` },
        }),
      );
    }
    return tag;
  } catch (e) {
    return null;
  }
}

function redirect(location, maxAge) {
  return new Response(null, {
    status: 302,
    headers: { location, "cache-control": `public, max-age=${maxAge}` },
  });
}

function text(status, body) {
  return new Response(body + "\n", { status, headers: { "content-type": "text/plain; charset=utf-8" } });
}

export default {
  fetch(request, env) {
    return handleRequest(request, { env });
  },
};
