// Connection management for CommunicationActor
// Handles connecting to and disconnecting from Julia named pipes

use crate::services::events::EventService;
use actix::prelude::*;
use log::{debug, error, trace};
use std::io::BufRead;
use std::sync::Arc;
use tokio::sync::mpsc;
use tokio::sync::Mutex;

#[cfg(not(unix))]
use interprocess::local_socket::{prelude::*, GenericNamespaced};

use super::state::{State, LocalSocketStream};
use super::io_operations;
use super::message_handler;

/// Connect to Julia's named pipes
pub async fn connect_to_pipes(
    state: &State,
    to_julia_pipe: String,
    from_julia_pipe: String,
) -> Result<mpsc::Sender<crate::messages::JuliaMessage>, String> {
    debug!(
        "[CommunicationActor::Connection] Connecting to pipes - To Julia: {}, From Julia: {}",
        to_julia_pipe, from_julia_pipe
    );

    // Check if we're trying to connect to different pipes than we're currently connected to
    let current_to_julia_pipe = state.to_julia_pipe_name.lock().await.clone();
    let current_from_julia_pipe = state.from_julia_pipe_name.lock().await.clone();
    
    // If pipe names don't match, we need to disconnect first
    if !current_to_julia_pipe.is_empty() && current_to_julia_pipe != to_julia_pipe {
        debug!("[CommunicationActor::Connection] Pipe names changed (to_julia: {} -> {}), disconnecting old connection", current_to_julia_pipe, to_julia_pipe);
        let _ = disconnect_from_pipes(state).await;
    }
    if !current_from_julia_pipe.is_empty() && current_from_julia_pipe != from_julia_pipe {
        debug!("[CommunicationActor::Connection] Pipe names changed (from_julia: {} -> {}), disconnecting old connection", current_from_julia_pipe, from_julia_pipe);
        let _ = disconnect_from_pipes(state).await;
    }
    
    // Idempotency/race guards - allow reconnection if only partially connected
    let is_fully_connected = {
        let code_connected = {
            let code_stream_guard = state.code_stream.lock().await;
            code_stream_guard.is_some()
        };
        let from_julia_connected = {
            let from_julia_read_stream_guard = state.from_julia_read_stream.lock().await;
            from_julia_read_stream_guard.is_some()
        };
        code_connected && from_julia_connected
    };
    
    // Only skip if we're already connected to the SAME pipes
    if *state.is_connected.lock().await && is_fully_connected && current_to_julia_pipe == to_julia_pipe && current_from_julia_pipe == from_julia_pipe {
        debug!("[CommunicationActor::Connection] Already fully connected to the same pipes; skipping connect_to_pipes");
        return Err("Already connected".to_string());
    }
    
    // If we're only partially connected, allow reconnection to complete it
    if *state.is_connected.lock().await && !is_fully_connected {
        debug!("[CommunicationActor::Connection] Partially connected, attempting to complete connection");
    }
    {
        let mut connecting = state.is_connecting.lock().await;
        if *connecting {
            debug!("[CommunicationActor::Connection] Connection in progress; skipping new connect_to_pipes call");
            return Err("Connection in progress".to_string());
        }
        *connecting = true;
    }

    // Update pipe names using interior mutability
    {
        let mut to_julia_pipe_name_guard = state.to_julia_pipe_name.lock().await;
        *to_julia_pipe_name_guard = to_julia_pipe;
    }
    {
        let mut from_julia_pipe_name_guard = state.from_julia_pipe_name.lock().await;
        *from_julia_pipe_name_guard = from_julia_pipe;
    }

    // Initialize message sending channel
    let (tx, rx) = mpsc::channel::<crate::messages::JuliaMessage>(100);

    // Start the message sender task (before connection)
    io_operations::start_message_sender_task(state, rx).await;

    // Connect to Julia's named pipes
    let connect_result = connect_to_julia_pipes(state).await;

    // Set connected flag since connections are established
    {
        // Clear connecting flag
        let mut connecting = state.is_connecting.lock().await;
        *connecting = false;
    }

    // Propagate error if connection failed
    connect_result?;

    // Only set is_connected to true if both pipes are connected
    let code_connected = {
        let code_stream_guard = state.code_stream.lock().await;
        code_stream_guard.is_some()
    };
    let from_julia_connected = {
        let from_julia_read_stream_guard = state.from_julia_read_stream.lock().await;
        from_julia_read_stream_guard.is_some()
    };
    
    let mut is_connected_guard = state.is_connected.lock().await;
    if code_connected && from_julia_connected {
        *is_connected_guard = true;
        debug!("[CommunicationActor::Connection] Both pipes connected - marking as fully connected");
    } else {
        debug!("[CommunicationActor::Connection] Partial connection: code={}, from_julia={}", code_connected, from_julia_connected);
        // Don't set is_connected to true yet - allow another call to complete the connection
    }

    // No need for a TO_JULIA pipe reader - Julia sends all responses through FROM_JULIA pipe
    // The FROM_JULIA pipe reader is already started in connect_to_julia_pipes()

    debug!("[CommunicationActor::Connection] Successfully connected to Julia pipes");
    Ok(tx)
}

