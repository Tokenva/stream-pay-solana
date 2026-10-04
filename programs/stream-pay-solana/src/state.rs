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

#[account]
#[derive(InitSpace)]
pub struct CrossChainConfig {
    pub authority: Pubkey,
    pub source_chain: u16,
    pub source_emitter: [u8; 32],
    pub bump: u8,
    pub created_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct ConsumedVaa {
    pub emitter_chain: u16,
    pub emitter_address: [u8; 32],
    pub sequence: u64,
    pub action: u8,
    pub operation_id: [u8; 32],
    pub stream_id: [u8; 32],
    pub amount: u64,
    pub start_time: u64,
    pub end_time: u64,
    pub payload_hash: [u8; 32],
    pub consumed_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct CrossChainStream {
    pub external_stream_id: [u8; 32],
    pub native_stream_id: u64,
    pub organization: Pubkey,
    pub employee: Pubkey,
    pub mint: Pubkey,
    pub operation_id: [u8; 32],
    pub created_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct CrossChainAssetConfig {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub bump: u8,
    pub created_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct OrganizationRoles {
    pub organization: Pubkey,
    pub admin: Pubkey,
    pub finance: Pubkey,
    pub approver: Pubkey,
    pub viewer: Pubkey,
    pub bump: u8,
    pub created_at: i64,
}

impl OrganizationRoles {
    pub fn can_create_payroll(&self, authority: &Pubkey) -> bool {
        *authority == self.admin || *authority == self.approver
    }

    pub fn can_top_up(&self, authority: &Pubkey) -> bool {
        *authority == self.admin
            || *authority == self.finance
            || *authority == self.approver
    }

    pub fn can_cancel(&self, authority: &Pubkey) -> bool {
        *authority == self.admin || *authority == self.approver
    }

    pub fn can_deposit(&self, authority: &Pubkey) -> bool {
        *authority == self.admin || *authority == self.finance
    }
}
