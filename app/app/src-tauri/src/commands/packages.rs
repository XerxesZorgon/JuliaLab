use log::{debug, error};
use tauri::State;
use serde::{Deserialize, Serialize};

use crate::error::AppError;
use crate::state::AppState;

#[tauri::command]
pub async fn get_julia_package_status(app_state: State<'_, AppState>) -> Result<serde_json::Value, AppError> {
    debug!("[Packages] Getting Julia package status");
    let code = r#"
        try
            local Pkg = Base.require(Base.PkgId(Base.UUID("44cfe95a-1eb2-52ea-b672-e2afdf69b78f"), "Pkg"))
            local JSON = Base.require(Base.PkgId(Base.UUID("682c06a0-de6a-54ab-a142-c8b1cf79cde6"), "JSON"))

            current_project = Pkg.project()
            deps = Pkg.dependencies()
            direct_deps = Set{String}()

            try
                project_toml = Pkg.TOML.parsefile(joinpath(dirname(current_project.path), "Project.toml"))
                if haskey(project_toml, "deps")
                    for (name, _uuid) in project_toml["deps"]
                        push!(direct_deps, name)
                    end
                end
            catch
            end

            packages = []
            for (uuid, dep) in deps
                push!(packages, Dict(
                    "name" => dep.name,
                    "version" => string(dep.version),
                    "uuid" => string(uuid),
                    "description" => nothing,
                    "is_direct" => dep.name in direct_deps
                ))
            end

            JSON.json(Dict("packages" => packages, "active_project" => current_project.path))
        catch e
            # If JSON didn't load either, return a plain-text fallback that Rust can detect
            "{\"packages\":[], \"active_project\":null, \"error\":\"" * replace(string(e), "\"" => "'") * "\"}"
        end
    "#;
    use internals::messages::execution::ExecuteApiRequest;

    // Wrap in a 30-second timeout so the frontend never hangs forever
    let result = tokio::time::timeout(
        std::time::Duration::from_secs(30),
        app_state.actor_system.execution_actor.send(ExecuteApiRequest { code: code.to_string() }),
    ).await;

    let result = match result {
        Ok(actor_result) => actor_result.map_err(|_| AppError::InternalError("Actor comm failed".to_string()))?,
        Err(_) => {
            error!("[Packages] Timed out waiting for Julia package status (30s)");
            return Ok(serde_json::json!({"packages": [], "active_project": null, "error": "Request timed out after 30 seconds"}));
        }
    };

    match result {
        Ok(raw) => {
            let raw = raw.to_string();
            let preview = if raw.len() > 200 { format!("{}…", &raw[..200]) } else { raw.clone() };
            debug!("[Packages] Result preview: {}", preview);
            match serde_json::from_str::<serde_json::Value>(&raw) {
                Ok(json) => {
                    if let Some(pkgs) = json.get("packages").and_then(|p| p.as_array()) {
                        debug!("[Packages] Parsed {} packages", pkgs.len());
                    }
                    Ok(json)
                },
                Err(e) => {
                    error!("[Packages] JSON parse error: {} — raw: {}", e, preview);
                    Ok(serde_json::json!({"packages": [], "active_project": null}))
                },
            }
        },
        Err(e) => {
            error!("[Packages] Julia execution failed: {}", e);
            Ok(serde_json::json!({"packages": [], "active_project": null, "error": e}))
        }
    }
}

#[tauri::command]
pub async fn clean_transitive_dependencies(app_state: State<'_, AppState>) -> Result<(), AppError> {
    debug!("[Packages] Clean transitive dependencies");
    let code = r#"
        try
            # Use local scope to avoid polluting global namespace
            let
                local Pkg = Base.require(Base.PkgId(Base.UUID("44cfe95a-1eb2-52ea-b672-e2afdf69b78f"), "Pkg"))
                
                deps = Pkg.dependencies()
                transitive_packages = []
                direct_deps = Set{String}()
                try
                    current_project = Pkg.project()
                    project_toml = Pkg.TOML.parsefile(joinpath(dirname(current_project.path), "Project.toml"))
                    if haskey(project_toml, "deps")
                        for (name, uuid) in project_toml["deps"]
                            push!(direct_deps, name)
                        end
                    end
                catch e
                end
                for (uuid, dep) in deps
                    if !(dep.name in direct_deps)
                        push!(transitive_packages, dep.name)
                    end
                end
                for pkg in transitive_packages
                    try
                        Pkg.remove(pkg)
                    catch e
                    end
                end
                Pkg.instantiate()
                "Transitive dependencies cleaned successfully"
            end
        catch e
            "Failed to clean transitive dependencies: " * string(e)
        end
    "#;
    use internals::messages::execution::ExecuteApiRequest;
    let result = tokio::time::timeout(
        std::time::Duration::from_secs(60),
        app_state.actor_system.execution_actor.send(ExecuteApiRequest { code: code.to_string() }),
    ).await;
    let result = match result {
        Ok(actor_result) => actor_result.map_err(|_| AppError::InternalError("Actor comm failed".to_string()))?,
        Err(_) => return Err(AppError::InternalError("Timed out after 60 seconds".to_string())),
    };
    match result {
        Ok(r) => if r.contains("cleaned successfully") { Ok(()) } else { Err(AppError::InternalError(r)) },
        Err(e) => Err(AppError::InternalError(format!("Failed to clean transitive dependencies: {}", e))),
    }
}

