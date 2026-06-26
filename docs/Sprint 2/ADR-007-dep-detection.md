# ADR-007: Delegate tool management; detect paths at launch via detect-deps.js
**Date:** 2026-06-23
**Status:** Accepted

## Context

JuliaLabApp depends on four external tools: Julia (juliaup), Lean4
(elan), Wolfram Engine (Wolfram installer), and VSCodium. Each has its
own version manager or installer. Two design approaches were considered:

| Approach | Description |
|---|---|
| Manage | JuliaLabApp downloads, installs, and updates all tools itself |
| Delegate and detect | Use existing version managers; detect what is installed at launch |

## Decision

Delegate version management to existing tools (juliaup, elan, Wolfram
installer). At each launch, `detect-deps.js` discovers installed tool
paths, writes them to `server-data/Machine/settings.json`, and shows a
warning dialog for any missing tool with its install URL.

## Rationale

- juliaup and elan already do version management correctly for Julia
  and Lean4 — building parallel systems would duplicate their work and
  create version conflicts.
- Wolfram Engine has its own licensing and installation process;
  JuliaLabApp should not touch it.
- Detection at launch means paths stay correct even after the user
  updates tools externally.
- Missing dependency dialogs are non-blocking warnings, not hard
  failures — scientists may not need all tools.

## Detection strategy

| Tool | Primary | Fallback |
|---|---|---|
| Julia | `juliaup which release` | `%LOCALAPPDATA%\juliaup\bin\` then PATH |
| Lean4 | `elan which leanprover/lean4:stable` | `%USERPROFILE%\.elan\bin\` then PATH |
| Wolfram Engine | Windows registry `HKLM\SOFTWARE\Wolfram Research\Installations` | Known install paths then PATH |
| VSCodium | Known install path `C:\Program Files\VSCodium\` | Hard failure if absent |

## Sprint 4 scope (deferred)

First-launch setup wizard that installs missing prerequisites via
winget / official installers. Auto-update notifications for extensions.

## Consequences

- Simpler Sprint 2: no download logic, no version management.
- User must install prerequisites before launching JuliaLab for full
  functionality — install URLs are shown in the warning dialog.
- detect-deps.js must handle the case where tools update and change
  their paths — re-run detection on each launch (not cached).
