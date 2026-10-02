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

#[account]
#[derive(InitSpace)]
pub struct Stream {
    pub organization: Pubkey,
    pub employee: Pubkey,
    pub vault: Pubkey,
    pub escrow: Pubkey,
    pub mint: Pubkey,
    pub stream_id: u64,
    pub total_amount: u64,
    pub start_time: i64,
    pub end_time: i64,
    pub claimed_amount: u64,
    pub canceled: bool,
    pub cancel_time: i64,
    pub bump: u8,
}

impl Stream {
    pub fn earned_amount(&self, current_time: i64) -> u64 {
        if current_time <= self.start_time {
            return 0;
        }

        let effective_end = if self.canceled {
            self.cancel_time.min(self.end_time)
        } else {
            self.end_time
        };

        if current_time >= effective_end {
            let elapsed = (effective_end - self.start_time) as u128;
            let duration = (self.end_time - self.start_time) as u128;
            let total_amount = self.total_amount as u128;

            return ((total_amount * elapsed) / duration) as u64;
        }

        let elapsed = (current_time - self.start_time) as u128;
        let duration = (self.end_time - self.start_time) as u128;
        let total_amount = self.total_amount as u128;

        ((total_amount * elapsed) / duration) as u64
    }
}
