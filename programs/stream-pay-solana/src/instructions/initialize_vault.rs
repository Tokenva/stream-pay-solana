use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::{
    constants::{PROTOCOL_CONFIG_SEED, VAULT_AUTHORITY_SEED, VAULT_SEED},
    error::StreamPayError,
    state::ProtocolConfig,
};

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [PROTOCOL_CONFIG_SEED],
        bump = protocol_config.bump,
        constraint = protocol_config.authority == authority.key()
            @ StreamPayError::Unauthorized
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = vault_authority,
        token::token_program = token_program,
        seeds = [VAULT_SEED, mint.key().as_ref()],
        bump
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: PDA used only as the vault token-account authority.
    #[account(
        seeds = [VAULT_AUTHORITY_SEED, mint.key().as_ref()],
        bump
    )]
    pub vault_authority: UncheckedAccount<'info>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

pub fn handle_initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
    msg!("StreamPay vault initialized");
    msg!("Mint: {}", ctx.accounts.mint.key());
    msg!("Vault: {}", ctx.accounts.vault.key());
    msg!("Vault authority: {}", ctx.accounts.vault_authority.key());

    Ok(())
}
