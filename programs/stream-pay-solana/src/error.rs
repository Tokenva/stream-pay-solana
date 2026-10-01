use anchor_lang::prelude::*;

#[error_code]
pub enum StreamPayError {
    #[msg("The protocol is already paused")]
    AlreadyPaused,

    #[msg("The protocol is not paused")]
    NotPaused,

    #[msg("The signer is not the protocol authority")]
    Unauthorized,

    #[msg("Amount must be greater than zero")]
    InvalidAmount,
}
