# T7A — Async Revise Timing Manual Test

**Purpose:** Verify that the Ready signal fires quickly and Revise loads
asynchronously without blocking startup.

## TC-7A.1 Startup timing baseline
1. Before making the async Revise change, run `npm run tauri dev`.
2. Note the elapsed time from:
   - "Julia process started successfully" log line
   - to "ALL_PIPES_READY" signal
3. Record this as the **baseline** (typically 8–15s with synchronous Revise).

## TC-7A.2 Startup timing after async change
1. After implementing async Revise loading, run `npm run tauri dev`.
2. Note the same elapsed time.
3. **Pass:** New startup time is >= 3s faster than baseline.
   Typical expected improvement: 5–8s faster.

## TC-7A.3 Revise is actually loaded
1. After app reaches Ready state, wait 3–5 seconds.
2. Open a .jl file in the editor and make a change.
3. **Expected:** Revise detects the change and the function updates without
   restarting Julia (Revise.jl's standard behavior).
4. **Pass:** Code change is reflected without a Julia restart.
5. **Fail:** Revise never activates -> check that the async spawn actually runs
   and is not being cancelled.

## TC-7A.4 No double-load
1. Check the console log for `"using Revise"` or `"Revise loaded"` messages.
2. **Pass:** The message appears exactly once.
3. **Fail:** Message appears twice -> the old blocking block was not deleted.
