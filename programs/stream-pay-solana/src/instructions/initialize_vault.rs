use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::{
    constants::{ORGANIZATION_SEED, VAULT_AUTHORITY_SEED, VAULT_SEED},
    error::StreamPayError,
    state::Organization,
};

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [ORGANIZATION_SEED, authority.key().as_ref()],
        bump = organization.bump,
        constraint = organization.authority == authority.key()
            @ StreamPayError::Unauthorized
    )]
    pub organization: Account<'info, Organization>,

    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = vault_authority,
        seeds = [
            VAULT_SEED,
            organization.key().as_ref(),
            mint.key().as_ref()
        ],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,

    /// CHECK: PDA used only as the vault token-account authority.
    #[account(
        seeds = [
            VAULT_AUTHORITY_SEED,
            organization.key().as_ref(),
            mint.key().as_ref()
        ],
        bump
    )]
    pub vault_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handle_initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
    msg!("Organization vault initialized");
    msg!("Organization: {}", ctx.accounts.organization.key());
    msg!("Mint: {}", ctx.accounts.mint.key());
    msg!("Vault: {}", ctx.accounts.vault.key());
    msg!("Vault authority: {}", ctx.accounts.vault_authority.key());

    Ok(())
}
