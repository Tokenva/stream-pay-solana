pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

pub use constants::*;
pub use instructions::*;
pub use state::*;

use anchor_lang::prelude::*;

declare_id!("4wvijq8n8bUKMsvmyJuhJzmdYq3jDUQYAZ6TXXjZDskS");

#[program]
pub mod stream_pay_solana {
    use super::*;

    pub fn initialize_protocol(ctx: Context<InitializeProtocol>) -> Result<()> {
        crate::instructions::initialize_protocol::handle_initialize_protocol(ctx)
    }
}
