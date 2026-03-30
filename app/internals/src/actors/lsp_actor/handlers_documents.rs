// Message handlers for document operations

use actix::prelude::*;
use log::{debug, error};

use crate::messages::lsp::*;
use super::state::LspActorState;

/// Helper type alias used in this module.
type LspHandlerFuture = ResponseActFuture<LspActorState, Result<(), String>>;

impl Handler<NotifyDidOpen> for LspActorState {
    type Result = LspHandlerFuture;

    fn handle(&mut self, msg: NotifyDidOpen, _ctx: &mut Context<Self>) -> Self::Result {
        debug!(
            "LspActor: Document opened - URI: {}, Language: {}",
            msg.uri, msg.language
        );

        let project_path = self.current_project.clone().unwrap_or_default();
        let should_start =
            !self.is_running
            && !project_path.is_empty()
            && (msg.language == "julia" || msg.uri.ends_with(".jl"));
        let lsp_service = self.lsp_service.clone();

        // ── Stage 1: LSP lazy start ───────────────────────────────────────────
        // We need to call `self.start_lsp_server(...)` while we own `&mut self`.
        // `ResponseActFuture` is `Pin<Box<dyn ActorFuture<Self, Output=…>>>` and
        // its inner future must be `'static`.  `start_lsp_server` returns an
        // `impl Future` that borrows `self`, which is *not* `'static`.
        //
        // Solution: spawn the heavy lifting on the Tokio runtime as an
        // independent task by cloning just the service handle (which is already
        // the `Arc`-based `LspService`), and update `self.is_running` etc.
        // immediately here in the synchronous part of `handle`.
        //
        // This matches how other heavy Actix handlers work in this codebase.
        let start_fut: LspHandlerFuture = if should_start {
            debug!("LspActor: Lazy starting LSP for Julia document…");
            // Clone the pieces start_lsp_server needs so we don't hold &mut self.
            let lsp_svc = self.lsp_service.clone();
            let install_actor = self.installation_actor.clone();
            let event_mgr = self.event_manager.clone();
            let orch_actor = self.orchestrator_actor.clone();

            // Mark as running optimistically so re-entrant opens don't re-trigger.
            self.is_running = true;
            self.current_project = Some(project_path.clone());

            Box::pin(actix::fut::wrap_future(async move {
                // Resolve Julia path from InstallationActor before starting
                if let Some(ref ia) = install_actor {
                    use crate::messages::installation::GetJuliaPathFromInstallation;
                    if let Ok(Ok(Some(jp))) = ia.send(GetJuliaPathFromInstallation).await {
                        debug!("LspActor(lazy): Got Julia path: {}", jp);
                        lsp_svc.update_julia_executable(std::path::PathBuf::from(jp));
                    }
                }

                // Emit starting status
                let _ = event_mgr.emit_lsp_status("starting", "Starting Language Server…").await;

                // Kick off the service directly (avoids holding &mut LspActorState).
                let result = lsp_svc.start_lsp_server(project_path).await;

                match &result {
                    Ok(()) => {
                        debug!("LspActor(lazy): LSP service started, emitting readiness events");
                        let _ = event_mgr.emit_lsp_status("ready", "Language Server is ready").await;
                        let _ = event_mgr.emit_lsp_ready().await;

                        // Notify orchestrator
                        if let Some(ref oa) = orch_actor {
                            use crate::messages::coordination::LspReady;
                            let _ = oa.send(LspReady).await;
                        }
                    }
                    Err(e) => {
                        error!("LspActor(lazy): LSP start failed: {}", e);
                        let _ = event_mgr.emit_lsp_status("failed", &format!("LSP start failed: {}", e)).await;
                    }
                }
                result
            }))
        } else {
            Box::pin(actix::fut::ready(Ok(())))
        };

        // ── Stage 2: Notify did_open (always) ────────────────────────────────
        Box::pin(start_fut.then(move |start_res, _act, _| {
            if let Err(e) = start_res {
                error!("LspActor: Failed to lazy-start LSP: {}", e);
            }
            let svc = lsp_service.clone();
            actix::fut::wrap_future(async move {
                svc.notify_did_open(msg.uri, msg.content, msg.language).await
            })
        }))
    }
}

impl Handler<NotifyDidClose> for LspActorState {
    type Result = ResponseActFuture<Self, Result<(), String>>;
    
    fn handle(&mut self, msg: NotifyDidClose, _ctx: &mut Context<Self>) -> Self::Result {
        debug!("LspActor: Document closed - URI: {}", msg.uri);
        let lsp_service = self.lsp_service.clone();
        Box::pin(
            async move {
                lsp_service.notify_did_close(msg.uri).await
            }
            .into_actor(self)
            .map(|res, _actor, _| res)
        )
    }
}

impl Handler<NotifyDidChange> for LspActorState {
    type Result = ResponseActFuture<Self, Result<(), String>>;
    
    fn handle(&mut self, msg: NotifyDidChange, _ctx: &mut Context<Self>) -> Self::Result {
        debug!("LspActor: Document changed - URI: {}", msg.uri);
        let lsp_service = self.lsp_service.clone();
        Box::pin(
            async move {
                lsp_service.notify_did_change(msg.uri, msg.content).await
            }
            .into_actor(self)
            .map(|res, _actor, _| res)
        )
    }
}

impl Handler<NotifyDidSave> for LspActorState {
    type Result = ResponseActFuture<Self, Result<(), String>>;
    
    fn handle(&mut self, msg: NotifyDidSave, _ctx: &mut Context<Self>) -> Self::Result {
        debug!("LspActor: Document saved - URI: {}", msg.uri);
        let lsp_service = self.lsp_service.clone();
        Box::pin(
            async move {
                lsp_service.notify_did_save(msg.uri).await
            }
            .into_actor(self)
            .map(|res, _actor, _| res)
        )
    }
}

impl Handler<UpdateDocument> for LspActorState {
    type Result = ResponseActFuture<Self, Result<(), String>>;
    
    fn handle(&mut self, msg: UpdateDocument, _ctx: &mut Context<Self>) -> Self::Result {
        let lsp_service = self.lsp_service.clone();
        Box::pin(
            async move {
                lsp_service.update_document(msg.uri, msg.content).await
            }
            .into_actor(self)
            .map(|res, _actor, _| res)
        )
    }
}

impl Handler<InvalidateCache> for LspActorState {
    type Result = ResponseActFuture<Self, Result<(), String>>;
    
    fn handle(&mut self, msg: InvalidateCache, _ctx: &mut Context<Self>) -> Self::Result {
        let lsp_service = self.lsp_service.clone();
        Box::pin(
            async move {
                lsp_service.invalidate_cache(msg.uri).await
            }
            .into_actor(self)
            .map(|res, _actor, _| res)
        )
    }
}





















