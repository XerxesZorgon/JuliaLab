# AI Development Protocol
## For use with Claude Code and Claude (chat)

Place this file at the root of every project as `AI_PROTOCOL.md`.
At the start of every Claude Code session, say:
**"Follow AI_PROTOCOL.md for all work in this session."**

At the start of every Claude (chat) session, say:
**"I'm working on [project name]. Follow AI_PROTOCOL.md."**

---

## What This Protocol Does

Software development with AI assistants is fast but fragile. The AI writes
code quickly, but it cannot feel the consequences of a mistake the way a
human engineer does. Without a disciplined process, small errors compound
across many files until the project is in a state that takes hours to untangle.

This protocol prevents that by keeping every change small, reviewed, and
reversible. It works for any software project — web apps, desktop apps,
data pipelines, scripts, anything.

---

## The Two Roles

### Claude (chat) — the architect and reviewer
You are reading this in Claude chat. This is where you:
- Describe what you want to build or fix
- Receive diagnosis when something breaks
- Review plans before any code is written
- Get guidance on what to do next

Claude chat is your senior technical advisor. Bring every decision here
before acting on it.

### Claude Code — the executor
Claude Code is the command-line tool that actually writes and runs code.
It is fast and capable but needs precise, small instructions. It should
never be given a multi-step task and left to run unsupervised.

---

## The Change Cycle

Every unit of work — no matter how small — follows this exact sequence.
Do not skip steps.

```
READ → PLAN → DIFF → APPROVE → RUN → VERIFY → COMMIT
```

### 1. READ
Claude Code reads the relevant file(s) and reports what it finds.
**No changes yet.** If Claude Code starts writing code during this step,
stop it and ask it to report first.

### 2. PLAN
Claude Code states:
- Exactly which file will change
- Exactly which function or section within that file
- What the change will do in plain English
- What "success" looks like (one specific observable outcome)

Bring this plan to Claude (chat) if anything is unclear or if more than
two files are involved. More than two files means the task needs to be split.

### 3. DIFF
Claude Code shows the exact proposed change — either as a diff
(`--- before / +++ after`) or as a clearly marked before/after block.

**Do not allow Claude Code to apply any change without showing it first.**

Review the diff by asking:
- Does this change only what was planned?
- Does it follow the same style as the surrounding code?
- Is anything being deleted that shouldn't be?

If unsure, paste the diff into Claude (chat) for review.

### 4. APPROVE
Tell Claude Code: "Apply the change" or "Go ahead."
If the diff looks wrong, say "Don't apply this — let's rethink" and
bring it to Claude (chat).

### 5. RUN
Claude Code applies the change and runs the specific test or check
for that change. This might be:
- A unit test (`npm test`, `julia test_file.jl`, `cargo test`)
- A compile check (`cargo check`, `npm run build`)
- A visual check (run the app and observe the one thing that changed)

### 6. VERIFY
Claude Code reports the result verbatim — test output, error messages,
or a description of what appeared on screen. Do not accept "it seems
to work" — require specific confirmation of the acceptance criterion.

### 7. COMMIT
If the test passes, commit immediately. See the Git section below for
exact commands. If the test fails, revert immediately. See the Revert
section. Never proceed to the next task without committing or reverting
the current one.

---

## Git: The Safety Net

Git is a tool that takes snapshots of your code at specific moments.
Every commit is a snapshot you can return to. Think of it as save points
in a video game — you can always go back to the last save.

You do not need to understand Git deeply to use it safely.
Follow these instructions exactly.

### Setting up Git for a new project

If the project does not already have Git set up, tell Claude Code:
> "Set up git for this project and create an initial commit."

It will run:
```bash
git init
git add .
git commit -m "Initial commit"
```

If you want to back up to GitHub, create a new repository on github.com
(click New Repository, give it a name, do not add any files), then tell
Claude Code the repository URL and ask it to connect the project.

### Checking the current state — run this every session

**Before starting any work:**
```bash
git status
```
This shows whether there are unsaved changes. If you see modified files
from a previous session, handle those before starting new work.
Ask Claude (chat) what to do if you're not sure.

```bash
git log --oneline -5
```
This shows the last 5 commits in a compact form. Know where you are
before you start. It looks like this:
```
a3f92b1 fix: restore setup_plotting in main.jl
d891cc4 feat: GoldenLayout drag working
2f3a091 chore: Task 7B staleness check complete
```

### Committing — saving a working state

