Technical stack: Tauri 2 (Rust), Vue 3 + TypeScript, Monaco Editor, Naive UI, 
LanguageServer.jl via LSP, Pinia state management.

Architecture constraints:

- Must preserve Compute42's Actix actor system for Julia process management
- Julia integration via stdio/socket — no embedded Julia, spawn as subprocess
- Revise.jl must load automatically in every new Julia session
- AI pane communicates with Gemini CLI via subprocess (gemini CLI is installed separately)
- Cross-platform: Windows, macOS, Linux
- All panels communicate through Tauri invoke() commands — no direct DOM access to Julia

Deliver: architecture diagram, component hierarchy, Rust command API surface, 
data flow between Vue frontend and Julia backend, Revise.jl integration approach, 
Gemini AI pane integration approach.

```
---

### 3. Additional Features Worth Adding

Beyond the MATLAB core discussed earlier, here are features that would make JuliaLab genuinely excellent:

**Productivity & Workflow**
- **Live documentation tooltips** — hover over any function to show its docstring rendered with LaTeX via MathJax (Julia's docs are rich with math)
- **Unicode autocomplete** — type `\alpha` + Tab to insert `α`, just like in VS Code's Julia extension; this is a signature Julia feature MATLAB users will love once they discover it
- **Method browser** — click any function to see all defined methods (multiple dispatch is central to Julia; surface it visually)
- **Environment switcher** — a dropdown in the toolbar to switch `Project.toml` environments, like a conda env switcher
- **Benchmark runner** — one-click `@benchmark` via BenchmarkTools.jl with results displayed in a chart panel; appeals strongly to performance-focused MATLAB migrants
- **ProfileView integration** — run the profiler and display a flame graph inline (similar to MATLAB's profiler)

**Notebook & Publishing**
- **Pluto.jl launcher** — a button to open the current file as a reactive Pluto notebook in the browser; Pluto is Julia's answer to Jupyter and is beloved in the community
- **Weave.jl export** — export scripts to PDF/HTML reports (like MATLAB's Publish feature), since `##` cell headers double as section markers

**Package & Environment**
- **Package search pane** — search Julia General registry with fuzzy search, show download counts and GitHub stars before installing
- **Dependency graph viewer** — visualize `Project.toml` dependencies as a tree

**Education & Discoverability**
- **MATLAB→Julia cheat sheet panel** — a built-in reference panel showing MATLAB syntax on the left, Julia equivalent on the right (e.g., `zeros(3,3)` vs `zeros(3,3)`, `size(A,1)` vs `size(A,1)`, `A'` vs `A'` or `transpose(A)`). This would be genuinely unique to JuliaLab and invaluable for your target audience.
- **Startup tips** — show a "did you know" tip at launch about Julia-specific idioms

---

### 4. Adding a Gemini AI Pane

This is very achievable. Gemini CLI is open source (Apache 2.0) and provides a free tier of 60 requests per minute and 1,000 requests per day with a personal Google account, with access to Gemini models and a 1M token context window. 

The integration approach for JuliaLab is to embed a chat-style panel in the IDE that spawns `gemini` as a subprocess via Tauri and streams its output back to the Vue UI — the same pattern Compute42 uses for its Julia process.

**Architecture:**
```

Vue AI Pane (chat UI)
    ↕ Tauri invoke()
Rust Tauri Command: spawn_gemini_query(prompt, context)
    ↕ subprocess / stdin-stdout
gemini CLI (installed separately by user)
    ↕ Gemini API
Gemini 2.5 Pro (1M token context)