#[tauri::command]
pub async fn search_julia_packages(query: String, app_state: State<'_, AppState>) -> Result<serde_json::Value, AppError> {
    debug!("[Packages] Search Julia packages: {}", query);
    let code = format!(r#"
        try
            # Use local scope to avoid polluting global namespace
            let
                local Pkg = Base.require(Base.PkgId(Base.UUID("44cfe95a-1eb2-52ea-b672-e2afdf69b78f"), "Pkg"))
                local JSON = Base.require(Base.PkgId(Base.UUID("682c06a0-de6a-54ab-a142-c8b1cf79cde6"), "JSON"))
                
                # Use Pkg.available() which is more reliable across Julia versions
                available_packages = Pkg.available()
                packages = []
                
                for pkg_name in available_packages
                    pkg_str = string(pkg_name)
                    if occursin("{}", lowercase(pkg_str))
                        push!(packages, Dict(
                            "name" => pkg_str,
                            "description" => "Package available in registry",
                            "version" => "unknown",
                            "uuid" => "unknown"
                        ))
                    end
                end
                
                # Sort by name and limit results
                sort!(packages, by = x -> x["name"])
                packages = packages[1:min(20, length(packages))]
                
                JSON.json(Dict("packages" => packages))
            end
        catch e
            "Failed to search packages: " * string(e)
        end
    "#, query);
    use internals::messages::execution::ExecuteApiRequest;
    match app_state.actor_system.execution_actor.send(ExecuteApiRequest { code }).await.map_err(|_| AppError::InternalError("Actor comm failed".to_string()))? {
        Ok(result) => match serde_json::from_str::<serde_json::Value>(&result) {
            Ok(v) => Ok(v),
            Err(_) => Ok(serde_json::json!({"packages":[]})),
        },
        Err(_) => Ok(serde_json::json!({"packages":[]})),
    }
}

#[tauri::command]
pub async fn run_julia_pkg_command(command: String, app_state: State<'_, AppState>) -> Result<String, AppError> {
    debug!("[Packages] Run pkg command: {}", command);
    let code = format!(r#"
        try
            # Use local scope to avoid polluting global namespace
            let
                local Pkg = Base.require(Base.PkgId(Base.UUID("44cfe95a-1eb2-52ea-b672-e2afdf69b78f"), "Pkg"))
                local JSON = Base.require(Base.PkgId(Base.UUID("682c06a0-de6a-54ab-a142-c8b1cf79cde6"), "JSON"))
                
                # Execute package operations directly
                
                cmd_parts = split("{}", " ")
                operation = cmd_parts[1]
                package_name = length(cmd_parts) > 1 ? cmd_parts[2] : ""
                
                # Execute package operations
                if operation == "add" && !isempty(package_name)
                    Pkg.add(package_name)
                    result = Dict("success" => true, "message" => "Successfully added package: " * package_name, "stdout" => "Package added successfully", "stderr" => "")
                elseif (operation == "remove" || operation == "rm") && !isempty(package_name)
                    Pkg.rm(package_name)
                    result = Dict("success" => true, "message" => "Successfully removed package: " * package_name, "stdout" => "Package removed successfully", "stderr" => "")
                elseif operation == "update"
                    Pkg.update()
                    result = Dict("success" => true, "message" => "Successfully updated packages", "stdout" => "Packages updated successfully", "stderr" => "")
                elseif operation == "instantiate"
                    Pkg.instantiate()
                    result = Dict("success" => true, "message" => "Successfully instantiated project", "stdout" => "Project instantiated successfully", "stderr" => "")
                else
                    result = Dict("success" => false, "message" => "Unknown or invalid command: " * "{}", "stdout" => "", "stderr" => "Invalid command")
                end
                
                
                JSON.json(result)
            end
        catch e
            "{{\"success\":false,\"message\":\"" * replace(string(e), "\"" => "'") * "\",\"stdout\":\"\",\"stderr\":\"\"}}"
        end
    "#, command, command);
    use internals::messages::execution::ExecuteApiRequest;
    let result = tokio::time::timeout(
        std::time::Duration::from_secs(120),
        app_state.actor_system.execution_actor.send(ExecuteApiRequest { code }),
    ).await;
    let result = match result {
        Ok(actor_result) => actor_result.map_err(|_| AppError::InternalError("Actor comm failed".to_string()))?,
        Err(_) => return Err(AppError::InternalError("Pkg command timed out after 120 seconds".to_string())),
    };
    match result {
        Ok(r) => Ok(r),
        Err(e) => Err(AppError::InternalError(format!("Failed to execute Pkg command: {}", e))),
    }
}

// ============================================================================
// SearchPackages Integration
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchPackagesResult {
    pub name: String,
    pub uuid: String,
    pub repository_url: Option<String>,
    pub description: Option<String>,
    pub stars: Option<u32>,
    pub topics: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchPackagesResponse {
    pub packages: Vec<SearchPackagesResult>,
    pub total: usize,
    pub query: String,
}
