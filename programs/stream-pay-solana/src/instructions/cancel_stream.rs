use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, TransferChecked};

use crate::{
    constants::{
        ORGANIZATION_SEED, STREAM_ESCROW_SEED, STREAM_SEED, VAULT_AUTHORITY_SEED, VAULT_SEED,
    },
    error::StreamPayError,
    state::{Organization, OrganizationRoles, Stream},
};

#[derive(Accounts)]
#[instruction(stream_id: u64)]
pub struct CancelStream<'info> {
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

    /// CHECK: PDA is the authority of the company vault.
    #[account(
        seeds = [
            VAULT_AUTHORITY_SEED,
            organization.key().as_ref(),
            mint.key().as_ref()
        ],
        bump
    )]
    pub vault_authority: UncheckedAccount<'info>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = employee,
    )]
    pub employee_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,

    pub roles: Option<Account<'info, OrganizationRoles>>,
}

pub fn handle_cancel_stream(ctx: Context<CancelStream>, _stream_id: u64) -> Result<()> {
    let actor = ctx.accounts.authority.key();
    let authorized = ctx.accounts.organization.authority == actor
        || ctx.accounts.roles.as_ref().is_some_and(|roles| {
            roles.organization == ctx.accounts.organization.key()
                && roles.can_cancel(&actor)
        });
    require!(authorized, StreamPayError::Unauthorized);

    require!(
        !ctx.accounts.stream.canceled,
        StreamPayError::AlreadyCanceled
    );

    let current_time = Clock::get()?.unix_timestamp;

    let earned_amount = ctx.accounts.stream.earned_amount(current_time);

    let claimable_amount = earned_amount
        .checked_sub(ctx.accounts.stream.claimed_amount)
        .ok_or(StreamPayError::ArithmeticOverflow)?;

    let remaining_amount = ctx
        .accounts
        .stream
        .total_amount
        .checked_sub(earned_amount)
        .ok_or(StreamPayError::ArithmeticOverflow)?;

    let organization_key = ctx.accounts.organization.key();
    let employee_key = ctx.accounts.employee.key();
    let stream_id_bytes = ctx.accounts.stream.stream_id.to_le_bytes();
    let stream_bump = [ctx.accounts.stream.bump];

    let stream_seeds: &[&[u8]] = &[
        STREAM_SEED,
        organization_key.as_ref(),
        employee_key.as_ref(),
        &stream_id_bytes,
        &stream_bump,
    ];

    let signer_seeds = [stream_seeds];

    // Pay the employee anything earned but not yet claimed.
    if claimable_amount > 0 {
        let cpi_accounts = TransferChecked {
            from: ctx.accounts.stream_escrow.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.employee_token_account.to_account_info(),
            authority: ctx.accounts.stream.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            cpi_accounts,
            &signer_seeds,
        );

        token::transfer_checked(cpi_ctx, claimable_amount, ctx.accounts.mint.decimals)?;
    }

    // Return unearned funds to the company vault.
    if remaining_amount > 0 {
        let cpi_accounts = TransferChecked {
            from: ctx.accounts.stream_escrow.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.stream.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            cpi_accounts,
            &signer_seeds,
        );

        token::transfer_checked(cpi_ctx, remaining_amount, ctx.accounts.mint.decimals)?;
    }

    ctx.accounts.stream.claimed_amount = earned_amount;
    ctx.accounts.stream.canceled = true;
    ctx.accounts.stream.cancel_time = current_time;

    msg!("Stream canceled");
    msg!("Earned amount: {}", earned_amount);
    msg!("Paid on cancel: {}", claimable_amount);
    msg!("Returned to vault: {}", remaining_amount);

    Ok(())
}
