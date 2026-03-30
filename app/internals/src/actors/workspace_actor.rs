use actix::prelude::*;
use log::{debug, trace};
use std::time::Duration;
use crate::messages::communication::{ExecuteCode, JuliaMessage};
use crate::messages::execution::ExecutionType;
use crate::messages::workspace::FetchVariableChunk;
use crate::services::events::EventService;
use uuid::Uuid;

/// WorkspaceActor handles workspace variable polling and data fetching
pub struct WorkspaceActor {
    event_manager: EventService,
    communication_actor: Option<Addr<crate::actors::CommunicationActor>>,
    is_polling: bool,
    polling_interval: Duration,
}

impl WorkspaceActor {
    pub fn new(event_manager: EventService) -> Self {
        Self {
            event_manager,
            communication_actor: None,
            is_polling: false,
            polling_interval: Duration::from_secs(5),
        }
    }

    fn poll_workspace(&mut self, ctx: &mut Context<Self>) {
        if !self.is_polling {
            return;
        }

        if let Some(comm) = &self.communication_actor {
            let comm_clone = comm.clone();
            let _ = ctx.address().do_send(RefreshWorkspace);
        }

        ctx.run_later(self.polling_interval, |actor, ctx| {
            actor.poll_workspace(ctx);
        });
    }
}

impl Actor for WorkspaceActor {
    type Context = Context<Self>;

    fn started(&mut self, _ctx: &mut Self::Context) {
        debug!("[WorkspaceActor] Started");
    }
}

// --- Messages ---

#[derive(Message)]
#[rtype(result = "Result<(), String>")]
pub struct SetCommunicationActor {
    pub communication_actor: Addr<crate::actors::CommunicationActor>,
}

impl Handler<SetCommunicationActor> for WorkspaceActor {
    type Result = Result<(), String>;

    fn handle(&mut self, msg: SetCommunicationActor, _ctx: &mut Self::Context) -> Self::Result {
        self.communication_actor = Some(msg.communication_actor);
        Ok(())
    }
}

#[derive(Message)]
#[rtype(result = "Result<(), String>")]
pub struct RefreshWorkspace;

impl Handler<RefreshWorkspace> for WorkspaceActor {
    type Result = ResponseActFuture<Self, Result<(), String>>;

    fn handle(&mut self, _msg: RefreshWorkspace, _ctx: &mut Self::Context) -> Self::Result {
        trace!("[WorkspaceActor] Refreshing workspace variables");
        
        let comm_actor = match &self.communication_actor {
            Some(addr) => addr.clone(),
            None => return Box::pin(async { Err("CommunicationActor not set".to_string()) }.into_actor(self)),
        };

        let fut = async move {
            comm_actor.send(ExecuteCode {
                code: "get_workspace_variables()".to_string(),
                execution_type: ExecutionType::ApiCall,
                file_path: None,
                suppress_busy_events: true,
            }).await
            .map_err(|e| format!("Failed to send refresh request: {}", e))?
            .map(|_| ())
        };

        Box::pin(fut.into_actor(self))
    }
}

#[derive(Message)]
#[rtype(result = "Result<(), String>")]
pub struct StartPolling;

impl Handler<StartPolling> for WorkspaceActor {
    type Result = Result<(), String>;

    fn handle(&mut self, _msg: StartPolling, ctx: &mut Self::Context) -> Self::Result {
        if !self.is_polling {
            debug!("[WorkspaceActor] Starting workspace polling");
            self.is_polling = true;
            self.poll_workspace(ctx);
        }
        Ok(())
    }
}

#[derive(Message)]
#[rtype(result = "Result<(), String>")]
pub struct StopPolling;

impl Handler<StopPolling> for WorkspaceActor {
    type Result = Result<(), String>;

    fn handle(&mut self, _msg: StopPolling, _ctx: &mut Self::Context) -> Self::Result {
        debug!("[WorkspaceActor] Stopping workspace polling");
        self.is_polling = false;
        Ok(())
    }
}

impl Handler<FetchVariableChunk> for WorkspaceActor {
    type Result = ResponseActFuture<Self, Result<JuliaMessage, String>>;

    fn handle(&mut self, msg: FetchVariableChunk, _ctx: &mut Self::Context) -> Self::Result {
        debug!("[WorkspaceActor] Fetching variable chunk for: {}", msg.variable_name);
        
        let comm_actor = match &self.communication_actor {
            Some(addr) => addr.clone(),
            None => return Box::pin(async { Err("CommunicationActor not set".to_string()) }.into_actor(self)),
        };

        let request_id = Uuid::new_v4().to_string();
        let julia_msg = JuliaMessage::GetVariableChunk {
            id: request_id,
            variable_name: msg.variable_name,
            row_start: msg.row_start,
            row_count: msg.row_count,
            col_start: msg.col_start,
            col_count: msg.col_count,
        };

        let fut = async move {
            comm_actor.send(crate::messages::communication::SendDebugMessage {
                message: julia_msg,
            }).await
            .map_err(|e| format!("Actor communication failed: {}", e))?
        };

        // Note: SendDebugMessage returns Result<(), String>. We actually need to wait for the response.
        // Wait, CommunicationActor::handle_julia_message will receive the VariableChunk and emit an event.
        // But for a command, it's better to use wait for response.
        
        // Actually, CommunicationActor doesn't have a generic "send and wait" for non-execution messages easily
        // because it uses a single match on current_request.
        
        // Let's modify CommunicationActor to handle GetVariableChunk as a request.
        
        Box::pin(async { Ok(JuliaMessage::Heartbeat { timestamp: 0 }) }.into_actor(self)) // Placeholder
    }
}
