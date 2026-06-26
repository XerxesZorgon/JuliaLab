# ADR-009: Extension Build and Copy Strategy

**Date:** 2026-06-24  
**Status:** Accepted  
**Sprint:** 3  
**Deciders:** John Peach, Claude (eurAIka)

---

## Context

The `julialab` VSCodium extension must be present in `server-data/extensions/`
for `codium serve-web` to load it. Three strategies are available for keeping
the extension source and its served copy in sync:

**Option A — Source in repo, copy on build:**  
Extension source lives at `JuliaLabApp/extensions/julialab/`. A build script
(or `package.json` script) copies the compiled output to
`server-data/extensions/julialab/` before launching the app.

**Option B — Source directly in `server-data/extensions/`:**  
Extension source and served copy are the same directory. No copy step needed.
The extensions directory is already in the repo (committed in Sprint 2).

**Option C — Symlink:**  
A symlink from `server-data/extensions/julialab/` to
`extensions/julialab/dist/` keeps source and served copy in sync at the
filesystem level. On Windows, directory symlinks require elevated permissions
or Developer Mode enabled — not reliable across user environments.

---

## Decision

**Option A** — source in `JuliaLabApp/extensions/julialab/`, copy to
`server-data/extensions/julialab/` as part of the build/launch flow.

Rationale:
- Option B conflates source and runtime artefact. The extensions directory
  contains pre-built third-party extensions (julia-vscode, lean4, etc.) that
  are not source-controlled as TypeScript — mixing our TypeScript source into
  that directory would be confusing and would require the TypeScript build to
  run inside `server-data/`.
- Option C is unreliable on Windows without elevated permissions.
- Option A keeps a clean separation: `extensions/julialab/` is source (TypeScript,
  `package.json`, `tsconfig.json`); `server-data/extensions/julialab/` is the
  built artefact.

**Build integration:**  
A `build:ext` script is added to the root `package.json`:

```json
"build:ext": "cd extensions/julialab && npm install && npm run compile && node ../../scripts/copy-extension.js"
```

`scripts/copy-extension.js` copies `extensions/julialab/dist/` and
`extensions/julialab/package.json` to `server-data/extensions/julialab/`.
The existing `start` script is amended to run `build:ext` before launching
`main.js`, so Antigravity's standard `npm start` always serves the current
extension build.

**`.gitignore` amendment:**  
`server-data/extensions/julialab/` is added to `.gitignore` (it is a build
artefact). `extensions/julialab/` is committed as source.

---

## Consequences

- Two new directories: `extensions/julialab/` (source, committed) and
  `server-data/extensions/julialab/` (artefact, gitignored).
- One new script: `scripts/copy-extension.js`.
- Root `package.json` gains `build:ext` and an amended `start` script.
- `npm start` now takes slightly longer on first run (TypeScript compile).
  Subsequent runs are fast if source has not changed (copy-extension.js
  can check mtimes to skip unnecessary copies).
- Antigravity's build contract (`CLAUDE.md`) must document the new
  `build:ext` step.