/// Disconnect from Julia's named pipes
pub async fn disconnect_from_pipes(state: &State) -> Result<(), String> {
    debug!("[CommunicationActor::Connection] Disconnecting from pipes");

    // Close code stream
    let mut code_stream_guard = state.code_stream.lock().await;
    *code_stream_guard = None;

    // Close code connection (for backward compatibility)
    let mut code_guard = state.code_connection.lock().await;
    *code_guard = None;

    // Close from_julia read stream
    let mut from_julia_read_guard = state.from_julia_read_stream.lock().await;
    debug!("[CommunicationActor::Connection] Closing from_julia read stream");
    *from_julia_read_guard = None;

    // Close plot connection
    let mut plot_guard = state.plot_connection.lock().await;
    *plot_guard = None;

    // Update connection status
    let mut is_connected_guard = state.is_connected.lock().await;
    *is_connected_guard = false;

    debug!("[CommunicationActor::Connection] Successfully disconnected from pipes");
    Ok(())
}

/// Connect to Julia pipe (for sending data TO Julia)
pub async fn connect_to_julia_pipe(state: &State, to_julia_pipe: String) -> Result<mpsc::Sender<crate::messages::JuliaMessage>, String> {
    debug!("[CommunicationActor::Connection] [PIPE_CONNECT] Starting connection to Julia pipe (to_julia): '{}'", to_julia_pipe);
    
    // Update to_julia pipe name
    {
        let mut to_julia_pipe_name_guard = state.to_julia_pipe_name.lock().await;
        *to_julia_pipe_name_guard = to_julia_pipe.clone();
    }
    
    // Check if to_julia pipe is already connected
    let to_julia_already_connected = {
        let code_stream_guard = state.code_stream.lock().await;
        code_stream_guard.is_some()
    };
    
    if to_julia_already_connected {
        debug!("[CommunicationActor::Connection] To Julia pipe already connected, skipping");
        // Return existing message sender if available
        let sender_guard = state.message_sender.lock().await;
        if let Some(sender) = sender_guard.as_ref() {
            return Ok(sender.clone());
        }
        // If no sender, create a new one
    }
    
    // Initialize message sending channel if not already initialized
    let message_sender = {
        let sender_guard = state.message_sender.lock().await;
        if let Some(sender) = sender_guard.as_ref() {
            sender.clone()
        } else {
            drop(sender_guard);
            // Create new channel
            let (tx, rx) = mpsc::channel::<crate::messages::JuliaMessage>(100);
            // Start the message sender task
            io_operations::start_message_sender_task(state, rx).await;
            // Store the sender
            {
                let mut sender_guard = state.message_sender.lock().await;
                *sender_guard = Some(tx.clone());
            }
            tx
        }
    };
    
    let to_julia_pipe_name = state.to_julia_pipe_name.clone();
    let code_stream = state.code_stream.clone();
    
    let code_connect_result = tokio::task::spawn_blocking(move || {
        let pipe_name = to_julia_pipe_name.blocking_lock().clone();
        debug!("[CommunicationActor::Connection] Attempting to connect to Julia pipe (to_julia) '{}' (max 30 attempts)", pipe_name);

        #[cfg(unix)]
        {
            let socket_path = format!("/tmp/{}", pipe_name);
            debug!("[CommunicationActor::Connection] Using filesystem socket path: {}", socket_path);
            if std::path::Path::new(&socket_path).exists() {
                debug!("[CommunicationActor::Connection] Socket file exists at: {}", socket_path);
            } else {
                debug!("[CommunicationActor::Connection] Socket file NOT found at: {} (may not be ready yet)", socket_path);
            }
            let stream = connect_with_retry(
                || LocalSocketStream::connect(&socket_path)
                    .map_err(|e| format!("To Julia pipe '{}' not ready: {}", pipe_name, e)),
                30,
                std::time::Duration::from_millis(200),
            ).map_err(|e| {
                error!("[CommunicationActor::Connection] Failed to connect to Julia pipe (to_julia) '{}' after 30 attempts", pipe_name);
                e
            })?;
            debug!("[CommunicationActor::Connection] Successfully connected to Julia pipe (to_julia) '{}'", pipe_name);
            *code_stream.blocking_lock() = Some(stream);
            Ok(())
        }

        #[cfg(not(unix))]
        {
            // Validate namespace name once so invalid names fail fast without consuming retries.
            pipe_name.clone().to_ns_name::<GenericNamespaced>()
                .map_err(|e| format!("Failed to create namespace name for to_julia pipe '{}': {}", pipe_name, e))?;
            let pipe_name_c = pipe_name.clone();
            let stream = connect_with_retry(
                || {
                    let ns = pipe_name_c.clone().to_ns_name::<GenericNamespaced>()
                        .map_err(|e| format!("to_ns_name '{}': {}", pipe_name_c, e))?;
                    LocalSocketStream::connect(ns)
                        .map_err(|e| format!("To Julia pipe '{}' not ready: {}", pipe_name_c, e))
                },
                30,
                std::time::Duration::from_millis(200),
            ).map_err(|e| {
                error!("[CommunicationActor::Connection] Failed to connect to Julia pipe (to_julia) '{}' after 30 attempts", pipe_name);
                e
            })?;
            debug!("[CommunicationActor::Connection] Successfully connected to Julia pipe (to_julia) '{}' after 30 attempts", pipe_name);
            *code_stream.blocking_lock() = Some(stream);
            Ok(())
        }
    }).await;
    
    match code_connect_result {
        Ok(Ok(_)) => {
            debug!("[CommunicationActor::Connection] To Julia pipe connection successful");
            Ok(message_sender)
        }
        Ok(Err(e)) => {
            error!("[CommunicationActor::Connection] To Julia pipe connection failed: {}", e);
            Err(e)
        }
        Err(e) => {
            error!("[CommunicationActor::Connection] To Julia pipe connection task failed: {}", e);
            Err(format!("To Julia pipe connection task failed: {}", e))
        }
    }
}

