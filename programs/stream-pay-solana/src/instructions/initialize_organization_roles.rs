use anchor_lang::prelude::*;

use crate::{
    constants::{ORGANIZATION_ROLES_SEED, ORGANIZATION_SEED},
    error::StreamPayError,
    state::{Organization, OrganizationRoles},
};

#[derive(Accounts)]
pub struct InitializeOrganizationRoles<'info> {
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
        space = 8 + OrganizationRoles::INIT_SPACE,
        seeds = [ORGANIZATION_ROLES_SEED, organization.key().as_ref()],
        bump
    )]
    pub roles: Account<'info, OrganizationRoles>,

    pub system_program: Program<'info, System>,
}

pub fn handle_initialize_organization_roles(
    ctx: Context<InitializeOrganizationRoles>,
    admin: Pubkey,
    finance: Pubkey,
    approver: Pubkey,
    viewer: Pubkey,
) -> Result<()> {
    let roles = &mut ctx.accounts.roles;

    roles.organization = ctx.accounts.organization.key();
    roles.admin = admin;
    roles.finance = finance;
    roles.approver = approver;
    roles.viewer = viewer;
    roles.bump = ctx.bumps.roles;
    roles.created_at = Clock::get()?.unix_timestamp;

    Ok(())
}
