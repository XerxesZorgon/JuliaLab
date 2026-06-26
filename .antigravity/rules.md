# Antigravity Rules

- **Verification Protocol:** Never quit JuliaLab with `taskkill /IM electron.exe` during verification, as it bypasses the teardown under test. Always quit via the app's ✕ (if manual) or by sending the `window:close` IPC.