/// Connect from Julia pipe (for receiving data FROM Julia)
pub async fn connect_from_julia_pipe(state: &State, from_julia_pipe: String) -> Result<(), String> {
    debug!("[CommunicationActor::Connection] [PIPE_CONNECT] Starting connection from Julia pipe (from_julia): '{}'", from_julia_pipe);
    
    // Update from_julia pipe name
    {
        let mut from_julia_pipe_name_guard = state.from_julia_pipe_name.lock().await;
        *from_julia_pipe_name_guard = from_julia_pipe.clone();
    }
    
    // Check if from_julia pipe is already connected
    let from_julia_already_connected = {
        let from_julia_read_stream_guard = state.from_julia_read_stream.lock().await;
        from_julia_read_stream_guard.is_some()
    };
    
    if from_julia_already_connected {
        debug!("[CommunicationActor::Connection] From Julia pipe already connected, skipping");
        return Ok(());
    }
    
    let from_julia_pipe_name = state.from_julia_pipe_name.clone();
    let from_julia_read_stream = state.from_julia_read_stream.clone();
    let from_julia_read_stream_for_reader = state.from_julia_read_stream.clone();
    let event_manager = state.event_manager.clone();
    let pending_requests_clone = state.pending_requests.clone();
    let process_actor_for_reader = {
        let process_actor_guard = state.process_actor.lock().await;
        process_actor_guard.clone()
    };
    let plot_actor = {
        let plot_actor_guard = state.plot_actor.lock().await;
        plot_actor_guard.clone()
    };
    
    let plot_connect_result = tokio::task::spawn_blocking(move || {
        let pipe_name = from_julia_pipe_name.blocking_lock().clone();
        debug!("[CommunicationActor::Connection] Attempting to connect from Julia pipe (from_julia) '{}' (max 30 attempts)", pipe_name);

        #[cfg(unix)]
        {
            let socket_path = format!("/tmp/{}", pipe_name);
            debug!("[CommunicationActor::Connection] Using filesystem socket path for from_julia: {}", socket_path);
            if std::path::Path::new(&socket_path).exists() {
                debug!("[CommunicationActor::Connection] From_julia socket file exists at: {}", socket_path);
            } else {
                debug!("[CommunicationActor::Connection] From_julia socket file NOT found at: {} (may not be ready yet)", socket_path);
            }
            let stream = connect_with_retry(
                || LocalSocketStream::connect(&socket_path)
                    .map_err(|e| format!("From Julia pipe '{}' not ready: {}", pipe_name, e)),
                30,
                std::time::Duration::from_millis(200),
            ).map_err(|e| {
                error!("[CommunicationActor::Connection] Failed to connect from Julia pipe (from_julia) '{}' after 30 attempts", pipe_name);
                e
            })?;
            debug!("[CommunicationActor::Connection] Successfully connected from Julia pipe (from_julia) '{}'", pipe_name);
            *from_julia_read_stream.blocking_lock() = Some(stream);
            Ok(())
        }

        #[cfg(not(unix))]
        {
            // Validate namespace name once so invalid names fail fast without consuming retries.
            pipe_name.clone().to_ns_name::<GenericNamespaced>()
                .map_err(|e| format!("Failed to create namespace name for from_julia pipe '{}': {}", pipe_name, e))?;
            let pipe_name_c = pipe_name.clone();
            let stream = connect_with_retry(
                || {
                    let ns = pipe_name_c.clone().to_ns_name::<GenericNamespaced>()
                        .map_err(|e| format!("to_ns_name '{}': {}", pipe_name_c, e))?;
                    LocalSocketStream::connect(ns)
                        .map_err(|e| format!("From Julia pipe '{}' not ready: {}", pipe_name_c, e))
                },
                30,
                std::time::Duration::from_millis(200),
            ).map_err(|e| {
                error!("[CommunicationActor::Connection] Failed to connect from Julia pipe (from_julia) '{}' after 30 attempts", pipe_name);
                e
            })?;
            debug!("[CommunicationActor::Connection] Successfully connected from Julia pipe (from_julia) '{}' after 30 attempts", pipe_name);
            *from_julia_read_stream.blocking_lock() = Some(stream);
            Ok(())
        }
    }).await;
    
    match plot_connect_result {
        Ok(Ok(_)) => {
            debug!("[CommunicationActor::Connection] From Julia pipe connection successful");
            
            // Start the plot data reader after connection is established (only once)
            tokio::spawn(async move {
                debug!("[CommunicationActor::Connection] Starting plot data reader after connection");
                read_from_julia_messages(&from_julia_read_stream_for_reader, &event_manager, &pending_requests_clone, plot_actor, process_actor_for_reader).await;
            });
            
            Ok(())
        }
        Ok(Err(e)) => {
            error!("[CommunicationActor::Connection] From Julia pipe connection failed: {}", e);
            Err(e)
        }
        Err(e) => {
            error!("[CommunicationActor::Connection] From Julia pipe connection task failed: {}", e);
            Err(format!("From Julia pipe connection task failed: {}", e))
        }
    }
}

