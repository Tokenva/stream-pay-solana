use anchor_lang::prelude::*;

use crate::{
    constants::{PROTOCOL_CONFIG_SEED, PROTOCOL_VERSION},
    state::ProtocolConfig,
};

#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + ProtocolConfig::INIT_SPACE,
        seeds = [PROTOCOL_CONFIG_SEED],
        bump
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,

    pub system_program: Program<'info, System>,
}

pub fn handle_initialize_protocol(ctx: Context<InitializeProtocol>) -> Result<()> {
    let protocol_config = &mut ctx.accounts.protocol_config;

    protocol_config.authority = ctx.accounts.authority.key();
    protocol_config.version = PROTOCOL_VERSION;
    protocol_config.paused = false;
    protocol_config.bump = ctx.bumps.protocol_config;
    protocol_config.created_at = Clock::get()?.unix_timestamp;

    msg!("StreamPay protocol initialized");

    Ok(())
}
