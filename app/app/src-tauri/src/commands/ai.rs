use std::sync::{Arc, Mutex};

use log::debug;
use serde::{Deserialize, Serialize};
use tauri::{command, AppHandle, Emitter, Manager};
use tauri_plugin_shell::{process::CommandEvent, ShellExt};

// ─── Platform binary name ─────────────────────────────────────────────────────

/// On Windows the Gemini CLI npm package installs a `.cmd` shim.
#[cfg(target_os = "windows")]
fn gemini_binary() -> &'static str {
    "gemini.cmd"
}

#[cfg(not(target_os = "windows"))]
fn gemini_binary() -> &'static str {
    "gemini"
}

// ─── Managed state ────────────────────────────────────────────────────────────

/// Holds the currently-running Gemini child process so it can be killed on demand.
/// Wrapped in `Arc<Mutex>` so it can live in Tauri's managed state and be shared
/// between `call_gemini_stream` and `kill_gemini_stream`.
pub struct GeminiChildState(pub Arc<Mutex<Option<tauri_plugin_shell::process::CommandChild>>>);

impl GeminiChildState {
    pub fn new() -> Self {
        Self(Arc::new(Mutex::new(None)))
    }
}

// ─── Tauri-facing types ───────────────────────────────────────────────────────

#[derive(Deserialize, Debug)]
pub struct GeminiPayload {
    pub prompt: String,
    pub context: Option<String>,
}

/// Streamed text chunk emitted as `gemini-stream-chunk`.
#[derive(Serialize, Clone)]
pub struct ChunkPayload {
    pub text: String,
}

/// Emitted as `gemini-stream-end` when the child exits.
#[derive(Serialize, Clone)]
pub struct StreamEndPayload {
    pub exit_code: Option<i32>,
}

/// Emitted as `gemini-stream-error`.
///
/// `is_auth_error` is `true` when the error looks like a missing API key or
/// unauthenticated CLI — the frontend should then display the sign-in hint.
#[derive(Serialize, Clone)]
pub struct StreamErrorPayload {
    pub message: String,
    pub is_auth_error: bool,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

fn classify_stderr(text: &str) -> bool {
    let lower = text.to_lowercase();
    lower.contains("api key")
        || lower.contains("authentication")
        || lower.contains("unauthorized")
        || lower.contains("permission denied")
        || lower.contains("not authenticated")
        || lower.contains("gemini auth")
}

fn emit_error(app: &AppHandle, message: impl Into<String>, is_auth_error: bool) {
    let _ = app.emit(
        "gemini-stream-error",
        StreamErrorPayload {
            message: message.into(),
            is_auth_error,
        },
    );
}

// ─── Commands ─────────────────────────────────────────────────────────────────

/// Returns `true` if the Gemini CLI binary exists on PATH.
#[command]
pub async fn check_gemini_cli() -> Result<bool, String> {
    match std::process::Command::new(gemini_binary())
        .arg("--version")
        .output()
    {
        Ok(out) => Ok(out.status.success()),
        Err(_) => Ok(false),
    }
}

/// Spawn the Gemini CLI, stream stdout chunks to the frontend via events, and
/// store the child handle so `kill_gemini_stream` can terminate it on demand.
///
/// # Events emitted
/// | Event                 | Payload                            |
/// |-----------------------|------------------------------------|
/// | `gemini-stream-chunk` | `ChunkPayload { text }`            |
/// | `gemini-stream-error` | `StreamErrorPayload`               |
/// | `gemini-stream-end`   | `StreamEndPayload { exit_code }`   |
#[command]
pub async fn call_gemini_stream(
    app: AppHandle,
    payload: GeminiPayload,
) -> Result<(), String> {
    // Build the full prompt, optionally prepending the IDE context.
    let full_prompt = match &payload.context {
        Some(ctx) if !ctx.trim().is_empty() => {
            format!(
                "{}\n\nUser question:\n{}",
                ctx.trim(),
                payload.prompt
            )
        }
        _ => payload.prompt.clone(),
    };

    debug!("[AI] Spawning Gemini CLI with prompt ({} chars)", full_prompt.len());

    let spawn_result = app
        .shell()
        .command(gemini_binary())
        .args([full_prompt])
        .spawn();

    let (mut rx, child) = match spawn_result {
        Ok(pair) => pair,
        Err(e) => {
            let msg = e.to_string();
            let is_not_found = msg.to_lowercase().contains("not found")
                || msg.to_lowercase().contains("no such file")
                || msg.to_lowercase().contains("cannot find");

            let user_msg = if is_not_found {
                "The Gemini CLI was not found. \
                 Install it with `npm install -g @google/gemini-cli` \
                 and ensure your GOOGLE_API_KEY is set."
                    .to_string()
            } else {
                format!("Failed to launch Gemini CLI: {}", msg)
            };

            emit_error(&app, user_msg, is_not_found);
            let _ = app.emit("gemini-stream-end", StreamEndPayload { exit_code: Some(-1) });
            return Ok(());
        }
    };

    // Store the child handle for potential kill.
    if let Some(state) = app.try_state::<GeminiChildState>() {
        if let Ok(mut guard) = state.0.lock() {
            *guard = Some(child);
        }
    }

    // Consume the event stream on a background task, keeping the invoke call
    // from blocking the Tauri main thread.
    let app_clone = app.clone();
    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(data) => {
                    let text = String::from_utf8_lossy(&data).to_string();
                    if !text.is_empty() {
                        let _ = app_clone.emit("gemini-stream-chunk", ChunkPayload { text });
                    }
                }
                CommandEvent::Stderr(data) => {
                    let text = String::from_utf8_lossy(&data).into_owned();
                    if !text.trim().is_empty() {
                        emit_error(&app_clone, text.clone(), classify_stderr(&text));
                    }
                }
                CommandEvent::Error(err) => {
                    emit_error(&app_clone, err, false);
                }
                CommandEvent::Terminated(status) => {
                    // Release the stored child handle before emitting end so the
                    // kill command doesn't operate on a dead process.
                    if let Some(state) = app_clone.try_state::<GeminiChildState>() {
                        if let Ok(mut guard) = state.0.lock() {
                            *guard = None;
                        }
                    }
                    let _ = app_clone.emit(
                        "gemini-stream-end",
                        StreamEndPayload {
                            exit_code: status.code,
                        },
                    );
                    break;
                }
                _ => {}
            }
        }
    });

    Ok(())
}

/// Kill the currently-running Gemini CLI child process, if any.
/// The frontend calls this when the user presses "Stop Generating".
#[command]
pub async fn kill_gemini_stream(app: AppHandle) -> Result<(), String> {
    if let Some(state) = app.try_state::<GeminiChildState>() {
        if let Ok(mut guard) = state.0.lock() {
            if let Some(child) = guard.take() {
                child.kill().map_err(|e| e.to_string())?;
                debug!("[AI] Gemini child process killed by user request.");
            }
        }
    }
    // Always emit a terminal event so the frontend cleans up its loading state.
    let _ = app.emit(
        "gemini-stream-end",
        StreamEndPayload { exit_code: Some(-2) },
    );
    Ok(())
}