/// Connect to Julia's named pipes with retry logic
/// Attempts to connect to pipes individually - will skip pipes that are already connected
async fn connect_to_julia_pipes(state: &State) -> Result<(), String> {
    debug!("[CommunicationActor::Connection] Connecting to Julia pipes");

    // Get pipe names for debugging
    let to_julia_pipe_name_debug = state.to_julia_pipe_name.lock().await.clone();
    let from_julia_pipe_name_debug = state.from_julia_pipe_name.lock().await.clone();
    debug!(
        "[CommunicationActor::Connection] To Julia pipe name: '{}'",
        to_julia_pipe_name_debug
    );
    debug!(
        "[CommunicationActor::Connection] From Julia pipe name: '{}'",
        from_julia_pipe_name_debug
    );

    // Check if code pipe is already connected
    let code_already_connected = {
        let code_stream_guard = state.code_stream.lock().await;
        code_stream_guard.is_some()
    };

    // Connect to to_julia pipe if not already connected
    if !code_already_connected {
        let to_julia_pipe_name = state.to_julia_pipe_name.clone();
        let code_stream = state.code_stream.clone();

        let code_connect_result = tokio::task::spawn_blocking(move || -> Result<(), String> {
            let pipe_name = to_julia_pipe_name.blocking_lock().clone();
            debug!("[CommunicationActor::Connection] Attempting to connect to Julia pipe (to_julia) '{}' (max 30 attempts)", pipe_name);

            #[cfg(unix)]
            {
                let socket_path = format!("/tmp/{}", pipe_name);
                let stream = connect_with_retry(
                    || LocalSocketStream::connect(&socket_path)
                        .map_err(|e| format!("To Julia pipe '{}' not ready: {}", pipe_name, e)),
                    30,
                    std::time::Duration::from_millis(200),
                ).map_err(|e| {
                    error!("[CommunicationActor::Connection] Failed to connect to Julia pipe (to_julia) '{}' after 30 attempts", pipe_name);
                    e
                })?;
                debug!("[CommunicationActor::Connection] Successfully connected to Julia pipe (to_julia) '{}'", pipe_name);
                *code_stream.blocking_lock() = Some(stream);
                Ok(())
            }

            #[cfg(not(unix))]
            {
                pipe_name.clone().to_ns_name::<GenericNamespaced>()
                    .map_err(|e| format!("Failed to create namespace name for to_julia pipe: {}", e))?;
                let pipe_name_c = pipe_name.clone();
                let stream = connect_with_retry(
                    || {
                        let ns = pipe_name_c.clone().to_ns_name::<GenericNamespaced>()
                            .map_err(|e| format!("to_ns_name '{}': {}", pipe_name_c, e))?;
                        LocalSocketStream::connect(ns)
                            .map_err(|e| format!("To Julia pipe '{}' not ready: {}", pipe_name_c, e))
                    },
                    30,
                    std::time::Duration::from_millis(200),
                ).map_err(|e| {
                    error!("[CommunicationActor::Connection] Failed to connect to Julia pipe (to_julia) '{}' after 30 attempts", pipe_name);
                    e
                })?;
                debug!("[CommunicationActor::Connection] Successfully connected to Julia pipe (to_julia) '{}' after 30 attempts", pipe_name);
                *code_stream.blocking_lock() = Some(stream);
                Ok(())
            }
        }).await;

        match code_connect_result {
            Ok(Ok(_)) => {
                debug!("[CommunicationActor::Connection] To Julia pipe connection successful");
            }
            Ok(Err(e)) => {
                debug!("[CommunicationActor::Connection] To Julia pipe connection not ready: {}", e);
                // Don't fail - from_julia pipe might connect later
            }
            Err(e) => {
                error!(
                    "[CommunicationActor::Connection] To Julia pipe connection task failed: {}",
                    e
                );
                // Don't fail - try from_julia pipe anyway
            }
        }
    } else {
        debug!("[CommunicationActor::Connection] To Julia pipe already connected, skipping");
    }

    // Check if from_julia pipe is already connected
    let from_julia_already_connected = {
        let from_julia_read_stream_guard = state.from_julia_read_stream.lock().await;
        from_julia_read_stream_guard.is_some()
    };

    // Connect to from_julia pipe if not already connected
    if !from_julia_already_connected {
        let from_julia_pipe_name = state.from_julia_pipe_name.clone();
        let from_julia_read_stream = state.from_julia_read_stream.clone();

        let plot_connect_result = tokio::task::spawn_blocking(move || -> Result<(), String> {
            let pipe_name = from_julia_pipe_name.blocking_lock().clone();
            debug!("[CommunicationActor::Connection] Attempting to connect from Julia pipe (from_julia) '{}' (max 30 attempts)", pipe_name);

            #[cfg(unix)]
            {
                let socket_path = format!("/tmp/{}", pipe_name);
                let stream = connect_with_retry(
                    || LocalSocketStream::connect(&socket_path)
                        .map_err(|e| format!("From Julia pipe '{}' not ready: {}", pipe_name, e)),
                    30,
                    std::time::Duration::from_millis(200),
                ).map_err(|e| {
                    error!("[CommunicationActor::Connection] Failed to connect from Julia pipe (from_julia) '{}' after 30 attempts", pipe_name);
                    e
                })?;
                debug!("[CommunicationActor::Connection] Successfully connected from Julia pipe (from_julia) '{}'", pipe_name);
                *from_julia_read_stream.blocking_lock() = Some(stream);
                Ok(())
            }

            #[cfg(not(unix))]
            {
                pipe_name.clone().to_ns_name::<GenericNamespaced>()
                    .map_err(|e| format!("Failed to create namespace name for from_julia pipe: {}", e))?;
                let pipe_name_c = pipe_name.clone();
                let stream = connect_with_retry(
                    || {
                        let ns = pipe_name_c.clone().to_ns_name::<GenericNamespaced>()
                            .map_err(|e| format!("to_ns_name '{}': {}", pipe_name_c, e))?;
                        LocalSocketStream::connect(ns)
                            .map_err(|e| format!("From Julia pipe '{}' not ready: {}", pipe_name_c, e))
                    },
                    30,
                    std::time::Duration::from_millis(200),
                ).map_err(|e| {
                    error!("[CommunicationActor::Connection] Failed to connect from Julia pipe (from_julia) '{}' after 30 attempts", pipe_name);
                    e
                })?;
                debug!("[CommunicationActor::Connection] Successfully connected from Julia pipe (from_julia) '{}' after 30 attempts", pipe_name);
                *from_julia_read_stream.blocking_lock() = Some(stream);
                Ok(())
            }
        }).await;

        match plot_connect_result {
            Ok(Ok(_)) => {
                debug!("[CommunicationActor::Connection] from_julia pipe connection successful");

                // Start the from_julia message reader after connection is established (only once)
                let from_julia_read_stream = state.from_julia_read_stream.clone();
                let event_manager = state.event_manager.clone();
                let pending_requests_clone = state.pending_requests.clone();
                let process_actor_for_reader = {
                    let process_actor_guard = state.process_actor.lock().await;
                    process_actor_guard.clone()
                };
                let plot_actor = {
                    let plot_actor_guard = state.plot_actor.lock().await;
                    plot_actor_guard.clone()
                };
                // Check if reader is already running (avoid multiple readers)
                // For now, just spawn - we'll track this better if needed
                tokio::spawn(async move {
                    debug!("[CommunicationActor::Connection] Starting from_julia message reader after connection");
                    read_from_julia_messages(&from_julia_read_stream, &event_manager, &pending_requests_clone, plot_actor, process_actor_for_reader).await;
                });
            }
            Ok(Err(e)) => {
                debug!("[CommunicationActor::Connection] From Julia pipe connection not ready: {}", e);
                // Don't fail - this is expected if called before FROM_JULIA_PIPE_READY
            }
            Err(e) => {
                error!(
                    "[CommunicationActor::Connection] From Julia pipe connection task failed: {}",
                    e
                );
                // Don't fail - this is expected if called before FROM_JULIA_PIPE_READY
            }
        }
    } else {
        debug!("[CommunicationActor::Connection] From Julia pipe already connected, skipping");
    }

    // Check if both pipes are connected to determine overall connection status
    let to_julia_connected = {
        let code_stream_guard = state.code_stream.lock().await;
        code_stream_guard.is_some()
    };
    let from_julia_connected = {
        let from_julia_read_stream_guard = state.from_julia_read_stream.lock().await;
        from_julia_read_stream_guard.is_some()
    };

    if to_julia_connected && from_julia_connected {
        debug!("[CommunicationActor::Connection] Both pipes connected successfully");
    } else {
        // Partial connection is OK - we'll complete when the other pipe is ready
        debug!("[CommunicationActor::Connection] Partial connection: to_julia={}, from_julia={}", to_julia_connected, from_julia_connected);
    }

    Ok(())
}

