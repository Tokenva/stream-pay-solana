use anchor_lang::prelude::*;

use crate::{
    constants::{ORGANIZATION_POLICY_SEED, ORGANIZATION_SEED},
    error::StreamPayError,
    state::{Organization, OrganizationPolicy},
};

#[derive(Accounts)]
pub struct InitializeOrganizationPolicy<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [ORGANIZATION_SEED, authority.key().as_ref()],
        bump = organization.bump,
        constraint = organization.authority == authority.key()
            @ StreamPayError::Unauthorized
    )]
    pub organization: Account<'info, Organization>,

    #[account(
        init,
        payer = authority,
        space = 8 + OrganizationPolicy::INIT_SPACE,
        seeds = [ORGANIZATION_POLICY_SEED, organization.key().as_ref()],
        bump
    )]
    pub policy: Account<'info, OrganizationPolicy>,

    pub system_program: Program<'info, System>,
}

pub fn handle_initialize_organization_policy(
    ctx: Context<InitializeOrganizationPolicy>,
    approved_mint: Pubkey,
    max_transaction_amount: u64,
    max_payroll_amount: u64,
    max_employee_amount: u64,
    require_approval: bool,
    paused: bool,
) -> Result<()> {
    let policy = &mut ctx.accounts.policy;

    policy.organization = ctx.accounts.organization.key();
    policy.approved_mint = approved_mint;
    policy.max_transaction_amount = max_transaction_amount;
    policy.max_payroll_amount = max_payroll_amount;
    policy.max_employee_amount = max_employee_amount;
    policy.require_approval = require_approval;
    policy.paused = paused;
    policy.bump = ctx.bumps.policy;
    policy.created_at = Clock::get()?.unix_timestamp;

    Ok(())
}
