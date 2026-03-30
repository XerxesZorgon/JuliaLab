use actix::prelude::*;
use crate::messages::communication::JuliaMessage;

#[derive(Message)]
#[rtype(result = "Result<JuliaMessage, String>")]
pub struct FetchVariableChunk {
    pub variable_name: String,
    pub row_start: usize,
    pub row_count: usize,
    pub col_start: usize,
    pub col_count: usize,
}