/// Synchronous retry helper for named-pipe connection attempts.
/// MUST be called inside `tokio::task::spawn_blocking` — `std::thread::sleep` would
/// block an async worker thread if called from `tokio::task::spawn`.
/// Validate namespace names (e.g. `to_ns_name`) *before* calling this so that
/// invalid-name errors fail fast without consuming retries.
fn connect_with_retry<S>(
    mut connect: impl FnMut() -> Result<S, String>,
    max_attempts: u32,
    delay: std::time::Duration,
) -> Result<S, String> {
    let mut last_err = String::new();
    for attempt in 1..=max_attempts {
        match connect() {
            Ok(s) => return Ok(s),
            Err(e) => {
                debug!(
                    "[CommunicationActor::Connection] connect_with_retry: attempt {}/{} failed: {}",
                    attempt, max_attempts, e
                );
                last_err = e;
                if attempt < max_attempts {
                    std::thread::sleep(delay);
                }
            }
        }
    }
    Err(last_err)
}

/// Read messages from Julia via the from_julia pipe
/// This pipe carries all messages from Julia to Rust: plot data, execution responses, etc.
#[allow(clippy::type_complexity)]
async fn read_from_julia_messages(
    from_julia_read_stream: &Arc<Mutex<Option<LocalSocketStream>>>,
    event_manager: &EventService,
    pending_requests: &Arc<Mutex<std::collections::HashMap<String, (tokio::sync::oneshot::Sender<crate::messages::JuliaMessage>, bool)>>>,
    plot_actor: Option<Addr<crate::actors::PlotActor>>,
    process_actor: Option<Addr<crate::actors::ProcessActor>>,
) {
    debug!("[CommunicationActor::Connection] Starting from_julia message reader");

    loop {
        // Check if we have a from_julia read stream available
        let has_stream = {
            let from_julia_read_stream_guard = from_julia_read_stream.lock().await;
            from_julia_read_stream_guard.is_some()
        };

        if has_stream {
            // Use blocking I/O for reading without timeout
            let read_result = tokio::task::spawn_blocking({
                let from_julia_read_stream = from_julia_read_stream.clone();
                move || {
                    // Get the stream in the blocking context
                    let mut from_julia_read_stream_guard = from_julia_read_stream.blocking_lock();
                    if let Some(stream) = from_julia_read_stream_guard.as_mut() {
                        let mut buffer = String::new();
                        let mut reader = std::io::BufReader::new(stream);
                        
                        // Simple read_line without timeout - will return 0 bytes if no data
                        let read_result = reader.read_line(&mut buffer);
                        
                        read_result.map(|bytes_read| (bytes_read, buffer))
                    } else {
                        Err(std::io::Error::new(std::io::ErrorKind::NotConnected, "No from_julia stream available"))
                    }
                }
            }).await;

            match read_result {
                Ok(Ok((bytes_read, buffer))) => {
                    if bytes_read == 0 {
                        // No data available, wait before trying again to avoid busy waiting
                        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
                        continue;
                    }

                    if !buffer.trim().is_empty() {
                        trace!(
                            "[CommunicationActor::Connection] Received message from Julia (size: {} bytes)",
                            buffer.len()
                        );

                        // Parse and handle the message
                        match serde_json::from_str::<crate::messages::JuliaMessage>(buffer.trim()) {
                            Ok(message) => {
                                trace!("[CommunicationActor::Connection] Successfully parsed message from Julia");
                                trace!(
                                    "[CommunicationActor::Connection] Message type: {:?}",
                                    std::mem::discriminant(&message)
                                );
                                
                                // Handle the message using the message handler
                                let handler = message_handler::MessageHandler::new(
                                    event_manager.clone(),
                                    plot_actor.clone(),
                                    process_actor.clone(),
                                );
                                
                                // Pass the pending_requests so responses can be matched with pending requests
                                if let Err(e) = handler.handle_julia_message(&message, pending_requests).await {
                                    error!("[CommunicationActor::Connection] Failed to handle message from Julia: {}", e);
                                }
                            }
                            Err(e) => {
                                error!("[CommunicationActor::Connection] Failed to parse message from Julia: {} (raw: {})", e, buffer.trim());
                                debug!(
                                    "[CommunicationActor::Connection] Parse error details: {}",
                                    e
                                );
                            }
                        }
                    } else {
                        debug!("[CommunicationActor::Connection] Received empty buffer from Julia");
                    }
                }
                Ok(Err(e)) => {
                    // Check for broken pipe errors
                    let is_broken_pipe = matches!(
                        e.kind(),
                        std::io::ErrorKind::BrokenPipe
                            | std::io::ErrorKind::ConnectionReset
                            | std::io::ErrorKind::ConnectionAborted
                    );
                    
                    if is_broken_pipe {
                        // Pipe is broken - emit system error
                        let elapsed = crate::app_time::get_app_start_time().elapsed();
                        error!(
                            "[CommunicationActor::Connection] from_julia pipe connection broken after {:.2}s since app start: {}",
                            elapsed.as_secs_f64(),
                            e
                        );
                        let error_msg = "The connection to Julia has been lost. Please restart JuliaLab to reconnect.";
                        if let Err(emit_err) = event_manager.emit_system_error(error_msg).await {
                            error!("[CommunicationActor::Connection] Failed to emit system error: {}", emit_err);
                        }
                        break;
                    } else if e.kind() == std::io::ErrorKind::UnexpectedEof {
                        // EOF - connection closed by Julia
                        debug!("[CommunicationActor::Connection] from_julia connection closed by Julia (EOF)");
                        break;
                    } else {
                        error!("[CommunicationActor::Connection] Error reading from from_julia connection: {}", e);
                        // Break on errors to avoid infinite error loops
                        break;
                    }
                }
                Err(e) => {
                    error!(
                        "[CommunicationActor::Connection] Blocking read task failed: {}",
                        e
                    );
                    // Break on task errors to avoid infinite error loops
                    break;
                }
            }
        } else {
            error!("[CommunicationActor::Connection] No from_julia stream available for reading");
            break;
        }
    }

    debug!("[CommunicationActor::Connection] from_julia message reader ended");
}