Run this after every successful test:
```bash
git add -A
git commit -m "brief description of what changed and why"
```

Good commit message examples:
- `fix: restore setup_plotting call — plots were not displaying`
- `feat: PlotsToolbar with CairoMakie gallery buttons`
- `chore: Task 7B staleness check — skips Pkg.instantiate when unchanged`
- `test: add T3_plot_export.jl — passes`

Bad commit message examples:
- `update`
- `fix stuff`
- `wip`
- `changes`

You can also tell Claude Code: "Commit the current working state with
a descriptive message" and it will write the message for you.

### When to commit — the complete list

Commit immediately when any of these happen:
- A test passes that previously failed
- A new feature works for the first time
- A bug is fixed and confirmed gone
- A refactor is complete and nothing is broken
- You are about to start a risky change (commit the clean state first,
  so you have a safe point to return to)
- You are ending a working session for the day

**If in doubt, commit.** Too many commits is never a problem.
Too few commits means losing hours of work when something goes wrong.

### Pushing to GitHub — backing up your work

After committing, send your work to GitHub:
```bash
git push
```

Do this at the end of every working session. If you have not set up
GitHub yet, ask Claude Code to help you connect the project.

### Reverting — undoing a broken change

When something breaks, the first action is always to undo.
Do not try to fix a broken state with more changes on top of it.

**Undo the last commit (safest option — keeps files, removes the commit):**
```bash
git revert HEAD
```

**Discard all changes to one specific file since the last commit:**
```bash
git checkout -- path/to/filename.ext
```

**Discard all uncommitted changes everywhere (use with care):**
```bash
git stash
```

After reverting, bring the situation to Claude (chat) for diagnosis
before writing any new code. Describe what you did, what broke, and
paste the error message.

---

## Task Sizing

### A correctly sized task
- Changes **one file**
- Has **one acceptance criterion** (one specific thing to verify)
- Takes **less than 15 minutes** to complete and verify
- Is **fully reversible** with one git command

### A task that is too large — split it

Signs that a task needs to be split:
- It mentions changing more than 2 files
- It has more than one thing to verify
- It touches both the frontend (what you see) and the backend (the logic)
- It involves both code changes and configuration changes
- You cannot state the acceptance criterion in one sentence

**How to split:** bring the task description to Claude (chat) and ask:
"How do I split this into atomic steps?" You will get a numbered list
of single-file changes in the right order.

### The splitting rule for common project types

**Web or desktop app (frontend + backend):**
1. Backend first: add the function or API endpoint, verify it compiles
2. Wire the connection: register it so the frontend can reach it, verify the call works
3. Frontend last: build the UI that calls it, verify it renders correctly

**Data pipeline:**
1. Input: read and validate the data, test with a small sample
2. Transform: apply the logic, verify the output matches expected values
3. Output: write the result, verify the file or database is correct

**Script or utility:**
1. Core logic first, tested in isolation
2. Input and output wiring second
3. Error handling third

---

## Diagnostic Protocol

When something breaks, follow this sequence exactly. Do not skip steps.

**Step 1 — Stop.**
Do not make any more changes. A broken state that receives more changes
becomes exponentially harder to fix.

**Step 2 — Copy the error verbatim.**
Copy the exact error message from the terminal, browser console, or test
output. Do not paraphrase or summarize. Paste it into Claude (chat).

**Step 3 — Show the recent changes.**
Run this and paste the output into Claude (chat):
```bash
git diff HEAD~1
```
This shows exactly what changed in the last commit. Most bugs are
visible here before any debugging is needed.

**Step 4 — Wait for a diagnosis.**
Claude (chat) will identify the root cause from the error message and
the diff. Do not let Claude Code attempt any fix until a specific root
cause has been named.

**Step 5 — Apply one targeted fix.**
Once the root cause is confirmed, Claude Code makes one change that
addresses exactly that cause. Show the diff, approve it, run it, verify it.

**Step 6 — If the fix does not work, revert and return to Step 1.**
Never apply a second fix on top of a first fix that did not work.
Revert, then start the diagnostic process again from the beginning.

---

## Red Flags — Stop and Ask Claude (chat)

Stop Claude Code immediately and bring the situation here when:

