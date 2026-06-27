# Antigravity Rules

- **Verification Protocol:** Never quit JuliaLab with `taskkill /IM electron.exe` during verification, as it bypasses the teardown under test. Always quit via the app's ✕ (if manual) or by sending the `window:close` IPC.
- **Launch Commands:** Never run `npm start` or `npm run start:fast` before receiving explicit approval on any pending diff. Launch commands are manual steps performed by John unless an explicit task action says otherwise.