#[cfg(test)]
mod tests {
    use super::connect_with_retry;

    /// Regression: the four pipe-connect retry loops must execute inside
    /// `tokio::task::spawn_blocking`, not `tokio::task::spawn`.
    ///
    /// On a `current_thread` runtime there is exactly one async worker thread.
    /// A blocking syscall (e.g. `CreateFile`/`WaitNamedPipe` on Windows) placed
    /// directly inside `tokio::task::spawn(async { blocking_call })` occupies that
    /// single thread — no other async tasks can run until it returns.
    /// `spawn_blocking` offloads to a dedicated blocking-thread pool and keeps the
    /// async worker free.
    ///
    /// This test calls the real production wrapper path
    /// (`spawn_blocking` + `connect_with_retry`) with an injected connect fn that
    /// does `std::thread::sleep(500 ms)` then returns `Err` (simulating WaitNamedPipe).
    /// Three attempts × 500 ms = ≥1 500 ms of blocking on the calling thread.
    /// A concurrent 100 ms async sleep must complete well under 500 ms — proving the
    /// async worker was never stalled.
    ///
    /// If the code ever regresses to `tokio::task::spawn(async { connect_with_retry(...) })`,
    /// the injected blocking sleep occupies the sole async thread, the 100 ms sleep
    /// stalls for ≥500 ms, and the assertion fires.
    #[tokio::test(flavor = "current_thread")]
    async fn connect_retry_does_not_block_runtime() {
        let blocking_task = tokio::task::spawn_blocking(|| {
            // Inject a connect fn that simulates WaitNamedPipe: 500 ms blocking per attempt.
            connect_with_retry(
                || {
                    std::thread::sleep(std::time::Duration::from_millis(500));
                    Err::<(), String>("simulated WaitNamedPipe timeout".to_string())
                },
                3, // 3 attempts × 500 ms = 1 500 ms total blocking
                std::time::Duration::from_millis(1),
            )
        });

        // Must complete in well under 500 ms — spawn_blocking keeps the async thread free.
        let start = std::time::Instant::now();
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        let elapsed = start.elapsed();

        assert!(
            elapsed < std::time::Duration::from_millis(400),
            "Async sleep stalled for {:?} — retry loop is blocking the async worker thread \
             (regression: connect loops must use spawn_blocking, not tokio::task::spawn)",
            elapsed
        );

        // Allow the blocking task to finish (it returns Err, which is expected).
        let _ = blocking_task.await;
    }
}