| What Claude Code says or does | What it means |
|---|---|
| "Let me refactor this first" | Scope is expanding — stop it |
| "Let me stabilize things before..." | About to make broad changes — stop it |
| Fix requires changing 3+ files | Task needs to be split |
| Same bug has been patched twice without success | Diagnosis is wrong — revert and start over |
| New errors appear after the last change | The fix introduced a new bug — revert |
| Proposes replacing a library to fix a bug | Disproportionate response — stop it |
| A change "should work" but has no observable effect | Root cause was wrong — stop and diagnose |
| "This is complex, let me handle it all at once" | About to violate the one-change rule — stop it |

The correct response to every red flag is the same:
**Stop. Revert to the last clean commit. Describe the situation to Claude (chat).**

---

## Session Start Checklist

```
[ ] Open the project in your editor
[ ] Run: git status
    → Are there uncommitted changes from last session?
    → If yes: commit them (if working) or revert them (if broken)
    → If unsure: ask Claude (chat) what to do
[ ] Run: git log --oneline -5
    → Note the last commit so you know where you are
[ ] State the single goal for this session in one sentence
    → Write it down or tell Claude Code at the start
[ ] Tell Claude Code: "Follow AI_PROTOCOL.md for all work this session"
```

---

## Session End Checklist

```
[ ] Run: git status
    → Is there anything uncommitted?
    → If working: git add -A && git commit -m "description"
    → If broken: git revert HEAD or git stash
[ ] Run: git push
    → Sends today's work to GitHub for safekeeping
[ ] Note the next task
    → Write it in tasks.md so the next session starts with context
[ ] Note any known broken things
    → Be specific: "X is broken, last working commit was Y"
```

---

## Communication Templates

Use these exact phrases to keep Claude Code on track.

**Starting a task:**
> "Follow AI_PROTOCOL.md. Read [filename] and report what you find.
> Do not make any changes yet."

**After the read report:**
> "What is the single change needed to achieve [goal]?
> Show me the diff before applying anything."

**After seeing the diff — approving:**
> "Apply the change."

**After seeing the diff — rejecting:**
> "Don't apply this. Let me check with Claude chat first."

**After a test fails:**
> "Stop. Do not make any more changes.
> Run git diff HEAD~1 and show me the full output."

**When scope creep appears:**
> "That involves more than one change. What is the single smallest
> change that moves us toward [goal]? Do only that one."

**Ending a session:**
> "Run git status. Commit any working changes with a descriptive
> message, then push to GitHub."

---

## Quick Reference Card

Save this page or keep this section visible while working.

| Situation | Command or action |
|---|---|
| Start of session | `git status` then `git log --oneline -5` |
| Before any change | Read the file, see the diff, approve it |
| After a test passes | `git add -A && git commit -m "description"` |
| End of session | `git push` |
| Something breaks | Stop → `git diff HEAD~1` → ask Claude chat |
| Fix doesn't work | `git revert HEAD` → ask Claude chat |
| Task touches 3+ files | Split it — ask Claude chat for the order |
| Same bug fixed twice | Stop, revert, diagnose from scratch |
| Claude Code says "refactor first" | Stop, ask Claude chat |
| Unsure what to do | Ask Claude chat before doing anything |

---

## Starting a New Project

At the start of any new project, tell Claude (chat):

> "I'm starting a new project: [one sentence description of what it does].
> Help me set up AI_PROTOCOL.md and an initial tasks.md with the
> first three atomic tasks."

Claude (chat) will:
1. Confirm the protocol applies as-is or note any project-specific additions
2. Create an initial task list at the right granularity
3. Set up the git repository if needed
4. Populate the File Reference table below as the codebase takes shape

---

## File Reference

This table maps areas of the codebase to the files that must be read
before making changes nearby. Add entries as you learn the project.

**Template (copy for each new project):**

| What you're changing | Read these files first |
|---|---|
| (fill in as you learn the codebase) | |

**JuliaLab:**

| What you're changing | Read first |
|---|---|
| Julia startup, Revise, sysimage | `lifecycle.rs` |
| Plot display pipeline | `display.jl`, `execution.jl` |
| Panel layout, drag and drop | `DockLayout.vue`, `layoutStore.ts` |
| Ribbon tabs and toolbars | `RibbonBar.vue` |
| Julia runtime scripts | `main.jl`, `handlers.jl` |
| Tauri commands (backend) | `lib.rs`, `commands/` directory |
| Styles and visual theme | `theme.css` |
| Package management | `packages.jl` |
| Tests | `tests/julia/`, `tests/manual/` |
| Build and sprint tasks | `CLAUDE.md`, `tasks.md`, `SKILLS.md` |