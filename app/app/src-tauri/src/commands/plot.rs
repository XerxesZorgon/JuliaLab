use internals::messages::PlotData;
use log::{debug, error};
use tauri::{AppHandle, Emitter, Manager};
use crate::state::AppState;
use crate::error::AppError;
use internals::messages::plot::GetPlots;

/// Get all plots from orchestrator's plot server
#[tauri::command]
pub async fn get_all_plots(app_handle: AppHandle) -> Result<Vec<PlotData>, AppError> {
    debug!("Getting all plots from orchestrator");

    // Get the orchestrator from app state
    let app_state = app_handle.state::<AppState>();
    match app_state.actor_system.plot_actor.send(GetPlots).await.map_err(|_| AppError::InternalError("Actor comm failed".to_string()))? {
        Ok(plots) => {
            debug!("Successfully retrieved {} plots", plots.len());
            Ok(plots)
        }
        Err(e) => {
            error!("Failed to get plots: {}", e);
            Err(AppError::InternalError(format!("Failed to get plots: {}", e)))
        }
    }
}

/// Get a specific plot by ID
#[tauri::command]
pub async fn get_plot(plot_id: String, app_handle: AppHandle) -> Result<Option<PlotData>, AppError> {
    debug!("Getting plot with ID: {}", plot_id);

    let app_state = app_handle.state::<AppState>();
    match app_state.actor_system.plot_actor.send(GetPlots).await.map_err(|_| AppError::InternalError("Actor comm failed".to_string()))? {
        Ok(plots) => {
            let plot = plots.into_iter().find(|p| p.id == plot_id);
            Ok(plot)
        }
        Err(e) => {
            error!("Failed to get plot: {}", e);
            Err(AppError::InternalError(format!("Failed to get plot: {}", e)))
        }
    }
}

/// Get all plots from a specific source file
#[tauri::command]
pub async fn get_plots_by_source_file(
    source_file: String,
    app_handle: AppHandle,
) -> Result<Vec<PlotData>, AppError> {
    debug!("Getting plots from source file: {}", source_file);

    let app_state = app_handle.state::<AppState>();
    match app_state.actor_system.plot_actor.send(GetPlots).await.map_err(|_| AppError::InternalError("Actor comm failed".to_string()))? {
        Ok(plots) => {
            let filtered_plots: Vec<PlotData> = plots
                .into_iter()
                .filter(|plot| plot.source_file.as_ref() == Some(&source_file))
                .collect();
            Ok(filtered_plots)
        }
        Err(e) => {
            error!("Failed to get plots: {}", e);
            Err(AppError::InternalError(format!("Failed to get plots: {}", e)))
        }
    }
}

/// Delete a plot by ID
#[tauri::command]
pub async fn delete_plot(plot_id: String, app_handle: AppHandle) -> Result<bool, AppError> {
    debug!("Deleting plot with ID: {}", plot_id);

    let app_state = app_handle.state::<AppState>();
    match app_state.actor_system.plot_actor.send(internals::messages::plot::DeletePlot { plot_id: plot_id.clone() }).await.map_err(|_| AppError::InternalError("Actor comm failed".to_string()))? {
        Ok(_) => {
            debug!("Successfully deleted plot");
            Ok(true)
        }
        Err(e) => {
            error!("Failed to delete plot: {}", e);
            Err(AppError::InternalError(format!("Failed to delete plot: {}", e)))
        }
    }
}

/// Clear all plots
#[tauri::command]
pub async fn clear_all_plots(app_handle: AppHandle) -> Result<(), AppError> {
    debug!("Clearing all plots");

    let app_state = app_handle.state::<AppState>();
    // Get all plots and delete them one by one
    match app_state.actor_system.plot_actor.send(GetPlots).await.map_err(|_| AppError::InternalError("Actor comm failed".to_string()))? {
        Ok(plots) => {
            for plot in plots {
                if let Err(e) = app_state.actor_system.plot_actor.send(internals::messages::plot::DeletePlot { plot_id: plot.id.clone() }).await.map_err(|_| AppError::InternalError("Actor comm failed".to_string()))? {
                    error!("Failed to delete plot {}: {}", plot.id, e);
                }
            }
            debug!("Cleared all plots");
            Ok(())
        }
        Err(e) => {
            error!("Failed to get plots for clearing: {}", e);
            Err(AppError::InternalError(format!("Failed to clear plots: {}", e)))
        }
    }
}

/// Test the plot system with a sample SVG
#[tauri::command]
pub async fn test_plot_system(app_handle: AppHandle) -> Result<String, AppError> {
    debug!("Testing plot system with sample SVG");

    let test_svg = r#"<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="lightblue"/>
        <circle cx="100" cy="100" r="50" fill="red"/>
        <text x="100" y="120" text-anchor="middle" fill="white">Test Plot</text>
    </svg>"#;

    let app_state = app_handle.state::<AppState>();

    let plot_data = PlotData {
        id: uuid::Uuid::new_v4().to_string(),
        mime_type: "image/svg+xml".to_string(),
        data: test_svg.to_string(),
        timestamp: std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_millis() as i64,
        title: Some("Test Plot".to_string()),
        description: Some("A test plot for development".to_string()),
        source_file: Some("test_script.jl".to_string()),
        line_number: Some(1),
        code_context: Some("println(\"Hello World\")".to_string()),
        session_id: Some("test_session".to_string()),
    };

    match app_state.actor_system
        .plot_actor
        .send(internals::messages::plot::AddPlot { plot_data })
        .await
        .map_err(|_| AppError::InternalError("Actor comm failed".to_string()))? {
        Ok(_) => {
            debug!("Added test plot successfully");
            Ok("Test plot added successfully".to_string())
        }
        Err(e) => {
            error!("Failed to add test plot: {}", e);
            Err(AppError::InternalError(format!("Failed to add test plot: {}", e)))
        }
    }
}

