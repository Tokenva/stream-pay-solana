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

    pub fn create_organization(ctx: Context<CreateOrganization>) -> Result<()> {
        crate::instructions::create_organization::handle_create_organization(ctx)
    }

    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        crate::instructions::initialize_vault::handle_initialize_vault(ctx)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        crate::instructions::deposit::handle_deposit(ctx, amount)
    }

    pub fn create_stream(
        ctx: Context<CreateStream>,
        stream_id: u64,
        total_amount: u64,
        start_time: i64,
        end_time: i64,
    ) -> Result<()> {
        crate::instructions::create_stream::handle_create_stream(
            ctx,
            stream_id,
            total_amount,
            start_time,
            end_time,
        )
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        crate::instructions::claim::handle_claim(ctx)
    }
}
