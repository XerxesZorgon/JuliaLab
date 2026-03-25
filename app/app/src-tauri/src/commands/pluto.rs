use log::debug;
use tauri::State;

use crate::error::AppError;
use crate::state::AppState;

/// Launch a Pluto.jl notebook server and open it in the default browser.
/// Resolves the Julia executable from the standard JuliaLab install location,
/// then spawns a detached process running `Pluto.run()`.
#[tauri::command]
pub async fn launch_pluto(_app_state: State<'_, AppState>) -> Result<(), AppError> {
    debug!("[Pluto] launch_pluto command invoked");

    // Resolve Julia executable — mirrors the path logic in lifecycle.rs
    let app_data_dir = dirs::data_local_dir()
        .ok_or_else(|| AppError::InternalError("Failed to get app data directory".to_string()))?;

    let julia_exe = app_data_dir
        .join("org.julialab.ide")
        .join("julia")
        .join("julia-1.12.1")
        .join("bin")
        .join(if cfg!(target_os = "windows") { "julia.exe" } else { "julia" });

    if !julia_exe.exists() {
        return Err(AppError::InternalError(format!(
            "Julia executable not found at {:?}",
            julia_exe
        )));
    }

    debug!("[Pluto] Using Julia at: {:?}", julia_exe);

    // Spawn detached Julia process that installs (if needed) and launches Pluto.
    // Pluto.run() opens the browser automatically.
    let mut cmd = std::process::Command::new(&julia_exe);
    cmd.args([
        "--startup-file=no",
        "-e",
        concat!(
            "import Pkg; ",
            "Pkg.activate(; temp=true); ",
            "Pkg.add(\"Pluto\"); ",
            "import Pluto; ",
            "Pluto.run()"
        ),
    ]);

    // Detach: no pipes, non-blocking
    cmd.stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null());

    // Windows: suppress console window flash
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }

    cmd.spawn()
        .map_err(|e| AppError::InternalError(format!("Failed to launch Pluto: {}", e)))?;

    debug!("[Pluto] Pluto server process spawned (detached)");
    Ok(())
}