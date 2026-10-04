use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, TransferChecked};

use crate::{
    constants::{ORGANIZATION_SEED, VAULT_SEED},
    error::StreamPayError,
    state::{Organization, OrganizationPolicy, OrganizationRoles},
};

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,

    #[account(
        seeds = [ORGANIZATION_SEED, organization.authority.as_ref()],
        bump = organization.bump
    )]
    pub organization: Account<'info, Organization>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = depositor,
    )]
    pub depositor_token_account: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [
            VAULT_SEED,
            organization.key().as_ref(),
            mint.key().as_ref()
        ],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,

    pub roles: Option<Account<'info, OrganizationRoles>>,
    pub policy: Option<Account<'info, OrganizationPolicy>>,
}

pub fn handle_deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    let actor = ctx.accounts.depositor.key();
    let authorized = ctx.accounts.organization.authority == actor
        || ctx.accounts.roles.as_ref().is_some_and(|roles| {
            roles.organization == ctx.accounts.organization.key() && roles.can_deposit(&actor)
        });
    require!(authorized, StreamPayError::Unauthorized);

    if let Some(policy) = ctx.accounts.policy.as_ref() {
        require!(!policy.paused, StreamPayError::OrganizationPaused);
        require!(
            policy.organization == ctx.accounts.organization.key(),
            StreamPayError::Unauthorized
        );
        require!(
            policy.approved_mint == ctx.accounts.mint.key(),
            StreamPayError::InvalidPolicyAsset
        );

        if policy.max_transaction_amount > 0 {
            require!(
                amount <= policy.max_transaction_amount,
                StreamPayError::TransactionLimitExceeded
            );
        }
    }

    require!(amount > 0, StreamPayError::InvalidAmount);

    let cpi_accounts = TransferChecked {
        from: ctx.accounts.depositor_token_account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.vault.to_account_info(),
        authority: ctx.accounts.depositor.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.key(), cpi_accounts);

    token::transfer_checked(cpi_ctx, amount, ctx.accounts.mint.decimals)?;

    msg!("Vault deposit completed");
    msg!("Organization: {}", ctx.accounts.organization.key());
    msg!("Amount: {}", amount);

    Ok(())
}
