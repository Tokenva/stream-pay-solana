use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct ProtocolConfig {
    pub authority: Pubkey,
    pub version: u8,
    pub paused: bool,
    pub bump: u8,
    pub created_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct Organization {
    pub authority: Pubkey,
    pub bump: u8,
    pub created_at: i64,
}
