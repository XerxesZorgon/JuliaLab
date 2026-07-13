# Sprint 12 — Final Regression + Teardown + Tag Checklist

## Sprint 12 deliverables — confirm all ✓

| Feature | Status |
|---|---|
| Pluto launcher fix (port/secret parsing, stderr detection) | ✓ Task 001 |
| HOME tab APPS group — 4 buttons appear correctly | ✓ Task 002 |
| Wolfram: panel focus + kernel launch | ✓ (fix applied after Task 003) |
| Wolfram: 7-item QuickPick | ✓ Task 004 |
| Claude: `editor.openLast`, respects preference, doesn't overwrite it | ✓ (fix applied after Task 003) |
| Lean: 14-item flat QuickPick, all commands confirmed | ✓ Task 003 |
| Pluto: 3-item QuickPick, visually matching Wolfram/Lean | ✓ Task 005 (full arc: custom popup → native menu → real QuickPick) |
| Activity Bar icon hidden for Claude Code (user preference, native VS Code feature, no code) | ✓ |

## Known, accepted, NOT blocking this tag

- Claude Code's panel content renders blank — third-party extension issue, not JuliaLabApp code (backlog #17)
- Wolfram kernel connection shows transient error toasts before succeeding — cosmetic timing issue (backlog #16)
- Ribbon WebContentsView height constraint — broader architectural finding this sprint surfaced (backlog #1, updated)

## Regression — spot check unrelated areas

| Area | Check |
|---|---|
| FIGURES tab (Sprint 9-11 Plot Builder) | Quick check — variable selection, plot generation still work |
| CODE/VIEW tabs | Quick spot check — unaffected by this sprint's changes |
| Existing Docs/Examples/Community/About buttons | Confirm still work exactly as before (unchanged this sprint) |

## Teardown verification (John-only, single controlled cycle)

1. Close JuliaLabApp via ✕ only — including confirming any Pluto server
   process spawned during testing gets cleaned up too (check
   `state.childPids` handling, or just verify via process list)
2. Run:
   ```powershell
   Get-CimInstance Win32_Process | Where-Object { $_.Name -match 'codium-tunnel|serve-web|julia' } | Select-Object ProcessId, Name, CommandLine
   ```
   (note: added `julia` to the match pattern this time, given Sprint 12
   specifically introduced Julia subprocess spawning via Pluto — worth
   confirming no orphaned Julia/Pluto processes linger, not just the
   usual serve-web ones)
3. Report raw output — empty is a clean pass. Do not kill anything
   before reporting.

## Only after everything above is confirmed

```
git add -A
git commit -m "Sprint 12 complete: HOME tab APPS group (Pluto, Wolfram, Lean, Claude launchers)"
git tag sprint12-complete
git push origin main --tags
```
