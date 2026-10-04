use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

use crate::{
    constants::{CROSS_CHAIN_ASSET_CONFIG_SEED, PROTOCOL_CONFIG_SEED},
    error::StreamPayError,
    state::{CrossChainAssetConfig, ProtocolConfig},
};

#[derive(Accounts)]
pub struct InitializeCrossChainAssetConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [PROTOCOL_CONFIG_SEED],
        bump = protocol_config.bump,
        constraint = protocol_config.authority == authority.key()
            @ StreamPayError::Unauthorized,
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,

    #[account(
        init,
        payer = authority,
        seeds = [CROSS_CHAIN_ASSET_CONFIG_SEED],
        bump,
        space = 8 + CrossChainAssetConfig::INIT_SPACE,
    )]
    pub cross_chain_asset_config: Account<'info, CrossChainAssetConfig>,

    pub mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
}

pub fn handle_initialize_cross_chain_asset_config(
    ctx: Context<InitializeCrossChainAssetConfig>,
) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;

    let config = &mut ctx.accounts.cross_chain_asset_config;

    config.authority = ctx.accounts.authority.key();
    config.mint = ctx.accounts.mint.key();
    config.bump = ctx.bumps.cross_chain_asset_config;
    config.created_at = now;

    msg!("Cross-chain settlement mint initialized: {}", config.mint);

    Ok(())
}
