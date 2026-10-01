use anchor_lang::prelude::*;

use crate::{constants::ORGANIZATION_SEED, state::Organization};

#[derive(Accounts)]
pub struct CreateOrganization<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Organization::INIT_SPACE,
        seeds = [ORGANIZATION_SEED, authority.key().as_ref()],
        bump
    )]
    pub organization: Account<'info, Organization>,

    pub system_program: Program<'info, System>,
}

pub fn handle_create_organization(ctx: Context<CreateOrganization>) -> Result<()> {
    let organization = &mut ctx.accounts.organization;

    organization.authority = ctx.accounts.authority.key();
    organization.bump = ctx.bumps.organization;
    organization.created_at = Clock::get()?.unix_timestamp;

    msg!("Organization created");
    msg!("Authority: {}", organization.authority);

    Ok(())
}