/// Emit plot navigator update event
#[tauri::command]
pub async fn emit_plot_navigator_update(app_handle: AppHandle) -> Result<(), AppError> {
    debug!("Emitting plot navigator update event");

    let app_state = app_handle.state::<AppState>();
    
    match app_state.actor_system.plot_actor.send(GetPlots).await.map_err(|_| AppError::InternalError("Actor comm failed".to_string()))? {
        Ok(plots) => {
            let plot_ids: Vec<String> = plots.iter().map(|p| p.id.clone()).collect();
            app_handle
                .emit("plot:navigator-update", plot_ids)
                .map_err(|e| e.to_string())?;
            Ok(())
        }
        Err(e) => {
            error!("Failed to get plots for navigator update: {}", e);
            Err(AppError::InternalError(format!("Failed to get plots: {}", e)))
        }
    }
}

#[tauri::command]
pub async fn serve_plot_image(
    plot_id: String,
    app_handle: AppHandle,
) -> Result<(String, String), AppError> {
    // Get the plot data
    let app_state = app_handle.state::<AppState>();

    match app_state.actor_system.plot_actor.send(GetPlots).await.map_err(|_| AppError::InternalError("Actor comm failed".to_string()))? {
        Ok(plots) => {
            let plot = plots.into_iter().find(|p| p.id == plot_id);
            match plot {
                Some(plot_data) => {
                    debug!("Serving plot image for ID: {}", plot_id);
                    Ok((plot_data.data, plot_data.mime_type))
                }
                None => {
                    error!("Plot not found for ID: {}", plot_id);
                    Err(AppError::ValidationError(format!("Plot not found: {}", plot_id)))
                }
            }
        }
        Err(e) => {
            error!("Failed to get plots: {}", e);
            Err(AppError::InternalError(format!("Failed to get plots: {}", e)))
        }
    }
}

/// Export a plot to a file (PNG format)
#[tauri::command]
pub async fn export_plot(
    plot_id: String,
    file_path: String,
    format: String,
    app_handle: AppHandle,
) -> Result<String, AppError> {
    debug!("Exporting plot {} to {} as {}", plot_id, file_path, format);

    // Only PNG format is supported for now
    if format != "png" {
        return Err(AppError::ValidationError(format!("Unsupported export format: {}", format)));
    }

    // Get the plot data
    let app_state = app_handle.state::<AppState>();
    let plot_data = match app_state.actor_system.plot_actor.send(GetPlots).await.map_err(|_| AppError::InternalError("Actor comm failed".to_string()))? {
        Ok(plots) => {
            plots.into_iter().find(|p| p.id == plot_id).ok_or_else(|| {
                AppError::ValidationError(format!("Plot not found: {}", plot_id))
            })?
        }
        Err(e) => {
            error!("Failed to get plots: {}", e);
            return Err(AppError::InternalError(format!("Failed to get plots: {}", e)));
        }
    };

    // Check if it's an image type
    if !plot_data.mime_type.starts_with("image/") {
        return Err(AppError::ValidationError(format!("Plot is not an image type: {}", plot_data.mime_type)));
    }

    // Decode base64 data
    let image_data = if plot_data.data.contains(',') {
        // Remove data URL prefix if present (e.g., "data:image/png;base64,...")
        plot_data.data.split(',').nth(1).unwrap_or(&plot_data.data)
    } else {
        &plot_data.data
    };

    let decoded = base64::decode(image_data).map_err(|e| {
        AppError::InternalError(format!("Failed to decode base64 image data: {}", e))
    })?;

    // Write to file
    std::fs::write(&file_path, decoded).map_err(|e| {
        AppError::InternalError(format!("Failed to write image to file: {}", e))
    })?;

    debug!("Successfully exported plot to {}", file_path);
    Ok(file_path)
}

/// Plot ribbon export command (Task 3 stub).
/// NOTE: Native save dialog wiring will be finalized in cleanup pass.
#[tauri::command]
pub async fn plot_export(format: String, _app_handle: AppHandle) -> Result<Option<String>, AppError> {
    let fmt = format.to_lowercase();
    if !matches!(fmt.as_str(), "png" | "svg" | "pdf") {
        return Err(AppError::ValidationError(format!("Unsupported plot export format: {}", format)));
    }

    debug!("PlotCmd: plot_export requested for format={} (stub)", fmt);
    Ok(None)
}

/// Plot ribbon new figure command (Task 3 stub).
#[tauri::command]
pub async fn new_figure() -> Result<(), AppError> {
    debug!("PlotCmd: new_figure called (stub)");
    Ok(())
}
