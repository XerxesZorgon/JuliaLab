# JuliaLab

A Windows desktop IDE for scientists migrating from MATLAB to Julia. JuliaLab presents a full VSCodium workbench inside an Electron window, wrapped in a MATLAB R2023b+-style ribbon interface — so the layout feels familiar while the language underneath is Julia.

**Status: early MVP, active development.** Expect rough edges. No packaged installer exists yet — see [Installation](#installation) for the build-from-source setup.

## What's working

- MATLAB-style ribbon: **HOME**, **CODE**, and **VIEW** tabs are complete.
- **FIGURES** tab is intentionally paused pending a dedicated MATLAB-parity plotting sprint (multi-variable plotting, Path3D, GLMakie).
- Julia language support via a bundled `julialab` VS Code extension, bridged to the ribbon over WebSocket.
- Optional Wolfram Engine and Lean4 integration, auto-detected at launch.

**Known issue:** AI assistant integration (Cline/Wolfram/Lean4 panel rendering) is under active investigation — current working hypothesis is a stale Service Worker. See `docs/Sprint - AI Assistant & Wolfram Investigation` for details. A workaround (`julialab.openAIAssistant`) opens Claude, ChatGPT, or Gemini in your system browser instead of an embedded panel.

## Long-term vision

A single MATLAB-familiar environment with integrated support for Julia, Lean4, Wolfram Language, and AI coding assistants.

## Prerequisites

| Tool | Required? | Notes |
|---|---|---|
| Windows 11 | Yes | Not cross-platform yet — several paths (including VSCodium's) are hardcoded to Windows locations. |
| [VSCodium](https://vscodium.com) | Yes | Must be installed at the **default** location, `C:\Program Files\VSCodium`. JuliaLab spawns `codium serve-web` directly and does not currently search for alternate install paths. |
| [Node.js](https://nodejs.org) | Yes | 22.x used in development. |
| [Git](https://git-scm.com) | Yes | To clone this repo. |
| [Julia](https://julialang.org/downloads/) via [juliaup](https://github.com/JuliaLang/juliaup) | Yes | JuliaLab detects `juliaup`'s active release first, falling back to `julia` on PATH. |
| [Wolfram Engine](https://www.wolfram.com/engine/) | Optional | Only needed for Wolfbook notebooks. Free personal license available. |
| [Lean4](https://lean-lang.org/install/) via `elan` | Optional | Only needed for Lean4 language support. |

Missing optional tools don't block launch — JuliaLab detects what's available and warns about what isn't.

## Installation

```powershell
git clone https://github.com/XerxesZorgon/JuliaLab.git
cd JuliaLab
npm install
npm start
```

`npm start` compiles the bundled `julialab` extension, then launches the Electron app. First launch creates a default workspace at `~\JuliaLab` and runs dependency detection.

## Development

| Command | Use when |
|---|---|
| `npm start` | You changed the `julialab` extension (`extensions/julialab/`) — rebuilds the extension, then launches. |
| `npm run start:fast` | You only changed ribbon/UI files (`index.html`, `renderer.js`, `ribbon.css`) — skips the extension build. |
| `npm run build:ext` | Rebuild just the extension without launching. |

### Architecture

- `main.js` — Electron `BaseWindow` hosting two `WebContentsView`s: a ribbon view (`index.html` / `renderer.js`) and a VSCodium workbench view (`codium serve-web`, fixed at port `41000`).
- `extensions/julialab/` — VS Code extension bridging the ribbon and workbench over a WebSocket on port `2999`.
- `server-data/` — the serve-web user-data directory (extensions and data subfolders are git-ignored; regenerated at runtime).

Fixed ports and a fixed VSCodium install path are current architectural constraints, not oversights — see `docs/` for the ADRs behind these decisions.

## Project structure

```
JuliaLabApp/
├── main.js               # Electron main process
├── index.html / renderer.js / ribbon.css   # Ribbon UI
├── preload.js / workbench-preload.js
├── extensions/julialab/  # VS Code extension (ribbon ↔ workbench bridge)
├── scripts/               # Dependency detection, build helpers
├── server-data/           # VSCodium serve-web runtime data
└── docs/                  # Sprint docs, ADRs, design docs, test plans
```

## Contributing

This project follows the **eurAIka** methodology: strict phase gating (Problem Statement → SDD → ADRs → Design Doc → Test Plan → `tasks.md`) before implementation. See `docs/Sprint <N>/` for the document trail of each sprint. Not currently accepting external contributions while the architecture stabilizes.

## License

Not yet specified — a `LICENSE` file has not been added to this repository. Treat as all-rights-reserved until one is added.

## Links

- Issues / source: [github.com/XerxesZorgon/JuliaLab](https://github.com/XerxesZorgon/JuliaLab)
- Blog: [wildpeaches.xyz](https://wildpeaches.xyz)
