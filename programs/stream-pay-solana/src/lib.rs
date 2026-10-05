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

    pub fn initialize_organization_roles(
        ctx: Context<InitializeOrganizationRoles>,
        admin: Pubkey,
        finance: Pubkey,
        approver: Pubkey,
        viewer: Pubkey,
    ) -> Result<()> {
        crate::instructions::initialize_organization_roles::handle_initialize_organization_roles(
            ctx, admin, finance, approver, viewer,
        )
    }

    pub fn initialize_organization_policy(
        ctx: Context<InitializeOrganizationPolicy>,
        approved_mint: Pubkey,
        max_transaction_amount: u64,
        max_payroll_amount: u64,
        max_employee_amount: u64,
        require_approval: bool,
        paused: bool,
    ) -> Result<()> {
        crate::instructions::initialize_organization_policy::handle_initialize_organization_policy(
            ctx,
            approved_mint,
            max_transaction_amount,
            max_payroll_amount,
            max_employee_amount,
            require_approval,
            paused,
        )
    }

    pub fn update_organization_policy(
        ctx: Context<UpdateOrganizationPolicy>,
        approved_mint: Pubkey,
        max_transaction_amount: u64,
        max_payroll_amount: u64,
        max_employee_amount: u64,
        require_approval: bool,
        paused: bool,
    ) -> Result<()> {
        crate::instructions::update_organization_policy::handle_update_organization_policy(
            ctx,
            approved_mint,
            max_transaction_amount,
            max_payroll_amount,
            max_employee_amount,
            require_approval,
            paused,
        )
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

    pub fn top_up_stream(ctx: Context<TopUpStream>, stream_id: u64, amount: u64) -> Result<()> {
        crate::instructions::top_up_stream::handle_top_up_stream(ctx, stream_id, amount)
    }

    pub fn cancel_stream(ctx: Context<CancelStream>, stream_id: u64) -> Result<()> {
        crate::instructions::cancel_stream::handle_cancel_stream(ctx, stream_id)
    }

    pub fn initialize_cross_chain_config(
        ctx: Context<InitializeCrossChainConfig>,
        source_emitter: [u8; 32],
    ) -> Result<()> {
        crate::instructions::cross_chain::handle_initialize_cross_chain_config(ctx, source_emitter)
    }

    pub fn consume_vaa(
        ctx: Context<ConsumeVaa>,
        guardian_set_bump: u8,
        sequence: u64,
        vaa_body: Vec<u8>,
    ) -> Result<()> {
        crate::instructions::cross_chain::handle_consume_vaa(
            ctx,
            guardian_set_bump,
            sequence,
            vaa_body,
        )
    }

    pub fn execute_cross_chain_action(
        ctx: Context<ExecuteCrossChainAction>,
        sequence: u64,
        native_stream_id: u64,
        vaa_body: Vec<u8>,
    ) -> Result<()> {
        instructions::cross_chain_action::handle_execute_cross_chain_action(
            ctx,
            sequence,
            native_stream_id,
            vaa_body,
        )
    }

    pub fn initialize_cross_chain_asset_config(
        ctx: Context<InitializeCrossChainAssetConfig>,
    ) -> Result<()> {
        crate::instructions::cross_chain_asset::handle_initialize_cross_chain_asset_config(ctx)
    }

    pub fn execute_cross_chain_cancel(
    ctx: Context<ExecuteCrossChainCancel>,
    sequence: u64,
    vaa_body: Vec<u8>,
) -> Result<()> {
    instructions::handle_execute_cross_chain_cancel(
        ctx,
        sequence,
        vaa_body,
    )
}

    pub fn execute_cross_chain_top_up(
        ctx: Context<ExecuteCrossChainTopUp>,
        sequence: u64,
        native_stream_id: u64,
        vaa_body: Vec<u8>,
    ) -> Result<()> {
        instructions::cross_chain_top_up::handle_execute_cross_chain_top_up(
            ctx,
            sequence,
            native_stream_id,
            vaa_body,
        )
    }
}
