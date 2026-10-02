use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, TransferChecked};

use crate::{
    constants::{
        ORGANIZATION_SEED, STREAM_ESCROW_SEED, STREAM_SEED, VAULT_AUTHORITY_SEED, VAULT_SEED,
    },
    error::StreamPayError,
    state::{Organization, Stream},
};

#[derive(Accounts)]
#[instruction(stream_id: u64)]
pub struct CreateStream<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [ORGANIZATION_SEED, authority.key().as_ref()],
        bump = organization.bump,
        constraint = organization.authority == authority.key()
            @ StreamPayError::Unauthorized
    )]
    pub organization: Account<'info, Organization>,

    pub employee: SystemAccount<'info>,

    pub mint: Account<'info, Mint>,

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
    )]
    pub vault: Account<'info, TokenAccount>,

    /// CHECK: PDA signs token transfers from the company vault.
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
        init,
        payer = authority,
        space = 8 + Stream::INIT_SPACE,
        seeds = [
            STREAM_SEED,
            organization.key().as_ref(),
            employee.key().as_ref(),
            &stream_id.to_le_bytes()
        ],
        bump
    )]
    pub stream: Account<'info, Stream>,

    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = stream,
        seeds = [
            STREAM_ESCROW_SEED,
            stream.key().as_ref()
        ],
        bump
    )]
    pub stream_escrow: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_create_stream(
    ctx: Context<CreateStream>,
    stream_id: u64,
    total_amount: u64,
    start_time: i64,
    end_time: i64,
) -> Result<()> {
    require!(total_amount > 0, StreamPayError::InvalidAmount);
    require!(end_time > start_time, StreamPayError::InvalidAmount);

    let stream = &mut ctx.accounts.stream;

    stream.organization = ctx.accounts.organization.key();
    stream.employee = ctx.accounts.employee.key();
    stream.vault = ctx.accounts.vault.key();
    stream.escrow = ctx.accounts.stream_escrow.key();
    stream.mint = ctx.accounts.mint.key();
    stream.stream_id = stream_id;
    stream.total_amount = total_amount;
    stream.start_time = start_time;
    stream.end_time = end_time;
    stream.claimed_amount = 0;
    stream.bump = ctx.bumps.stream;

    let organization_key = ctx.accounts.organization.key();
    let mint_key = ctx.accounts.mint.key();
    let vault_authority_bump = [ctx.bumps.vault_authority];

    let vault_authority_seeds: &[&[u8]] = &[
        VAULT_AUTHORITY_SEED,
        organization_key.as_ref(),
        mint_key.as_ref(),
        &vault_authority_bump,
    ];

    let cpi_accounts = TransferChecked {
        from: ctx.accounts.vault.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.stream_escrow.to_account_info(),
        authority: ctx.accounts.vault_authority.to_account_info(),
    };

    let signer_seeds = [vault_authority_seeds];

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.key(),
        cpi_accounts,
        &signer_seeds,
    );

    token::transfer_checked(cpi_ctx, total_amount, ctx.accounts.mint.decimals)?;

    msg!("Payment stream created");
    msg!("Stream: {}", stream.key());
    msg!("Employee: {}", stream.employee);
    msg!("Escrow: {}", stream.escrow);
    msg!("Amount: {}", stream.total_amount);
    msg!("Start: {}", stream.start_time);
    msg!("End: {}", stream.end_time);

    Ok(())
}
