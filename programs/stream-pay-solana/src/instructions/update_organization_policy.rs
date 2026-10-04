use anchor_lang::prelude::*;

use crate::{
    constants::ORGANIZATION_POLICY_SEED, error::StreamPayError, state::OrganizationPolicy,
};

use crate::state::Organization;

#[derive(Accounts)]
pub struct UpdateOrganizationPolicy<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [crate::constants::ORGANIZATION_SEED, authority.key().as_ref()],
        bump = organization.bump,
        constraint = organization.authority == authority.key()
            @ StreamPayError::Unauthorized
    )]
    pub organization: Account<'info, Organization>,

    #[account(
        mut,
        seeds = [ORGANIZATION_POLICY_SEED, organization.key().as_ref()],
        bump = policy.bump,
        constraint = policy.organization == organization.key()
            @ StreamPayError::Unauthorized
    )]
    pub policy: Account<'info, OrganizationPolicy>,
}

pub fn handle_update_organization_policy(
    ctx: Context<UpdateOrganizationPolicy>,
    approved_mint: Pubkey,
    max_transaction_amount: u64,
    max_payroll_amount: u64,
    max_employee_amount: u64,
    require_approval: bool,
    paused: bool,
) -> Result<()> {
    let policy = &mut ctx.accounts.policy;

    policy.approved_mint = approved_mint;
    policy.max_transaction_amount = max_transaction_amount;
    policy.max_payroll_amount = max_payroll_amount;
    policy.max_employee_amount = max_employee_amount;
    policy.require_approval = require_approval;
    policy.paused = paused;

    Ok(())
}
