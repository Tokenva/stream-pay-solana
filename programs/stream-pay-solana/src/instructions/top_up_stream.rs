use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, TransferChecked};

use crate::{
    constants::{
        ORGANIZATION_SEED, STREAM_ESCROW_SEED, STREAM_SEED, VAULT_AUTHORITY_SEED, VAULT_SEED,
    },
    error::StreamPayError,
    state::{Organization, OrganizationPolicy, OrganizationRoles, Stream},
};

#[derive(Accounts)]
#[instruction(stream_id: u64)]
pub struct TopUpStream<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [ORGANIZATION_SEED, organization.authority.as_ref()],
        bump = organization.bump
    )]
    pub organization: Account<'info, Organization>,

    pub employee: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [
            STREAM_SEED,
            organization.key().as_ref(),
            employee.key().as_ref(),
            &stream_id.to_le_bytes()
        ],
        bump = stream.bump,
        constraint = stream.organization == organization.key()
            @ StreamPayError::Unauthorized,
        constraint = stream.employee == employee.key()
            @ StreamPayError::Unauthorized,
    )]
    pub stream: Account<'info, Stream>,

    #[account(
        mut,
        seeds = [
            VAULT_SEED,
            organization.key().as_ref(),
            mint.key().as_ref()
        ],
        bump,
        token::mint = mint,
        token::authority = vault_authority,
        constraint = stream.vault == vault.key()
            @ StreamPayError::Unauthorized,
    )]
    pub vault: Account<'info, TokenAccount>,

    /// CHECK: PDA signs transfers from the company vault.
    #[account(
        seeds = [
            VAULT_AUTHORITY_SEED,
            organization.key().as_ref(),
            mint.key().as_ref()
        ],
        bump
    )]
    pub vault_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [
            STREAM_ESCROW_SEED,
            stream.key().as_ref()
        ],
        bump,
        token::mint = mint,
        token::authority = stream,
        constraint = stream.escrow == stream_escrow.key()
            @ StreamPayError::Unauthorized,
    )]
    pub stream_escrow: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,

    pub roles: Option<Account<'info, OrganizationRoles>>,
    pub policy: Option<Account<'info, OrganizationPolicy>>,
}

pub fn handle_top_up_stream(ctx: Context<TopUpStream>, _stream_id: u64, amount: u64) -> Result<()> {
    let actor = ctx.accounts.authority.key();
    let authorized = ctx.accounts.organization.authority == actor
        || ctx.accounts.roles.as_ref().is_some_and(|roles| {
            roles.organization == ctx.accounts.organization.key() && roles.can_top_up(&actor)
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
    require!(
        !ctx.accounts.stream.canceled,
        StreamPayError::StreamCanceled
    );

    let current_time = Clock::get()?.unix_timestamp;

    require!(
        current_time < ctx.accounts.stream.start_time,
        StreamPayError::StreamAlreadyStarted
    );

    let new_total = ctx
        .accounts
        .stream
        .total_amount
        .checked_add(amount)
        .ok_or(StreamPayError::ArithmeticOverflow)?;

    let organization_key = ctx.accounts.organization.key();
    let mint_key = ctx.accounts.mint.key();
    let vault_authority_bump = [ctx.bumps.vault_authority];

    let vault_authority_seeds: &[&[u8]] = &[
        VAULT_AUTHORITY_SEED,
        organization_key.as_ref(),
        mint_key.as_ref(),
        &vault_authority_bump,
    ];

    let signer_seeds = [vault_authority_seeds];

    let cpi_accounts = TransferChecked {
        from: ctx.accounts.vault.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.stream_escrow.to_account_info(),
        authority: ctx.accounts.vault_authority.to_account_info(),
    };

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.key(),
        cpi_accounts,
        &signer_seeds,
    );

    token::transfer_checked(cpi_ctx, amount, ctx.accounts.mint.decimals)?;

    ctx.accounts.stream.total_amount = new_total;

    msg!("Stream top-up completed");
    msg!("Amount: {}", amount);
    msg!("New total: {}", new_total);

    Ok(())
}
