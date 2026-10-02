use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, TransferChecked};

use crate::{
    constants::{STREAM_ESCROW_SEED, STREAM_SEED},
    error::StreamPayError,
    state::Stream,
};

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub employee: Signer<'info>,

    #[account(
        mut,
        seeds = [
            STREAM_SEED,
            stream.organization.as_ref(),
            stream.employee.as_ref(),
            &stream.stream_id.to_le_bytes()
        ],
        bump = stream.bump,
        constraint = stream.employee == employee.key()
            @ StreamPayError::Unauthorized
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
    )]
    pub stream_escrow: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = employee,
    )]
    pub employee_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_claim(ctx: Context<Claim>) -> Result<()> {
    require!(
        ctx.accounts.stream.mint == ctx.accounts.mint.key(),
        StreamPayError::InvalidStreamMint
    );

    let current_time = Clock::get()?.unix_timestamp;

    let earned_amount = ctx.accounts.stream.earned_amount(current_time);

    let claimable_amount = earned_amount
        .checked_sub(ctx.accounts.stream.claimed_amount)
        .ok_or(StreamPayError::NothingToClaim)?;

    require!(claimable_amount > 0, StreamPayError::NothingToClaim);

    let organization = ctx.accounts.stream.organization;
    let employee = ctx.accounts.stream.employee;
    let stream_id_bytes = ctx.accounts.stream.stream_id.to_le_bytes();
    let stream_bump = [ctx.accounts.stream.bump];

    let stream_seeds: &[&[u8]] = &[
        STREAM_SEED,
        organization.as_ref(),
        employee.as_ref(),
        &stream_id_bytes,
        &stream_bump,
    ];

    let signer_seeds = [stream_seeds];

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

    ctx.accounts.stream.claimed_amount = earned_amount;

    msg!("Stream claim completed");
    msg!("Employee: {}", ctx.accounts.employee.key());
    msg!("Earned amount: {}", earned_amount);
    msg!("Claimed amount: {}", claimable_amount);
    msg!("Total claimed: {}", ctx.accounts.stream.claimed_amount);

    Ok(())
}
