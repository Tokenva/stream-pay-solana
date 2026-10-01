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

    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        crate::instructions::initialize_vault::handle_initialize_vault(ctx)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        crate::instructions::deposit::handle_deposit(ctx, amount)
    }
}
