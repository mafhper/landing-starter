# AGENTS.md — landing-starter

Catalog of zero-dependency product-landing templates (plain HTML/CSS/JS).
Node exists only for scripts and tests — there is no build step, no bundler,
no `package.json` (the repo root has none), no lint/typecheck/formatter and
no `node_modules/` content: that path is only a cache location for the tools
below, alongside `.wrangler/`.

## Layout (source of truth)

- `template/` = Classic, `template-v2/` = Aurora. These are the masters,
  each with its own `index.html`, `assets/`, `download/`, `serve.mjs` and
  `README.template.md`.
- `demo/`, `demo-v2/` = instantiated copies (placeholders already filled,
  `README.md` instead of `README.template.md`). Published as `/classic/`,
  `/aurora/`. To change a template, edit `template*/` — never edit a demo
  to fix the template, and never edit `_site/` or `_stage/` (regenerated,
  gitignored).
- `site/` = gallery published at Pages root. `tools/` = `build-site.mjs`,
  `capture.mjs`. `bootstrap.mjs` = instantiator.
- Adding a `template-foo/` dir makes it appear in `bootstrap.mjs --list`
  automatically, but publishing requires adding it to the hardcoded
  `TEMPLATES` array in `tools/build-site.mjs`.

## Commands

```bash
node bootstrap.mjs --list
node bootstrap.mjs ../my-app --template template-v2 --name "My App" --repo owner/repo --accent "#7c3aed" --git
node bootstrap.mjs ../my-app --dry   # preview, writes nothing
node serve.mjs [dir] [port]          # static dev server, default port 8787
node --test download/worker.test.mjs assets/js/latest-release.test.mjs  # run from inside template/demo dir; 24 cases, no network
node tools/build-site.mjs [--no-zip] # wipes and rebuilds _site/ + _stage/
node tools/capture.mjs <url> <out.png|webp|jpg> [--w 1440] [--h 900] [--theme dark|light|system] [--full] [--store theme=light]
```

`serve.mjs` lives inside each template/demo, so run it from there.

## Gotchas

- `bootstrap.mjs` refuses: non-empty dest, dest = repo root, dest inside any
  `template*/` dir. Placeholders replaced: `__PROJECT_NAME__ __DESC__
  __TAGLINE__ __REPO__ __SLUG__ __ACCENT__ __VERSION__`
  (`README.template.md` → `README.md` in output). `--accent` must be hex,
  `--repo` must be `owner/repo`, `--version` must start with a digit.
  Leftover `__TOKEN__` prints a warning on stderr and still exits 0.
- `serve.mjs` answers `/download/*` with **501 by design** — the real resolver
  is the worker. Opening `index.html` via `file://` breaks `latest-release.mjs`
  (ES modules need http); always use `serve.mjs` to see download resolution.
- Downloads: GitHub Pages is static — only Level 1 (fixed asset name via
  `releases/latest/download/…`) and Level 1.5 (client-side `latest-release.mjs`,
  default) work there. The worker (Level 2) needs a fetch-capable host
  (`cd download && npx wrangler deploy`, route `/download/*`); configure via
  `worker.mjs` `CONFIG` or `wrangler.jsonc` vars `GITHUB_REPO`/`CACHE_TTL`.
  Client hints change arch **only on macOS** (`hintChanges`); Linux/Windows
  always use the default unless the explicit `/download/<os>-<arch>` route is hit.
  API failure degrades to the releases page — keep the link `href` as a working
  fallback and let the script only upgrade it.
- `build-site.mjs` fails the build on broken local `src`/`href` in published
  HTML, or residual `__TOKEN__` in published `.html/.css/.js/.mjs`
  (`*.test.js`/`*.test.mjs` files are exempt from the token check). Zips in
  `/downloads/` are generated per build, never versioned.
  Uses `zip` on Linux, `Compress-Archive` fallback on Windows.
- `capture.mjs` needs Edge/Chrome at stock Windows install paths, no npm deps.
  Browser profile is created under `node_modules/.cache/` (ignored) and deleted
  when the run ends.
- CI (`.github/workflows/pages.yml`): runs `node tools/build-site.mjs` and
  publishes `_site/` to Pages. Triggers only on `main` for paths
  `site/ demo/ demo-v2/ template/ template-v2/ tools/` + the workflow itself,
  plus `workflow_dispatch`. Changes outside those paths (e.g. `bootstrap.mjs`,
  `README.md`) do not deploy.
