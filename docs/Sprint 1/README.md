# JuliaLabApp

A MATLAB-familiar Julia IDE — VSCodium's full workbench in a single Electron
window with a MATLAB R2023b+-style ribbon bar.

## What it does

JuliaLabApp gives scientists transitioning from MATLAB to Julia a desktop IDE
they already know how to use. It wraps the VSCodium workbench (file tree,
editor, integrated terminal, extensions) in a single frameless Electron window
topped by a MATLAB-style ribbon (HOME / PLOTS / APPS / LIVE EDITOR / INSERT /
VIEW). The workbench is served by a locally-bundled `openvscode-server` process,
giving full PTY terminal responsiveness and access to the Julia, Lean4, Wolfram
Language, and AI coding assistant extensions via the Open VSX marketplace.

## Status

Sprint 1 in progress — single-window embedding.

## Installation (development)

Requirements:
- Node.js 22.22.1
- Electron (version pinned in `docs/PLAN.md`)
- openvscode-server (version pinned in `docs/PLAN.md`)
- Windows 10 x64

```
git clone <repo>
cd JuliaLabApp
npm install
npm start
```

openvscode-server must be available at the path configured in `main.js`
(see `docs/PLAN.md` for the pinned binary).

## Running tests

Sprint 1: manual acceptance criteria only. See `docs/TEST_PLAN.md`.

## Project documents

| Document | Purpose |
|---|---|
| `docs/SDD.md` | What and why |
| `docs/adr/` | Architecture decisions |
| `docs/DESIGN.md` | How — components, interfaces, algorithms |
| `docs/TEST_PLAN.md` | Acceptance criteria |
| `docs/PLAN.md` | Milestones, dependency lock |
| `tasks.md` | Atomic task list with acceptance criteria |

## Contributing

See `tasks.md`. One file per task. Mandatory diff review before any build.
Commit after every verified green task. Revert, don't patch, on failure.

## License

TBD
