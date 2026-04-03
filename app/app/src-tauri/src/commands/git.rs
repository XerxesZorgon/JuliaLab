use tauri::State;
use crate::state::AppState;
use crate::error::AppError;
use std::process::Command;
use log::debug;

fn run_git(args: &[&str], cwd: &str) -> Result<String, String> {
    let output = Command::new("git")
        .args(args)
        .current_dir(cwd)
        .output()
        .map_err(|e| format!("Failed to run git: {}", e))?;
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub async fn git_status(project_path: String) -> Result<String, AppError> {
    debug!("[Git] git status for: {}", project_path);
    run_git(&["status", "--porcelain"], &project_path)
        .map_err(|e| AppError::InternalError(e))
}

#[tauri::command]
pub async fn git_diff(project_path: String, file_path: String) -> Result<String, AppError> {
    debug!("[Git] git diff for: {}", file_path);
    run_git(&["diff", &file_path], &project_path)
        .map_err(|e| AppError::InternalError(e))
}

#[tauri::command]
pub async fn git_stage(project_path: String, file_path: String) -> Result<(), AppError> {
    debug!("[Git] git add: {}", file_path);
    run_git(&["add", &file_path], &project_path)
        .map(|_| ())
        .map_err(|e| AppError::InternalError(e))
}

#[tauri::command]
pub async fn git_unstage(project_path: String, file_path: String) -> Result<(), AppError> {
    debug!("[Git] git reset HEAD: {}", file_path);
    run_git(&["reset", "HEAD", &file_path], &project_path)
        .map(|_| ())
        .map_err(|e| AppError::InternalError(e))
}

#[tauri::command]
pub async fn git_commit(project_path: String, message: String) -> Result<(), AppError> {
    debug!("[Git] git commit: {}", message);
    run_git(&["commit", "-m", &message], &project_path)
        .map(|_| ())
        .map_err(|e| AppError::InternalError(e))
}

#[tauri::command]
pub async fn git_pull(project_path: String) -> Result<String, AppError> {
    debug!("[Git] git pull for: {}", project_path);
    run_git(&["pull"], &project_path)
        .map_err(|e| AppError::InternalError(e))
}

#[tauri::command]
pub async fn git_push(project_path: String) -> Result<String, AppError> {
    debug!("[Git] git push for: {}", project_path);
    run_git(&["push"], &project_path)
        .map_err(|e| AppError::InternalError(e))
}

#[tauri::command]
pub async fn git_log(project_path: String) -> Result<String, AppError> {
    debug!("[Git] git log for: {}", project_path);
    run_git(&["log", "--oneline", "-20"], &project_path)
        .map_err(|e| AppError::InternalError(e))
}

#[tauri::command]
pub async fn git_init(project_path: String) -> Result<(), AppError> {
    debug!("[Git] git init for: {}", project_path);
    run_git(&["init"], &project_path)
        .map(|_| ())
        .map_err(|e| AppError::InternalError(e))
}
